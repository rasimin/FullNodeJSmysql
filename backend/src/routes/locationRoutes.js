const express = require('express');
const router = express.Router();
const { getAllLocations, createLocation, updateLocation, deleteLocation, syncLocations } = require('../controllers/locationController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.use(authenticate); // All location routes require login

router.get('/', getAllLocations);
router.get('/sync', authorize(['Super Admin']), syncLocations);
router.post('/', authorize(['Super Admin', 'Admin Pusat']), createLocation);
router.put('/:id', authorize(['Super Admin', 'Admin Pusat']), updateLocation);
router.delete('/:id', authorize(['Super Admin']), deleteLocation);

module.exports = router;
