const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const { authenticateToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Public Routes (No Auth)
router.get('/public/:token', quoteController.getQuoteByToken);
router.post('/public/:token/decision', quoteController.handleQuoteDecision);

// Protected Routes
router.get('/customers', authenticateToken, quoteController.getCustomers);
router.get('/customers/:musteri_id/projects', authenticateToken, quoteController.getProjectsByCustomer);
router.get('/previous-orders', authenticateToken, quoteController.getPreviousOrderItems);
router.post('/upload-workflow', authenticateToken, upload.single('file'), quoteController.createQuoteWithWorkflow);
router.post('/upload', authenticateToken, upload.single('file'), quoteController.uploadQuote);
router.post('/create-json', authenticateToken, quoteController.createQuoteFromJson);
router.get('/', authenticateToken, quoteController.getQuotes);
router.get('/:id', authenticateToken, quoteController.getQuoteById);
router.post('/:id/approve', authenticateToken, quoteController.approveQuote);
router.post('/:id/reject', authenticateToken, quoteController.rejectQuote);
router.delete('/:id', authenticateToken, quoteController.deleteQuote);

module.exports = router;
