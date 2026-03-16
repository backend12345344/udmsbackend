const User = require('../models/User');

// ─── @desc    Update user profile
// ─── @route   PUT /api/users/profile
// ─── @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email, language, location } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (language) updates.language = language;
    if (location) updates.location = location;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Update emergency contacts
// ─── @route   PUT /api/users/emergency-contacts
// ─── @access  Private
const updateEmergencyContacts = async (req, res) => {
  try {
    const { emergencyContacts } = req.body;

    if (!Array.isArray(emergencyContacts)) {
      return res.status(400).json({ success: false, message: 'emergencyContacts must be an array' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { emergencyContacts },
      { new: true }
    );

    res.json({ success: true, emergencyContacts: user.emergencyContacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Update user location
// ─── @route   PUT /api/users/location
// ─── @access  Private
const updateLocation = async (req, res) => {
  try {
    const { coordinates, address, city, state, district } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates,
          address,
          city,
          state,
          district
        }
      },
      { new: true }
    );

    res.json({ success: true, location: user.location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Change password
// ─── @route   PUT /api/users/change-password
// ─── @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get all users (admin)
// ─── @route   GET /api/users
// ─── @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    let query = {};
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } }
    ];
    if (role) query.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));

    res.json({ success: true, total, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Block/Unblock user (admin)
// ─── @route   PUT /api/users/:id/block
// ─── @access  Admin
const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      isBlocked: user.isBlocked
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { updateProfile, updateEmergencyContacts, updateLocation, changePassword, getAllUsers, toggleBlockUser };
