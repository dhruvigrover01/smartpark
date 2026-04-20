const mongoose = require('mongoose');

const parkingSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  address: { type: String, required: true },
  owner:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerName: { type: String },

  location: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },

  type:     { type: String, enum: ['home','shop','office','commercial'], default: 'home' },
  vehicles: [{ type: String, enum: ['car','bike','suv','truck','ev'] }],

  slots: {
    total:     { type: Number, required: true, min: 1 },
    available: { type: Number, required: true, min: 0 },
  },

  time: {
    open:  { type: String, default: '09:00' },
    close: { type: String, default: '21:00' },
    label: { type: String, default: '9 AM – 9 PM' },
  },

  security: {
    cctv:  { type: Boolean, default: false },
    guard: { type: Boolean, default: false },
    gated: { type: Boolean, default: false },
  },

  // Auto-computed from security
  price:   { type: Number, default: 10 },
  tier:    { type: String, enum: ['Basic','Standard','Premium','Elite'], default: 'Basic' },

  description: { type: String, default: '' },
  notes:       { type: String, default: '' },
  images:      [{ type: String }],

  rating:  { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0 },

  verified: { type: Boolean, default: false },
  status:   { type: String, enum: ['pending','active','suspended'], default: 'pending' },
  congestion: { type: Boolean, default: false },

  isOSM:    { type: Boolean, default: false },
  osmId:    { type: String },
}, { timestamps: true });

// 2dsphere index for geospatial queries
parkingSchema.index({ location: '2dsphere' });
parkingSchema.index({ status: 1, verified: 1 });

// Auto-compute price and tier before save
parkingSchema.pre('save', function (next) {
  const s = this.security;
  const score = (s.cctv ? 1 : 0) + (s.guard ? 1 : 0) + (s.gated ? 1 : 0);
  const map = [
    { tier: 'Basic',    price: 10 },
    { tier: 'Standard', price: 25 },
    { tier: 'Premium',  price: 40 },
    { tier: 'Elite',    price: 60 },
  ];
  this.price = map[score].price;
  this.tier  = map[score].tier;
  next();
});

module.exports = mongoose.model('Parking', parkingSchema);
