const express = require('express');
const router = express.Router();
const salesAgentController = require('../controllers/SalesAgentController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', salesAgentController.getSalesAgents);
router.get('/active', salesAgentController.getActiveSalesAgents);
router.post('/', salesAgentController.createSalesAgent);
router.put('/:id', salesAgentController.updateSalesAgent);
router.delete('/:id', salesAgentController.deleteSalesAgent);

module.exports = router;
