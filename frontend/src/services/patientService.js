import apiClient, { handleApiError } from './api';

class PatientService {
  /**
   * Get all patients with pagination
   * @param {number} skip - Number of records to skip
   * @param {number} limit - Maximum number of records to return
   */
  async getAllPatients(skip = 0, limit = 100) {
    try {
      const response = await apiClient.get(`/patients/?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch patients'));
    }
  }

  /**
   * Get patient by ID
   * @param {string} patientId - Patient ID
   */
  async getPatientById(patientId) {
    try {
      const response = await apiClient.get(`/patients/${patientId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch patient details'));
    }
  }

  /**
   * Register new patient
   * @param {Object} patientData - Patient registration data
   */
  async registerPatient(patientData) {
    try {
      const response = await apiClient.post('/patients/register', patientData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to register patient'));
    }
  }

  /**
   * Search patient by NIC
   * @param {string} nic - National Identity Card number
   */
  async searchByNIC(nic) {
    try {
      const response = await apiClient.get(`/patients/search/by-nic/${nic}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Patient not found'));
    }
  }

  /**
   * Get patient appointments
   * @param {string} patientId - Patient ID
   */
  async getPatientAppointments(patientId) {
    try {
      const response = await apiClient.get(`/patients/${patientId}/appointments`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch appointments'));
    }
  }

  /**
   * Get patient allergies
   * @param {string} patientId - Patient ID
   */
  async getPatientAllergies(patientId) {
    try {
      const response = await apiClient.get(`/patients/${patientId}/allergies`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch allergies'));
    }
  }
}

export default new PatientService();
