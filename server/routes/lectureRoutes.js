import express from 'express';
import {
  createLecture,
  getCourseLectures,
  getLectureById,
  updateLecture,
  deleteLecture,
  addLectureResource,
  deleteLectureResource,
} from '../controllers/lectureController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadVideo, uploadMaterial } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Get lectures for a course
router.get('/course/:courseId', getCourseLectures);
router.get('/:id', protect, getLectureById);

// Instructor/Admin routes
router.post('/', protect, authorize('instructor', 'admin'), uploadVideo, createLecture);
router.put('/:id', protect, authorize('instructor', 'admin'), uploadVideo, updateLecture);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteLecture);

// Resource management
router.post('/:id/resources', protect, authorize('instructor', 'admin'), uploadMaterial, addLectureResource);
router.delete('/:id/resources/:resourceId', protect, authorize('instructor', 'admin'), deleteLectureResource);

export default router;