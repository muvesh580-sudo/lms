import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/paymentModel.js';
import User from '../models/userModel.js';
import Course from '../models/courseModel.js';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create a new payment order
// @route   POST /api/payments/create-order
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { courseId } = req.body;

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
    const user = await User.findById(req.user._id);
    if (user.enrolledCourses.includes(courseId)) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Create Razorpay order
    const options = {
      amount: course.price * 100, // amount in smallest currency unit (paise for INR)
      currency: 'INR',
      receipt: `receipt_order_${new Date().getTime()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
      course: {
        id: course._id,
        title: course.title,
        price: course.price
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, courseId } = req.body;

    // Verify the payment signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // Check if the signature matches
    const isAuthentic = expectedSignature === razorpaySignature;

    if (!isAuthentic) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Create payment record
    const payment = await Payment.create({
      user: req.user._id,
      course: courseId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      amount: course.price,
      status: 'successful',
    });

    // Update user's enrolled courses
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { enrolledCourses: courseId } },
      { new: true }
    );

    // Update course's enrolled students
    await Course.findByIdAndUpdate(
      courseId,
      { $addToSet: { enrolledStudents: req.user._id } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      payment,
      message: 'Payment verified successfully and course enrolled',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user payment history
// @route   GET /api/payments/history
// @access  Private
export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('course', 'title price thumbnail')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get payment details by ID
// @route   GET /api/payments/:id
// @access  Private
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('course', 'title price thumbnail description')
      .populate('user', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Make sure user is owner of the payment or admin
    if (
      payment.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all payments (admin only)
// @route   GET /api/payments/admin
// @access  Private/Admin
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate('course', 'title price')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};