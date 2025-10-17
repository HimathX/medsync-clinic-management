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
      if (filters.date) params.append('date_filter', filters.date);
      
      const response = await apiClient.get(`/appointments/?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch appointments'));
    }
  }

  /**
   * Alias for getAllAppointments - for backward compatibility
   * @param {Object} filters - Filter parameters
   */
  async getAppointments(filters = {}) {
    return this.getAllAppointments(filters);
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
      const response = await apiClient.patch(`/appointments/${appointmentId}`, updateData);
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

  /**
   * Get all appointments for a specific patient
   * @param {string} patientId - Patient ID
   * @param {boolean} includePast - Include past appointments (default: false)
   */
  async getPatientAppointments(patientId, includePast = false) {
    try {
      const response = await apiClient.get(`/appointments/patient/${patientId}?include_past=${includePast}`);
      return response.data.appointments || [];
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch patient appointments'));
    }
  }

  /**
   * Get all appointments for a specific doctor
   * @param {string} doctorId - Doctor ID
   * @param {boolean} includePast - Include past appointments (default: false)
   */
  async getDoctorAppointments(doctorId, includePast = false) {
    try {
      const response = await apiClient.get(`/appointments/doctor/${doctorId}?include_past=${includePast}`);
      return response.data.appointments || [];
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch doctor appointments'));
    }
  }

  /**
   * Get all appointments for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   */
  async getAppointmentsByDate(date) {
    try {
      const response = await apiClient.get(`/appointments/date/${date}`);
      return response.data.appointments || [];
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch appointments for date'));
    }
  }

  /**
   * Get available time slots for a doctor
   * @param {string} doctorId - Doctor ID
   * @param {string} dateFrom - Start date (YYYY-MM-DD) - optional
   * @param {string} dateTo - End date (YYYY-MM-DD) - optional
   */
  async getAvailableSlots(doctorId, dateFrom = null, dateTo = null) {
    try {
      let url = `/appointments/available-slots/${doctorId}`;
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await apiClient.get(url);
      return response.data.time_slots || [];
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch available time slots'));
    }
  }

  /**
   * Get available time slots for a specific branch
   * @param {string} branchId - Branch ID
   * @param {string} dateFilter - Date in YYYY-MM-DD format - optional
   * @returns {Promise} Available time slots with doctor information
   */
  async getAvailableSlotsByBranch(branchId, dateFilter = null) {
    try {
      let url = `/appointments/available-slots/branch/${branchId}`;
      if (dateFilter) {
        url += `?date_filter=${dateFilter}`;
      }
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch available time slots for branch'));
    }
  }
}

export default new AppointmentService();
