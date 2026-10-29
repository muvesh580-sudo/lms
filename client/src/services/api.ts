import axios from 'axios';
import { API_URL } from './config';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url || '';
    const isAuthRequest = url.includes('/users/login') || url.includes('/users/register');

    // Handle session expiry - but a failed login is not an expired session,
    // and redirecting there would wipe the "invalid password" message
    if (error.response?.status === 401 && !isAuthRequest && localStorage.getItem('token')) {
      // Clear session data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
