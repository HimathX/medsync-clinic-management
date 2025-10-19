import apiClient, { handleApiError } from './api';

class TreatmentService {
  // ============================================
  // TREATMENT CATALOGUE ENDPOINTS
  // ============================================
  
  /**
   * Get all treatment services with filters
   * @param {number} skip - Pagination offset (default: 0)
   * @param {number} limit - Number of records (default: 100)
   * @param {string|null} search - Search by treatment name
   * @param {number|null} minPrice - Minimum price filter
   * @param {number|null} maxPrice - Maximum price filter
   * @returns {Promise} Treatment catalogue list
   */
  async getAllTreatmentServices(skip = 0, limit = 100, search = null, minPrice = null, maxPrice = null) {
    try {
      const params = new URLSearchParams();
      params.append('skip', skip);
      params.append('limit', limit);
      if (search) params.append('search', search);
      if (minPrice !== null) params.append('min_price', minPrice);
      if (maxPrice !== null) params.append('max_price', maxPrice);
      
      const response = await apiClient.get(`/treatment-catalogue/?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatment services'));
    }
  }

  /**
   * Get treatment service by code
   * @param {string} serviceCode - Treatment service code (UUID)
   * @returns {Promise} Treatment details with usage stats
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
   * Create new treatment service
   * @param {Object} serviceData - { treatment_name, base_price, duration, description }
   * @returns {Promise} Created treatment service
   */
  async createTreatmentService(serviceData) {
    try {
      const response = await apiClient.post('/treatment-catalogue/', serviceData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create treatment service'));
    }
  }

  /**
   * Create multiple treatment services at once
   * @param {Array} treatments - Array of treatment objects
   * @returns {Promise} Bulk creation results
   */
  async createTreatmentServicesBulk(treatments) {
    try {
      const response = await apiClient.post('/treatment-catalogue/bulk', { treatments });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to bulk create treatment services'));
    }
  }

  /**
   * Update treatment service
   * @param {string} serviceCode - Treatment service code (UUID)
   * @param {Object} updateData - Fields to update
   * @returns {Promise} Updated treatment service
   */
  async updateTreatmentService(serviceCode, updateData) {
    try {
      const response = await apiClient.patch(`/treatment-catalogue/${serviceCode}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update treatment service'));
    }
  }

  /**
   * Delete treatment service
   * @param {string} serviceCode - Treatment service code (UUID)
   * @param {boolean} force - Force delete even with dependencies (default: false)
   * @returns {Promise} Success response
   */
  async deleteTreatmentService(serviceCode, force = false) {
    try {
      const params = force ? '?force=true' : '';
      const response = await apiClient.delete(`/treatment-catalogue/${serviceCode}${params}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete treatment service'));
    }
  }

  /**
   * Get treatment usage statistics
   * @param {number} limit - Number of top treatments to return (default: 10)
   * @returns {Promise} Most performed treatments
   */
  async getTreatmentCatalogueStatistics(limit = 10) {
    try {
      const response = await apiClient.get(`/treatment-catalogue/statistics/usage?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatment statistics'));
    }
  }

  /**
   * Get treatments by price range
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   * @returns {Promise} Treatments within price range
   */
  async getTreatmentsByPriceRange(minPrice, maxPrice) {
    try {
      const response = await apiClient.get(`/treatment-catalogue/price-range/${minPrice}/${maxPrice}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatments by price range'));
    }
  }

  // ============================================
  // TREATMENT RECORDS ENDPOINTS
  // ============================================
  
  /**
   * Add treatment to consultation record
   * @param {Object} treatmentData - { consultation_rec_id, treatment_service_code, notes }
   * @returns {Promise} Created treatment record
   */
  async addTreatment(treatmentData) {
    try {
      const response = await apiClient.post('/treatment-records/', treatmentData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to add treatment'));
    }
  }

  /**
   * Add multiple treatments to consultation record
   * @param {string} consultationRecId - Consultation record ID
   * @param {Array} treatments - Array of treatment objects [{ treatment_service_code, notes }]
   * @returns {Promise} Bulk add results
   */
  async addTreatmentsBulk(consultationRecId, treatments) {
    try {
      const response = await apiClient.post('/treatment-records/bulk', {
        consultation_rec_id: consultationRecId,
        treatments
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to bulk add treatments'));
    }
  }

  /**
   * Get all treatment records
   * @param {number} skip - Pagination offset (default: 0)
   * @param {number} limit - Number of records (default: 100)
   * @returns {Promise} Treatment records list
   */
  async getAllTreatments(skip = 0, limit = 100) {
    try {
      const response = await apiClient.get(`/treatment-records/?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatments'));
    }
  }

  /**
   * Get treatment record by ID
   * @param {string} treatmentId - Treatment ID (UUID)
   * @returns {Promise} Treatment details
   */
  async getTreatmentById(treatmentId) {
    try {
      const response = await apiClient.get(`/treatment-records/${treatmentId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatment'));
    }
  }

  /**
   * Get all treatments for a consultation record
   * @param {string} consultationRecId - Consultation record ID (UUID)
   * @returns {Promise} Treatments for consultation
   */
  async getTreatmentsByConsultation(consultationRecId) {
    try {
      const response = await apiClient.get(`/treatment-records/consultation/${consultationRecId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatments for consultation'));
    }
  }

  /**
   * Update treatment record notes
   * @param {string} treatmentId - Treatment ID (UUID)
   * @param {string} notes - Updated notes
   * @returns {Promise} Updated treatment
   */
  async updateTreatment(treatmentId, notes) {
    try {
      const response = await apiClient.patch(`/treatment-records/${treatmentId}`, { notes });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update treatment'));
    }
  }

  /**
   * Delete treatment record
   * @param {string} treatmentId - Treatment ID (UUID)
   * @returns {Promise} Success response
   */
  async deleteTreatment(treatmentId) {
    try {
      const response = await apiClient.delete(`/treatment-records/${treatmentId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete treatment'));
    }
  }

  /**
   * Get treatment statistics by service
   * @param {number} limit - Number of top treatments to return (default: 10)
   * @returns {Promise} Most frequently used treatments
   */
  async getTreatmentStatistics(limit = 10) {
    try {
      const response = await apiClient.get(`/treatment-records/statistics/by-service?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatment statistics'));
    }
  }
}

export default new TreatmentService();
