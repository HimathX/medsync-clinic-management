import apiClient, { handleApiError } from './api';

class TimeslotService {
  /**
   * Create multiple time slots in bulk
   * @param {Object} bulkData - { doctor_id, branch_id, time_slots: [{available_date, start_time, end_time}] }
   * @returns {Promise} Created time slots
   */
  async createBulkTimeSlots(bulkData) {
    try {
      const response = await apiClient.post('/timeslots/create-bulk', bulkData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create time slots'));
    }
  }

  /**
   * Get all time slots with filters
   * @param {number} skip - Pagination offset (default: 0)
   * @param {number} limit - Number of records (default: 100)
   * @param {string|null} doctorId - Filter by doctor ID
   * @param {string|null} branchId - Filter by branch ID
   * @param {string|null} dateFilter - Filter by specific date (YYYY-MM-DD)
   * @param {boolean|null} availableOnly - Show only available slots
   * @returns {Promise} Time slots list
   */
  async getAllTimeSlots(skip = 0, limit = 100, doctorId = null, branchId = null, dateFilter = null, availableOnly = null) {
    try {
      const params = new URLSearchParams();
      params.append('skip', skip);
      params.append('limit', limit);
      if (doctorId) params.append('doctor_id', doctorId);
      if (branchId) params.append('branch_id', branchId);
      if (dateFilter) params.append('date_filter', dateFilter);
      if (availableOnly !== null) params.append('available_only', availableOnly);
      
      const response = await apiClient.get(`/timeslots/?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch time slots'));
    }
  }

  /**
   * Get time slot by ID
   * @param {string} timeSlotId - Time slot ID (UUID)
   * @returns {Promise} Time slot details
   */
  async getTimeSlotById(timeSlotId) {
    try {
      const response = await apiClient.get(`/timeslots/${timeSlotId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch time slot'));
    }
  }

  /**
   * Get all time slots for a specific doctor
   * @param {string} doctorId - Doctor ID (UUID)
   * @param {boolean} includePast - Include past time slots (default: false)
   * @param {boolean} availableOnly - Show only available slots (default: false)
   * @returns {Promise} Doctor's time slots
   */
  async getTimeSlotsByDoctor(doctorId, includePast = false, availableOnly = false) {
    try {
      const params = new URLSearchParams();
      params.append('include_past', includePast);
      params.append('available_only', availableOnly);
      
      const response = await apiClient.get(`/timeslots/doctor/${doctorId}?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch doctor time slots'));
    }
  }

  /**
   * Get all time slots for a specific branch
   * @param {string} branchId - Branch ID (UUID)
   * @param {boolean} includePast - Include past time slots (default: false)
   * @param {boolean} availableOnly - Show only available slots (default: false)
   * @returns {Promise} Branch time slots
   */
  async getTimeSlotsByBranch(branchId, includePast = false, availableOnly = false) {
    try {
      const params = new URLSearchParams();
      params.append('include_past', includePast);
      params.append('available_only', availableOnly);
      
      const response = await apiClient.get(`/timeslots/branch/${branchId}?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch branch time slots'));
    }
  }

  /**
   * Get available time slots for a doctor
   * @param {string} doctorId - Doctor ID (UUID)
   * @param {string|null} dateFrom - Start date (YYYY-MM-DD)
   * @param {string|null} dateTo - End date (YYYY-MM-DD)
   * @returns {Promise} Available time slots
   */
  async getAvailableSlotsByDoctor(doctorId, dateFrom = null, dateTo = null) {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      
      const url = `/timeslots/available/doctor/${doctorId}?${params.toString()}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch available time slots'));
    }
  }

  /**
   * Delete a time slot (only if not booked)
   * @param {string} timeSlotId - Time slot ID (UUID)
   * @returns {Promise} Success response
   */
  async deleteTimeSlot(timeSlotId) {
    try {
      const response = await apiClient.delete(`/timeslots/${timeSlotId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete time slot'));
    }
  }
}

export default new TimeslotService();
