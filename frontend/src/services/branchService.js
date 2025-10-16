// Branch Service - Handles branch-related API calls
import api from './api';

/**
 * Branch Service
 * Manages branch information, status, and operations
 */
class BranchService {
  /**
   * Get all branches
   * @returns {Promise} List of all branches
   */
  async getAllBranches() {
    const response = await api.get('/branch/all');
    return response.data;
  }

  /**
   * Get branch by ID
   * @param {number} branchId - Branch ID
   * @returns {Promise} Branch details
   */
  async getBranchById(branchId) {
    const response = await api.get(`/branch/${branchId}`);
    return response.data;
  }

  /**
   * Get branch by name
   * @param {string} branchName - Branch name
   * @returns {Promise} Branch details
   */
  async getBranchByName(branchName) {
    const response = await api.get(`/branch/name/${branchName}`);
    return response.data;
  }

  /**
   * Create new branch
   * @param {Object} branchData - Branch information
   * @returns {Promise} Created branch
   */
  async createBranch(branchData) {
    const response = await api.post('/branch/create', branchData);
    return response.data;
  }

  /**
   * Update branch
   * @param {number} branchId - Branch ID
   * @param {Object} branchData - Updated branch data
   * @returns {Promise} Updated branch
   */
  async updateBranch(branchId, branchData) {
    const response = await api.put(`/branch/update/${branchId}`, branchData);
    return response.data;
  }

  /**
   * Delete branch
   * @param {number} branchId - Branch ID
   * @returns {Promise} Deletion confirmation
   */
  async deleteBranch(branchId) {
    const response = await api.delete(`/branch/delete/${branchId}`);
    return response.data;
  }
}

export default new BranchService();
