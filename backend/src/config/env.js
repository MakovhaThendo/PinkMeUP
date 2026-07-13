/**
 * env.js
 * Environment configuration and validation
 */

const dotenv = require('dotenv');
dotenv.config();

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN'
];

const missingVars = requiredEnvVars.filter(
  (varName) => !process.env[varName] || process.env[varName].trim() === ''
);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please check your .env file');
  process.exit(1);
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  EMAIL: {
    FROM: process.env.EMAIL_FROM,
    HOST: process.env.EMAIL_HOST,
    PORT: parseInt(process.env.EMAIL_PORT, 10) || 587,
    USER: process.env.EMAIL_USER,
    PASS: process.env.EMAIL_PASS
  },
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  BUSINESS: {
    NAME: 'PinkMeUp Beauty Spa & Academy',
    EMAIL: 'pinkmeup01@gmail.com',
    ADDRESS: 'Wits University, Matrix Building, Floor 1'
  }
};