// Authentication Service - Handles user authentication
import api from './api';

/**
 * Authentication Service
 * Manages user login, logout, and session management
 */
class AuthService {
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} loginType - Type of login ('staff' or 'patient')
   * @returns {Promise} Login response with user details
   */
  async login(email, password, loginType = 'patient') {
    // Use different endpoints based on login type
    const endpoint = loginType === 'staff' ? '/staff/login' : '/auth/login';
    
    const response = await api.post(endpoint, {
      email,
      password
    });
    
    // Store user data in localStorage
    if (response.data.success) {
      localStorage.setItem('userId', response.data.user_id);
      localStorage.setItem('userType', response.data.user_type);
      localStorage.setItem('fullName', response.data.full_name);
      localStorage.setItem('isAuthenticated', 'true');
      
      // For patient portal compatibility
      if (response.data.user_type === 'patient') {
        localStorage.setItem('patientId', response.data.user_id);
      }
    }
    
    return response.data;
  }

  /**
   * Logout user
   * Clears all session data
   */
  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    localStorage.removeItem('fullName');
    localStorage.removeItem('patientId');
    localStorage.removeItem('isAuthenticated');
    sessionStorage.clear();
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return localStorage.getItem('isAuthenticated') === 'true';
  }

  /**
   * Get current user data
   * @returns {Object} User data
   */
  getCurrentUser() {
    return {
      userId: localStorage.getItem('userId'),
      userType: localStorage.getItem('userType'),
      fullName: localStorage.getItem('fullName'),
      patientId: localStorage.getItem('patientId')
    };
  }

  /**
   * Get user type
   * @returns {string} User type (patient, doctor, staff, admin)
   */
  getUserType() {
    return localStorage.getItem('userType');
  }
}

export default new AuthService();
