const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { adminOnly } = require('../middleware/authMiddleware');

// All routes are admin-only
router.get('/pending', adminOnly, userController.getPendingUsers);
router.put('/:id/approve', adminOnly, userController.approveUser);
router.delete('/:id/reject', adminOnly, userController.rejectUser);
router.get('/', adminOnly, userController.getAllUsers);

module.exports = router;
