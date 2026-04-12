const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.post('/', bookingController.createBooking);
router.get('/', bookingController.getAllBookings);
router.get('/vehicle/:vehicleId', bookingController.getVehicleBooking);
router.put('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
