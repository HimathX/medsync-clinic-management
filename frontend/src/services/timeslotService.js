import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance for time slot operations
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const handleApiError = (error, defaultMessage) => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return error.message || defaultMessage;
};

const timeslotService = {
  /**
   * Get time slots for a specific doctor
   * @param {string} doctorId - Doctor ID
   * @param {boolean} availableOnly - Only return available (unbooked) slots
   * @param {boolean} upcomingOnly - Only return future slots
   */
  async getTimeSlotsByDoctor(doctorId, availableOnly = true, upcomingOnly = true) {
    try {
      const response = await apiClient.get(`/doctors/${doctorId}/time-slots`, {
        params: {
          available_only: availableOnly,
          upcoming_only: upcomingOnly
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch time slots'));
    }
  },

  /**
   * Create bulk time slots
   * @param {Object} bulkData - { doctor_id, branch_id, time_slots: [...] }
   */
  async createBulkTimeSlots(bulkData) {
    try {
      const response = await apiClient.post('/timeslots/create-bulk', bulkData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create time slots'));
    }
  },

  /**
   * Create a single time slot
   * @param {Object} slotData - { doctor_id, branch_id, available_date, start_time, end_time }
   */
  async createTimeSlot(slotData) {
    try {
      const response = await apiClient.post('/timeslots', slotData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create time slot'));
    }
  },

  /**
   * Delete a time slot
   * @param {string} slotId - Time slot ID
   */
  async deleteTimeSlot(slotId) {
    try {
      const response = await apiClient.delete(`/timeslots/${slotId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete time slot'));
    }
  },

  /**
   * Update a time slot
   * @param {string} slotId - Time slot ID
   * @param {Object} updateData - Updated slot data
   */
  async updateTimeSlot(slotId, updateData) {
    try {
      const response = await apiClient.patch(`/timeslots/${slotId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update time slot'));
    }
  },

  /**
   * Get available time slots for a specific date
   * @param {string} doctorId - Doctor ID
   * @param {string} date - Date in YYYY-MM-DD format
   */
  async getAvailableSlotsForDate(doctorId, date) {
    try {
      const response = await apiClient.get(`/doctors/${doctorId}/timeslots/available`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch available slots'));
    }
  },

  /**
   * Get all time slots (including booked) for a doctor
   * @param {string} doctorId - Doctor ID
   */
  async getAllTimeSlotsForDoctor(doctorId) {
    try {
      const response = await apiClient.get(`/doctors/${doctorId}/time-slots/all`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch all time slots'));
    }
  },

  /**
   * Mark time slot as booked
   * @param {string} slotId - Time slot ID
   */
  async markSlotAsBooked(slotId) {
    try {
      const response = await apiClient.patch(`/timeslots/${slotId}/book`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to mark slot as booked'));
    }
  },
};

export default timeslotService;
