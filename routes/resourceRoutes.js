const express = require('express');
const router = express.Router();
const {
  getResources, getNearbyHospitals, getNearbyShelters,
  getResource, createResource, updateResource, deleteResource
} = require('../controllers/resourceController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/',                    getResources);
router.get('/hospitals/nearby',    getNearbyHospitals);
router.get('/shelters/nearby',     getNearbyShelters);
router.get('/:id',                 getResource);
router.post('/',                   protect, adminOnly, createResource);
router.put('/:id',                 protect, adminOnly, updateResource);
router.delete('/:id',              protect, adminOnly, deleteResource);

module.exports = router;
