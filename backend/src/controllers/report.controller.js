/**
 * report.controller.js
 * Generates reports and analytics for the admin dashboard.
 * Includes booking trends, service popularity, stylist performance,
 * revenue reports, and dashboard statistics.
 */

const Appointment = require('../models/Appointment.model');
const Service = require('../models/Service.model');
const Stylist = require('../models/Stylist.model');
const User = require('../models/User.model');
const { successResponse, errorResponse } = require('../utils/response');
const { APPOINTMENT_STATUS } = require('../utils/constants');
const logger = require('../config/logger');

/**
 * Get booking trends over a date range
 * GET /api/v1/admin/reports/booking-trends
 */
const getBookingTrends = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) filter.date = { $lte: new Date(endDate) };

    const totalBookings = await Appointment.countDocuments(filter);
    const completedBookings = await Appointment.countDocuments({ 
      ...filter, 
      status: APPOINTMENT_STATUS.COMPLETED 
    });
    const cancelledBookings = await Appointment.countDocuments({ 
      ...filter, 
      status: APPOINTMENT_STATUS.CANCELLED 
    });

    const bookingsByStatus = await Appointment.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const bookingsByDay = await Appointment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dayOfWeek: '$date' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return successResponse(res, 'Booking trends retrieved.', {
      totalBookings,
      completedBookings,
      cancelledBookings,
      bookingsByStatus,
      bookingsByDay
    });
  } catch (error) {
    logger.error('Get booking trends error:', error);
    return errorResponse(res, 'Failed to retrieve booking trends.', 500);
  }
};

/**
 * Get most popular services
 * GET /api/v1/admin/reports/service-popularity
 */
const getServicePopularity = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { status: APPOINTMENT_STATUS.COMPLETED };
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) filter.date = { $lte: new Date(endDate) };

    const serviceStats = await Appointment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$serviceId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const serviceIds = serviceStats.map(item => item._id);
    const services = await Service.find({ _id: { $in: serviceIds } });

    const result = serviceStats.map(stat => {
      const service = services.find(s => s._id.toString() === stat._id.toString());
      return {
        serviceId: stat._id,
        serviceName: service ? service.name : 'Unknown',
        category: service ? service.category : 'Unknown',
        bookingsCount: stat.count
      };
    });

    return successResponse(res, 'Service popularity retrieved.', result);
  } catch (error) {
    logger.error('Get service popularity error:', error);
    return errorResponse(res, 'Failed to retrieve service popularity.', 500);
  }
};

/**
 * Get stylist performance metrics
 * GET /api/v1/admin/reports/stylist-performance
 */
const getStylistPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { status: APPOINTMENT_STATUS.COMPLETED };
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) filter.date = { $lte: new Date(endDate) };

    const stylistStats = await Appointment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$stylistId',
          completedBookings: { $sum: 1 }
        }
      },
      { $sort: { completedBookings: -1 } }
    ]);

    const stylistIds = stylistStats.map(item => item._id);
    const stylists = await Stylist.find({ _id: { $in: stylistIds } })
      .populate('userId', 'firstName lastName');

    const result = stylistStats.map(stat => {
      const stylist = stylists.find(s => s._id.toString() === stat._id.toString());
      return {
        stylistId: stat._id,
        stylistName: stylist && stylist.userId
          ? stylist.userId.firstName + ' ' + stylist.userId.lastName
          : 'Unknown',
        completedBookings: stat.completedBookings,
        rating: stylist ? stylist.rating : 0
      };
    });

    return successResponse(res, 'Stylist performance retrieved.', result);
  } catch (error) {
    logger.error('Get stylist performance error:', error);
    return errorResponse(res, 'Failed to retrieve stylist performance.', 500);
  }
};

/**
 * Get revenue report
 * GET /api/v1/admin/reports/revenue
 */
const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { status: APPOINTMENT_STATUS.COMPLETED };
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) filter.date = { $lte: new Date(endDate) };

    const completedAppointments = await Appointment.find(filter)
      .populate('serviceId', 'price');

    let totalRevenue = 0;
    completedAppointments.forEach(appointment => {
      if (appointment.serviceId && appointment.serviceId.price) {
        totalRevenue += appointment.serviceId.price;
      }
    });

    const revenueByDay = await Appointment.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'service'
        }
      },
      { $unwind: '$service' },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          revenue: { $sum: '$service.price' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return successResponse(res, 'Revenue report retrieved.', {
      totalRevenue,
      totalBookings: completedAppointments.length,
      revenueByDay
    });
  } catch (error) {
    logger.error('Get revenue report error:', error);
    return errorResponse(res, 'Failed to retrieve revenue report.', 500);
  }
};

/**
 * Get dashboard statistics
 * GET /api/v1/admin/reports/dashboard
 */
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalStylists = await User.countDocuments({ role: 'stylist' });
    const totalServices = await Service.countDocuments({ isActive: true });

    const todayBookings = await Appointment.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: { $nin: ['cancelled', 'no_show'] }
    });

    const pendingBookings = await Appointment.countDocuments({
      status: APPOINTMENT_STATUS.PENDING
    });

    const completedToday = await Appointment.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: APPOINTMENT_STATUS.COMPLETED
    });

    const recentBookings = await Appointment.find()
      .populate('customerId', 'firstName lastName')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    return successResponse(res, 'Dashboard stats retrieved.', {
      overview: {
        totalCustomers,
        totalStylists,
        totalServices,
        todayBookings,
        pendingBookings,
        completedToday
      },
      recentBookings
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    return errorResponse(res, 'Failed to retrieve dashboard stats.', 500);
  }
};

module.exports = {
  getBookingTrends,
  getServicePopularity,
  getStylistPerformance,
  getRevenueReport,
  getDashboardStats
};