import express from 'express';
import {
  createLecture,
  getCourseLectures,
  getLectureById,
  updateLecture,
  deleteLecture,
  addLectureResource,
  deleteLectureResource,
  streamLectureVideo,
  downloadLectureResource,
} from '../controllers/lectureController.js';
import { protect, optionalAuth, authorize } from '../middleware/authMiddleware.js';
import { uploadVideo, uploadMaterial } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Get lectures for a course (previews for everyone, everything for enrolled users)
router.get('/course/:courseId', optionalAuth, getCourseLectures);
router.get('/:id', optionalAuth, getLectureById);

// Private files, authorised by a short-lived media token
router.get('/:id/video', streamLectureVideo);
router.get('/:id/resources/:resourceId/download', downloadLectureResource);

// Instructor/Admin routes
router.post('/', protect, authorize('instructor', 'admin'), uploadVideo, createLecture);
router.put('/:id', protect, authorize('instructor', 'admin'), uploadVideo, updateLecture);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteLecture);

// Resource management
router.post('/:id/resources', protect, authorize('instructor', 'admin'), uploadMaterial, addLectureResource);
router.delete('/:id/resources/:resourceId', protect, authorize('instructor', 'admin'), deleteLectureResource);

export default router;
