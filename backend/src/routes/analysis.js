const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/category-sales', authenticateToken, analysisController.getCategorySales);
router.get('/stock-analysis', authenticateToken, analysisController.getStockAnalysis);
router.get('/insights', authenticateToken, analysisController.getInsights);
router.get('/products', authenticateToken, analysisController.getProductList);
router.get('/profit-analysis', authenticateToken, analysisController.getProfitAnalysis);
router.get('/top-customers', authenticateToken, analysisController.getTopCustomers);

module.exports = router;
