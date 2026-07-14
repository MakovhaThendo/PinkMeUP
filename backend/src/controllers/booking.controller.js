/**
 * booking.controller.js
 * Core booking operations including creation, cancellation,
 * rescheduling, and retrieval of appointments.
 */

const Appointment = require('../models/Appointment.model');
const Service = require('../models/Service.model');
const Stylist = require('../models/Stylist.model');
const { successResponse, errorResponse } = require('../utils/response');
const { APPOINTMENT_STATUS } = require('../utils/constants');
const { calculateEndTime, isValidTimeFormat, getDayOfWeek } = require('../utils/helpers');
const logger = require('../config/logger');

/**
 * Create a new booking with multiple services
 * POST /api/v1/bookings
 * Requires: Authentication
 */
const createBooking = async (req, res) => {
  try {
    const { serviceIds, stylistId, date, startTime, notes } = req.body;
    const customerId = req.user.id;

    // Validate serviceIds is an array
    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return errorResponse(res, 'At least one service is required.', 400);
    }

    // Get all services and calculate totals
    const services = await Service.find({ _id: { $in: serviceIds } });
    
    if (services.length !== serviceIds.length) {
      return errorResponse(res, 'One or more services not found.', 404);
    }

    // Check if all services are active
    const inactiveServices = services.filter(s => !s.isActive);
    if (inactiveServices.length > 0) {
      return errorResponse(res, 'One or more services are currently not available.', 400);
    }

    // Calculate total duration and price
    let totalDuration = 0;
    let totalPrice = 0;
    services.forEach(service => {
      totalDuration += service.duration;
      totalPrice += service.price;
    });

    const stylist = await Stylist.findById(stylistId);
    if (!stylist) {
      return errorResponse(res, 'Stylist not found.', 404);
    }

    if (!stylist.isAvailable) {
      return errorResponse(res, 'Stylist is currently not available.', 400);
    }

    if (!isValidTimeFormat(startTime)) {
      return errorResponse(res, 'Invalid time format. Use HH:MM.', 400);
    }

    const bookingDate = new Date(date);
    const dayOfWeek = getDayOfWeek(bookingDate);

    if (!dayOfWeek || !stylist.workingHours[dayOfWeek]) {
      return errorResponse(res, 'Stylist does not work on this day.', 400);
    }

    const { start, end } = stylist.workingHours[dayOfWeek];
    if (!start || !end) {
      return errorResponse(res, 'Stylist does not work on this day.', 400);
    }

    // Calculate end time based on total duration
    const endTime = calculateEndTime(startTime, totalDuration);

    // Check for existing bookings at same time with any service
    const existingBooking = await Appointment.findOne({
      stylistId,
      date: bookingDate,
      startTime,
      status: { $nin: [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.NO_SHOW] }
    });

    if (existingBooking) {
      return errorResponse(res, 'Time slot is already booked. Please select another time.', 409);
    }

    // Create the appointment with multiple services
    const appointment = await Appointment.create({
      customerId,
      stylistId,
      serviceIds,
      date: bookingDate,
      startTime,
      endTime,
      totalDuration,
      totalPrice,
      notes,
      status: APPOINTMENT_STATUS.CONFIRMED
    });

    // Populate user details for response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('customerId', 'firstName lastName email phone')
      .populate('stylistId', 'userId')
      .populate('serviceIds', 'name price duration description');

    return successResponse(res, 'Booking created successfully.', populatedAppointment, 201);
  } catch (error) {
    logger.error('Create booking error:', error);
    return errorResponse(res, 'Failed to create booking.', 500);
  }
};

/**
 * Get current user's bookings
 * GET /api/v1/bookings/my
 * Requires: Authentication
 */
const getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const customerId = req.user.id;

    const filter = { customerId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Appointment.find(filter)
      .populate('customerId', 'firstName lastName email phone')
      .populate('stylistId', 'userId')
      .populate('serviceIds', 'name price duration description')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1, startTime: -1 });

    const total = await Appointment.countDocuments(filter);

    return successResponse(res, 'Bookings retrieved successfully.', {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get my bookings error:', error);
    return errorResponse(res, 'Failed to retrieve bookings.', 500);
  }
};

/**
 * Get booking by ID with authorization check
 * GET /api/v1/bookings/:id
 * Requires: Authentication (owner, stylist, or admin)
 */
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .populate('customerId', 'firstName lastName email phone')
      .populate('stylistId', 'userId')
      .populate('serviceIds', 'name price duration description');

    if (!appointment) {
      return errorResponse(res, 'Booking not found.', 404);
    }

    const isOwner = appointment.customerId._id.toString() === req.user.id;
    const isStylist = req.user.role === 'stylist';
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isStylist && !isAdmin) {
      return errorResponse(res, 'Access denied. You do not own this booking.', 403);
    }

    return successResponse(res, 'Booking retrieved successfully.', appointment);
  } catch (error) {
    logger.error('Get booking by ID error:', error);
    return errorResponse(res, 'Failed to retrieve booking.', 500);
  }
};

/**
 * Cancel a booking
 * PUT /api/v1/bookings/:id/cancel
 * Requires: Authentication (owner or admin)
 */
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return errorResponse(res, 'Booking not found.', 404);
    }

    const isOwner = appointment.customerId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'Access denied. You do not own this booking.', 403);
    }

    if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      return errorResponse(res, 'Booking is already cancelled.', 400);
    }

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
      return errorResponse(res, 'Completed bookings cannot be cancelled.', 400);
    }

    appointment.status = APPOINTMENT_STATUS.CANCELLED;
    if (reason) {
      appointment.notes = (appointment.notes || '') + '\nCancellation reason: ' + reason;
    }

    await appointment.save();

    return successResponse(res, 'Booking cancelled successfully.', appointment);
  } catch (error) {
    logger.error('Cancel booking error:', error);
    return errorResponse(res, 'Failed to cancel booking.', 500);
  }
};

/**
 * Reschedule a booking
 * PUT /api/v1/bookings/:id/reschedule
 * Requires: Authentication (owner or admin)
 */
const rescheduleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, startTime } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return errorResponse(res, 'Booking not found.', 404);
    }

    const isOwner = appointment.customerId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'Access denied. You do not own this booking.', 403);
    }

    if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      return errorResponse(res, 'Cancelled bookings cannot be rescheduled.', 400);
    }

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
      return errorResponse(res, 'Completed bookings cannot be rescheduled.', 400);
    }

    const stylist = await Stylist.findById(appointment.stylistId);
    if (!stylist) {
      return errorResponse(res, 'Stylist not found.', 404);
    }

    const bookingDate = new Date(date);
    const dayOfWeek = getDayOfWeek(bookingDate);

    if (!dayOfWeek || !stylist.workingHours[dayOfWeek]) {
      return errorResponse(res, 'Stylist does not work on this day.', 400);
    }

    const existingBooking = await Appointment.findOne({
      _id: { $ne: id },
      stylistId: appointment.stylistId,
      date: bookingDate,
      startTime,
      status: { $nin: [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.NO_SHOW] }
    });

    if (existingBooking) {
      return errorResponse(res, 'Time slot is already booked. Please select another time.', 409);
    }

    // Calculate end time based on total duration
    const endTime = calculateEndTime(startTime, appointment.totalDuration);

    appointment.date = bookingDate;
    appointment.startTime = startTime;
    appointment.endTime = endTime;

    await appointment.save();

    const updatedAppointment = await Appointment.findById(id)
      .populate('customerId', 'firstName lastName email phone')
      .populate('stylistId', 'userId')
      .populate('serviceIds', 'name price duration description');

    return successResponse(res, 'Booking rescheduled successfully.', updatedAppointment);
  } catch (error) {
    logger.error('Reschedule booking error:', error);
    return errorResponse(res, 'Failed to reschedule booking.', 500);
  }
};

/**
 * Get all bookings (admin only)
 * GET /api/v1/bookings/all
 * Requires: Admin role
 */
const getAllBookings = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) filter.date = { $lte: new Date(endDate) };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Appointment.find(filter)
      .populate('customerId', 'firstName lastName email phone')
      .populate('stylistId', 'userId')
      .populate('serviceIds', 'name price duration description')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1, startTime: -1 });

    const total = await Appointment.countDocuments(filter);

    return successResponse(res, 'All bookings retrieved successfully.', {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get all bookings error:', error);
    return errorResponse(res, 'Failed to retrieve bookings.', 500);
  }
};

/**
 * Get bookings for a specific stylist
 * GET /api/v1/bookings/stylist/:id
 * Requires: Authentication
 */
const getStylistBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const filter = { stylistId: id };
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const bookings = await Appointment.find(filter)
      .populate('customerId', 'firstName lastName email phone')
      .populate('serviceIds', 'name price duration description')
      .sort({ date: 1, startTime: 1 });

    return successResponse(res, 'Stylist bookings retrieved successfully.', bookings);
  } catch (error) {
    logger.error('Get stylist bookings error:', error);
    return errorResponse(res, 'Failed to retrieve stylist bookings.', 500);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
  getAllBookings,
  getStylistBookings
};