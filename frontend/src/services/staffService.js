// Staff Service - Handles staff-related API calls
import api from './api';

/**
 * Staff Service
 * Manages staff members, roles, and operations
 */
class StaffService {
  /**
   * Get all staff members
   * @returns {Promise} List of all staff
   */
  async getAllStaff() {
    const response = await api.get('/staff/all');
    return response.data;
  }

  /**
   * Get staff by ID
   * @param {number} staffId - Staff ID
   * @returns {Promise} Staff details
   */
  async getStaffById(staffId) {
    const response = await api.get(`/staff/${staffId}`);
    return response.data;
  }

  /**
   * Get staff by branch
   * @param {number} branchId - Branch ID
   * @returns {Promise} List of staff at branch
   */
  async getStaffByBranch(branchId) {
    const response = await api.get(`/staff/branch/${branchId}`);
    return response.data;
  }

  /**
   * Create new staff member
   * @param {Object} staffData - Staff information
   * @returns {Promise} Created staff member
   */
  async createStaff(staffData) {
    const response = await api.post('/staff/create', staffData);
    return response.data;
  }

  /**
   * Update staff member
   * @param {number} staffId - Staff ID
   * @param {Object} staffData - Updated staff data
   * @returns {Promise} Updated staff member
   */
  async updateStaff(staffId, staffData) {
    const response = await api.put(`/staff/update/${staffId}`, staffData);
    return response.data;
  }

  /**
   * Delete staff member
   * @param {number} staffId - Staff ID
   * @returns {Promise} Deletion confirmation
   */
  async deleteStaff(staffId) {
    const response = await api.delete(`/staff/delete/${staffId}`);
    return response.data;
  }
}

export default new StaffService();
