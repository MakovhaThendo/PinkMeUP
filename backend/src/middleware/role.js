/**
 * role.js
 * Role-based access control middleware
 * Provides role-specific authorization functions
 */

const { USER_ROLES } = require('../utils/constants');

/**
 * Authorize based on roles
 * @param {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to perform this action.'
      });
    }

    next();
  };
};

/**
 * Admin only access
 * @returns {Function} Middleware function
 */
const isAdmin = () => authorize(USER_ROLES.ADMIN);

/**
 * Stylist or Admin access
 * @returns {Function} Middleware function
 */
const isStylist = () => authorize(USER_ROLES.STYLIST, USER_ROLES.ADMIN);

/**
 * Customer or Admin access
 * @returns {Function} Middleware function
 */
const isCustomer = () => authorize(USER_ROLES.CUSTOMER, USER_ROLES.ADMIN);

/**
 * Owner or Admin access - checks if user owns the resource
 * @param {string} resourceIdField - Field name containing the user ID in the resource
 * @param {string} paramName - Name of the parameter containing the resource ID
 * @returns {Function} Middleware function
 */
const isOwnerOrAdmin = (resourceIdField = 'userId', paramName = 'id') => {
  return async (req, res, next) => {
    try {
      if (req.user.role === USER_ROLES.ADMIN) {
        return next();
      }

      const resourceId = req.params[paramName];
      const Model = require('../models/' + getModelName(req.baseUrl));
      
      const resource = await Model.findById(resourceId);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found.'
        });
      }

      const ownerId = resource[resourceIdField] || resource.customerId;
      
      if (ownerId && ownerId.toString() === req.user.id) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this resource.'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking ownership.'
      });
    }
  };
};

/**
 * Helper function to get model name from route
 */
const getModelName = (baseUrl) => {
  const routeMap = {
    '/api/v1/bookings': 'Appointment.model',
    '/api/v1/users': 'User.model',
    '/api/v1/services': 'Service.model',
    '/api/v1/stylists': 'Stylist.model'
  };
  return routeMap[baseUrl] || 'User.model';
};

module.exports = {
  authorize,
  isAdmin,
  isStylist,
  isCustomer,
  isOwnerOrAdmin
};