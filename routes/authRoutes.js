const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register, login, verifyOTP, resendOTP,
  forgotPassword, resetPassword, getMe, updateFCMToken
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid Indian mobile number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], register);

router.post('/login', login);
router.post('/verify-otp', protect, verifyOTP);
router.post('/resend-otp', protect, resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/fcm-token', protect, updateFCMToken);

module.exports = router;
