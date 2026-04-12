const express = require('express');
const router = express.Router();
const { getActivityLogs, getAuditTrails } = require('../controllers/logController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Activity Logs
router.get('/activities', getActivityLogs);

// Audit Trails (Usually restricted to higher admins)
router.get('/audits', authorize(['Super Admin', 'Admin Pusat']), getAuditTrails);

module.exports = router;
