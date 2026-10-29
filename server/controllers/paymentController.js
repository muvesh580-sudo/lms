import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Payment from '../models/paymentModel.js';
import User from '../models/userModel.js';
import Course from '../models/courseModel.js';
import { getCourseAccess } from '../utils/courseAccess.js';

// Initialize Razorpay lazily so the server can start without payment keys
let razorpay;
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  razorpay ??= new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return razorpay;
};

// Allow tests to swap in a fake Razorpay client
export const setRazorpayClient = (client) => {
  razorpay = client;
};

// Constant-time comparison of two hex signatures
const signaturesMatch = (expected, received) => {
  const a = Buffer.from(expected);
  const b = Buffer.from(String(received));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// @desc    Create a new payment order
// @route   POST /api/payments/create-order
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    const { courseId } = req.body;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: 'A valid course id is required' });
    }

    // Validate course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Verify course is published
    if (!course.published) {
      return res.status(400).json({ message: 'Course is not available for enrollment' });
    }

    // Check if user is already enrolled
    if (getCourseAccess(course, req.user).isEnrolled) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    if (course.price <= 0) {
      return res.status(400).json({ message: 'This course is free - use the enroll endpoint' });
    }

    const client = getRazorpay();
    if (!client) {
      return res.status(503).json({ message: 'Payments are not configured on this server' });
    }

    // Create Razorpay order. Provider errors carry Razorpay's own status code
    // (e.g. 401 for bad keys), which must not reach the client as "logged out".
    let order;
    try {
      order = await client.orders.create({
        amount: Math.round(course.price * 100), // amount in smallest currency unit (paise for INR)
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`,
        notes: { courseId: course._id.toString(), userId: req.user._id.toString() },
      });
    } catch (providerError) {
      console.error('Razorpay order creation failed:', providerError?.error?.description || providerError?.message);
      return res.status(502).json({ message: 'Payment provider error, please try again later' });
    }

    // Remember which user/course this order belongs to; verification relies on it
    await Payment.create({
      user: req.user._id,
      course: course._id,
      razorpayOrderId: order.id,
      amount: course.price,
      status: 'pending',
    });

    res.status(200).json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
      keyId: process.env.RAZORPAY_KEY_ID,
      course: {
        id: course._id,
        title: course.title,
        price: course.price,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (
      typeof razorpayOrderId !== 'string' ||
      typeof razorpayPaymentId !== 'string' ||
      typeof razorpaySignature !== 'string'
    ) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ message: 'Payments are not configured on this server' });
    }

    // Verify the payment signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (!signaturesMatch(expectedSignature, razorpaySignature)) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // The course comes from the order this user created, never from the request body,
    // and each order can only be redeemed once
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId, user: req.user._id, status: 'pending' },
      { razorpayPaymentId, razorpaySignature, status: 'successful' },
      { new: true }
    );

    if (!payment) {
      return res.status(400).json({ message: 'Unknown or already processed order' });
    }

    // Update user's enrolled courses
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { enrolledCourses: payment.course } });

    // Update course's enrolled students
    await Course.findByIdAndUpdate(payment.course, { $addToSet: { enrolledStudents: req.user._id } });

    res.status(200).json({
      success: true,
      payment,
      message: 'Payment verified successfully and course enrolled',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user payment history
// @route   GET /api/payments/history
// @access  Private
export const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id, status: 'successful' })
      .populate('course', 'title price thumbnail')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment details by ID
// @route   GET /api/payments/:id
// @access  Private
export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('course', 'title price thumbnail description')
      .populate('user', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Make sure user is owner of the payment or admin
    if (
      payment.user?._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(payment);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments (admin only)
// @route   GET /api/payments/admin
// @access  Private/Admin
export const getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({})
      .populate('course', 'title price')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    next(error);
  }
};
