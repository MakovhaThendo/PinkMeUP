/**
 * BusinessSetting model - central configuration for salon operations
 * Singleton pattern - only one document exists
 */

const mongoose = require('mongoose');

const DaySchema = new mongoose.Schema({
  start: { type: String, default: '08:00', match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Use HH:MM'] },
  end: { type: String, default: '17:00', match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Use HH:MM'] },
  isOpen: { type: Boolean, default: true }
});

const BusinessSettingSchema = new mongoose.Schema({
  businessHours: {
    monday: { type: DaySchema, default: () => ({ start: '08:00', end: '17:00', isOpen: true }) },
    tuesday: { type: DaySchema, default: () => ({ start: '08:00', end: '17:00', isOpen: true }) },
    wednesday: { type: DaySchema, default: () => ({ start: '08:00', end: '17:00', isOpen: true }) },
    thursday: { type: DaySchema, default: () => ({ start: '08:00', end: '17:00', isOpen: true }) },
    friday: { type: DaySchema, default: () => ({ start: '08:00', end: '17:00', isOpen: true }) },
    saturday: { type: DaySchema, default: () => ({ start: '09:00', end: '14:00', isOpen: true }) },
    sunday: { type: DaySchema, default: () => ({ start: '', end: '', isOpen: false }) }
  },
  slotInterval: { type: Number, default: 30, enum: [15, 30, 45, 60] },
  maxBookingsPerSlot: { type: Number, default: 1, min: 1 },
  bookingLeadTime: { type: Number, default: 60, min: 0 },
  cancellationWindow: { type: Number, default: 60, min: 0 },
  timezone: { type: String, default: 'Africa/Johannesburg' },
  businessName: { type: String, default: 'PinkMeUP Beauty Spa & Academy' }
}, { timestamps: true });

// Ensure only one settings document exists
BusinessSettingSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

module.exports = mongoose.model('BusinessSetting', BusinessSettingSchema);