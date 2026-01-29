const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, adminOnly } = require('../middleware/authMiddleware');

// General dashboard routes (all authenticated users)
router.get('/stats', authenticateToken, dashboardController.getStats);
router.get('/profit-chart', authenticateToken, dashboardController.getProfitChart);
router.get('/active-products', authenticateToken, dashboardController.getActiveProducts);
router.get('/forecast', authenticateToken, dashboardController.getForecast);


// Admin-only routes
router.get('/inactivity-alerts', adminOnly, dashboardController.getInactivityAlerts);

module.exports = router;
