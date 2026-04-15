import api from './api';

// Types
export interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: string | { _id: string; name: string; email: string };
  price: number;
  thumbnail: string;
  category: string;
  level: string;
  duration: string;
  avgRating: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseFormData {
  title: string;
  description: string;
  price: number;
  category: string;
  level: string;
  duration: string;
  thumbnail?: File;
}

export interface CourseFilter {
  keyword?: string;
  category?: string;
  level?: string;
  page?: number;
}

export interface CourseRating {
  rating: number;
  review: string;
}

// Course services
const courseService = {
  // Get all published courses with pagination and filters
  getCourses: async (filters?: CourseFilter): Promise<{ courses: Course[]; pages: number; count: number }> => {
    const { keyword, category, level, page = 1 } = filters || {};
    let url = `/courses?pageNumber=${page}`;
    if (keyword) url += `&keyword=${keyword}`;
    if (category) url += `&category=${category}`;
    if (level) url += `&level=${level}`;

    const response = await api.get(url);
    return response.data;
  },

  // Get course by ID
  getCourseById: async (id: string): Promise<Course> => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  // Create new course (for instructors)
  createCourse: async (courseData: FormData): Promise<Course> => {
    const response = await api.post('/courses', courseData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update course (for instructors/admins)
  updateCourse: async (id: string, courseData: FormData): Promise<Course> => {
    const response = await api.put(`/courses/${id}`, courseData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete course (for instructors/admins)
  deleteCourse: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  // Get instructor courses
  getInstructorCourses: async (): Promise<Course[]> => {
    const response = await api.get('/courses/instructor/courses');
    return response.data;
  },

  // Add course rating (for enrolled students)
  addCourseRating: async (id: string, ratingData: CourseRating): Promise<{ message: string; course: Course }> => {
    const response = await api.post(`/courses/${id}/ratings`, ratingData);
    return response.data;
  },

  // Get all courses (admin only)
  getAdminCourses: async (): Promise<Course[]> => {
    const response = await api.get('/courses/admin/courses');
    return response.data;
  },
};

export default courseService;