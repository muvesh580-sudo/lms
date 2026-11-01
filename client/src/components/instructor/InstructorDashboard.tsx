import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import courseService, { Course } from '../../services/courseService';
import { errorMessage, thumbnailUrl, PLACEHOLDER_IMAGE } from '../../services/config';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

const linkClasses =
  'inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50';

const InstructorDashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Id of the course a publish or delete is running for
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let cancelled = false;

    courseService
      .getInstructorCourses()
      .then((data) => {
        if (!cancelled) setCourses(data);
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

  const togglePublished = async (course: Course) => {
    setError('');
    setBusyId(course._id);
    try {
      const formData = new FormData();
      formData.append('published', String(!course.published));
      const updated = await courseService.updateCourse(course._id, formData);
      setCourses((list) =>
        list.map((c) => (c._id === course._id ? { ...c, published: updated.published } : c))
      );
    } catch (err) {
      setError(errorMessage(err, 'Failed to update the course.'));
    } finally {
      setBusyId('');
    }
  };

  const handleDelete = async (course: Course) => {
    if (!window.confirm(`Delete "${course.title}" and all of its lectures? This cannot be undone.`)) {
      return;
    }

    setError('');
    setBusyId(course._id);
    try {
      await courseService.deleteCourse(course._id);
      setCourses((list) => list.filter((c) => c._id !== course._id));
    } catch (err) {
      setError(errorMessage(err, 'Failed to delete the course.'));
    } finally {
      setBusyId('');
    }
  };

  if (loading) return <LoadingSpinner />;

  const stats = [
    { label: 'Courses', value: courses.length },
    { label: 'Published', value: courses.filter((c) => c.published).length },
    { label: 'Students', value: courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
        <Link
          to="/instructor/courses/create"
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Create course
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-600">You have not created any courses yet.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {courses.map((course) => (
            <li
              key={course._id}
              className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <img
                src={thumbnailUrl(course.thumbnail)}
                alt=""
                className="h-24 w-full rounded-md object-cover sm:w-40"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                }}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold text-gray-900">{course.title}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      course.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {course.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {course.price > 0 ? `₹${course.price}` : 'Free'} · {course.category} · {course.level} ·{' '}
                  {course.enrolledCount || 0} enrolled
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link to={`/instructor/courses/${course._id}/lectures`} className={linkClasses}>
                  Lectures
                </Link>
                <Link to={`/instructor/courses/${course._id}/edit`} className={linkClasses}>
                  Edit
                </Link>
                <Link to={`/courses/${course._id}`} className={linkClasses}>
                  View
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === course._id}
                  onClick={() => togglePublished(course)}
                >
                  {course.published ? 'Unpublish' : 'Publish'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={busyId === course._id}
                  onClick={() => handleDelete(course)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InstructorDashboard;
