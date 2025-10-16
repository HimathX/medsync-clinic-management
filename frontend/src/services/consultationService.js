import apiClient, { handleApiError } from './api';

class ConsultationService {
  /**
   * Create consultation record
   * @param {Object} consultationData - { appointment_id, symptoms, diagnoses }
   */
  async createConsultation(consultationData) {
    try {
      const response = await apiClient.post('/consultations/', consultationData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create consultation'));
    }
  }

  /**
   * Get consultation by ID
   * @param {string} consultationId - Consultation record ID
   */
  async getConsultationById(consultationId) {
    try {
      const response = await apiClient.get(`/consultations/${consultationId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch consultation'));
    }
  }

  /**
   * Get consultations by appointment
   * @param {string} appointmentId - Appointment ID
   */
  async getConsultationByAppointment(appointmentId) {
    try {
      const response = await apiClient.get(`/consultations/appointment/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch consultation'));
    }
  }

  /**
   * Update consultation
   * @param {string} consultationId - Consultation record ID
   * @param {Object} updateData - { symptoms, diagnoses }
   */
  async updateConsultation(consultationId, updateData) {
    try {
      const response = await apiClient.put(`/consultations/${consultationId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update consultation'));
    }
  }

  /**
   * Get full consultation details with treatments and prescriptions
   * @param {string} consultationId - Consultation record ID
   */
  async getConsultationDetails(consultationId) {
    try {
      const response = await apiClient.get(`/consultations/${consultationId}/details`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch consultation details'));
    }
  }
}

export default new ConsultationService();
