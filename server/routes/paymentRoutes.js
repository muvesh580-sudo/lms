import express from 'express';
import {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getPaymentById,
  getAllPayments,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes for payments
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/history', protect, getPaymentHistory);

// Admin route - must come before `/:id`, otherwise "admin" is treated as an id
router.get('/admin', protect, authorize('admin'), getAllPayments);

router.get('/:id', protect, getPaymentById);

export default router;