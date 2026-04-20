const Booking = require('../models/Booking');
const Parking = require('../models/Parking');

// POST /api/bookings
exports.create = async (req, res, next) => {
  try {
    const { parkingId, hours } = req.body;
    if (!parkingId || !hours)
      return res.status(400).json({ error: 'Parking ID and hours required.' });
    if (hours < 1 || hours > 24)
      return res.status(400).json({ error: 'Hours must be between 1 and 24.' });

    const spot = await Parking.findById(parkingId);
    if (!spot) return res.status(404).json({ error: 'Parking spot not found.' });
   if (!spot.slots || spot.slots.available < 1) {
  return res.status(400).json({ error: 'No slots available.' });
}

spot.slots.available -= 1;
    await spot.save();

    const booking = await Booking.create({
      user:        req.user._id,
      parking:     spot._id,
      parkingName: spot.name,
      parkingAddr: spot.address,
      hours:       parseInt(hours),
      rate:        spot.price,
      total:       parseInt(hours) * spot.price,
      startTime:   new Date(),
      endTime:     new Date(Date.now() + parseInt(hours) * 3600000),
    });

    res.status(201).json({ booking });
  } catch (err) { next(err); }
};

// GET /api/bookings/mine
exports.getMine = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('parking', 'name address price tier')
      .sort('-createdAt');
    res.json({ count: bookings.length, bookings });
  } catch (err) { next(err); }
};

// GET /api/bookings/:id
exports.getOne = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('parking');
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized.' });
    res.json({ booking });
  } catch (err) { next(err); }
};

// PATCH /api/bookings/:id/cancel
exports.cancel = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized.' });
    if (booking.status === 'cancelled')
      return res.status(400).json({ error: 'Already cancelled.' });

    booking.status = 'cancelled';
    await booking.save();

    // Restore slot
    await Parking.findByIdAndUpdate(booking.parking, { $inc: { 'slots.available': 1 } });
    res.json({ booking });
  } catch (err) { next(err); }
};

// GET /api/bookings/earnings  (owner: see bookings on their spots)
exports.getEarnings = async (req, res, next) => {
  try {
    const mySpots = await Parking.find({ owner: req.user._id }).select('_id');
    const ids = mySpots.map(s => s._id);
    const bookings = await Booking.find({ parking: { $in: ids }, status: { $ne: 'cancelled' } })
      .populate('user', 'name email')
      .populate('parking', 'name')
      .sort('-createdAt');
    const total = bookings.reduce((s, b) => s + b.total, 0);
    res.json({ count: bookings.length, total, bookings });
  } catch (err) { next(err); }
};
