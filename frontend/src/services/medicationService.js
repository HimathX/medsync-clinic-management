// Medication Service - Handles medication-related API calls
import api from './api';

/**
 * Medication Service
 * Manages medication data for prescriptions
 */
class MedicationService {
  /**
   * Get all medications with pagination
   * @param {number} skip - Number of records to skip
   * @param {number} limit - Maximum records to return
   * @returns {Promise} List of medications
   */
  async getAllMedications(skip = 0, limit = 100) {
    const response = await api.get(`/medications/?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  /**
   * Search medications by name or manufacturer
   * @param {string} query - Search term
   * @param {string} form - Optional filter by form (Tablet, Capsule, etc.)
   * @returns {Promise} Filtered medications
   */
  async searchMedications(query, form = null) {
    const params = new URLSearchParams({ query });
    if (form) params.append('form', form);
    const response = await api.get(`/medications/search/advanced?${params.toString()}`);
    return response.data;
  }

  /**
   * Get medication by ID
   * @param {string} medicationId - Medication UUID
   * @returns {Promise} Medication details
   */
  async getMedicationById(medicationId) {
    const response = await api.get(`/medications/${medicationId}`);
    return response.data;
  }

  /**
   * Get medications by form type
   * @param {string} form - Medication form (Tablet, Capsule, Injection, Syrup, Other)
   * @returns {Promise} List of medications
   */
  async getMedicationsByForm(form) {
    const response = await api.get(`/medications/by-form/${form}`);
    return response.data;
  }

  /**
   * Create a new medication
   * @param {Object} medicationData - Medication information
   * @returns {Promise} Created medication
   */
  async createMedication(medicationData) {
    const response = await api.post('/medications/bulk', { medications: [medicationData] });
    return response.data;
  }

  /**
   * Update medication information
   * @param {string} medicationId - Medication UUID
   * @param {Object} updateData - Updated fields
   * @returns {Promise} Update response
   */
  async updateMedication(medicationId, updateData) {
    const response = await api.put(`/medications/${medicationId}`, updateData);
    return response.data;
  }

  /**
   * Delete medication
   * @param {string} medicationId - Medication UUID
   * @returns {Promise} Delete response
   */
  async deleteMedication(medicationId) {
    const response = await api.delete(`/medications/${medicationId}`);
    return response.data;
  }
}

// Export singleton instance
const medicationService = new MedicationService();
export default medicationService;
