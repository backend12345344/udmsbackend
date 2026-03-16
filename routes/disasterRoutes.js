const express = require('express');
const router = express.Router();
const {
  getDisasters, getDisaster, createDisaster, updateDisaster,
  deleteDisaster, addUpdate, getStats, getTrending
} = require('../controllers/disasterController');
const { protect, adminOnly, volunteerOrAdmin } = require('../middleware/authMiddleware');

router.get('/',          getDisasters);
router.get('/stats',     getStats);
router.get('/trending',  getTrending);
router.get('/:id',       getDisaster);
router.post('/',         protect, adminOnly, createDisaster);
router.put('/:id',       protect, adminOnly, updateDisaster);
router.delete('/:id',    protect, adminOnly, deleteDisaster);
router.post('/:id/updates', protect, volunteerOrAdmin, addUpdate);

module.exports = router;
