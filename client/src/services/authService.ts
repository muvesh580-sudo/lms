import api from './api';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface UserResponse {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  token: string;
}

// Authentication services
const authService = {
  // Register user
  register: async (userData: RegisterData): Promise<UserResponse> => {
    const response = await api.post('/users/register', userData);
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<UserResponse> => {
    const response = await api.post('/users/login', credentials);
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Logout user
  logout: (): void => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  // Get user profile
  getUserProfile: async (): Promise<any> => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData: any): Promise<any> => {
    const response = await api.put('/users/profile', userData);
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const user = localStorage.getItem('user');
    return !!user;
  },

  // Get current user
  getCurrentUser: (): UserResponse | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export default authService;