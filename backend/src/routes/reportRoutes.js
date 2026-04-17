const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/dashboard', reportController.getDashboardStats);
router.get('/analytics', reportController.getAdvancedAnalytics);
router.get('/business-analysis', reportController.getBusinessAnalysisReport);
router.get('/sales-agents', reportController.getSalesAgentReport);
router.get('/sales-agents/:id/details', reportController.getAgentSalesDetails);
router.get('/analysis', reportController.getAnalysisReport);

module.exports = router;
