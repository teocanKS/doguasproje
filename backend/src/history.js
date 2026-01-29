const express = require('express');
const router = express.Router();
const { getHistory, getTransactionDetails, getDetailedHistory } = require('../controllers/historyController');
const { authenticate } = require('../middleware/authMiddleware');

// All history routes require authentication
router.get('/', authenticate, getHistory);
router.get('/detailed', authenticate, getDetailedHistory);
router.get('/:id', authenticate, getTransactionDetails);

module.exports = router;
