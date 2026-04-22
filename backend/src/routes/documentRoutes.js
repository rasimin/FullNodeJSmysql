const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticate } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(authenticate);

// Document Types
router.get('/types', documentController.getDocumentTypes);

// Vehicle Documents
router.get('/vehicle/:id', documentController.getVehicleDocuments);
router.post('/vehicle/:id', upload.single('document'), documentController.uploadVehicleDocument);
router.delete('/vehicle/:id/:docId', documentController.deleteVehicleDocument);

// Booking Documents
router.get('/booking/:id', documentController.getBookingDocuments);
router.post('/booking/:id', upload.single('document'), documentController.uploadBookingDocument);
router.delete('/booking/:id/:docId', documentController.deleteBookingDocument);

module.exports = router;
