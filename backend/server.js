/**
 * server.js
 * Server entry point - starts the Express application
 */

// Load environment variables FIRST
require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 5000;

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info('=================================');
      logger.info('   PinkMeUp Booking System API');
      logger.info('=================================');
      logger.info('Environment: ' + (process.env.NODE_ENV || 'development'));
      logger.info('Port: ' + PORT);
      logger.info('Health: http://localhost:' + PORT + '/health');
      logger.info('API: http://localhost:' + PORT + '/api/v1');
      logger.info('=================================');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! Shutting down...');
      logger.error(err.name + ': ' + err.message);
      if (err.stack) logger.error(err.stack);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('UNCAUGHT EXCEPTION! Shutting down...');
      logger.error(err.name + ': ' + err.message);
      if (err.stack) logger.error(err.stack);
      process.exit(1);
    });

    // Handle SIGTERM signal
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated!');
      });
    });

    // Handle SIGINT signal (Ctrl+C)
    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated!');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server: ' + error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;