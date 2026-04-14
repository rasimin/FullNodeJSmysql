const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, logout } = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const upload = require('../utils/upload');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, upload.single('avatar'), updateProfile);

module.exports = router;
