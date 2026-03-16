const Disaster = require('../models/Disaster');
const Alert = require('../models/Alert');

// ─── @desc    Get all disasters (with filters)
// ─── @route   GET /api/disasters
// ─── @access  Public
const getDisasters = async (req, res) => {
  try {
    const { type, severity, status, limit = 20, page = 1, lat, lng, radius } = req.query;

    let query = {};
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (status) query.status = status;
    else query.status = { $in: ['active', 'monitoring'] };

    // Geospatial query - nearby disasters
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: (parseFloat(radius) || 500) * 1000 // convert km to meters
        }
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Disaster.countDocuments(query);
    const disasters = await Disaster.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reportedBy', 'name mobile')
      .populate('verifiedBy', 'name');

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      disasters
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get single disaster
// ─── @route   GET /api/disasters/:id
// ─── @access  Public
const getDisaster = async (req, res) => {
  try {
    const disaster = await Disaster.findById(req.params.id)
      .populate('reportedBy', 'name mobile')
      .populate('verifiedBy', 'name')
      .populate('updates.postedBy', 'name role');

    if (!disaster) {
      return res.status(404).json({ success: false, message: 'Disaster not found' });
    }

    res.json({ success: true, disaster });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Create disaster
// ─── @route   POST /api/disasters
// ─── @access  Admin
const createDisaster = async (req, res) => {
  try {
    const disaster = await Disaster.create({
      ...req.body,
      reportedBy: req.user._id,
      isVerified: true
    });

    // Auto-create government alert for critical disasters
    if (disaster.severity === 'critical') {
      await Alert.create({
        title: `⚠️ CRITICAL ALERT: ${disaster.title}`,
        message: disaster.description || `A critical ${disaster.type} has been detected. Please follow official instructions.`,
        type: 'emergency',
        severity: 'critical',
        linkedDisaster: disaster._id,
        issuedBy: 'UDMS System',
        createdBy: req.user._id,
        targetArea: {
          state: disaster.location?.state,
          district: disaster.location?.district
        }
      });
    }

    res.status(201).json({ success: true, disaster });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Update disaster
// ─── @route   PUT /api/disasters/:id
// ─── @access  Admin
const updateDisaster = async (req, res) => {
  try {
    const disaster = await Disaster.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!disaster) {
      return res.status(404).json({ success: false, message: 'Disaster not found' });
    }

    res.json({ success: true, disaster });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Delete disaster
// ─── @route   DELETE /api/disasters/:id
// ─── @access  Admin
const deleteDisaster = async (req, res) => {
  try {
    const disaster = await Disaster.findByIdAndDelete(req.params.id);
    if (!disaster) {
      return res.status(404).json({ success: false, message: 'Disaster not found' });
    }
    res.json({ success: true, message: 'Disaster deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Add update to disaster
// ─── @route   POST /api/disasters/:id/updates
// ─── @access  Admin/Volunteer
const addUpdate = async (req, res) => {
  try {
    const { message } = req.body;
    const disaster = await Disaster.findByIdAndUpdate(
      req.params.id,
      { $push: { updates: { message, postedBy: req.user._id } } },
      { new: true }
    );
    res.json({ success: true, disaster });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get disaster statistics
// ─── @route   GET /api/disasters/stats
// ─── @access  Public
const getStats = async (req, res) => {
  try {
    const stats = await Disaster.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          totalAffected: { $sum: '$affectedPeople' }
        }
      }
    ]);

    const totals = await Disaster.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
          totalAffected: { $sum: '$affectedPeople' },
          totalDeaths: { $sum: '$casualties.deaths' }
        }
      }
    ]);

    res.json({ success: true, byType: stats, totals: totals[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get trending disasters (most viewed/critical)
// ─── @route   GET /api/disasters/trending
// ─── @access  Public
const getTrending = async (req, res) => {
  try {
    const disasters = await Disaster.find({ status: 'active' })
      .sort({ severity: -1, affectedPeople: -1, createdAt: -1 })
      .limit(10)
      .populate('reportedBy', 'name');

    res.json({ success: true, disasters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDisasters, getDisaster, createDisaster, updateDisaster, deleteDisaster, addUpdate, getStats, getTrending };
