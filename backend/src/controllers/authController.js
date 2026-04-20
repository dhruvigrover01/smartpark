const { OAuth2Client } = require('google-auth-library');
const User    = require('../models/User');
const { signToken } = require('../middleware/auth');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sendAuth = (user, res, statusCode = 200) => {
  const token = signToken(user._id);
  res.status(statusCode).json({ token, user });
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered.' });

    const user = await User.create({
      name, email, password,
      role: ['user','owner'].includes(role) ? role : 'user',
      provider: 'email',
    });
    sendAuth(user, res, 201);
  } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required.' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
    if (!user.password) return res.status(401).json({ error: 'Please login with Google.' });
    if (!(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid email or password.' });

    sendAuth(user, res);
  } catch (err) { next(err); }
};

// POST /api/auth/google
exports.googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'Google ID token required.' });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, name, email, picture } = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (user) {
      // Update Google info if logging in via Google
      if (!user.googleId) { user.googleId = googleId; user.picture = picture; await user.save(); }
    } else {
      user = await User.create({ name, email, picture, googleId, provider: 'google', isVerified: true });
    }
    sendAuth(user, res);
  } catch (err) {
    if (err.message?.includes('Invalid token')) return res.status(401).json({ error: 'Invalid Google token.' });
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};
