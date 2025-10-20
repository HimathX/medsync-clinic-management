import api from './api';
import { LoginRequest, LoginResponse, User } from '../types';

export const authService = {
  // Login with email and password
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/login', credentials);
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  },

  // Get current user info
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },

  // Refresh token
  refreshToken: async (): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/refresh');
    return response.data;
  },

  // Store auth data in localStorage
  storeAuthData: (data: LoginResponse): void => {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify({
      user_id: data.user_id,
      email: data.email,
      full_name: data.full_name,
      user_type: data.user_type,
      role: data.role,
    }));
  },

  // Get stored user
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },
};
