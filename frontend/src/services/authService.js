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
    // Clear old format keys
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    localStorage.removeItem('fullName');
    localStorage.removeItem('patientId');
    localStorage.removeItem('isAuthenticated');
    
    // Clear new format keys (used by DoctorLogin, etc.)
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_type');
    localStorage.removeItem('full_name');
    localStorage.removeItem('patient_id');
    localStorage.removeItem('doctor_id');
    localStorage.removeItem('email');
    localStorage.removeItem('token');
    localStorage.removeItem('room_no');
    localStorage.removeItem('consultation_fee');
    localStorage.removeItem('branch_name');
    localStorage.removeItem('specializations');
    
    sessionStorage.clear();
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    const hasFlag = localStorage.getItem('isAuthenticated') === 'true';
    const hasUserId = !!(localStorage.getItem('userId') || localStorage.getItem('user_id'));
    const hasUserType = !!(localStorage.getItem('userType') || localStorage.getItem('user_type'));
    // User is authenticated if they have the flag OR both userId and userType
    return hasFlag || (hasUserId && hasUserType);
  }

  /**
   * Get current user data
   * @returns {Object} User data
   */
  getCurrentUser() {
    // Check both old and new localStorage key formats for compatibility
    const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
    const userType = localStorage.getItem('userType') || localStorage.getItem('user_type');
    const fullName = localStorage.getItem('fullName') || localStorage.getItem('full_name');
    const patientId = localStorage.getItem('patientId') || localStorage.getItem('patient_id');
    const doctorId = localStorage.getItem('doctor_id');
    const email = localStorage.getItem('email');
    
    // User is authenticated if we have both userId and userType
    const isAuthenticated = !!(userId && userType);
    
    return {
      userId,
      userType,
      fullName,
      full_name: fullName,
      patientId,
      patient_id: patientId,
      doctor_id: doctorId,
      email,
      isAuthenticated
    };
  }

  /**
   * Get user type
   * @returns {string} User type (patient, doctor, staff, admin)
   */
  getUserType() {
    return localStorage.getItem('userType') || localStorage.getItem('user_type');
  }
}

export default new AuthService();
