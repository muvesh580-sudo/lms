import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { removeUploadedFile, removeStoredFile, uploadDirs } from '../middleware/uploadMiddleware.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Only accept plain strings from request bodies (blocks `{ "$ne": null }` style operator injection)
const str = (value) => (typeof value === 'string' ? value : undefined);

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const name = str(req.body.name)?.trim();
    const email = str(req.body.email)?.trim().toLowerCase();
    const password = str(req.body.password);

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user - role is never taken from the request
    const user = await User.create({
      name,
      email,
      password,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const email = str(req.body.email)?.trim().toLowerCase();
    const password = str(req.body.password);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'enrolledCourses',
      select: 'title description thumbnail category level duration price avgRating instructor',
      populate: { path: 'instructor', select: 'name' },
    });

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        enrolledCourses: user.enrolledCourses,
        profilePic: user.profilePic,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = str(req.body.name) || user.name;
      user.email = str(req.body.email) || user.email;

      // Update password if provided
      if (str(req.body.password)) {
        user.password = req.body.password;
      }

      // Update profile picture if uploaded
      const oldProfilePic = user.profilePic;
      if (req.file) {
        user.profilePic = req.file.filename;
      }

      const updatedUser = await user.save();

      if (req.file && oldProfilePic !== updatedUser.profilePic) {
        removeStoredFile(uploadDirs.profile, oldProfilePic);
      }

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePic: updatedUser.profilePic,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    removeUploadedFile(req.file);
    next(error);
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const pageSize = Math.min(Number(req.query.limit) || 50, 100);
    const page = Math.max(Number(req.query.pageNumber) || 1, 1);

    const count = await User.countDocuments({});
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ users, page, pages: Math.ceil(count / pageSize), count });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID (admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      const role = str(req.body.role);

      // Stop an admin from accidentally removing their own admin access
      if (role && role !== 'admin' && user._id.equals(req.user._id)) {
        return res.status(400).json({ message: 'You cannot change your own role' });
      }

      user.name = str(req.body.name) || user.name;
      user.email = str(req.body.email) || user.email;
      user.role = role || user.role;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};
