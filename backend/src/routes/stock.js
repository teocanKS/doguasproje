const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All stock routes require authentication
router.get('/', authenticateToken, stockController.getStockStatus);
router.get('/:productId/history', authenticateToken, stockController.getStockHistory);

module.exports = router;
