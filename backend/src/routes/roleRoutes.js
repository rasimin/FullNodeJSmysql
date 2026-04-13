const express = require('express');
const router = express.Router();
const { createRole, getRoles, updateRole, deleteRole } = require('../controllers/roleController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// All admins can see roles (to populate forms), but only Super Admin can modify them
router.use(authenticate);

router.get('/', authorize(['Super Admin', 'Admin Pusat']), getRoles);

// Management routes still restricted to Super Admin
router.post('/', authorize(['Super Admin']), createRole);
router.put('/:id', authorize(['Super Admin']), updateRole);
router.delete('/:id', authorize(['Super Admin']), deleteRole);

module.exports = router;
