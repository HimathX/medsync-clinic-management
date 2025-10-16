import apiClient, { handleApiError } from './api';

class AppointmentService {
  /**
   * Book new appointment
   * @param {Object} appointmentData - { patient_id, time_slot_id, notes }
   */
  async bookAppointment(appointmentData) {
    try {
      const response = await apiClient.post('/appointments/book', appointmentData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to book appointment'));
    }
  }

  /**
   * Get all appointments with filters
   * @param {Object} filters - Filter parameters (status, doctor_id, patient_id, branch_id, dates)
   */
  async getAllAppointments(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.doctor_id) params.append('doctor_id', filters.doctor_id);
      if (filters.patient_id) params.append('patient_id', filters.patient_id);
      if (filters.branch_id) params.append('branch_id', filters.branch_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const response = await apiClient.get(`/appointments/?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch appointments'));
    }
  }

  /**
   * Get appointment by ID
   * @param {string} appointmentId - Appointment ID
   */
  async getAppointmentById(appointmentId) {
    try {
      const response = await apiClient.get(`/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch appointment'));
    }
  }

  /**
   * Update appointment status
   * @param {string} appointmentId - Appointment ID
   * @param {Object} updateData - { status, notes }
   */
  async updateAppointment(appointmentId, updateData) {
    try {
      const response = await apiClient.put(`/appointments/${appointmentId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update appointment'));
    }
  }

  /**
   * Cancel appointment
   * @param {string} appointmentId - Appointment ID
   */
  async cancelAppointment(appointmentId) {
    try {
      const response = await apiClient.delete(`/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to cancel appointment'));
    }
  }

  /**
   * Get appointment with full details (doctor, patient, timeslot)
   * @param {string} appointmentId - Appointment ID
   */
  async getAppointmentDetails(appointmentId) {
    try {
      const response = await apiClient.get(`/appointments/${appointmentId}/details`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch appointment details'));
    }
  }
}

export default new AppointmentService();
