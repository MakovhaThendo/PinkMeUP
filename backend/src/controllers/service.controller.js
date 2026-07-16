/**
 * Service management controller - public read, admin write
 */

const Service = require('../models/Service.model');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../config/logger');

const createService = async (req, res) => {
  try {
    const { name, description, price, duration, category } = req.body;
    const existing = await Service.findOne({ name });
    if (existing) return errorResponse(res, 'Service already exists.', 409);

    const service = await Service.create({ name, description, price, duration, category });
    return successResponse(res, 'Service created.', service, 201);
  } catch (error) {
    logger.error('Create service error:', error);
    return errorResponse(res, 'Failed to create service.', 500);
  }
};

const getServices = async (req, res) => {
  try {
    const { category, isActive, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const services = await Service.find(filter).skip(skip).limit(parseInt(limit)).sort({ name: 1 });
    const total = await Service.countDocuments(filter);

    return successResponse(res, 'Services retrieved.', {
      services,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    logger.error('Get services error:', error);
    return errorResponse(res, 'Failed to retrieve services.', 500);
  }
};

const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return errorResponse(res, 'Service not found.', 404);
    return successResponse(res, 'Service retrieved.', service);
  } catch (error) {
    logger.error('Get service error:', error);
    return errorResponse(res, 'Failed to retrieve service.', 500);
  }
};

const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration, category, isActive } = req.body;

    const service = await Service.findById(id);
    if (!service) return errorResponse(res, 'Service not found.', 404);

    if (name) {
      const existing = await Service.findOne({ name, _id: { $ne: id } });
      if (existing) return errorResponse(res, 'Service name already exists.', 409);
      service.name = name;
    }
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = price;
    if (duration !== undefined) service.duration = duration;
    if (category) service.category = category;
    if (isActive !== undefined) service.isActive = isActive;
    await service.save();

    return successResponse(res, 'Service updated.', service);
  } catch (error) {
    logger.error('Update service error:', error);
    return errorResponse(res, 'Failed to update service.', 500);
  }
};

const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return errorResponse(res, 'Service not found.', 404);
    await service.deleteOne();
    return successResponse(res, 'Service deleted.');
  } catch (error) {
    logger.error('Delete service error:', error);
    return errorResponse(res, 'Failed to delete service.', 500);
  }
};

const getServiceCategories = async (req, res) => {
  try {
    const categories = await Service.distinct('category');
    return successResponse(res, 'Categories retrieved.', categories);
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