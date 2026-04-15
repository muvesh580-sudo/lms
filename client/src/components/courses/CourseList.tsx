import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import courseService, { CourseFilter } from '../../services/courseService';
import CourseCard from './CourseCard';
import LoadingSpinner from '../ui/LoadingSpinner';

const CourseList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [level, setLevel] = useState(searchParams.get('level') || '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);

  // Categories and levels for filters
  const categories = ['Web Development', 'Mobile Development', 'Data Science', 'Machine Learning', 'DevOps', 'Design', 'Business', 'Marketing'];
  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const filters: CourseFilter = {
          page: currentPage,
        };

        if (keyword) filters.keyword = keyword;
        if (category) filters.category = category;
        if (level) filters.level = level;

        const response = await courseService.getCourses(filters);
        setCourses(response.courses);
        setTotalPages(response.pages);
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch courses. Please try again later.');
        setLoading(false);
      }
    };

    fetchCourses();
  }, [keyword, category, level, currentPage]);

  useEffect(() => {
    // Update URL with filters
    const params: any = {};
    if (keyword) params.keyword = keyword;
    if (category) params.category = category;
    if (level) params.level = level;
    if (currentPage > 1) params.page = currentPage.toString();

    setSearchParams(params);
  }, [keyword, category, level, currentPage, setSearchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleClearFilters = () => {
    setKeyword('');
    setCategory('');
    setLevel('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">Browse Courses</h1>
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Search and Filters */}
          <div className="w-full space-y-4 rounded-lg bg-white p-4 shadow lg:w-1/4">
            <form onSubmit={handleSearch}>
              <div className="mb-4">
                <label htmlFor="keyword" className="mb-2 block text-sm font-medium text-gray-700">
                  Search
                </label>
                <input
                  type="text"
                  id="keyword"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  placeholder="Search courses..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="category" className="mb-2 block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="level" className="mb-2 block text-sm font-medium text-gray-700">
                  Level
                </label>
                <select
                  id="level"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <option value="">All Levels</option>
                  {levels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          {/* Course Grid */}
          <div className="w-full lg:w-3/4">
            {error ? (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded-md bg-yellow-50 p-4">
                <p className="text-sm text-yellow-700">
                  No courses found. Try adjusting your filters.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {courses.map((course) => (
                    <CourseCard key={course._id} course={course} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 ${
                          currentPage === 1
                            ? 'cursor-not-allowed'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => handlePageChange(i + 1)}
                          className={`relative inline-flex items-center border ${
                            currentPage === i + 1
                              ? 'border-primary-500 bg-primary-50 text-primary-600'
                              : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                          } px-4 py-2 text-sm font-medium`}
                        >
                          {i + 1}
                        </button>
                      ))}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 ${
                          currentPage === totalPages
                            ? 'cursor-not-allowed'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseList;