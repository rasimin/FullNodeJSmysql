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

// Session Management
const { getSessions, revokeSession, revokeOtherSessions } = require('../controllers/authController');
router.get('/sessions', authenticate, getSessions);
router.delete('/sessions/all-others', authenticate, revokeOtherSessions);
router.delete('/sessions/:id', authenticate, revokeSession);

module.exports = router;
