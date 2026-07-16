/**
 * Booking management routes - protected
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { bookingValidation, rescheduleValidation, cancelValidation, idParamValidation, paginationValidation } = require('../validators');
const bookingController = require('../controllers/booking.controller');

router.use(authenticate);

// Customer routes
router.get('/my', validate(paginationValidation), bookingController.getMyBookings);
router.get('/:id', validate(idParamValidation), bookingController.getBookingById);
router.post('/', validate(bookingValidation), bookingController.createBooking);
router.put('/:id/cancel', validate(cancelValidation), bookingController.cancelBooking);
router.put('/:id/reschedule', validate(rescheduleValidation), bookingController.rescheduleBooking);

// Admin routes
router.get('/all', authorize('admin'), validate(paginationValidation), bookingController.getAllBookings);

module.exports = router;