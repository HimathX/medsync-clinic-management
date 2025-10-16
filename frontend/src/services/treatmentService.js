import apiClient, { handleApiError } from './api';

class TreatmentService {
  // ============ TREATMENT CATALOGUE ============
  
  /**
   * Get all treatment services
   */
  async getAllTreatmentServices() {
    try {
      const response = await apiClient.get('/treatment-catalogue/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatment services'));
    }
  }

  /**
   * Get treatment service by code
   * @param {string} serviceCode - Treatment service code
   */
  async getTreatmentServiceByCode(serviceCode) {
    try {
      const response = await apiClient.get(`/treatment-catalogue/${serviceCode}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatment service'));
    }
  }

  /**
   * Add new treatment service
   * @param {Object} serviceData - { treatment_name, base_price, duration }
   */
  async addTreatmentService(serviceData) {
    try {
      const response = await apiClient.post('/treatment-catalogue/', serviceData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to add treatment service'));
    }
  }

  // ============ TREATMENT RECORDS ============
  
  /**
   * Create treatment record
   * @param {Object} treatmentData - { consultation_rec_id, treatment_service_code }
   */
  async createTreatmentRecord(treatmentData) {
    try {
      const response = await apiClient.post('/treatment-records/', treatmentData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create treatment record'));
    }
  }

  /**
   * Get treatment records by consultation
   * @param {string} consultationId - Consultation record ID
   */
  async getTreatmentsByConsultation(consultationId) {
    try {
      const response = await apiClient.get(`/treatment-records/consultation/${consultationId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatment records'));
    }
  }

  /**
   * Get treatment record by ID
   * @param {string} treatmentId - Treatment ID
   */
  async getTreatmentById(treatmentId) {
    try {
      const response = await apiClient.get(`/treatment-records/${treatmentId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatment'));
    }
  }
}

export default new TreatmentService();
