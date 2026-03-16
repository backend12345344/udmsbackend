const express = require('express');
const router = express.Router();
const Volunteer = require('../models/Volunteer');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// POST /api/volunteers/register
router.post('/register', protect, async (req, res) => {
  try {
    const existing = await Volunteer.findOne({ user: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You are already registered as a volunteer' });
    }
    const volunteer = await Volunteer.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, message: 'Volunteer registration submitted!', volunteer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/volunteers - All volunteers (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { lat, lng, radius = 100, skills } = req.query;
    let query = { isVerified: true, availability: 'available' };
    if (skills) query.skills = { $in: skills.split(',') };

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000
        }
      };
    }

    const volunteers = await Volunteer.find(query)
      .populate('user', 'name mobile location')
      .limit(50);

    res.json({ success: true, volunteers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/volunteers/:id/verify - Admin verifies volunteer
router.put('/:id/verify', protect, adminOnly, async (req, res) => {
  try {
    const volunteer = await Volunteer.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).populate('user', 'name mobile');

    // Update user role
    const User = require('../models/User');
    await User.findByIdAndUpdate(volunteer.user._id, { role: 'volunteer' });

    res.json({ success: true, volunteer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/volunteers/availability - Update own availability
router.put('/availability', protect, async (req, res) => {
  try {
    const { availability } = req.body;
    const volunteer = await Volunteer.findOneAndUpdate(
      { user: req.user._id },
      { availability },
      { new: true }
    );
    res.json({ success: true, volunteer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
