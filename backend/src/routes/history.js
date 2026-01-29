const express = require('express');
const router = express.Router();
const { getHistory, getTransactionDetails, getDetailedHistory } = require('../controllers/historyController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All history routes require authentication
router.get('/', authenticateToken, getHistory);
router.get('/detailed', authenticateToken, getDetailedHistory);
router.get('/:id', authenticateToken, getTransactionDetails);

module.exports = router;
