const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Protect Routes (Auth Required) ───────────────────────────────────────
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

// ─── Admin Only ────────────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'government')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Admin access required' });
  }
};

// ─── Volunteer or Admin ────────────────────────────────────────────────────
const volunteerOrAdmin = (req, res, next) => {
  if (req.user && ['admin', 'government', 'volunteer'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Volunteer or Admin access required' });
  }
};

// ─── Generate JWT ──────────────────────────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

module.exports = { protect, adminOnly, volunteerOrAdmin, generateToken };
