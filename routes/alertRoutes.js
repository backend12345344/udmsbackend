const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// GET /api/alerts - Get active alerts
router.get('/', async (req, res) => {
  try {
    const { state, city, limit = 20 } = req.query;
    let query = { isActive: true };
    if (state) query['targetArea.state'] = { $regex: state, $options: 'i' };
    if (city) query['targetArea.city'] = { $regex: city, $options: 'i' };

    const alerts = await Alert.find(query)
      .sort({ severity: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .populate('linkedDisaster', 'title type');

    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/alerts - Create alert (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const alert = await Alert.create({ ...req.body, createdBy: req.user._id });
    // TODO: Trigger push notifications to users in target area
    res.status(201).json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/alerts/:id - Update alert
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/alerts/:id - Delete alert
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
