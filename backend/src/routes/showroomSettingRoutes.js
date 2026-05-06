const express = require('express');
const router = express.Router();
const showroomSettingController = require('../controllers/showroomSettingController');
const { authenticate } = require('../middlewares/authMiddleware');
const upload = require('../utils/upload');
router.use(authenticate);

router.get('/', showroomSettingController.getShowroomSetting);
router.put('/:id', upload.fields([
  { name: 'header_image', maxCount: 1 },
  { name: 'about_image_1', maxCount: 1 },
  { name: 'about_image_2', maxCount: 1 },
  { name: 'about_image_3', maxCount: 1 },
  { name: 'about_image_4', maxCount: 1 },
  { name: 'about_image_5', maxCount: 1 }
]), showroomSettingController.updateShowroomSetting);
router.get('/check-slug', showroomSettingController.checkSlugAvailability);

module.exports = router;
