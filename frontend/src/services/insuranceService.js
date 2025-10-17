import apiClient, { handleApiError } from './api';

class InsuranceService {
  // ============================================
  // INSURANCE PACKAGES
  // ============================================
  
  /**
   * Get all insurance packages
   * @param {number} skip - Pagination offset (default: 0)
   * @param {number} limit - Number of records (default: 100)
   * @param {boolean|null} isActive - Filter by active status
   * @returns {Promise} Insurance packages list
   */
  async getAllPackages(skip = 0, limit = 100, isActive = null) {
    try {
      const params = new URLSearchParams();
      params.append('skip', skip);
      params.append('limit', limit);
      if (isActive !== null) params.append('is_active', isActive);
      
      const response = await apiClient.get(`/insurance/packages?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch insurance packages'));
    }
  }

  /**
   * Get insurance package by ID
   * @param {string} packageId - Insurance package ID
   * @returns {Promise} Package details with active insurance count
   */
  async getPackageById(packageId) {
    try {
      const response = await apiClient.get(`/insurance/packages/${packageId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch insurance package'));
    }
  }

  /**
   * Create new insurance package (Admin only)
   * @param {Object} packageData - { package_name, annual_limit, copayment_percentage, description, is_active }
   * @returns {Promise} Created package
   */
  async createPackage(packageData) {
    try {
      const response = await apiClient.post('/insurance/packages', packageData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create insurance package'));
    }
  }

  /**
   * Update insurance package (Admin only)
   * @param {string} packageId - Package ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise} Updated package
   */
  async updatePackage(packageId, updateData) {
    try {
      const response = await apiClient.patch(`/insurance/packages/${packageId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update insurance package'));
    }
  }

  /**
   * Delete (deactivate) insurance package (Admin only)
   * @param {string} packageId - Package ID
   * @returns {Promise} Success response
   */
  async deletePackage(packageId) {
    try {
      const response = await apiClient.delete(`/insurance/packages/${packageId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete insurance package'));
    }
  }

  // ============================================
  // PATIENT INSURANCE
  // ============================================
  
  /**
   * Get all insurances for a specific patient
   * @param {string} patientId - Patient ID
   * @returns {Promise} Patient's insurance list
   */
  async getPatientInsurances(patientId) {
    try {
      const response = await apiClient.get(`/insurance/patient/${patientId}/insurances`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch patient insurances'));
    }
  }

  /**
   * Get all patient insurances with filters
   * @param {number} skip - Pagination offset
   * @param {number} limit - Number of records
   * @param {string|null} statusFilter - Filter by status (Active, Inactive, Expired, Pending)
   * @returns {Promise} All patient insurances
   */
  async getAllPatientInsurances(skip = 0, limit = 100, statusFilter = null) {
    try {
      const params = new URLSearchParams();
      params.append('skip', skip);
      params.append('limit', limit);
      if (statusFilter) params.append('status_filter', statusFilter);
      
      const response = await apiClient.get(`/insurance/patient-insurance?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch patient insurances'));
    }
  }

  /**
   * Get patient insurance by ID
   * @param {string} insuranceId - Insurance ID
   * @returns {Promise} Insurance details with patient and package info
   */
  async getPatientInsuranceById(insuranceId) {
    try {
      const response = await apiClient.get(`/insurance/patient-insurance/${insuranceId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch insurance details'));
    }
  }

  /**
   * Get all insurances for a specific package
   * @param {string} packageId - Package ID
   * @returns {Promise} Insurances using this package
   */
  async getInsurancesByPackage(packageId) {
    try {
      const response = await apiClient.get(`/insurance/package/${packageId}/insurances`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch package insurances'));
    }
  }

  /**
   * Add insurance to a patient
   * @param {Object} insuranceData - { patient_id, insurance_package_id, start_date, end_date, status }
   * @returns {Promise} Created insurance
   */
  async addPatientInsurance(insuranceData) {
    try {
      const response = await apiClient.post('/insurance/patient-insurance', insuranceData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to add patient insurance'));
    }
  }

  /**
   * Update patient insurance
   * @param {string} insuranceId - Insurance ID
   * @param {Object} updateData - { status, end_date }
   * @returns {Promise} Updated insurance
   */
  async updatePatientInsurance(insuranceId, updateData) {
    try {
      const response = await apiClient.patch(`/insurance/patient-insurance/${insuranceId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update insurance'));
    }
  }

  /**
   * Delete (deactivate) patient insurance
   * @param {string} insuranceId - Insurance ID
   * @returns {Promise} Success response
   */
  async deletePatientInsurance(insuranceId) {
    try {
      const response = await apiClient.delete(`/insurance/patient-insurance/${insuranceId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete insurance'));
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get insurance statistics summary
   * @returns {Promise} Statistics including package counts, status breakdown, expiring soon
   */
  async getInsuranceStatistics() {
    try {
      const response = await apiClient.get('/insurance/statistics/summary');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch insurance statistics'));
    }
  }
}

export default new InsuranceService();
