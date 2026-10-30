import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../features/store';
import courseService, { CourseDetails } from '../../services/courseService';
import paymentService from '../../services/paymentService';
import { errorMessage, thumbnailUrl, PLACEHOLDER_IMAGE } from '../../services/config';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

// Load Razorpay's checkout script on demand (it is not bundled)
const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// Lecture durations are stored in minutes
const formatMinutes = (minutes: number) =>
  minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`;

const CheckIcon = () => (
  <svg
    className="mr-2 h-5 w-5 text-green-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
);

const StarPath = () => (
  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
);

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  // The server reports whether the user is enrolled and which lectures are unlocked
  const fetchCourse = useCallback(async () => {
    if (!id) return;
    const courseData = await courseService.getCourseById(id);
    setCourse(courseData);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchCourse()
      .catch((err) => setError(errorMessage(err, 'Failed to fetch course data. Please try again.')))
      .finally(() => setLoading(false));
  }, [fetchCourse, user]);

  const enrolled = !!course?.isEnrolled;
  const lectures = course?.lectures || [];

  const handleEnrollment = async () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (!course) return;

    setActionError('');
    setPaymentLoading(true);

    try {
      if (course.price <= 0) {
        await courseService.enrollFree(course._id);
        await fetchCourse();
        setPaymentLoading(false);
        return;
      }

      const orderData = await paymentService.createOrder(course._id);

      if (!(await loadRazorpay()) || !window.Razorpay) {
        setActionError('Could not load the payment window. Check your connection and try again.');
        setPaymentLoading(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'LMS Platform',
        description: `Enrollment for ${course.title}`,
        order_id: orderData.id,
        handler: async (response: RazorpayResponse) => {
          try {
            const result = await paymentService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              courseId: course._id,
            });
            if (result.success) {
              await fetchCourse();
            }
          } catch (err) {
            setActionError(errorMessage(err, 'Payment verification failed. Please contact support.'));
          }
          setPaymentLoading(false);
        },
        modal: {
          // Closing the checkout without paying must re-enable the button
          ondismiss: () => setPaymentLoading(false),
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#6366F1',
        },
      });
      razorpay.open();
    } catch (err) {
      setActionError(errorMessage(err, 'Failed to process enrollment. Please try again later.'));
      setPaymentLoading(false);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    try {
      await courseService.addCourseRating(id!, { rating, review });
      setShowRatingModal(false);

      // Refresh course data to show updated rating
      await fetchCourse();
    } catch (err) {
      setActionError(errorMessage(err, 'Failed to submit rating. Please try again.'));
      setShowRatingModal(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-yellow-700">Course not found.</p>
        </div>
      </div>
    );
  }

  const renderInstructorName = () => {
    if (typeof course.instructor === 'string') {
      return 'Instructor';
    }
    return course.instructor.name;
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Course Details */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="mb-2 text-3xl font-bold text-gray-900">{course.title}</h1>
              <p className="text-lg text-gray-600">{course.description}</p>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <svg className="mr-1 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path>
                </svg>
                <span>Created by {renderInstructorName()}</span>
              </div>
              <div className="flex items-center">
                <svg className="mr-1 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center">
                <svg className="mr-1 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <span>Last updated {new Date(course.updatedAt).toLocaleDateString()}</span>
              </div>
              <span className="rounded-full bg-primary-100 px-2 py-1 text-primary-800">{course.level}</span>
              <div className="flex items-center" aria-label={`Rated ${course.avgRating?.toFixed(1) || 0} out of 5`}>
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-5 w-5 ${i < Math.floor(course.avgRating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <StarPath />
                  </svg>
                ))}
                <span className="ml-1 text-sm text-gray-500">
                  {course.avgRating ? course.avgRating.toFixed(1) : 'No ratings yet'}
                </span>
              </div>
            </div>

            {/* Everyone sees the outline; locked lectures cannot be opened */}
            <div className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Course Content</h2>
              <div className="rounded-lg border border-gray-200">
                {lectures.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {lectures.map((lecture) => (
                      <li
                        key={lecture._id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {lecture.title}
                            {lecture.isPreview && !enrolled && (
                              <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                Preview
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">{lecture.description}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500">{formatMinutes(lecture.duration)}</span>
                          {lecture.locked ? (
                            <span className="text-sm text-gray-400">Locked</span>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate(`/learn/lecture/${lecture._id}`)}
                            >
                              Watch
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-gray-500">No lectures available yet.</div>
                )}
              </div>
            </div>

            {enrolled && user?.role === 'student' && (
              <div className="mb-8">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">Rate This Course</h2>
                <Button onClick={() => setShowRatingModal(true)}>Add Rating & Review</Button>
              </div>
            )}
          </div>

          {/* Enrollment/Preview Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <div className="mb-4 overflow-hidden rounded-lg">
                <img
                  src={thumbnailUrl(course.thumbnail)}
                  alt={course.title}
                  className="h-48 w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = PLACEHOLDER_IMAGE;
                  }}
                />
              </div>
              <div className="mb-4 text-center text-3xl font-bold text-primary-600">
                {course.price > 0 ? `₹${course.price}` : 'Free'}
              </div>

              {actionError && (
                <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
                  {actionError}
                </div>
              )}

              {course.canManage ? (
                <Button variant="secondary" fullWidth disabled>
                  You manage this course
                </Button>
              ) : enrolled ? (
                <Button variant="success" fullWidth disabled>
                  Already Enrolled
                </Button>
              ) : (
                <Button variant="primary" fullWidth onClick={handleEnrollment} disabled={paymentLoading}>
                  {paymentLoading ? 'Processing...' : course.price > 0 ? 'Enroll Now' : 'Enroll for Free'}
                </Button>
              )}

              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">This course includes:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckIcon />
                    <span>Learn at your own pace</span>
                  </li>
                  <li className="flex items-center">
                    <CheckIcon />
                    <span>Access on any device</span>
                  </li>
                  <li className="flex items-center">
                    <CheckIcon />
                    <span>
                      {lectures.length} lecture{lectures.length === 1 ? '' : 's'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="rating-title">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <form onSubmit={handleRatingSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 id="rating-title" className="text-lg font-medium leading-6 text-gray-900">
                    Rate This Course
                  </h3>
                  <div className="mt-4">
                    <div className="mb-4">
                      <span className="mb-1 block text-sm font-medium text-gray-700">Rating</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            aria-label={`${value} star${value > 1 ? 's' : ''}`}
                            aria-pressed={value <= rating}
                            onClick={() => setRating(value)}
                          >
                            <svg
                              className={`h-8 w-8 ${value <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              aria-hidden="true"
                            >
                              <StarPath />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="review" className="mb-1 block text-sm font-medium text-gray-700">
                        Review
                      </label>
                      <textarea
                        id="review"
                        rows={4}
                        maxLength={2000}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        placeholder="Share your experience with this course..."
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="submit"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                    disabled={rating === 0}
                  >
                    Submit Rating
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowRatingModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseDetail;
