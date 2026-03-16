const Resource = require('../models/Resource');

// ─── @desc    Get resources (with filters & geospatial)
// ─── @route   GET /api/resources
// ─── @access  Public
const getResources = async (req, res) => {
  try {
    const { type, lat, lng, radius = 50, limit = 20, page = 1, city } = req.query;

    let query = { isActive: true };
    if (type) query.type = type;
    if (city) query['location.city'] = { $regex: city, $options: 'i' };

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000
        }
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Resource.countDocuments(query);
    const resources = await Resource.find(query)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, total, resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get nearby hospitals
// ─── @route   GET /api/resources/hospitals/nearby
// ─── @access  Public
const getNearbyHospitals = async (req, res) => {
  try {
    const { lat, lng, radius = 30 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude required' });
    }

    const hospitals = await Resource.find({
      type: 'hospital',
      isActive: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000
        }
      }
    }).limit(20);

    res.json({ success: true, hospitals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get nearby shelters
// ─── @route   GET /api/resources/shelters/nearby
// ─── @access  Public
const getNearbyShelters = async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Coordinates required' });
    }

    const shelters = await Resource.find({
      type: { $in: ['shelter', 'relief_camp'] },
      isActive: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000
        }
      }
    }).limit(20);

    res.json({ success: true, shelters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get single resource
// ─── @route   GET /api/resources/:id
// ─── @access  Public
const getResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }
    res.json({ success: true, resource });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Create resource
// ─── @route   POST /api/resources
// ─── @access  Admin
const createResource = async (req, res) => {
  try {
    const resource = await Resource.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json({ success: true, resource });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Update resource
// ─── @route   PUT /api/resources/:id
// ─── @access  Admin
const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }
    res.json({ success: true, resource });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Delete resource
// ─── @route   DELETE /api/resources/:id
// ─── @access  Admin
const deleteResource = async (req, res) => {
  try {
    await Resource.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getResources, getNearbyHospitals, getNearbyShelters, getResource, createResource, updateResource, deleteResource };
