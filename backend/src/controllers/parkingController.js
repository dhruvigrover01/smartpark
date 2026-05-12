const Parking = require('../models/Parking');

// GET /api/parking?lat=&lng=&radius=&filter=&page=
exports.getNearby = async (req, res, next) => {
  try {
    const { lat, lng, radius = 2000, filter, page = 1, limit = 30 } = req.query;

    const query = { status: 'active', verified: true };

    if (filter === 'car' || filter === 'bike' || filter === 'suv')
      query.vehicles = filter;

    let spots;
    if (lat && lng) {
      spots = await Parking.find({
        ...query,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseInt(radius),
          },
        },
      })
        .populate('owner', 'name email picture')
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    } else {
      spots = await Parking.find(query)
        .populate('owner', 'name email picture')
        .limit(parseInt(limit));
    }

    res.json({ count: spots.length, spots });
  } catch (err) { next(err); }
};

// GET /api/parking/:id
exports.getOne = async (req, res, next) => {
  try {
    const spot = await Parking.findById(req.params.id).populate('owner', 'name email picture');
    if (!spot) return res.status(404).json({ error: 'Parking spot not found.' });
    res.json({ spot });
  } catch (err) { next(err); }
};

// POST /api/parking  (owner only)
exports.create = async (req, res, next) => {
  try {
    const { name, address, lat, lng, type, vehicles, slots, time, security, description, notes } = req.body;
    if (!name || !address || !lat || !lng)
      return res.status(400).json({ error: 'Name, address and coordinates are required.' });

    const spot = await Parking.create({
      name, address,
      owner: req.user._id,
      ownerName: req.user.name,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      type: type || 'home',
      vehicles: vehicles || ['car'],
      slots: { total: slots?.total || 1, available: slots?.available || 1 },
      time: {
        open: time?.open || '09:00',
        close: time?.close || '21:00',
        label: time?.label || `${time?.open || '09:00'} – ${time?.close || '21:00'}`,
      },
      security: {
        cctv:  !!security?.cctv,
        guard: !!security?.guard,
        gated: !!security?.gated,
      },
      description, notes,
    });

    res.status(201).json({ spot });
  } catch (err) { next(err); }
};
// POST /api/parking/map  (save map parking)
exports.createFromMap = async (req, res, next) => {
  try {
    let { name, address, lat, lng, price } = req.body;

    console.log("MAP DATA:", req.body);

    lat = parseFloat(lat);
    lng = parseFloat(lng);

    if (!name || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid map data.' });
    }

    // ✅ simple duplicate check
    let spot = await Parking.findOne({ name });

    if (!spot) {
      spot = await Parking.create({
  name,
  address: address || "Unknown",
  owner: req.user._id,          //  ADD THIS
  ownerName: req.user.name,     // (optional but good)
  location: {
    type: "Point",
    coordinates: [lng, lat],
  },
  price: price || 20,
  slots: { total: 10, available: 10 },
  verified: true,
  status: "active",
});
    }

    res.json({ spot });

  } catch (err) {
    console.error("CREATE MAP ERROR:", err);
    next(err);
  }
};

// PUT /api/parking/:id  (owner or admin)
exports.update = async (req, res, next) => {
  try {
    const spot = await Parking.findById(req.params.id);
    if (!spot) return res.status(404).json({ error: 'Not found.' });
    if (spot.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized.' });

    const allowed = ['name','address','type','vehicles','slots','time','security','description','notes','images'];
    allowed.forEach(k => { if (req.body[k] !== undefined) spot[k] = req.body[k]; });

    if (req.body.lat && req.body.lng)
      spot.location = { type: 'Point', coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)] };

    await spot.save();
    res.json({ spot });
  } catch (err) { next(err); }
};

// DELETE /api/parking/:id
exports.remove = async (req, res, next) => {
  try {
    const spot = await Parking.findById(req.params.id);
    if (!spot) return res.status(404).json({ error: 'Not found.' });
    if (spot.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized.' });
    await spot.deleteOne();
    res.json({ message: 'Listing removed.' });
  } catch (err) { next(err); }
};

// GET /api/parking/mine  (owner's listings)
exports.getMine = async (req, res, next) => {
  try {
    const spots = await Parking.find({ owner: req.user._id }).sort('-createdAt');
    res.json({ count: spots.length, spots });
  } catch (err) { next(err); }
};

// PATCH /api/parking/:id/verify  (admin only)
exports.verify = async (req, res, next) => {
  try {
    const spot = await Parking.findByIdAndUpdate(
      req.params.id,
      { verified: true, status: 'active' },
      { new: true }
    );
    if (!spot) return res.status(404).json({ error: 'Not found.' });
    res.json({ spot });
  } catch (err) { next(err); }
};
