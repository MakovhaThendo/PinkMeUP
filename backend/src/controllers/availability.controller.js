/**
 * availability.controller.js
 * Handles availability checking for stylists and time slots.
 * Updated to support multiple services per booking.
 */

const Appointment = require('../models/Appointment.model');
const Service = require('../models/Service.model');
const Stylist = require('../models/Stylist.model');
const { successResponse, errorResponse } = require('../utils/response');
const { generateTimeSlots, getDayOfWeek } = require('../utils/helpers');
const logger = require('../config/logger');

/**
 * Check availability for a specific stylist on a date
 * GET /api/v1/availability
 * Updated to check if time slot can accommodate a service (or multiple services)
 */
const checkAvailability = async (req, res) => {
  try {
    const { stylistId, date, serviceIds } = req.query;

    if (!stylistId || !date) {
      return errorResponse(res, 'Stylist ID and date are required.', 400);
    }

    // Parse service IDs if provided
    let serviceIdArray = [];
    if (serviceIds) {
      serviceIdArray = Array.isArray(serviceIds) ? serviceIds : [serviceIds];
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

    // Get already booked slots
    const bookedSlots = await Appointment.find({
      stylistId,
      date: bookingDate,
      status: { $nin: ['cancelled', 'no_show'] }
    }).select('startTime endTime totalDuration');

    const bookedStartTimes = bookedSlots.map(slot => slot.startTime);

    // Calculate required duration if services provided
    let requiredDuration = 0;
    if (serviceIdArray.length > 0) {
      const services = await Service.find({ _id: { $in: serviceIdArray } });
      services.forEach(service => {
        requiredDuration += service.duration;
      });
    }

    // Generate available slots (30-minute intervals)
    const allSlots = generateTimeSlots(start, end, 30);

    // Filter slots based on booked slots and required duration
    let availableSlots = allSlots.filter(
      slot => !bookedStartTimes.includes(slot)
    );

    // If checking for a specific service, filter by duration requirement
    if (requiredDuration > 0) {
      const slotDuration = 30; // Each slot is 30 minutes
      const slotsNeeded = Math.ceil(requiredDuration / slotDuration);
      
      // Check for consecutive available slots
      const filteredSlots = [];
      for (let i = 0; i < availableSlots.length; i++) {
        let consecutiveCount = 1;
        for (let j = i + 1; j < availableSlots.length && j < i + slotsNeeded; j++) {
          // Check if slots are consecutive (30 min apart)
          const currentMinutes = parseInt(availableSlots[i].split(':')[0]) * 60 + parseInt(availableSlots[i].split(':')[1]);
          const nextMinutes = parseInt(availableSlots[j].split(':')[0]) * 60 + parseInt(availableSlots[j].split(':')[1]);
          if (nextMinutes - currentMinutes === 30 * (j - i)) {
            consecutiveCount++;
          } else {
            break;
          }
        }
        if (consecutiveCount >= slotsNeeded) {
          filteredSlots.push(availableSlots[i]);
        }
      }
      availableSlots = filteredSlots;
    }

    return successResponse(res, 'Availability retrieved successfully.', {
      stylist: {
        id: stylist._id,
        specialization: stylist.specialization
      },
      date: date,
      workingHours: { start, end },
      availableSlots,
      totalAvailable: availableSlots.length,
      requiredDuration: requiredDuration || null,
      serviceCount: serviceIdArray.length || 0
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
    const { date, serviceIds } = req.query;

    if (!date) {
      return errorResponse(res, 'Date is required.', 400);
    }

    // Parse service IDs if provided
    let serviceIdArray = [];
    let requiredDuration = 0;
    if (serviceIds) {
      serviceIdArray = Array.isArray(serviceIds) ? serviceIds : [serviceIds];
      const services = await Service.find({ _id: { $in: serviceIdArray } });
      services.forEach(service => {
        requiredDuration += service.duration;
      });
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
      let availableSlots = generateTimeSlots(start, end, 30).filter(
        slot => !bookedStartTimes.includes(slot)
      );

      // If checking for specific services, filter by duration
      if (requiredDuration > 0) {
        const slotDuration = 30;
        const slotsNeeded = Math.ceil(requiredDuration / slotDuration);
        const filteredSlots = [];
        for (let i = 0; i < availableSlots.length; i++) {
          let consecutiveCount = 1;
          for (let j = i + 1; j < availableSlots.length && j < i + slotsNeeded; j++) {
            const currentMinutes = parseInt(availableSlots[i].split(':')[0]) * 60 + parseInt(availableSlots[i].split(':')[1]);
            const nextMinutes = parseInt(availableSlots[j].split(':')[0]) * 60 + parseInt(availableSlots[j].split(':')[1]);
            if (nextMinutes - currentMinutes === 30 * (j - i)) {
              consecutiveCount++;
            } else {
              break;
            }
          }
          if (consecutiveCount >= slotsNeeded) {
            filteredSlots.push(availableSlots[i]);
          }
        }
        availableSlots = filteredSlots;
      }

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
      stylists: availableStylists,
      requiredDuration: requiredDuration || null,
      serviceCount: serviceIdArray.length || 0
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
    const { stylistId, date, serviceIds } = req.query;

    if (!stylistId || !date) {
      return errorResponse(res, 'Stylist ID and date are required.', 400);
    }

    // Parse service IDs if provided
    let serviceIdArray = [];
    let requiredDuration = 0;
    if (serviceIds) {
      serviceIdArray = Array.isArray(serviceIds) ? serviceIds : [serviceIds];
      const services = await Service.find({ _id: { $in: serviceIdArray } });
      services.forEach(service => {
        requiredDuration += service.duration;
      });
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
    let availableSlots = generateTimeSlots(start, end, 30).filter(
      slot => !bookedStartTimes.includes(slot)
    );

    // If checking for specific services, filter by duration
    if (requiredDuration > 0) {
      const slotDuration = 30;
      const slotsNeeded = Math.ceil(requiredDuration / slotDuration);
      const filteredSlots = [];
      for (let i = 0; i < availableSlots.length; i++) {
        let consecutiveCount = 1;
        for (let j = i + 1; j < availableSlots.length && j < i + slotsNeeded; j++) {
          const currentMinutes = parseInt(availableSlots[i].split(':')[0]) * 60 + parseInt(availableSlots[i].split(':')[1]);
          const nextMinutes = parseInt(availableSlots[j].split(':')[0]) * 60 + parseInt(availableSlots[j].split(':')[1]);
          if (nextMinutes - currentMinutes === 30 * (j - i)) {
            consecutiveCount++;
          } else {
            break;
          }
        }
        if (consecutiveCount >= slotsNeeded) {
          filteredSlots.push(availableSlots[i]);
        }
      }
      availableSlots = filteredSlots;
    }

    return successResponse(res, 'Time slots retrieved successfully.', {
      date,
      workingHours: { start, end },
      availableSlots,
      totalAvailable: availableSlots.length,
      requiredDuration: requiredDuration || null,
      serviceCount: serviceIdArray.length || 0
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