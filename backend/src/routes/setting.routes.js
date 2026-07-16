/**
 * setting.routes.js
 * Business settings routes - admin only
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { body } = require('express-validator');
const settingController = require('../controllers/setting.controller');

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Validation rules for updating settings
const updateSettingsValidation = [
  body('businessHours')
    .optional()
    .isObject()
    .withMessage('Business hours must be an object'),

  body('businessHours.monday')
    .optional()
    .isObject()
    .withMessage('Monday hours must be an object'),

  body('businessHours.monday.start')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format. Use HH:MM'),

  body('businessHours.monday.end')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format. Use HH:MM'),

  body('slotInterval')
    .optional()
    .isInt({ min: 15, max: 60 })
    .withMessage('Slot interval must be between 15 and 60 minutes'),

  body('maxBookingsPerSlot')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max bookings per slot must be at least 1'),

  body('bookingLeadTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Booking lead time must be a positive number'),

  body('cancellationWindow')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Cancellation window must be a positive number'),

  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a string'),

  body('businessName')
    .optional()
    .isString()
    .withMessage('Business name must be a string')
];

const updateBusinessHoursValidation = [
  body('businessHours')
    .isObject()
    .withMessage('Business hours are required'),

  body('businessHours.monday')
    .optional()
    .isObject()
    .withMessage('Monday hours must be an object'),

  body('businessHours.monday.start')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format. Use HH:MM'),

  body('businessHours.monday.end')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format. Use HH:MM')
];

// Routes
router.get('/', settingController.getSettings);
router.put('/', validate(updateSettingsValidation), settingController.updateSettings);
router.post('/reset', settingController.resetSettings);
router.get('/hours', settingController.getBusinessHours);
router.put('/hours', validate(updateBusinessHoursValidation), settingController.updateBusinessHours);

module.exports = router;