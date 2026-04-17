const express = require('express');
const router = express.Router();
const { exportUsers, exportSalesAgents, exportVehicles, exportDashboardPdf } = require('../controllers/exportController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/users', exportUsers);
router.get('/sales-agents', exportSalesAgents);
router.get('/vehicles', exportVehicles);
router.get('/dashboard/pdf', exportDashboardPdf);

module.exports = router;
