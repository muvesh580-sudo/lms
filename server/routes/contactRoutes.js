import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  createContactMessage,
  getContactMessages,
} from '../controllers/contactController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// The form is public, so limit how often one visitor can send it
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.CONTACT_RATE_LIMIT) || 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many messages, please try again later' },
});

router.post('/', contactLimiter, createContactMessage);
router.get('/', protect, authorize('admin'), getContactMessages);

export default router;
