const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');
const { validationResult } = require('express-validator');

// ─── @desc    Register new user
// ─── @route   POST /api/auth/register
// ─── @access  Public
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, mobile, password, email } = req.body;

    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Mobile number already registered' });
    }

    const user = await User.create({ name, mobile, password, email });
    
    // Generate OTP for verification
    const otp = user.generateOTP();
    await user.save();

    // TODO: Send OTP via SMS gateway
    // await sendSMS(mobile, `Your UDMS OTP is: ${otp}. Valid for 10 minutes.`);

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your mobile.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        language: user.language
      },
      // Remove this in production - only for dev testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Login user
// ─── @route   POST /api/auth/login
// ─── @access  Public
const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ success: false, message: 'Please provide mobile and password' });
    }

    const user = await User.findOne({ mobile }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact support.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        language: user.language,
        profilePicture: user.profilePicture,
        location: user.location
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Verify OTP
// ─── @route   POST /api/auth/verify-otp
// ─── @access  Private
const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.otp || !user.otp.code) {
      return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    res.json({ success: true, message: 'Mobile number verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Resend OTP
// ─── @route   POST /api/auth/resend-otp
// ─── @access  Private
const resendOTP = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const otp = user.generateOTP();
    await user.save();

    // TODO: Send OTP via SMS gateway
    // await sendSMS(user.mobile, `Your UDMS OTP is: ${otp}. Valid for 10 minutes.`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Forgot Password - request OTP
// ─── @route   POST /api/auth/forgot-password
// ─── @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { mobile } = req.body;
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this mobile number' });
    }

    const otp = user.generateOTP();
    await user.save();

    // TODO: Send OTP via SMS
    // await sendSMS(mobile, `Your UDMS password reset OTP is: ${otp}. Valid for 10 minutes.`);

    res.json({
      success: true,
      message: 'OTP sent to your registered mobile number',
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Reset Password with OTP
// ─── @route   POST /api/auth/reset-password
// ─── @access  Public
const resetPassword = async (req, res) => {
  try {
    const { mobile, otp, newPassword } = req.body;

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.otp || user.otp.code !== otp || new Date() > user.otp.expiresAt) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.password = newPassword;
    user.otp = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. Please login.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get current user profile
// ─── @route   GET /api/auth/me
// ─── @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Update FCM token for push notifications
// ─── @route   PUT /api/auth/fcm-token
// ─── @access  Private
const updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ success: true, message: 'FCM token updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, verifyOTP, resendOTP, forgotPassword, resetPassword, getMe, updateFCMToken };
