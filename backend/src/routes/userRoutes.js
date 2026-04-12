const express = require('express');
const router = express.Router();
const { createUser, getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { ActivityLog } = require('../models');

router.use(authenticate);

// Radar Pencatat Global untuk semua request ke /api/users
router.use((req, res, next) => {
  console.log(`[User Route] Incoming: ${req.method} ${req.originalUrl}`);
  ActivityLog.create({
    user_id: req.user?.id || 0,
    action: `Route Access: ${req.method}`,
    details: { url: req.originalUrl, body: req.body },
    ip_address: req.ip
  }).catch(err => console.error('Log Error:', err));
  next();
});

// List users (All authenticated users can see list, but maybe restricted in frontend)
router.get('/', getUsers);
router.get('/:id', getUserById);

// Manage Users (Admin only)
router.post('/', authorize(['Super Admin', 'Admin Pusat']), createUser);
router.put('/:id', authorize(['Super Admin', 'Admin Pusat']), updateUser);
router.delete('/:id', authorize(['Super Admin']), deleteUser);

module.exports = router;
