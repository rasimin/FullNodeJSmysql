const express = require('express');
const router = express.Router();
const showroomSettingController = require('../controllers/showroomSettingController');
const { authenticate } = require('../middlewares/authMiddleware');
router.use(authenticate);

router.get('/', showroomSettingController.getShowroomSetting);
router.put('/:id', showroomSettingController.updateShowroomSetting);
router.get('/check-slug', showroomSettingController.checkSlugAvailability);

module.exports = router;
