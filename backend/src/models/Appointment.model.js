const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stylistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stylist',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: { type: String, trim: true, maxlength: 500 },
  isWalkIn: { type: Boolean, default: false },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 }
  }
}, { timestamps: true });

AppointmentSchema.index({ date: 1, startTime: 1, stylistId: 1 });
AppointmentSchema.index({ customerId: 1, status: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
