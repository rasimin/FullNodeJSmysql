const express = require('express');
const router = express.Router();
const { getActivityLogs, getAuditTrails } = require('../controllers/logController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Activity Logs
router.get('/activities', getActivityLogs);

// Audit Trails
router.get('/audits', authorize(['Super Admin', 'Admin Pusat', 'Admin Cabang']), getAuditTrails);

module.exports = router;
