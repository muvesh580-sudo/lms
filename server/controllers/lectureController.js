import path from 'path';
import mongoose from 'mongoose';
import Lecture from '../models/lectureModel.js';
import Course from '../models/courseModel.js';
import {
  uploadDirs,
  removeUploadedFile,
  removeStoredFile,
} from '../middleware/uploadMiddleware.js';
import { getCourseAccess, toLectureResponse, verifyMediaToken } from '../utils/courseAccess.js';

const RESOURCE_TYPES = ['pdf', 'doc', 'ppt', 'zip', 'other'];

// Load a lecture together with its course, or send the matching 404
const findLectureWithCourse = async (lectureId, res) => {
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) {
    res.status(404).json({ message: 'Lecture not found' });
    return {};
  }
  const course = await Course.findById(lecture.course);
  if (!course) {
    res.status(404).json({ message: 'Course not found' });
    return {};
  }
  return { lecture, course };
};

// @desc    Create a new lecture for a course
// @route   POST /api/lectures
// @access  Private/Instructor or Admin
export const createLecture = async (req, res, next) => {
  try {
    const { title, description, course, duration, order, isPreview } = req.body;

    if (!mongoose.isValidObjectId(course)) {
      removeUploadedFile(req.file);
      return res.status(400).json({ message: 'A valid course id is required' });
    }

    // Check if course exists
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      removeUploadedFile(req.file);
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the course instructor or an admin
    if (!getCourseAccess(courseExists, req.user).canManage) {
      removeUploadedFile(req.file);
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Make sure a video was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a video file' });
    }

    // Create the lecture
    const lecture = await Lecture.create({
      title,
      description,
      course,
      videoUrl: req.file.filename,
      duration: Number(duration),
      order: Number(order),
      isPreview: isPreview === 'true' || isPreview === true,
    });

    res.status(201).json(toLectureResponse(lecture, { unlocked: true, userId: req.user._id }));
  } catch (error) {
    removeUploadedFile(req.file);
    next(error);
  }
};

// @desc    Get all lectures for a course
// @route   GET /api/lectures/course/:courseId
// @access  Public (preview lectures) / Enrolled, instructor or admin (all lectures)
export const getCourseLectures = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const access = getCourseAccess(course, req.user);

    // If course is not published, only instructor or admin can view
    if (!course.published && !access.canManage) {
      return res
        .status(req.user ? 403 : 401)
        .json({ message: 'Not authorized' });
    }

    const lectures = await Lecture.find({ course: course._id }).sort({ order: 1 });

    // Everyone sees the outline; only previews are playable without access
    res.json(
      lectures.map((lecture) =>
        toLectureResponse(lecture, {
          unlocked: access.canViewContent || lecture.isPreview,
          userId: req.user?._id,
        })
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get lecture by ID
// @route   GET /api/lectures/:id
// @access  Public (preview of a published course) / Enrolled, instructor or admin
export const getLectureById = async (req, res, next) => {
  try {
    const { lecture, course } = await findLectureWithCourse(req.params.id, res);
    if (!lecture) return;

    const access = getCourseAccess(course, req.user);

    if (!course.published && !access.canManage) {
      return res.status(req.user ? 403 : 401).json({ message: 'Not authorized' });
    }

    // Preview lectures are available for everyone
    if (!lecture.isPreview && !access.canViewContent) {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, please log in' });
      }
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    res.json(toLectureResponse(lecture, { unlocked: true, userId: req.user?._id }));
  } catch (error) {
    next(error);
  }
};

// @desc    Stream a lecture video
// @route   GET /api/lectures/:id/video?token=
// @access  Holder of a media token issued for this lecture
export const streamLectureVideo = async (req, res, next) => {
  try {
    if (!verifyMediaToken(String(req.query.token || ''), req.params.id)) {
      return res.status(401).json({ message: 'Invalid or expired media link' });
    }

    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    res.sendFile(path.basename(lecture.videoUrl), { root: uploadDirs.videos }, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ message: 'Video file not found' });
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download a lecture resource
// @route   GET /api/lectures/:id/resources/:resourceId/download?token=
// @access  Holder of a media token issued for this lecture
export const downloadLectureResource = async (req, res, next) => {
  try {
    if (!verifyMediaToken(String(req.query.token || ''), req.params.id)) {
      return res.status(401).json({ message: 'Invalid or expired media link' });
    }

    const lecture = await Lecture.findById(req.params.id);
    const resource = lecture?.resources.id(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const filename = path.basename(resource.fileUrl);
    const downloadName = `${resource.title.replace(/[^\w.-]+/g, '_')}${path.extname(filename)}`;
    res.download(path.join(uploadDirs.materials, filename), downloadName, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ message: 'Resource file not found' });
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lecture
// @route   PUT /api/lectures/:id
// @access  Private/Instructor or Admin
export const updateLecture = async (req, res, next) => {
  try {
    const { title, description, duration, order, isPreview } = req.body;

    const { lecture, course } = await findLectureWithCourse(req.params.id, res);
    if (!lecture) {
      removeUploadedFile(req.file);
      return;
    }

    // Check if user is the course instructor or an admin
    if (!getCourseAccess(course, req.user).canManage) {
      removeUploadedFile(req.file);
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update lecture fields
    lecture.title = title || lecture.title;
    lecture.description = description || lecture.description;
    lecture.duration = duration !== undefined ? Number(duration) : lecture.duration;
    lecture.order = order !== undefined ? Number(order) : lecture.order;
    lecture.isPreview =
      isPreview !== undefined ? isPreview === 'true' || isPreview === true : lecture.isPreview;

    // Update video if uploaded
    const oldVideo = lecture.videoUrl;
    if (req.file) {
      lecture.videoUrl = req.file.filename;
    }

    const updatedLecture = await lecture.save();
    if (req.file) {
      removeStoredFile(uploadDirs.videos, oldVideo);
    }
    res.json(toLectureResponse(updatedLecture, { unlocked: true, userId: req.user._id }));
  } catch (error) {
    removeUploadedFile(req.file);
    next(error);
  }
};

// @desc    Delete lecture
// @route   DELETE /api/lectures/:id
// @access  Private/Instructor or Admin
export const deleteLecture = async (req, res, next) => {
  try {
    const { lecture, course } = await findLectureWithCourse(req.params.id, res);
    if (!lecture) return;

    // Check if user is the course instructor or an admin
    if (!getCourseAccess(course, req.user).canManage) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await lecture.deleteOne();
    removeStoredFile(uploadDirs.videos, lecture.videoUrl);
    lecture.resources.forEach((r) => removeStoredFile(uploadDirs.materials, r.fileUrl));
    res.json({ message: 'Lecture removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add resource to lecture
// @route   POST /api/lectures/:id/resources
// @access  Private/Instructor or Admin
export const addLectureResource = async (req, res, next) => {
  try {
    const { title } = req.body;
    const fileType = RESOURCE_TYPES.includes(req.body.fileType) ? req.body.fileType : 'other';

    const { lecture, course } = await findLectureWithCourse(req.params.id, res);
    if (!lecture) {
      removeUploadedFile(req.file);
      return;
    }

    // Check if user is the course instructor or an admin
    if (!getCourseAccess(course, req.user).canManage) {
      removeUploadedFile(req.file);
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Make sure a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    // Add the resource
    lecture.resources.push({
      title,
      fileUrl: req.file.filename,
      fileType,
    });
    await lecture.save();

    res.status(201).json(toLectureResponse(lecture, { unlocked: true, userId: req.user._id }));
  } catch (error) {
    removeUploadedFile(req.file);
    next(error);
  }
};

// @desc    Delete resource from lecture
// @route   DELETE /api/lectures/:id/resources/:resourceId
// @access  Private/Instructor or Admin
export const deleteLectureResource = async (req, res, next) => {
  try {
    const { lecture, course } = await findLectureWithCourse(req.params.id, res);
    if (!lecture) return;

    // Check if user is the course instructor or an admin
    if (!getCourseAccess(course, req.user).canManage) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const resource = lecture.resources.id(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Remove the resource
    lecture.resources.pull(resource._id);
    await lecture.save();
    removeStoredFile(uploadDirs.materials, resource.fileUrl);

    res.json(toLectureResponse(lecture, { unlocked: true, userId: req.user._id }));
  } catch (error) {
    next(error);
  }
};
