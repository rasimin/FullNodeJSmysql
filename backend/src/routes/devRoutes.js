const express = require('express');
const router = express.Router();
const devController = require('../controllers/devController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Only Super Admin can run raw queries
router.post('/query', authenticate, authorize(['Super Admin']), devController.executeQuery);

module.exports = router;
