const express = require('express');
const router = express.Router();
const showroomSettingController = require('../controllers/showroomSettingController');
const { authenticate } = require('../middlewares/authMiddleware');
const upload = require('../utils/upload');
router.use(authenticate);

router.get('/', showroomSettingController.getShowroomSetting);
router.put('/:id', upload.single('header_image'), showroomSettingController.updateShowroomSetting);
router.get('/check-slug', showroomSettingController.checkSlugAvailability);

module.exports = router;
