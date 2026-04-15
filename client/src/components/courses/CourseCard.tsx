import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../../services/courseService';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const renderInstructorName = () => {
    if (typeof course.instructor === 'string') {
      return 'Instructor';
    }
    return course.instructor.name;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md transition-all duration-300 hover:shadow-xl">
      <div className="relative">
        <Link to={`/courses/${course._id}`}>
          <img
            src={`http://localhost:5000/uploads/thumbnails/${course.thumbnail}`}
            alt={course.title}
            className="h-48 w-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/640x360?text=Course+Image';
            }}
          />
        </Link>
        <div className="absolute right-2 top-2 rounded-full bg-primary-600 px-3 py-1 text-xs font-bold text-white">
          {course.level}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <Link to={`/courses/${course._id}`}>
          <h3 className="mb-2 text-xl font-semibold text-gray-800 hover:text-primary-600">
            {course.title}
          </h3>
        </Link>
        <p className="mb-4 flex-1 text-sm text-gray-600 line-clamp-3">{course.description}</p>
        <div className="mt-auto">
          <div className="mb-2 flex items-center text-sm text-gray-500">
            <svg
              className="mr-1 h-4 w-4 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path>
            </svg>
            {renderInstructorName()}
          </div>
          <div className="mb-2 flex items-center text-sm text-gray-500">
            <svg
              className="mr-1 h-4 w-4 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              ></path>
            </svg>
            {course.duration}
          </div>
          <div className="mb-4 flex items-center">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(course.avgRating || 0)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              ))}
              <span className="ml-1 text-sm text-gray-500">
                {course.avgRating ? course.avgRating.toFixed(1) : 'No ratings yet'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-primary-600">₹{course.price}</span>
            <Link
              to={`/courses/${course._id}`}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              View Course
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;