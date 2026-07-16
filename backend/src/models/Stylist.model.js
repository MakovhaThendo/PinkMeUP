/**
 * Stylist model - linked to User, manages specialties and ratings
 * Working hours are now globally controlled via BusinessSetting
 */

const mongoose = require('mongoose');

const StylistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  specialties: [{ type: String, trim: true }],
  isAvailable: { type: Boolean, default: true },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  ratingCount: { type: Number, default: 0 }
}, { timestamps: true });

// Calculate average rating when a new review is added
StylistSchema.methods.addRating = async function(newRating) {
  this.rating = parseFloat(((this.rating * this.ratingCount + newRating) / (this.ratingCount + 1)).toFixed(1));
  this.ratingCount += 1;
  await this.save();
  return this.rating;
};

// Get stylist with user details
StylistSchema.statics.getWithUser = function(id) {
  return this.findById(id).populate('userId', 'firstName lastName email phone');
};

// Get all stylists with user details
StylistSchema.statics.getAllWithUser = function(filter = {}) {
  return this.find(filter).populate('userId', 'firstName lastName email phone').sort({ rating: -1 });
};

module.exports = mongoose.model('Stylist', StylistSchema);