/**
 * auth.routes.js
 * Authentication routes - public and protected
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { registerValidation, loginValidation } = require('../validators');
const authController = require('../controllers/auth.controller');

// Public routes (no authentication required)
router.post('/register', validate(registerValidation), authController.register);
router.post('/login', validate(loginValidation), authController.login);

// Protected routes (require authentication)
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;