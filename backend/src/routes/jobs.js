const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All job routes require authentication
router.post('/', authenticateToken, jobController.createJob);
router.post('/:id/complete', authenticateToken, jobController.completeJob);
router.get('/active', authenticateToken, jobController.getActiveJobs);
router.get('/:id', authenticateToken, jobController.getJobDetails);

// Helper endpoints
router.get('/parties/customers', authenticateToken, jobController.getCustomers);
router.get('/parties/suppliers', authenticateToken, jobController.getSuppliers);
router.post('/parties/customers', authenticateToken, jobController.createCustomer);
router.post('/parties/suppliers', authenticateToken, jobController.createSupplier);

module.exports = router;
