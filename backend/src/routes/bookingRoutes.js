const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.post('/', bookingController.createBooking);
router.get('/', bookingController.getAllBookings);
router.get('/vehicle/:vehicleId', bookingController.getVehicleBooking);
router.get('/vehicle/:vehicleId/history', bookingController.getVehicleBookingHistory);
router.put('/vehicle/:vehicleId/sold', bookingController.confirmSale);
router.put('/vehicle/:vehicleId/cancel', bookingController.cancelVehicleBooking);
router.put('/:id', bookingController.updateBooking);
router.put('/:id/cancel', bookingController.cancelBooking);
router.delete('/:id', bookingController.deleteBooking);

module.exports = router;
