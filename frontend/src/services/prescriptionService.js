import apiClient, { handleApiError } from './api';

class PrescriptionService {
  // ============================================
  // CREATE PRESCRIPTION
  // ============================================
  
  /**
   * Create prescription with multiple items
   * @param {Object} prescriptionData - { consultation_rec_id, items: [{ medication_id, dosage, frequency, duration_days, instructions }] }
   * @returns {Promise} Created prescription response
   */
  async createPrescription(prescriptionData) {
    try {
      const response = await apiClient.post('/prescriptions/', prescriptionData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create prescription'));
    }
  }

  // ============================================
  // GET PRESCRIPTIONS
  // ============================================
  
  /**
   * Get all prescriptions with optional filters
   * @param {number} skip - Pagination offset (default: 0)
   * @param {number} limit - Number of records (default: 100)
   * @param {string|null} patientId - Filter by patient
   * @param {string|null} doctorId - Filter by doctor
   * @param {string|null} medicationId - Filter by medication
   * @returns {Promise} Prescriptions list
   */
  async getAllPrescriptions(skip = 0, limit = 100, patientId = null, doctorId = null, medicationId = null) {
    try {
      const params = new URLSearchParams();
      params.append('skip', skip);
      params.append('limit', limit);
      if (patientId) params.append('patient_id', patientId);
      if (doctorId) params.append('doctor_id', doctorId);
      if (medicationId) params.append('medication_id', medicationId);
      
      const response = await apiClient.get(`/prescriptions/?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch prescriptions'));
    }
  }

  /**
   * Get prescription by consultation ID
   * @param {string} consultationRecId - Consultation record ID
   * @returns {Promise} Prescription items for consultation
   */
  async getPrescriptionByConsultation(consultationRecId) {
    try {
      const response = await apiClient.get(`/prescriptions/consultation/${consultationRecId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch prescription for consultation'));
    }
  }

  /**
   * Get prescription item by ID
   * @param {string} prescriptionItemId - Prescription item ID
   * @returns {Promise} Prescription item details
   */
  async getPrescriptionItem(prescriptionItemId) {
    try {
      const response = await apiClient.get(`/prescriptions/item/${prescriptionItemId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch prescription item'));
    }
  }

  /**
   * Get patient prescription history
   * @param {string} patientId - Patient ID
   * @returns {Promise} Complete prescription history grouped by consultation
   */
  async getPatientPrescriptionHistory(patientId) {
    try {
      const response = await apiClient.get(`/prescriptions/patient/${patientId}/history`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch patient prescription history'));
    }
  }

  // ============================================
  // UPDATE PRESCRIPTION
  // ============================================
  
  /**
   * Update prescription item
   * @param {string} prescriptionItemId - Prescription item ID
   * @param {Object} updateData - { dosage, frequency, duration_days, instructions }
   * @returns {Promise} Updated prescription item
   */
  async updatePrescriptionItem(prescriptionItemId, updateData) {
    try {
      const response = await apiClient.patch(`/prescriptions/item/${prescriptionItemId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update prescription item'));
    }
  }

  // ============================================
  // DELETE PRESCRIPTION
  // ============================================
  
  /**
   * Delete prescription item
   * @param {string} prescriptionItemId - Prescription item ID
   * @returns {Promise} Success response
   */
  async deletePrescriptionItem(prescriptionItemId) {
    try {
      const response = await apiClient.delete(`/prescriptions/item/${prescriptionItemId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete prescription item'));
    }
  }

  // ============================================
  // STATISTICS
  // ============================================
  
  /**
   * Get medication usage statistics
   * @param {string|null} startDate - Start date (YYYY-MM-DD)
   * @param {string|null} endDate - End date (YYYY-MM-DD)
   * @param {number} limit - Number of top medications (default: 10)
   * @returns {Promise} Most prescribed medications statistics
   */
  async getMedicationUsageStatistics(startDate = null, endDate = null, limit = 10) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('limit', limit);
      
      const response = await apiClient.get(`/prescriptions/statistics/medication-usage?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch medication usage statistics'));
    }
  }
}

export default new PrescriptionService();
