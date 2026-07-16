/**
 * Environment configuration and validation
 * Loads .env file and validates required variables
 */

const dotenv = require('dotenv');
dotenv.config();

const required = ['NODE_ENV', 'PORT', 'MONGODB_URI', 'JWT_SECRET', 'JWT_EXPIRES_IN'];
const missing = required.filter(key => !process.env[key] || process.env[key].trim() === '');

if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  EMAIL: {
    FROM: process.env.EMAIL_FROM,
    HOST: process.env.EMAIL_HOST,
    PORT: parseInt(process.env.EMAIL_PORT, 10) || 587,
    USER: process.env.EMAIL_USER,
    PASS: process.env.EMAIL_PASS
  },
  BUSINESS: {
    NAME: 'PinkMeUp Beauty Spa & Academy',
    EMAIL: 'pinkmeup01@gmail.com',
    ADDRESS: 'Wits University, Matrix Building, Floor 1'
  }
};