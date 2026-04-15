import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadProfilePic } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, uploadProfilePic, updateUserProfile);

// Admin routes
router.get('/', protect, authorize('admin'), getUsers);
router.delete('/:id', protect, authorize('admin'), deleteUser);
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUser);

export default router;