/**
 * user.controller.js
 * Manages user operations including listing, viewing, updating,
 * and deleting users. Admin-only operations.
 */

const User = require('../models/User.model');
const { successResponse, errorResponse } = require('../utils/response');
const { USER_ROLES } = require('../utils/constants');
const logger = require('../config/logger');

/**
 * Get all users with pagination and role filtering
 * GET /api/v1/users
 * Requires: Admin role
 */
const getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (role) filter.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    return successResponse(res, 'Users retrieved successfully.', {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    return errorResponse(res, 'Failed to retrieve users.', 500);
  }
};

/**
 * Get single user by ID
 * GET /api/v1/users/:id
 * Requires: Admin role
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    return successResponse(res, 'User retrieved successfully.', user);
  } catch (error) {
    logger.error('Get user by ID error:', error);
    return errorResponse(res, 'Failed to retrieve user.', 500);
  }
};

/**
 * Update user details
 * PUT /api/v1/users/:id
 * Requires: Admin role
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    const userData = user.toObject();
    delete userData.password;

    return successResponse(res, 'User updated successfully.', userData);
  } catch (error) {
    logger.error('Update user error:', error);
    return errorResponse(res, 'Failed to update user.', 500);
  }
};

/**
 * Delete user
 * DELETE /api/v1/users/:id
 * Requires: Admin role
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    await user.deleteOne();

    return successResponse(res, 'User deleted successfully.');
  } catch (error) {
    logger.error('Delete user error:', error);
    return errorResponse(res, 'Failed to delete user.', 500);
  }
};

/**
 * Get all customers only
 * GET /api/v1/users/customers
 */
const getCustomers = async (req, res) => {
  try {
    const users = await User.find({ role: USER_ROLES.CUSTOMER })
      .select('-password')
      .sort({ createdAt: -1 });

    return successResponse(res, 'Customers retrieved successfully.', users);
  } catch (error) {
    logger.error('Get customers error:', error);
    return errorResponse(res, 'Failed to retrieve customers.', 500);
  }
};

/**
 * Get all stylists only
 * GET /api/v1/users/stylists
 * Requires: Admin role
 */
const getStylists = async (req, res) => {
  try {
    const users = await User.find({ role: USER_ROLES.STYLIST })
      .select('-password')
      .sort({ createdAt: -1 });

    return successResponse(res, 'Stylists retrieved successfully.', users);
  } catch (error) {
    logger.error('Get stylists error:', error);
    return errorResponse(res, 'Failed to retrieve stylists.', 500);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getCustomers,
  getStylists
};