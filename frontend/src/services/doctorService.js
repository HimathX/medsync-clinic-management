import apiClient, { handleApiError } from './api';

class DoctorService {
  /**
   * Get all doctors
   */
  async getAllDoctors() {
    try {
      const response = await apiClient.get('/doctors/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch doctors'));
    }
  }

  /**
   * Get doctor by ID
   * @param {string} doctorId - Doctor ID
   */
  async getDoctorById(doctorId) {
    try {
      const response = await apiClient.get(`/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch doctor'));
    }
  }

  /**
   * Get doctors by branch
   * @param {string} branchId - Branch ID
   */
  async getDoctorsByBranch(branchId) {
    try {
      const response = await apiClient.get(`/doctors/branch/${branchId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch doctors'));
    }
  }

  /**
   * Get doctor specializations
   * @param {string} doctorId - Doctor ID
   */
  async getDoctorSpecializations(doctorId) {
    try {
      const response = await apiClient.get(`/doctors/${doctorId}/specializations`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch specializations'));
    }
  }

  /**
   * Get available time slots for doctor
   * @param {string} doctorId - Doctor ID
   * @param {boolean} availableOnly - Only return available (unbooked) slots
   */
  async getDoctorTimeSlots(doctorId, availableOnly = true) {
    try {
      const response = await apiClient.get(`/doctors/${doctorId}/time-slots?available_only=${availableOnly}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch time slots'));
    }
  }

  /**
   * Get all available specializations
   * @param {boolean} activeOnly - Only return specializations with active doctors
   * @returns {Promise} List of all specializations
   */
  async getAllSpecializations(activeOnly = true) {
    try {
      const response = await apiClient.get(`/doctors/specializations/all?active_only=${activeOnly}&limit=1000`);
      return response.data.specializations || [];
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch specializations'));
    }
  }

  /**
   * Get specialization details including doctors
   * @param {string} specializationId - Specialization ID
   * @returns {Promise} Specialization details with doctors
   */
  async getSpecializationDetails(specializationId) {
    try {
      const response = await apiClient.get(`/doctors/specializations/${specializationId}/details`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch specialization details'));
    }
  }

  /**
   * Get doctors by specialization
   * @param {string} specializationId - Specialization ID
   * @returns {Promise} List of doctors with this specialization
   */
  async getDoctorsBySpecialization(specializationId) {
    try {
      const response = await apiClient.get(`/doctors/specialization/${specializationId}`);
      return response.data.doctors || [];
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch doctors by specialization'));
    }
  }

  /**
   * Search specializations by keyword
   * @param {string} searchTerm - Search keyword
   * @returns {Promise} Matching specializations
   */
  async searchSpecializations(searchTerm) {
    try {
      const response = await apiClient.get(`/doctors/specializations/search/${searchTerm}`);
      return response.data.specializations || [];
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to search specializations'));
    }
  }
}

export default new DoctorService();
