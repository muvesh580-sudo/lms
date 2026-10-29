import api from './api';

// Types
export interface Lecture {
  _id: string;
  title: string;
  description: string;
  course: string;
  duration: number;
  order: number;
  resources: Resource[];
  isPreview: boolean;
  // Locked lectures (not enrolled, not a preview) have no playable URLs
  locked: boolean;
  videoStreamUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  _id: string;
  title: string;
  downloadUrl?: string;
  fileType: 'pdf' | 'doc' | 'ppt' | 'zip' | 'other';
}

export interface LectureFormData {
  title: string;
  description: string;
  course: string;
  duration: number;
  order: number;
  isPreview: boolean;
}

export interface ResourceFormData {
  title: string;
  fileType: 'pdf' | 'doc' | 'ppt' | 'zip' | 'other';
}

// Lecture services
const lectureService = {
  // Get all lectures for a course
  getCourseLectures: async (courseId: string): Promise<Lecture[]> => {
    const response = await api.get(`/lectures/course/${courseId}`);
    return response.data;
  },

  // Get lecture by ID
  getLectureById: async (id: string): Promise<Lecture> => {
    const response = await api.get(`/lectures/${id}`);
    return response.data;
  },

  // Create new lecture
  createLecture: async (lectureData: FormData): Promise<Lecture> => {
    const response = await api.post('/lectures', lectureData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update lecture
  updateLecture: async (id: string, lectureData: FormData): Promise<Lecture> => {
    const response = await api.put(`/lectures/${id}`, lectureData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete lecture
  deleteLecture: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/lectures/${id}`);
    return response.data;
  },

  // Add resource to lecture
  addResource: async (lectureId: string, resourceData: FormData): Promise<Lecture> => {
    const response = await api.post(`/lectures/${lectureId}/resources`, resourceData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete resource from lecture
  deleteResource: async (
    lectureId: string,
    resourceId: string
  ): Promise<Lecture> => {
    const response = await api.delete(`/lectures/${lectureId}/resources/${resourceId}`);
    return response.data;
  },
};

export default lectureService;