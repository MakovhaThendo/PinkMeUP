const mongoose = require('mongoose');

const StylistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialization: [{ type: String }],
  workingHours: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String }
  },
  isAvailable: { type: Boolean, default: true },
  rating: { type: Number, min: 0, max: 5, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Stylist', StylistSchema);
