const express = require('express');
const router = express.Router();
const { exportUsers, exportDashboardPdf } = require('../controllers/exportController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/users', exportUsers);
router.get('/dashboard/pdf', exportDashboardPdf);

module.exports = router;
