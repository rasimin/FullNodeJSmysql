const express = require('express');
const router = express.Router();
const { 
  getVehicles, createVehicle, updateVehicle, deleteVehicle,
  getBrands, getModelHistory, createBrand, updateBrand, deleteBrand 
} = require('../controllers/vehicleController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', getVehicles);
router.get('/brands', getBrands);
router.post('/brands', authorize(['Super Admin', 'Admin Pusat']), createBrand);
router.put('/brands/:id', authorize(['Super Admin', 'Admin Pusat']), updateBrand);
router.delete('/brands/:id', authorize(['Super Admin']), deleteBrand);
router.get('/model-history', getModelHistory);
router.post('/', authorize(['Super Admin', 'Admin Pusat', 'Admin Cabang']), createVehicle);
router.put('/:id', authorize(['Super Admin', 'Admin Pusat', 'Admin Cabang']), updateVehicle);
router.delete('/:id', authorize(['Super Admin', 'Admin Pusat']), deleteVehicle);

module.exports = router;
