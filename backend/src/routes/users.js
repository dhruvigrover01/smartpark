const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/users/profile
router.get('/profile', (req, res) => res.json({ user: req.user }));

// PATCH /api/users/profile
router.patch('/profile', async (req, res, next) => {
  try {
    const allowed = ['name', 'picture', 'role'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ user });
  } catch (err) { next(err); }
});

// PATCH /api/users/change-password
router.patch('/change-password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user.password) return res.status(400).json({ error: 'Account uses Google sign-in.' });
    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ error: 'Current password is incorrect.' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated.' });
  } catch (err) { next(err); }
});

module.exports = router;
