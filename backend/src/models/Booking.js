const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parking: { type: mongoose.Schema.Types.ObjectId, ref: 'Parking', required: true },

  parkingName: { type: String },
  parkingAddr: { type: String },

  hours:  { type: Number, required: true, min: 1, max: 24 },
  rate:   { type: Number, required: true },
  total:  { type: Number, required: true },

  status: { type: String, enum: ['pending','confirmed','completed','cancelled'], default: 'confirmed' },

  bookingRef: { type: String, unique: true },

  startTime: { type: Date },
  endTime:   { type: Date },
}, { timestamps: true });

// Generate booking reference before save
bookingSchema.pre('save', function (next) {
  if (!this.bookingRef) {
    this.bookingRef = 'SP-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    this.total = this.hours * this.rate;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
