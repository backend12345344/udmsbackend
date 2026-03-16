const express = require('express');
const router = express.Router();
const {
  updateProfile, updateEmergencyContacts, updateLocation,
  changePassword, getAllUsers, toggleBlockUser
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.put('/profile',             protect, updateProfile);
router.put('/emergency-contacts',  protect, updateEmergencyContacts);
router.put('/location',            protect, updateLocation);
router.put('/change-password',     protect, changePassword);
router.get('/',                    protect, adminOnly, getAllUsers);
router.put('/:id/block',           protect, adminOnly, toggleBlockUser);

module.exports = router;
