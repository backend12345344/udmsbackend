const SOS = require('../models/SOS');
const User = require('../models/User');

// ─── @desc    Trigger SOS
// ─── @route   POST /api/sos
// ─── @access  Private
const triggerSOS = async (req, res) => {
  try {
    const { coordinates, address, message, type, accuracy } = req.body;

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({ success: false, message: 'Location coordinates required' });
    }

    const sos = await SOS.create({
      user: req.user._id,
      location: {
        type: 'Point',
        coordinates,
        address,
        accuracy
      },
      message: message || 'EMERGENCY! I need immediate help!',
      type: type || 'general'
    });

    // Get user's emergency contacts
    const user = await User.findById(req.user._id);
    const notifiedContacts = [];

    if (user.emergencyContacts && user.emergencyContacts.length > 0) {
      for (const contact of user.emergencyContacts) {
        // TODO: Send SMS/Call to emergency contacts
        // await sendSMS(contact.mobile, `🚨 SOS ALERT from ${user.name}! 
        // Location: ${address || 'See map'}
        // Message: ${message}
        // Time: ${new Date().toLocaleString('en-IN')}`);
        
        notifiedContacts.push({
          name: contact.name,
          mobile: contact.mobile,
          method: 'sms'
        });
      }
    }

    sos.notifiedContacts = notifiedContacts;
    await sos.save();

    // TODO: Send push notification to nearby volunteers
    // await notifyNearbyVolunteers(coordinates, sos._id);

    res.status(201).json({
      success: true,
      message: 'SOS triggered successfully. Help is on the way!',
      sos: {
        _id: sos._id,
        status: sos.status,
        location: sos.location,
        notifiedContacts: notifiedContacts.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get active SOS alerts (admin/volunteers)
// ─── @route   GET /api/sos
// ─── @access  Admin/Volunteer
const getActiveSOS = async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    let query = { status: 'active' };

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000
        }
      };
    }

    const sosList = await SOS.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name mobile emergencyContacts')
      .limit(50);

    res.json({ success: true, count: sosList.length, sosList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get user's SOS history
// ─── @route   GET /api/sos/my
// ─── @access  Private
const getMySOS = async (req, res) => {
  try {
    const sosList = await SOS.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, sosList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Resolve SOS
// ─── @route   PUT /api/sos/:id/resolve
// ─── @access  Private
const resolveSOS = async (req, res) => {
  try {
    const sos = await SOS.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status || 'resolved', resolvedAt: new Date(), resolvedBy: req.user._id },
      { new: true }
    );

    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS not found' });
    }

    res.json({ success: true, message: 'SOS updated', sos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Respond to SOS
// ─── @route   POST /api/sos/:id/respond
// ─── @access  Private
const respondToSOS = async (req, res) => {
  try {
    const { message } = req.body;
    const sos = await SOS.findByIdAndUpdate(
      req.params.id,
      {
        status: 'acknowledged',
        $push: { responders: { user: req.user._id, message } }
      },
      { new: true }
    );

    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS not found' });
    }

    res.json({ success: true, message: 'Response recorded', sos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { triggerSOS, getActiveSOS, getMySOS, resolveSOS, respondToSOS };
