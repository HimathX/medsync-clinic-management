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
   * @param {string} date - Date in YYYY-MM-DD format
   */
  async getDoctorTimeSlots(doctorId, date) {
    try {
      const response = await apiClient.get(`/timeslots/doctor/${doctorId}?date=${date}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch time slots'));
    }
  }
}

export default new DoctorService();
