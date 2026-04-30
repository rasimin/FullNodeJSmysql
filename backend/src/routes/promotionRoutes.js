const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { authenticate } = require('../middlewares/authMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(authenticate);

router.get('/', promotionController.getPromotions);
router.post('/', upload.single('image'), promotionController.createPromotion);
router.put('/:id', upload.single('image'), promotionController.updatePromotion);
router.delete('/:id', promotionController.deletePromotion);
router.patch('/:id/toggle', promotionController.toggleStatus);

module.exports = router;
