import apiClient, { handleApiError } from './api';

class InsuranceService {
  // ============ INSURANCE PACKAGES ============
  
  /**
   * Get all insurance packages
   */
  async getAllPackages() {
    try {
      const response = await apiClient.get('/insurance/packages');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch insurance packages'));
    }
  }

  /**
   * Get insurance package by ID
   * @param {string} packageId - Insurance package ID
   */
  async getPackageById(packageId) {
    try {
      const response = await apiClient.get(`/insurance/packages/${packageId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch insurance package'));
    }
  }

  // ============ PATIENT INSURANCE ============
  
  /**
   * Get patient insurance
   * @param {string} patientId - Patient ID
   */
  async getPatientInsurance(patientId) {
    try {
      const response = await apiClient.get(`/insurance/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch patient insurance'));
    }
  }

  /**
   * Enroll patient in insurance
   * @param {Object} enrollmentData - { patient_id, insurance_package_id, start_date, end_date }
   */
  async enrollPatient(enrollmentData) {
    try {
      const response = await apiClient.post('/insurance/enroll', enrollmentData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to enroll patient'));
    }
  }

  // ============ CLAIMS ============
  
  /**
   * Submit insurance claim
   * @param {Object} claimData - Claim submission data
   */
  async submitClaim(claimData) {
    try {
      const response = await apiClient.post('/claims/', claimData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to submit claim'));
    }
  }

  /**
   * Get all claims
   * @param {string|null} patientId - Optional patient ID filter
   */
  async getAllClaims(patientId = null) {
    try {
      const url = patientId ? `/claims/patient/${patientId}` : '/claims/';
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch claims'));
    }
  }

  /**
   * Get claim by ID
   * @param {string} claimId - Claim ID
   */
  async getClaimById(claimId) {
    try {
      const response = await apiClient.get(`/claims/${claimId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch claim'));
    }
  }

  /**
   * Update claim status
   * @param {string} claimId - Claim ID
   * @param {string} status - New status (Approved, Rejected, Pending)
   */
  async updateClaimStatus(claimId, status) {
    try {
      const response = await apiClient.put(`/claims/${claimId}/status`, { status });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update claim status'));
    }
  }
}

export default new InsuranceService();
