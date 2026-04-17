const express = require('express');
const router = express.Router();
const { 
  getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle,
  getBrands, getModelHistory, getTypeHistory, getYearHistory, getFilterOptions, createBrand, updateBrand, deleteBrand,
  uploadVehicleImages, deleteVehicleImage, setPrimaryImage, getVehicleSummary
} = require('../controllers/vehicleController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(authenticate);

router.get('/', getVehicles);
router.get('/summary', getVehicleSummary);
router.get('/brands', getBrands);
router.post('/brands', authorize(['Super Admin', 'Admin Pusat']), createBrand);
router.put('/brands/:id', authorize(['Super Admin', 'Admin Pusat']), updateBrand);
router.delete('/brands/:id', authorize(['Super Admin']), deleteBrand);
router.get('/model-history', getModelHistory);
router.get('/type-history', getTypeHistory);
router.get('/year-history', getYearHistory);
router.get('/filter-options', getFilterOptions);

// Vehicle CRUD
router.post('/', authorize(['Super Admin', 'Admin Pusat', 'Admin Cabang']), createVehicle);
router.get('/:id', getVehicleById);
router.put('/:id', authorize(['Super Admin', 'Admin Pusat', 'Admin Cabang']), updateVehicle);
router.delete('/:id', authorize(['Super Admin', 'Admin Pusat']), deleteVehicle);

// Vehicle Images
router.post('/:id/images', authorize(['Super Admin', 'Admin Pusat', 'Admin Cabang']), upload.array('images', 10), uploadVehicleImages);
router.put('/:id/images/:imageId/primary', authorize(['Super Admin', 'Admin Pusat', 'Admin Cabang']), setPrimaryImage);
router.delete('/:id/images/:imageId', authorize(['Super Admin', 'Admin Pusat', 'Admin Cabang']), deleteVehicleImage);

module.exports = router;
