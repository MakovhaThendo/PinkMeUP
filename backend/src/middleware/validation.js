/**
 * validation.js
 * Request validation middleware using express-validator
 */

const { validationResult } = require('express-validator');

/**
 * Validate request against validation rules
 * @param {Array} validations - Array of express-validator validation chains
 * @returns {Function} Middleware function
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  };
};

/**
 * Validate request body against validation rules
 * @param {Object} schema - Validation schema object
 * @returns {Function} Middleware function
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      
      for (const rule of rules) {
        const result = rule(value);
        if (result !== true) {
          errors.push({
            field,
            message: result
          });
          break;
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

/**
 * Create validation rule helpers
 */
const rules = {
  required: (value) => {
    if (value === undefined || value === null || value === '') {
      return 'This field is required';
    }
    return true;
  },
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return 'Please provide a valid email address';
    }
    return true;
  },
  minLength: (min) => (value) => {
    if (value && value.length < min) {
      return 'Must be at least ' + min + ' characters';
    }
    return true;
  },
  maxLength: (max) => (value) => {
    if (value && value.length > max) {
      return 'Cannot exceed ' + max + ' characters';
    }
    return true;
  },
  min: (min) => (value) => {
    if (value !== undefined && value !== null && value < min) {
      return 'Must be at least ' + min;
    }
    return true;
  }
};

module.exports = {
  validate,
  validateBody,
  rules
};