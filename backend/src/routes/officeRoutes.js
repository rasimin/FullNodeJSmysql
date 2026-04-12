const express = require('express');
const router = express.Router();
const { createOffice, getOffices, updateOffice, deleteOffice } = require('../controllers/officeController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Everyone can view offices
router.get('/', getOffices);

// Only Admins can manage offices
router.post('/', authorize(['Super Admin', 'Admin Pusat']), createOffice);
router.put('/:id', authorize(['Super Admin', 'Admin Pusat']), updateOffice);
router.delete('/:id', authorize(['Super Admin']), deleteOffice);

module.exports = router;
