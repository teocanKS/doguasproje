const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { adminOnly } = require('../middleware/authMiddleware');

// All log routes are admin-only
router.get('/', adminOnly, logController.getLogs);

module.exports = router;
