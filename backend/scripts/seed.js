/**
 * seed.js
 * Database seeder - populates the database with initial data
 * Usage: npm run seed
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../src/models/User.model');
const Service = require('../src/models/Service.model');
const Stylist = require('../src/models/Stylist.model');
const Appointment = require('../src/models/Appointment.model');

const logger = require('../src/config/logger');

/**
 * Connect to database
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding');
  } catch (error) {
    logger.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

/**
 * Clear all collections
 */
const clearDatabase = async () => {
  logger.info('Clearing database...');
  await User.deleteMany({});
  await Service.deleteMany({});
  await Stylist.deleteMany({});
  await Appointment.deleteMany({});
  logger.info('Database cleared');
};

/**
 * Seed users
 */
const seedUsers = async () => {
  logger.info('Seeding users...');

  const users = [
    {
      firstName: 'Phumuzile',
      lastName: 'Moyo',
      email: 'admin@pinkmeup.com',
      password: await bcrypt.hash('Admin@123', 10),
      phone: '+27 82 123 4567',
      role: 'admin',
      isActive: true
    },
    {
      firstName: 'Thandi',
      lastName: 'Nkosi',
      email: 'thandi@pinkmeup.com',
      password: await bcrypt.hash('Stylist@123', 10),
      phone: '+27 82 234 5678',
      role: 'stylist',
      isActive: true
    },
    {
      firstName: 'Lerato',
      lastName: 'Mokoena',
      email: 'lerato@pinkmeup.com',
      password: await bcrypt.hash('Stylist@123', 10),
      phone: '+27 82 345 6789',
      role: 'stylist',
      isActive: true
    },
    {
      firstName: 'Sipho',
      lastName: 'Zulu',
      email: 'sipho@example.com',
      password: await bcrypt.hash('Customer@123', 10),
      phone: '+27 82 456 7890',
      role: 'customer',
      isActive: true
    },
    {
      firstName: 'Zanele',
      lastName: 'Dlamini',
      email: 'zanele@example.com',
      password: await bcrypt.hash('Customer@123', 10),
      phone: '+27 82 567 8901',
      role: 'customer',
      isActive: true
    }
  ];

  const createdUsers = await User.insertMany(users);
  logger.info('Users seeded: ' + createdUsers.length);
  return createdUsers;
};

/**
 * Seed services
 */
const seedServices = async () => {
  logger.info('Seeding services...');

  const services = [
    {
      name: 'Hair Braiding',
      description: 'Professional hair braiding service with various styles including cornrows, box braids, and twists.',
      price: 350,
      duration: 120,
      category: 'Hair',
      isActive: true
    },
    {
      name: 'Manicure',
      description: 'Full nail care service including shaping, cuticle care, and polish application.',
      price: 250,
      duration: 45,
      category: 'Nails',
      isActive: true
    },
    {
      name: 'Pedicure',
      description: 'Complete foot care service including soak, exfoliation, callus removal, and polish.',
      price: 300,
      duration: 60,
      category: 'Nails',
      isActive: true
    },
    {
      name: 'Facial Treatment',
      description: 'Deep cleansing facial with exfoliation, mask, and moisturizing treatment.',
      price: 400,
      duration: 60,
      category: 'Skincare',
      isActive: true
    },
    {
      name: 'Waxing',
      description: 'Professional hair removal service using high-quality wax for smooth results.',
      price: 200,
      duration: 30,
      category: 'Body',
      isActive: true
    },
    {
      name: 'Massage Therapy',
      description: 'Relaxing full-body massage to relieve tension and promote wellness.',
      price: 500,
      duration: 90,
      category: 'Therapy',
      isActive: true
    },
    {
      name: 'Makeup Application',
      description: 'Professional makeup application for any occasion using premium products.',
      price: 450,
      duration: 60,
      category: 'Makeup',
      isActive: true
    },
    {
      name: 'Brow Shaping',
      description: 'Precision eyebrow shaping using threading or waxing techniques.',
      price: 150,
      duration: 20,
      category: 'Brows',
      isActive: true
    }
  ];

  const createdServices = await Service.insertMany(services);
  logger.info('Services seeded: ' + createdServices.length);
  return createdServices;
};

/**
 * Seed stylists
 */
const seedStylists = async (users) => {
  logger.info('Seeding stylists...');

  const stylistUsers = users.filter(u => u.role === 'stylist');
  if (stylistUsers.length === 0) {
    logger.warn('No stylist users found, skipping stylist seeding');
    return [];
  }

  const stylists = [
    {
      userId: stylistUsers[0]._id,
      specialization: ['Hair Braiding', 'Waxing', 'Brow Shaping'],
      workingHours: {
        monday: { start: '08:00', end: '17:00' },
        tuesday: { start: '08:00', end: '17:00' },
        wednesday: { start: '08:00', end: '17:00' },
        thursday: { start: '08:00', end: '17:00' },
        friday: { start: '08:00', end: '17:00' },
        saturday: { start: '09:00', end: '14:00' },
        sunday: { start: '', end: '' }
      },
      isAvailable: true,
      rating: 4.5
    },
    {
      userId: stylistUsers[1]._id,
      specialization: ['Manicure', 'Pedicure', 'Makeup Application'],
      workingHours: {
        monday: { start: '08:00', end: '17:00' },
        tuesday: { start: '08:00', end: '17:00' },
        wednesday: { start: '08:00', end: '17:00' },
        thursday: { start: '08:00', end: '17:00' },
        friday: { start: '08:00', end: '17:00' },
        saturday: { start: '09:00', end: '14:00' },
        sunday: { start: '', end: '' }
      },
      isAvailable: true,
      rating: 4.2
    }
  ];

  const createdStylists = await Stylist.insertMany(stylists);
  logger.info('Stylists seeded: ' + createdStylists.length);
  return createdStylists;
};

/**
 * Seed appointments
 */
const seedAppointments = async (users, services, stylists) => {
  logger.info('Seeding appointments...');

  const customerUsers = users.filter(u => u.role === 'customer');
  if (customerUsers.length === 0 || services.length === 0 || stylists.length === 0) {
    logger.warn('Missing data for appointments, skipping appointment seeding');
    return [];
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = [
    {
      customerId: customerUsers[0]._id,
      stylistId: stylists[0]._id,
      serviceId: services[0]._id,
      date: tomorrow,
      startTime: '09:00',
      endTime: '11:00',
      duration: 120,
      status: 'confirmed',
      notes: 'First time customer'
    },
    {
      customerId: customerUsers[0]._id,
      stylistId: stylists[1]._id,
      serviceId: services[1]._id,
      date: tomorrow,
      startTime: '14:00',
      endTime: '14:45',
      duration: 45,
      status: 'confirmed',
      notes: ''
    },
    {
      customerId: customerUsers[1]._id,
      stylistId: stylists[0]._id,
      serviceId: services[4]._id,
      date: tomorrow,
      startTime: '11:30',
      endTime: '12:00',
      duration: 30,
      status: 'pending',
      notes: 'Prefers female stylist'
    },
    {
      customerId: customerUsers[1]._id,
      stylistId: stylists[1]._id,
      serviceId: services[6]._id,
      date: new Date(today.setDate(today.getDate() + 2)),
      startTime: '10:00',
      endTime: '11:00',
      duration: 60,
      status: 'confirmed',
      notes: 'Wedding makeup'
    }
  ];

  const createdAppointments = await Appointment.insertMany(appointments);
  logger.info('Appointments seeded: ' + createdAppointments.length);
  return createdAppointments;
};

/**
 * Main seed function
 */
const seedDatabase = async () => {
  try {
    logger.info('=================================');
    logger.info('   PinkMeUp Database Seeder');
    logger.info('=================================');

    // Connect to database
    await connectDB();

    // Clear existing data
    await clearDatabase();

    // Seed data in order (maintains references)
    const users = await seedUsers();
    const services = await seedServices();
    const stylists = await seedStylists(users);
    const appointments = await seedAppointments(users, services, stylists);

    logger.info('=================================');
    logger.info('   Seeding Complete!');
    logger.info('=================================');
    logger.info('Users: ' + users.length);
    logger.info('Services: ' + services.length);
    logger.info('Stylists: ' + stylists.length);
    logger.info('Appointments: ' + appointments.length);
    logger.info('=================================');

    // Disconnect from database
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');

    process.exit(0);
  } catch (error) {
    logger.error('Seeding error:', error.message);
    if (error.stack) logger.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the seeder
seedDatabase();