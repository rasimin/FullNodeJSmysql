const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Public Showroom Metadata
router.get('/showroom/:slug', publicController.getShowroomBySlug);

// Public Vehicle Listing & Filtering
router.get('/vehicles/:slug', publicController.getPublicVehicles);

// Public Vehicle Detail
router.get('/vehicle-detail/:id', publicController.getPublicVehicleDetail);

// Public Promotions
router.get('/promotions/:slug', publicController.getPublicPromotions);

// Public Offices (for filtering)
router.get('/offices/:slug', publicController.getPublicOffices);

// Public Sales Agents
router.get('/sales-agents', publicController.getPublicSalesAgents);

// Public Filter Options
router.get('/filter-options/:slug', publicController.getPublicFilterOptions);
router.get('/brands', publicController.getPublicBrands);

module.exports = router;
