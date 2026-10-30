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
              Build new skills at your own pace with online courses for every level. Watch a free preview before you enroll.
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
                <h3 className="text-xl font-semibold text-gray-900">Courses for Every Level</h3>
                <p className="mt-2 text-gray-500">
                  Find courses from beginner to advanced across web development, data science, design and more.
                </p>
              </div>

              <div className="rounded-lg bg-white p-8 shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-indigo-600 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Try Before You Enroll</h3>
                <p className="mt-2 text-gray-500">
                  Watch free preview lectures to see if a course is right for you before you join.
                </p>
              </div>

              <div className="rounded-lg bg-white p-8 shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-indigo-600 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Learn at Your Own Pace</h3>
                <p className="mt-2 text-gray-500">
                  Start, pause and come back to your lectures whenever it suits you. All your courses stay in one place.
                </p>
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
            <span className="block text-indigo-200">Find your first course today.</span>
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