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
  enrollFreeCourse,
} from '../controllers/courseController.js';
import { protect, optionalAuth, authorize } from '../middleware/authMiddleware.js';
import { uploadThumbnail } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Static paths are registered before `/:id` so they are never captured by it
router.get('/instructor/courses', protect, authorize('instructor'), getInstructorCourses);
router.get('/admin/courses', protect, authorize('admin'), getAdminCourses);

// Public routes (a logged-in instructor/admin can also see unpublished courses)
router.get('/', getCourses);
router.get('/:id', optionalAuth, getCourseById);

// Protected routes for instructors and admins
router.post('/', protect, authorize('instructor', 'admin'), uploadThumbnail, createCourse);
router.put('/:id', protect, authorize('instructor', 'admin'), uploadThumbnail, updateCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse);

// Protected routes for students
router.post('/:id/enroll', protect, enrollFreeCourse);
router.post('/:id/ratings', protect, authorize('student'), addCourseRating);

export default router;
