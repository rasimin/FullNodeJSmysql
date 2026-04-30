const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { authenticate } = require('../middlewares/authMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/', promotionController.getPromotions);
router.get('/:id', promotionController.getPromotionDetail);

// Protected routes
router.post('/', authenticate, upload.single('image'), promotionController.createPromotion);
router.put('/:id', authenticate, upload.single('image'), promotionController.updatePromotion);
router.delete('/:id', authenticate, promotionController.deletePromotion);
router.patch('/:id/toggle', authenticate, promotionController.toggleStatus);

module.exports = router;
