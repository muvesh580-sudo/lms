import Lecture from '../models/lectureModel.js';
import Course from '../models/courseModel.js';
import User from '../models/userModel.js';

// @desc    Create a new lecture for a course
// @route   POST /api/lectures
// @access  Private/Instructor or Admin
export const createLecture = async (req, res) => {
  try {
    const { title, description, course, duration, order, isPreview } = req.body;

    // Check if course exists
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the course instructor or an admin
    if (
      courseExists.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
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
      isPreview: isPreview === 'true',
    });

    res.status(201).json(lecture);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all lectures for a course
// @route   GET /api/lectures/course/:courseId
// @access  Public or Private (depending on enrollment)
export const getCourseLectures = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get all lectures for the course
    const lectures = await Lecture.find({ course: courseId }).sort({ order: 1 });

    // If course is not published, only instructor or admin can view
    if (!course.published) {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      // Check if user is the instructor or an admin
      const isInstructor = course.instructor.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isInstructor && !isAdmin) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    // If user is not enrolled, only return preview lectures
    if (req.user) {
      const user = await User.findById(req.user._id);
      const isEnrolled = user.enrolledCourses.includes(courseId);
      const isInstructor = course.instructor.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isEnrolled && !isInstructor && !isAdmin) {
        const previewLectures = lectures.filter(lecture => lecture.isPreview);
        return res.json(previewLectures);
      }
    } else {
      // User is not logged in, only return preview lectures
      const previewLectures = lectures.filter(lecture => lecture.isPreview);
      return res.json(previewLectures);
    }

    // User is enrolled or is instructor/admin, return all lectures
    res.json(lectures);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get lecture by ID
// @route   GET /api/lectures/:id
// @access  Private (based on enrollment)
export const getLectureById = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Get course info to check access
    const course = await Course.findById(lecture.course);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is authorized to view this lecture
    // Preview lectures are available for everyone
    if (lecture.isPreview) {
      return res.json(lecture);
    }

    // For non-preview lectures, user must be authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, please log in' });
    }

    // Check if user is enrolled, instructor, or admin
    const user = await User.findById(req.user._id);
    const isEnrolled = user.enrolledCourses.includes(course._id);
    const isInstructor = course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isEnrolled && !isInstructor && !isAdmin) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    res.json(lecture);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update lecture
// @route   PUT /api/lectures/:id
// @access  Private/Instructor or Admin
export const updateLecture = async (req, res) => {
  try {
    const { title, description, order, isPreview } = req.body;

    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Get course to check if user is authorized
    const course = await Course.findById(lecture.course);

    // Check if user is the course instructor or an admin
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update lecture fields
    lecture.title = title || lecture.title;
    lecture.description = description || lecture.description;
    lecture.order = order !== undefined ? Number(order) : lecture.order;
    lecture.isPreview = isPreview !== undefined ? isPreview === 'true' : lecture.isPreview;

    // Update video if uploaded
    if (req.file) {
      lecture.videoUrl = req.file.filename;
    }

    const updatedLecture = await lecture.save();
    res.json(updatedLecture);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete lecture
// @route   DELETE /api/lectures/:id
// @access  Private/Instructor or Admin
export const deleteLecture = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Get course to check if user is authorized
    const course = await Course.findById(lecture.course);

    // Check if user is the course instructor or an admin
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await lecture.deleteOne();
    res.json({ message: 'Lecture removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add resource to lecture
// @route   POST /api/lectures/:id/resources
// @access  Private/Instructor or Admin
export const addLectureResource = async (req, res) => {
  try {
    const { title, fileType } = req.body;

    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Get course to check if user is authorized
    const course = await Course.findById(lecture.course);

    // Check if user is the course instructor or an admin
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Make sure a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    // Add the resource
    const resource = {
      title,
      fileUrl: req.file.filename,
      fileType,
    };

    lecture.resources.push(resource);
    await lecture.save();

    res.status(201).json(lecture);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete resource from lecture
// @route   DELETE /api/lectures/:id/resources/:resourceId
// @access  Private/Instructor or Admin
export const deleteLectureResource = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Get course to check if user is authorized
    const course = await Course.findById(lecture.course);

    // Check if user is the course instructor or an admin
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Remove the resource
    lecture.resources = lecture.resources.filter(
      (resource) => resource._id.toString() !== req.params.resourceId
    );

    await lecture.save();
    res.json(lecture);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};