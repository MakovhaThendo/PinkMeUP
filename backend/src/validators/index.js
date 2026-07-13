const { body, param, query } = require('express-validator');

const registerValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .isMobilePhone('any').withMessage('Please provide a valid phone number')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
];

const bookingValidation = [
  body('serviceId')
    .notEmpty().withMessage('Service ID is required')
    .isMongoId().withMessage('Invalid service ID format'),

  body('stylistId')
    .notEmpty().withMessage('Stylist ID is required')
    .isMongoId().withMessage('Invalid stylist ID format'),

  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),

  body('startTime')
    .notEmpty().withMessage('Start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),

  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];

const rescheduleValidation = [
  param('id')
    .isMongoId().withMessage('Invalid appointment ID'),

  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),

  body('startTime')
    .notEmpty().withMessage('Start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format')
];

const cancelValidation = [
  param('id')
    .isMongoId().withMessage('Invalid appointment ID'),

  body('reason')
    .optional()
    .isLength({ max: 200 }).withMessage('Reason cannot exceed 200 characters')
];

const serviceValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Service name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('duration')
    .notEmpty().withMessage('Duration is required')
    .isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes'),

  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
];

const stylistValidation = [
  body('userId')
    .isMongoId().withMessage('Invalid user ID format'),

  body('specialization')
    .optional()
    .isArray().withMessage('Specialization must be an array'),

  body('workingHours')
    .optional()
    .isObject().withMessage('Working hours must be an object')
];

const idParamValidation = [
  param('id')
    .isMongoId().withMessage('Invalid ID format')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt()
];

module.exports = {
  registerValidation,
  loginValidation,
  bookingValidation,
  rescheduleValidation,
  cancelValidation,
  serviceValidation,
  stylistValidation,
  idParamValidation,
  paginationValidation
};
