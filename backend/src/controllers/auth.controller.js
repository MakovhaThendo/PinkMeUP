/**
 * auth.controller.js
 * Handles all authentication-related operations including registration,
 * login, profile management, and password changes.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../config/logger');

/**
 * Generate JWT token for authenticated user
 * @param {string} userId - MongoDB ObjectId of the user
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * Register a new customer account
 * POST /api/v1/auth/register
 */
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'Email already registered. Please login.', 409);
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: 'customer'
    });

    const token = generateToken(user._id);

    const userData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    return successResponse(res, 'Registration successful. Welcome to PinkMeUp!', {
      user: userData,
      token
    }, 201);
  } catch (error) {
    logger.error('Registration error:', error);
    return errorResponse(res, 'Registration failed. Please try again.', 500);
  }
};

/**
 * Login existing user
 * POST /api/v1/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Account is deactivated. Please contact support.', 403);
    }

    const token = generateToken(user._id);

    const userData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    return successResponse(res, 'Login successful. Welcome back!', {
      user: userData,
      token
    });
  } catch (error) {
    logger.error('Login error:', error);
    return errorResponse(res, 'Login failed. Please try again.', 500);
  }
};

/**
 * Get authenticated user's profile
 * GET /api/v1/auth/profile
 * Requires: Authentication token
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }
    return successResponse(res, 'Profile retrieved successfully.', user);
  } catch (error) {
    logger.error('Get profile error:', error);
    return errorResponse(res, 'Failed to retrieve profile.', 500);
  }
};

/**
 * Update authenticated user's profile
 * PUT /api/v1/auth/profile
 * Requires: Authentication token
 */
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;

    await user.save();

    const userData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    return successResponse(res, 'Profile updated successfully.', userData);
  } catch (error) {
    logger.error('Update profile error:', error);
    return errorResponse(res, 'Failed to update profile.', 500);
  }
};

/**
 * Change user password
 * PUT /api/v1/auth/change-password
 * Requires: Authentication token
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return errorResponse(res, 'Current password is incorrect.', 401);
    }

    user.password = newPassword;
    await user.save();

    return successResponse(res, 'Password changed successfully.');
  } catch (error) {
    logger.error('Change password error:', error);
    return errorResponse(res, 'Failed to change password.', 500);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};