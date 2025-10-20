// Treatment Catalogue Service - Handles treatment catalogue API calls
import api from './api';

/**
 * Treatment Catalogue Service
 * Manages treatment services available for prescriptions
 */
class TreatmentCatalogueService {
  /**
   * Get all treatments with pagination
   * @param {number} skip - Number of records to skip
   * @param {number} limit - Maximum records to return
   * @returns {Promise} List of treatments
   */
  async getAllTreatments(skip = 0, limit = 500) {
    // Backend limit validation: must be between 1-500
    const validLimit = Math.min(Math.max(limit, 1), 500);
    const response = await api.get(`/treatment-catalogue/?skip=${skip}&limit=${validLimit}`);
    return response.data;
  }

  /**
   * Get treatment by service code
   * @param {string} serviceCode - Treatment service code UUID
   * @returns {Promise} Treatment details
   */
  async getTreatmentById(serviceCode) {
    const response = await api.get(`/treatment-catalogue/${serviceCode}`);
    return response.data;
  }

  /**
   * Get treatments by price range
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   * @returns {Promise} List of treatments
   */
  async getTreatmentsByPriceRange(minPrice, maxPrice) {
    const response = await api.get(`/treatment-catalogue/price-range/${minPrice}/${maxPrice}`);
    return response.data;
  }

  /**
   * Get treatment usage statistics
   * @param {number} limit - Number of top treatments to return
   * @returns {Promise} Treatment statistics
   */
  async getTreatmentStatistics(limit = 10) {
    const response = await api.get(`/treatment-catalogue/statistics/usage?limit=${limit}`);
    return response.data;
  }

  /**
   * Create new treatment
   * @param {Object} treatmentData - Treatment information
   * @returns {Promise} Created treatment
   */
  async createTreatment(treatmentData) {
    const response = await api.post('/treatment-catalogue/', treatmentData);
    return response.data;
  }

  /**
   * Update treatment information
   * @param {string} serviceCode - Treatment service code UUID
   * @param {Object} updateData - Updated fields
   * @returns {Promise} Update response
   */
  async updateTreatment(serviceCode, updateData) {
    const response = await api.put(`/treatment-catalogue/${serviceCode}`, updateData);
    return response.data;
  }

  /**
   * Delete treatment
   * @param {string} serviceCode - Treatment service code UUID
   * @returns {Promise} Delete response
   */
  async deleteTreatment(serviceCode) {
    const response = await api.delete(`/treatment-catalogue/${serviceCode}`);
    return response.data;
  }

  /**
   * Search treatments by service name
   * @param {string} query - Search term
   * @returns {Promise} Filtered treatments
   */
  async searchTreatments(query) {
    const response = await api.get(`/treatment-catalogue/?skip=0&limit=100`);
    const allTreatments = response.data.treatments || response.data;
    
    // Filter locally (if backend doesn't have search endpoint)
    if (!query) return allTreatments;
    
    const lowerQuery = query.toLowerCase();
    return allTreatments.filter(treatment => 
      treatment.service_name?.toLowerCase().includes(lowerQuery) ||
      treatment.description?.toLowerCase().includes(lowerQuery)
    );
  }
}

// Export singleton instance
const treatmentCatalogueService = new TreatmentCatalogueService();
export default treatmentCatalogueService;
