/**
 * stylist.controller.js
 * Manages stylist profiles including creation, updates,
 * availability management, and retrieval.
 */

const Stylist = require('../models/Stylist.model');
const User = require('../models/User.model');
const { successResponse, errorResponse } = require('../utils/response');
const { USER_ROLES } = require('../utils/constants');
const logger = require('../config/logger');

/**
 * Create a stylist profile
 * POST /api/v1/stylists
 * Requires: Admin role
 */
const createStylist = async (req, res) => {
  try {
    const { userId, specialization, workingHours } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    if (user.role !== USER_ROLES.STYLIST) {
      user.role = USER_ROLES.STYLIST;
      await user.save();
    }

    const existingStylist = await Stylist.findOne({ userId });
    if (existingStylist) {
      return errorResponse(res, 'Stylist profile already exists for this user.', 409);
    }

    const stylist = await Stylist.create({
      userId,
      specialization,
      workingHours
    });

    const populatedStylist = await Stylist.findById(stylist._id)
      .populate('userId', 'firstName lastName email phone');

    return successResponse(res, 'Stylist profile created successfully.', populatedStylist, 201);
  } catch (error) {
    logger.error('Create stylist error:', error);
    return errorResponse(res, 'Failed to create stylist profile.', 500);
  }
};

/**
 * Get all stylists with pagination
 * GET /api/v1/stylists
 */
const getStylists = async (req, res) => {
  try {
    const { isAvailable, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const stylists = await Stylist.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ rating: -1 });

    const total = await Stylist.countDocuments(filter);

    return successResponse(res, 'Stylists retrieved successfully.', {
      stylists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get stylists error:', error);
    return errorResponse(res, 'Failed to retrieve stylists.', 500);
  }
};

/**
 * Get stylist by ID
 * GET /api/v1/stylists/:id
 */
const getStylistById = async (req, res) => {
  try {
    const { id } = req.params;
    const stylist = await Stylist.findById(id)
      .populate('userId', 'firstName lastName email phone');

    if (!stylist) {
      return errorResponse(res, 'Stylist not found.', 404);
    }

    return successResponse(res, 'Stylist retrieved successfully.', stylist);
  } catch (error) {
    logger.error('Get stylist by ID error:', error);
    return errorResponse(res, 'Failed to retrieve stylist.', 500);
  }
};

/**
 * Update stylist profile
 * PUT /api/v1/stylists/:id
 * Requires: Admin role
 */
const updateStylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { specialization, workingHours, isAvailable, rating } = req.body;

    const stylist = await Stylist.findById(id);
    if (!stylist) {
      return errorResponse(res, 'Stylist not found.', 404);
    }

    if (specialization) stylist.specialization = specialization;
    if (workingHours) stylist.workingHours = workingHours;
    if (isAvailable !== undefined) stylist.isAvailable = isAvailable;
    if (rating !== undefined) stylist.rating = rating;

    await stylist.save();

    const updatedStylist = await Stylist.findById(id)
      .populate('userId', 'firstName lastName email phone');

    return successResponse(res, 'Stylist updated successfully.', updatedStylist);
  } catch (error) {
    logger.error('Update stylist error:', error);
    return errorResponse(res, 'Failed to update stylist.', 500);
  }
};

/**
 * Delete stylist profile
 * DELETE /api/v1/stylists/:id
 * Requires: Admin role
 */
const deleteStylist = async (req, res) => {
  try {
    const { id } = req.params;

    const stylist = await Stylist.findById(id);
    if (!stylist) {
      return errorResponse(res, 'Stylist not found.', 404);
    }

    await stylist.deleteOne();

    return successResponse(res, 'Stylist deleted successfully.');
  } catch (error) {
    logger.error('Delete stylist error:', error);
    return errorResponse(res, 'Failed to delete stylist.', 500);
  }
};

/**
 * Get stylist availability for a specific date
 * GET /api/v1/stylists/:id/availability
 */
const getStylistAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const stylist = await Stylist.findById(id);
    if (!stylist) {
      return errorResponse(res, 'Stylist not found.', 404);
    }

    if (!stylist.isAvailable) {
      return successResponse(res, 'Stylist availability retrieved.', {
        available: false,
        message: 'Stylist is currently not available.'
      });
    }

    return successResponse(res, 'Stylist availability retrieved.', {
      available: true,
      workingHours: stylist.workingHours
    });
  } catch (error) {
    logger.error('Get stylist availability error:', error);
    return errorResponse(res, 'Failed to retrieve availability.', 500);
  }
};

module.exports = {
  createStylist,
  getStylists,
  getStylistById,
  updateStylist,
  deleteStylist,
  getStylistAvailability
};