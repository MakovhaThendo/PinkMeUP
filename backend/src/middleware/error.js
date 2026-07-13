/**
 * error.js
 * Global error handling middleware
 */

const logger = require('../config/logger');

/**
 * Global error handler
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user.id : 'unauthenticated'
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error.';

  const response = {
    success: false,
    message: message
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Not found handler - catches all unmatched routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const notFound = (req, res, next) => {
  const error = new Error('Route not found: ' + req.originalUrl);
  error.statusCode = 404;
  next(error);
};

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a 400 Bad Request error
 * @param {string} message - Error message
 * @param {Array} errors - Validation errors
 * @returns {ApiError} ApiError instance
 */
const badRequest = (message, errors = null) => {
  return new ApiError(message, 400, errors);
};

/**
 * Create a 401 Unauthorized error
 * @param {string} message - Error message
 * @returns {ApiError} ApiError instance
 */
const unauthorized = (message = 'Unauthorized') => {
  return new ApiError(message, 401);
};

/**
 * Create a 403 Forbidden error
 * @param {string} message - Error message
 * @returns {ApiError} ApiError instance
 */
const forbidden = (message = 'Forbidden') => {
  return new ApiError(message, 403);
};

/**
 * Create a 404 Not Found error
 * @param {string} message - Error message
 * @returns {ApiError} ApiError instance
 */
const notFoundError = (message = 'Resource not found') => {
  return new ApiError(message, 404);
};

/**
 * Create a 409 Conflict error
 * @param {string} message - Error message
 * @returns {ApiError} ApiError instance
 */
const conflict = (message = 'Conflict') => {
  return new ApiError(message, 409);
};

module.exports = {
  errorHandler,
  notFound,
  ApiError,
  badRequest,
  unauthorized,
  forbidden,
  notFoundError,
  conflict
};