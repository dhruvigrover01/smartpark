const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, minlength: 6 }, // null for Google users
  picture:  { type: String, default: '' },
  role:     { type: String, enum: ['user', 'owner', 'admin'], default: 'user' },
  provider: { type: String, enum: ['email', 'google'], default: 'email' },
  googleId: { type: String },
  isVerified: { type: Boolean, default: false },
  createdAt:  { type: Date, default: Date.now },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Strip sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
