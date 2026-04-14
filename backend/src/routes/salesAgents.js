const express = require('express');
const router = express.Router();
const salesAgentController = require('../controllers/SalesAgentController');
const { authenticate } = require('../middlewares/authMiddleware');

const upload = require('../middlewares/uploadMiddleware');
router.use(authenticate);

router.get('/', salesAgentController.getSalesAgents);
router.get('/active', salesAgentController.getActiveSalesAgents);
router.post('/', upload.single('avatar'), salesAgentController.createSalesAgent);
router.put('/:id', upload.single('avatar'), salesAgentController.updateSalesAgent);
router.delete('/:id', salesAgentController.deleteSalesAgent);

module.exports = router;
