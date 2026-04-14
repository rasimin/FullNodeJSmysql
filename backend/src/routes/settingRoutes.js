const express = require('express');
const router = express.Router();
const { getSettings, updateSetting } = require('../controllers/settingController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', authenticate, getSettings);
// Only Super Admin or Admin Pusat can change system settings
router.put('/', authenticate, authorize(['Super Admin', 'Admin Pusat']), updateSetting);

module.exports = router;
