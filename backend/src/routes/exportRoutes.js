const express = require('express');
const router = express.Router();
const { 
  exportUsers, exportSalesAgents, exportVehicles, 
  exportBookingPdf, exportSaleInvoicePdf, exportDashboardPdf,
  exportFinancialReportPdf
} = require('../controllers/exportController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/users', exportUsers);
router.get('/sales-agents', exportSalesAgents);
router.get('/vehicles', exportVehicles);
router.get('/bookings/:id', exportBookingPdf); // ?type=receipt or dp-invoice
router.get('/sales/:id/invoice', exportSaleInvoicePdf);
router.get('/dashboard/pdf', exportDashboardPdf);
router.get('/financial-report', exportFinancialReportPdf);

module.exports = router;
