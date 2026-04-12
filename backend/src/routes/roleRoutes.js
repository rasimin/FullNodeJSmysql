const express = require('express');
const router = express.Router();
const { createRole, getRoles, updateRole, deleteRole } = require('../controllers/roleController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Only Super Admin can manage roles
router.use(authenticate);
router.use(authorize(['Super Admin'])); 

router.post('/', createRole);
router.get('/', getRoles);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

module.exports = router;
