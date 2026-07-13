/**
 * admin.routes.js
 * Admin-only routes for management, availability, and reports
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { idParamValidation } = require('../validators');
const bookingController = require('../controllers/booking.controller');
const availabilityController = require('../controllers/availability.controller');
const reportController = require('../controllers/report.controller');

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Booking management
router.get('/bookings', bookingController.getAllBookings);
router.get('/bookings/stylist/:id', validate(idParamValidation), bookingController.getStylistBookings);

// Availability management
router.get('/availability', availabilityController.checkAvailability);
router.get('/availability/slots', availabilityController.getAvailableSlots);
router.get('/availability/time-slots', availabilityController.getTimeSlotsForDate);

// Reports and analytics
router.get('/reports/booking-trends', reportController.getBookingTrends);
router.get('/reports/service-popularity', reportController.getServicePopularity);
router.get('/reports/stylist-performance', reportController.getStylistPerformance);
router.get('/reports/revenue', reportController.getRevenueReport);
router.get('/reports/dashboard', reportController.getDashboardStats);

module.exports = router;
