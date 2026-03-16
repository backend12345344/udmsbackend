const express = require('express');
const router = express.Router();
const { triggerSOS, getActiveSOS, getMySOS, resolveSOS, respondToSOS } = require('../controllers/sosController');
const { protect, volunteerOrAdmin } = require('../middleware/authMiddleware');

router.post('/',             protect, triggerSOS);
router.get('/',              protect, volunteerOrAdmin, getActiveSOS);
router.get('/my',            protect, getMySOS);
router.put('/:id/resolve',   protect, resolveSOS);
router.post('/:id/respond',  protect, respondToSOS);

module.exports = router;
