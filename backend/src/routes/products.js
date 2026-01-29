const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All product routes require authentication
router.get('/', authenticateToken, productController.getProducts);
router.get('/categories', authenticateToken, productController.getCategories);
router.get('/:id', authenticateToken, productController.getProductById);

module.exports = router;
