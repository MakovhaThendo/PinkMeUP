/**
 * Appointment model - bookings with multiple services support
 * Tracks status, pricing, duration, and feedback
 */

const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  stylistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stylist', required: true, index: true },
  serviceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true }],
  date: { type: Date, required: true, index: true },
  startTime: { type: String, required: true, match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Use HH:MM'] },
  endTime: { type: String, required: true, match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Use HH:MM'] },
  totalDuration: { type: Number, required: true, min: 15 },
  totalPrice: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'], default: 'pending', index: true },
  notes: { type: String, trim: true, maxlength: 500 },
  isWalkIn: { type: Boolean, default: false },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    createdAt: Date
  },
  cancellationReason: { type: String, trim: true, maxlength: 200 },
  rescheduleHistory: [{
    previousDate: Date,
    previousStartTime: String,
    previousEndTime: String,
    rescheduledAt: { type: Date, default: Date.now },
    reason: String
  }]
}, { timestamps: true });

// Indexes for performance
AppointmentSchema.index({ date: 1, startTime: 1, stylistId: 1 });
AppointmentSchema.index({ customerId: 1, status: 1 });
AppointmentSchema.index({ stylistId: 1, status: 1 });

// Virtual: check if appointment can be cancelled
AppointmentSchema.methods.canCancel = function(cancellationWindow = 1440) {
  if (['cancelled', 'completed', 'no_show'].includes(this.status)) {
    return { canCancel: false, message: `Appointment is already ${this.status}.` };
  }
  const now = new Date();
  const [hours, minutes] = this.startTime.split(':').map(Number);
  const appointmentDateTime = new Date(this.date).setHours(hours, minutes, 0, 0);
  const minutesUntil = (appointmentDateTime - now) / 60000;
  return minutesUntil < cancellationWindow 
    ? { canCancel: false, message: `Must cancel ${cancellationWindow} min in advance.` }
    : { canCancel: true, message: 'Can be cancelled.' };
};

// Cancel appointment with reason
AppointmentSchema.methods.cancel = async function(reason) {
  this.status = 'cancelled';
  this.cancellationReason = reason || 'Cancelled by user';
  await this.save();
  return this;
};

// Reschedule with history tracking
AppointmentSchema.methods.reschedule = async function(newDate, newStartTime, newEndTime, reason) {
  this.rescheduleHistory.push({ previousDate: this.date, previousStartTime: this.startTime, previousEndTime: this.endTime, reason: reason || 'Rescheduled' });
  this.date = newDate;
  this.startTime = newStartTime;
  this.endTime = newEndTime;
  this.status = 'confirmed';
  await this.save();
  return this;
};

// Add feedback and update stylist rating
AppointmentSchema.methods.addFeedback = async function(rating, comment) {
  this.feedback = { rating, comment: comment || '', createdAt: new Date() };
  if (this.status === 'completed') {
    const Stylist = mongoose.model('Stylist');
    const stylist = await Stylist.findById(this.stylistId);
    if (stylist) await stylist.addRating(rating);
  }
  await this.save();
  return this;
};

// Get upcoming appointments for a user
AppointmentSchema.statics.getUpcoming = function(userId, role) {
  const filter = { date: { $gte: new Date() }, status: { $ne: 'cancelled' } };
  if (role === 'customer') filter.customerId = userId;
  if (role === 'stylist') filter.stylistId = userId;
  return this.find(filter)
    .populate('customerId', 'firstName lastName email phone')
    .populate('stylistId', 'userId')
    .populate('serviceIds', 'name price duration')
    .sort({ date: 1, startTime: 1 });
};

// Get appointments for a specific date
AppointmentSchema.statics.getForDate = function(date, stylistId = null) {
  const start = new Date(date).setHours(0, 0, 0, 0);
  const end = new Date(date).setHours(23, 59, 59, 999);
  const filter = { date: { $gte: start, $lte: end } };
  if (stylistId) filter.stylistId = stylistId;
  return this.find(filter)
    .populate('customerId', 'firstName lastName email phone')
    .populate('stylistId', 'userId')
    .populate('serviceIds', 'name price duration')
    .sort({ startTime: 1 });
};

module.exports = mongoose.model('Appointment', AppointmentSchema);