/**
 * service.controller.js
 * Manages salon services including CRUD operations.
 * Admin-only for write operations, public for read.
 */

const Service = require('../models/Service.model');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../config/logger');

/**
 * Create a new service
 * POST /api/v1/services
 * Requires: Admin role
 */
const createService = async (req, res) => {
  try {
    const { name, description, price, duration, category } = req.body;

    const existingService = await Service.findOne({ name });
    if (existingService) {
      return errorResponse(res, 'Service with this name already exists.', 409);
    }

    const service = await Service.create({
      name,
      description,
      price,
      duration,
      category
    });

    return successResponse(res, 'Service created successfully.', service, 201);
  } catch (error) {
    logger.error('Create service error:', error);
    return errorResponse(res, 'Failed to create service.', 500);
  }
};

/**
 * Get all services with pagination and filtering
 * GET /api/v1/services
 * Public endpoint
 */
const getServices = async (req, res) => {
  try {
    const { category, isActive, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const services = await Service.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await Service.countDocuments(filter);

    return successResponse(res, 'Services retrieved successfully.', {
      services,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get services error:', error);
    return errorResponse(res, 'Failed to retrieve services.', 500);
  }
};

/**
 * Get single service by ID
 * GET /api/v1/services/:id
 */
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);

    if (!service) {
      return errorResponse(res, 'Service not found.', 404);
    }

    return successResponse(res, 'Service retrieved successfully.', service);
  } catch (error) {
    logger.error('Get service by ID error:', error);
    return errorResponse(res, 'Failed to retrieve service.', 500);
  }
};

/**
 * Update a service
 * PUT /api/v1/services/:id
 * Requires: Admin role
 */
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration, category, isActive } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return errorResponse(res, 'Service not found.', 404);
    }

    if (name) {
      const existingService = await Service.findOne({ 
        name: name, 
        _id: { $ne: id } 
      });
      if (existingService) {
        return errorResponse(res, 'Service with this name already exists.', 409);
      }
      service.name = name;
    }
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = price;
    if (duration !== undefined) service.duration = duration;
    if (category) service.category = category;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    return successResponse(res, 'Service updated successfully.', service);
  } catch (error) {
    logger.error('Update service error:', error);
    return errorResponse(res, 'Failed to update service.', 500);
  }
};

/**
 * Delete a service
 * DELETE /api/v1/services/:id
 * Requires: Admin role
 */
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      return errorResponse(res, 'Service not found.', 404);
    }

    await service.deleteOne();

    return successResponse(res, 'Service deleted successfully.');
  } catch (error) {
    logger.error('Delete service error:', error);
    return errorResponse(res, 'Failed to delete service.', 500);
  }
};

/**
 * Get all unique service categories
 * GET /api/v1/services/categories
 */
const getServiceCategories = async (req, res) => {
  try {
    const categories = await Service.distinct('category');
    return successResponse(res, 'Categories retrieved successfully.', categories);
  } catch (error) {
    logger.error('Get categories error:', error);
    return errorResponse(res, 'Failed to retrieve categories.', 500);
  }
};

module.exports = {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  getServiceCategories
};