import mongoose from 'mongoose';
import Course from '../models/courseModel.js';
import Lecture from '../models/lectureModel.js';
import User from '../models/userModel.js';
import {
  uploadDirs,
  removeUploadedFile,
  removeStoredFile,
} from '../middleware/uploadMiddleware.js';
import { getCourseAccess, toLectureResponse } from '../utils/courseAccess.js';

// Escape user input before using it inside a regular expression
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Only accept plain strings from the query string (blocks `?category[$ne]=x`)
const str = (value) => (typeof value === 'string' && value ? value : undefined);

// Multipart forms send booleans as strings
const toBoolean = (value) => value === true || value === 'true';

// Public shape of a course: hide the enrolled student list
const toCourseResponse = (course) => {
  const data = course.toObject ? course.toObject() : { ...course };
  data.enrolledCount = data.enrolledStudents?.length || 0;
  delete data.enrolledStudents;
  return data;
};

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private/Instructor or Admin
export const createCourse = async (req, res, next) => {
  try {
    const { title, description, price, category, level, duration } = req.body;

    // Set the instructor to current user
    const instructor = req.user._id;

    // Set thumbnail if uploaded
    const thumbnail = req.file ? req.file.filename : 'default-course.jpg';

    const course = await Course.create({
      title,
      description,
      instructor,
      price,
      thumbnail,
      category,
      level,
      duration,
    });

    res.status(201).json(course);
  } catch (error) {
    removeUploadedFile(req.file);
    next(error);
  }
};

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
export const getCourses = async (req, res, next) => {
  try {
    const pageSize = 10;
    const page = Math.max(Number(req.query.pageNumber) || 1, 1);

    const keyword = str(req.query.keyword);
    const category = str(req.query.category);
    const level = str(req.query.level);

    // Only return published courses for public access
    const filter = {
      published: true,
      // `trusted` exempts this server-built operator from the global sanitizeFilter
      ...(keyword && {
        title: mongoose.trusted({ $regex: escapeRegex(keyword.slice(0, 100)), $options: 'i' }),
      }),
      ...(category && { category }),
      ...(level && { level }),
    };

    const [count, courses] = await Promise.all([
      Course.countDocuments(filter),
      Course.find(filter)
        .select('-enrolledStudents -ratings')
        .populate('instructor', 'name')
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1)),
    ]);

    res.json({
      courses,
      page,
      pages: Math.ceil(count / pageSize),
      count,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get instructor courses
// @route   GET /api/courses/instructor/courses
// @access  Private/Instructor
export const getInstructorCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(courses.map(toCourseResponse));
  } catch (error) {
    next(error);
  }
};

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Public (published) / instructor or admin (unpublished)
export const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name')
      .populate({ path: 'lectures', options: { sort: { order: 1 } } });

    // If course not found
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const access = getCourseAccess(course, req.user);

    // For non-published courses, only the instructor or admin can view them
    if (!course.published && !access.canManage) {
      return res.status(req.user ? 403 : 401).json({ message: 'Not authorized' });
    }

    const data = toCourseResponse(course);
    data.lectures = (course.lectures || []).map((lecture) =>
      toLectureResponse(lecture, {
        unlocked: access.canViewContent || lecture.isPreview,
        userId: req.user?._id,
      })
    );
    data.isEnrolled = access.isEnrolled;
    data.canManage = access.canManage;

    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Instructor or Admin
export const updateCourse = async (req, res, next) => {
  try {
    const {
      title,
      description,
      price,
      category,
      level,
      duration,
      published,
    } = req.body;

    const course = await Course.findById(req.params.id);

    // Check if course exists
    if (!course) {
      removeUploadedFile(req.file);
      return res.status(404).json({ message: 'Course not found' });
    }

    // Make sure user is the course instructor or an admin
    if (!getCourseAccess(course, req.user).canManage) {
      removeUploadedFile(req.file);
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update course fields
    course.title = title || course.title;
    course.description = description || course.description;
    // `price || ...` would make it impossible to set a free (0) price
    course.price = price !== undefined && price !== '' ? price : course.price;
    course.category = category || course.category;
    course.level = level || course.level;
    course.duration = duration || course.duration;
    course.published = published !== undefined ? toBoolean(published) : course.published;

    // Update thumbnail if uploaded
    const oldThumbnail = course.thumbnail;
    if (req.file) {
      course.thumbnail = req.file.filename;
    }

    const updatedCourse = await course.save();
    if (req.file) {
      removeStoredFile(uploadDirs.thumbnails, oldThumbnail);
    }
    res.json(toCourseResponse(updatedCourse));
  } catch (error) {
    removeUploadedFile(req.file);
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Instructor or Admin
export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Make sure user is the course instructor or an admin
    if (!getCourseAccess(course, req.user).canManage) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Remove the course's lectures, their files and enrollment references too
    const lectures = await Lecture.find({ course: course._id });
    await Lecture.deleteMany({ course: course._id });
    await User.updateMany({ enrolledCourses: course._id }, { $pull: { enrolledCourses: course._id } });
    await course.deleteOne();

    lectures.forEach((lecture) => {
      removeStoredFile(uploadDirs.videos, lecture.videoUrl);
      lecture.resources.forEach((r) => removeStoredFile(uploadDirs.materials, r.fileUrl));
    });
    removeStoredFile(uploadDirs.thumbnails, course.thumbnail);

    res.json({ message: 'Course removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Enroll in a free course
// @route   POST /api/courses/:id/enroll
// @access  Private
export const enrollFreeCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course || !course.published) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.price > 0) {
      return res.status(402).json({ message: 'This course requires payment' });
    }

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { enrolledCourses: course._id } });
    await Course.findByIdAndUpdate(course._id, { $addToSet: { enrolledStudents: req.user._id } });

    res.json({ success: true, message: 'Enrolled successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add course rating
// @route   POST /api/courses/:id/ratings
// @access  Private/Student
export const addCourseRating = async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    const review = typeof req.body.review === 'string' ? req.body.review.slice(0, 2000) : '';

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be a whole number from 1 to 5' });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is enrolled in the course
    if (!getCourseAccess(course, req.user).isEnrolled) {
      return res.status(403).json({ message: 'You must enroll to leave a rating' });
    }

    // Check if user already rated the course
    const alreadyRated = course.ratings.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyRated) {
      // Update existing rating
      alreadyRated.rating = rating;
      alreadyRated.review = review;
    } else {
      // Add new rating
      course.ratings.push({
        rating,
        review,
        user: req.user._id,
      });
    }

    // Average rating is recalculated in the model's pre-save hook
    await course.save();
    res.status(201).json({ message: 'Rating added', course: toCourseResponse(course) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all courses (admin)
// @route   GET /api/courses/admin/courses
// @access  Private/Admin
export const getAdminCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({})
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });
    res.json(courses.map(toCourseResponse));
  } catch (error) {
    next(error);
  }
};
