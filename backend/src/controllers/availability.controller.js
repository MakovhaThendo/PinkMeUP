/**
 * availability.controller.js
 * Handles availability checking for stylists and time slots.
 * Used by customers to find available appointments.
 */

const Appointment = require('../models/Appointment.model');
const Stylist = require('../models/Stylist.model');
const { successResponse, errorResponse } = require('../utils/response');
const { generateTimeSlots, getDayOfWeek } = require('../utils/helpers');
const logger = require('../config/logger');

/**
 * Check availability for a specific stylist on a date
 * GET /api/v1/availability
 */
const checkAvailability = async (req, res) => {
  try {
    const { stylistId, date } = req.query;

    if (!stylistId || !date) {
      return errorResponse(res, 'Stylist ID and date are required.', 400);
    }

    const stylist = await Stylist.findById(stylistId);
    if (!stylist) {
      return errorResponse(res, 'Stylist not found.', 404);
    }

    if (!stylist.isAvailable) {
      return successResponse(res, 'Stylist availability retrieved.', {
        available: false,
        message: 'Stylist is currently not available.'
      });
    }

    const bookingDate = new Date(date);
    const dayOfWeek = getDayOfWeek(bookingDate);

    if (!dayOfWeek || !stylist.workingHours[dayOfWeek]) {
      return successResponse(res, 'Stylist availability retrieved.', {
        available: false,
        message: 'Stylist does not work on this day.'
      });
    }

    const { start, end } = stylist.workingHours[dayOfWeek];
    if (!start || !end) {
      return successResponse(res, 'Stylist availability retrieved.', {
        available: false,
        message: 'Stylist has no working hours set for this day.'
      });
    }

    const bookedSlots = await Appointment.find({
      stylistId,
      date: bookingDate,
      status: { $nin: ['cancelled', 'no_show'] }
    }).select('startTime');

    const bookedStartTimes = bookedSlots.map(slot => slot.startTime);

    const availableSlots = generateTimeSlots(start, end, 30).filter(
      slot => !bookedStartTimes.includes(slot)
    );

    return successResponse(res, 'Availability retrieved successfully.', {
      stylist: {
        id: stylist._id,
        specialization: stylist.specialization
      },
      date: date,
      workingHours: { start, end },
      availableSlots,
      totalAvailable: availableSlots.length
    });
  } catch (error) {
    logger.error('Check availability error:', error);
    return errorResponse(res, 'Failed to check availability.', 500);
  }
};

/**
 * Get available slots across all stylists for a date
 * GET /api/v1/availability/slots
 */
const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return errorResponse(res, 'Date is required.', 400);
    }

    const bookingDate = new Date(date);
    const dayOfWeek = getDayOfWeek(bookingDate);

    const stylists = await Stylist.find({ isAvailable: true })
      .populate('userId', 'firstName lastName');

    const availableStylists = [];

    for (const stylist of stylists) {
      if (!stylist.workingHours[dayOfWeek]) continue;

      const { start, end } = stylist.workingHours[dayOfWeek];
      if (!start || !end) continue;

      const bookedSlots = await Appointment.find({
        stylistId: stylist._id,
        date: bookingDate,
        status: { $nin: ['cancelled', 'no_show'] }
      }).select('startTime');

      const bookedStartTimes = bookedSlots.map(slot => slot.startTime);
      const availableSlots = generateTimeSlots(start, end, 30).filter(
        slot => !bookedStartTimes.includes(slot)
      );

      if (availableSlots.length > 0) {
        availableStylists.push({
          stylist: {
            id: stylist._id,
            name: stylist.userId ? stylist.userId.firstName + ' ' + stylist.userId.lastName : 'Stylist',
            specialization: stylist.specialization,
            rating: stylist.rating
          },
          availableSlots
        });
      }
    }

    return successResponse(res, 'Available slots retrieved successfully.', {
      date,
      stylists: availableStylists
    });
  } catch (error) {
    logger.error('Get available slots error:', error);
    return errorResponse(res, 'Failed to retrieve available slots.', 500);
  }
};

/**
 * Get time slots for a specific stylist on a date
 * GET /api/v1/availability/time-slots
 */
const getTimeSlotsForDate = async (req, res) => {
  try {
    const { stylistId, date } = req.query;

    if (!stylistId || !date) {
      return errorResponse(res, 'Stylist ID and date are required.', 400);
    }

    const stylist = await Stylist.findById(stylistId);
    if (!stylist) {
      return errorResponse(res, 'Stylist not found.', 404);
    }

    const bookingDate = new Date(date);
    const dayOfWeek = getDayOfWeek(bookingDate);

    if (!dayOfWeek || !stylist.workingHours[dayOfWeek]) {
      return successResponse(res, 'Time slots retrieved.', {
        date,
        availableSlots: [],
        message: 'Stylist does not work on this day.'
      });
    }

    const { start, end } = stylist.workingHours[dayOfWeek];
    if (!start || !end) {
      return successResponse(res, 'Time slots retrieved.', {
        date,
        availableSlots: [],
        message: 'Stylist has no working hours set for this day.'
      });
    }

    const bookedSlots = await Appointment.find({
      stylistId,
      date: bookingDate,
      status: { $nin: ['cancelled', 'no_show'] }
    }).select('startTime');

    const bookedStartTimes = bookedSlots.map(slot => slot.startTime);
    const availableSlots = generateTimeSlots(start, end, 30).filter(
      slot => !bookedStartTimes.includes(slot)
    );

    return successResponse(res, 'Time slots retrieved successfully.', {
      date,
      workingHours: { start, end },
      availableSlots,
      totalAvailable: availableSlots.length
    });
  } catch (error) {
    logger.error('Get time slots error:', error);
    return errorResponse(res, 'Failed to retrieve time slots.', 500);
  }
};

module.exports = {
  checkAvailability,
  getAvailableSlots,
  getTimeSlotsForDate
};