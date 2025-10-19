import axios from 'axios';

// Read API URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          localStorage.removeItem('authToken');
          console.error('Unauthorized - Please login');
          break;
        case 404:
          console.error('Not found:', data.detail || data.message);
          break;
        case 500:
          console.error('Server error:', data.detail || data.message);
          break;
        default:
          console.error('API Error:', data.detail || data.message);
      }
    } else if (error.request) {
      console.error('No response from server. Please check your connection.');
    } else {
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error, defaultMsg = 'An error occurred') => {
  return error.response?.data?.detail || error.response?.data?.message || defaultMsg;
};

export default api;
