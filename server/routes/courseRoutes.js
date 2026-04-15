import express from 'express';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getInstructorCourses,
  addCourseRating,
  getAdminCourses,
} from '../controllers/courseController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadThumbnail } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getCourses);
router.get('/:id', getCourseById);

// Protected routes for instructors and admins
router.post('/', protect, authorize('instructor', 'admin'), uploadThumbnail, createCourse);
router.get('/instructor/courses', protect, authorize('instructor'), getInstructorCourses);
router.put('/:id', protect, authorize('instructor', 'admin'), uploadThumbnail, updateCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse);

// Protected routes for students
router.post('/:id/ratings', protect, authorize('student'), addCourseRating);

// Admin routes
router.get('/admin/courses', protect, authorize('admin'), getAdminCourses);

export default router;