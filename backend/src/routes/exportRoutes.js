const express = require('express');
const router = express.Router();
const { exportUsers } = require('../controllers/exportController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/users', exportUsers);

module.exports = router;
