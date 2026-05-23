const express = require('express');
const router = express.Router();
const { 
  exportUsers, exportSalesAgents, exportVehicles, 
  exportBookingPdf, exportSaleInvoicePdf, exportDashboardPdf,
  exportFinancialReportPdf
} = require('../controllers/exportController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/users', authorize(['Super Admin', 'Admin Pusat']), exportUsers);
router.get('/sales-agents', authorize(['Super Admin', 'Admin Pusat']), exportSalesAgents);
router.get('/vehicles', exportVehicles);
router.get('/bookings/:id', exportBookingPdf); // ?type=receipt or dp-invoice
router.get('/sales/:id/invoice', exportSaleInvoicePdf);
router.get('/dashboard/pdf', exportDashboardPdf);
router.get('/financial-report', authorize(['Super Admin', 'Admin Pusat']), exportFinancialReportPdf);

module.exports = router;
