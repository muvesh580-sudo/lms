import Course from '../models/courseModel.js';
import User from '../models/userModel.js';

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private/Instructor or Admin
export const createCourse = async (req, res) => {
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
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
export const getCourses = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    // Filter options
    const keyword = req.query.keyword
      ? {
        title: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
      : {};

    const category = req.query.category ? { category: req.query.category } : {};
    const level = req.query.level ? { level: req.query.level } : {};

    // Only return published courses for public access
    const publishFilter = { published: true };

    const count = await Course.countDocuments({
      ...keyword,
      ...category,
      ...level,
      ...publishFilter,
    });

    const courses = await Course.find({
      ...keyword,
      ...category,
      ...level,
      ...publishFilter,
    })
      .populate('instructor', 'name')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    res.json({
      courses,
      page,
      pages: Math.ceil(count / pageSize),
      count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get instructor courses
// @route   GET /api/courses/instructor
// @access  Private/Instructor
export const getInstructorCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Public
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('lectures');

    // If course not found
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // For non-published courses, only the instructor or admin can view them
    if (!course.published) {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      // Check if user is the instructor or an admin
      const isInstructor = course.instructor._id.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isInstructor && !isAdmin) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Instructor or Admin
export const updateCourse = async (req, res) => {
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
      return res.status(404).json({ message: 'Course not found' });
    }

    // Make sure user is the course instructor or an admin
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update course fields
    course.title = title || course.title;
    course.description = description || course.description;
    course.price = price || course.price;
    course.category = category || course.category;
    course.level = level || course.level;
    course.duration = duration || course.duration;
    course.published = published !== undefined ? published : course.published;

    // Update thumbnail if uploaded
    if (req.file) {
      course.thumbnail = req.file.filename;
    }

    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Instructor or Admin
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Make sure user is the course instructor or an admin
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await course.deleteOne();
    res.json({ message: 'Course removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add course rating
// @route   POST /api/courses/:id/ratings
// @access  Private/Student
export const addCourseRating = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is enrolled in the course
    const user = await User.findById(req.user._id);
    const isEnrolled = user.enrolledCourses.includes(course._id);

    if (!isEnrolled) {
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

    // Recalculate average rating
    if (course.ratings.length > 0) {
      course.avgRating =
        course.ratings.reduce((sum, item) => sum + item.rating, 0) /
        course.ratings.length;
    }

    await course.save();
    res.status(201).json({ message: 'Rating added', course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all courses (admin)
// @route   GET /api/courses/admin
// @access  Private/Admin
export const getAdminCourses = async (req, res) => {
  try {
    const courses = await Course.find({})
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};