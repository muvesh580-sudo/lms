import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import { Course } from '../../services/courseService';
import { errorMessage } from '../../services/config';
import CourseCard from '../courses/CourseCard';
import LoadingSpinner from '../ui/LoadingSpinner';

const MyCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    authService
      .getUserProfile()
      .then((profile) => {
        if (!cancelled) setCourses(profile.enrolledCourses || []);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Failed to load your courses.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">My Courses</h1>

      {error ? (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
          <p className="mb-4 text-gray-600">You are not enrolled in any courses yet.</p>
          <Link
            to="/courses"
            className="inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
