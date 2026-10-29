import api from './api';
import { Lecture } from './lectureService';

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
  enrolledCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Returned by GET /courses/:id
export interface CourseDetails extends Course {
  lectures: Lecture[];
  isEnrolled: boolean;
  canManage: boolean;
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
    // axios encodes params, so search text like "C++ & C#" is sent intact
    const response = await api.get('/courses', {
      params: { pageNumber: page, keyword: keyword || undefined, category: category || undefined, level: level || undefined },
    });
    return response.data;
  },

  // Get course by ID
  getCourseById: async (id: string): Promise<CourseDetails> => {
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

  // Enroll in a free course
  enrollFree: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/courses/${id}/enroll`);
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