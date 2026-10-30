import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../features/store';
import courseService, { Course } from '../../services/courseService';
import { dashboardPath } from '../../services/config';
import CourseCard from '../courses/CourseCard';
import LoadingSpinner from '../ui/LoadingSpinner';

const Home: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      try {
        setLoading(true);
        const response = await courseService.getCourses();
        setFeaturedCourses(response.courses);
        setLoading(false);
      } catch {
        setError('Failed to fetch featured courses');
        setLoading(false);
      }
    };

    fetchFeaturedCourses();
  }, []);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl lg:max-w-xl">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Learn Without Limits
            </h1>
            <p className="mt-6 text-xl text-indigo-100">
              Take the next step in your career with our online courses. Learn from industry experts and get certified in various domains.
            </p>
            <div className="mt-10 flex gap-4">
              <Link
                to="/courses"
                className="rounded-md bg-white px-8 py-3 text-base font-medium text-indigo-600 hover:bg-indigo-50 md:py-4 md:px-10 md:text-lg"
              >
                Explore Courses
              </Link>
              {/* Signed-in users go to their courses instead of being asked to sign up */}
              <Link
                to={user ? dashboardPath(user.role) : '/register'}
                className="rounded-md border border-transparent bg-indigo-500 px-8 py-3 text-base font-medium text-white hover:bg-indigo-400 md:py-4 md:px-10 md:text-lg"
              >
                {!user ? 'Sign Up Free' : user.role === 'student' ? 'My Courses' : 'Dashboard'}
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 hidden h-full w-1/2 lg:block" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80"
            alt="Students learning"
            className="h-full w-full object-cover opacity-50"
          />
        </div>
      </div>

      {/* Featured Courses Section */}
      <div className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Featured Courses</h2>
              <Link
                to="/courses"
                className="text-base font-semibold text-indigo-600 hover:text-indigo-500"
              >
                View all courses
                <span aria-hidden="true"> &rarr;</span>
              </Link>
            </div>

            {loading ? (
              <div className="mt-12 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="mt-12 rounded-md bg-red-50 p-4">
                <p className="text-red-700">{error}</p>
              </div>
            ) : featuredCourses.length === 0 ? (
              <div className="mt-12 rounded-md bg-yellow-50 p-4">
                <p className="text-yellow-700">No courses available at the moment.</p>
              </div>
            ) : (
              <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                {featuredCourses.map((course) => (
                  <CourseCard key={course._id} course={course} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Why Choose Our Platform
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-xl text-gray-500">
                We provide a complete learning experience with features designed to help you succeed.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-white p-8 shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-indigo-600 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Comprehensive Curriculum</h3>
                <p className="mt-2 text-gray-500">
                  Our courses are designed by industry experts and cover everything you need to know, from basics to advanced concepts.
                </p>
              </div>

              <div className="rounded-lg bg-white p-8 shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-indigo-600 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Expert Instructors</h3>
                <p className="mt-2 text-gray-500">
                  Learn from the best in the field. Our instructors are professionals with years of experience and a passion for teaching.
                </p>
              </div>

              <div className="rounded-lg bg-white p-8 shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-indigo-600 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Track Your Progress</h3>
                <p className="mt-2 text-gray-500">
                  Monitor your learning journey with detailed progress tracking, quizzes, and assessments to ensure you're on the right path.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              What Our Students Say
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="rounded-xl bg-white p-8 shadow-lg">
                <div className="mb-4 flex items-center">
                  <div className="flex-shrink-0">
                    <img
                      className="h-12 w-12 rounded-full"
                      src="https://randomuser.me/api/portraits/women/1.jpg"
                      alt="Student"
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Sarah Johnson</h3>
                    <p className="text-gray-500">Web Development Student</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "I've tried many online platforms, but this one stands out. The courses are well-structured and the instructors are highly knowledgeable. I landed a job as a front-end developer after completing just two courses!"
                </p>
                <div className="mt-4 flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-5 w-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-white p-8 shadow-lg">
                <div className="mb-4 flex items-center">
                  <div className="flex-shrink-0">
                    <img
                      className="h-12 w-12 rounded-full"
                      src="https://randomuser.me/api/portraits/men/2.jpg"
                      alt="Student"
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Michael Chen</h3>
                    <p className="text-gray-500">Data Science Student</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "The data science course here is exceptional. The practical projects helped me build a strong portfolio, and the career guidance was invaluable. Highly recommend for anyone looking to break into the field."
                </p>
                <div className="mt-4 flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-5 w-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-white p-8 shadow-lg">
                <div className="mb-4 flex items-center">
                  <div className="flex-shrink-0">
                    <img
                      className="h-12 w-12 rounded-full"
                      src="https://randomuser.me/api/portraits/women/3.jpg"
                      alt="Student"
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Emily Rodriguez</h3>
                    <p className="text-gray-500">UX Design Student</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "The UX/UI design course transformed my career. The lessons were easy to follow and the feedback from instructors helped me improve rapidly. I'm now working as a UI designer at a tech startup!"
                </p>
                <div className="mt-4 flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-700">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:flex lg:items-center lg:justify-between lg:px-8 lg:py-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to start learning?</span>
            <span className="block text-indigo-200">Join thousands of satisfied students today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/courses"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-white px-5 py-3 text-base font-medium text-indigo-600 hover:bg-indigo-50"
              >
                Get started
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                to="/about"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-5 py-3 text-base font-medium text-white hover:bg-indigo-700"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;