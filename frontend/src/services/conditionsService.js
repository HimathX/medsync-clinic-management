import apiClient, { handleApiError } from './api';

class ConditionsService {
  /**
   * Get all allergies for a patient
   * @param {string} patientId - Patient ID
   * @returns {Promise} Patient allergies
   */
  async getPatientAllergies(patientId) {
    try {
      const response = await apiClient.get(`/patient-conditions/allergies/${patientId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch patient allergies'));
    }
  }

  /**
   * Add a new allergy for a patient
   * @param {Object} allergyData - { patient_id, allergy_name, severity, reaction_description, diagnosed_date }
   * @returns {Promise} Created allergy
   */
  async addPatientAllergy(allergyData) {
    try {
      const response = await apiClient.post('/patient-conditions/allergies', allergyData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to add allergy'));
    }
  }

  /**
   * Delete a patient allergy
   * @param {string} allergyId - Allergy ID
   * @returns {Promise} Success response
   */
  async deletePatientAllergy(allergyId) {
    try {
      const response = await apiClient.delete(`/patient-conditions/allergies/${allergyId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete allergy'));
    }
  }

  /**
   * Get all conditions for a patient
   * @param {string} patientId - Patient ID
   * @param {boolean} activeOnly - Only return active conditions (default: false)
   * @returns {Promise} Patient conditions with category details
   */
  async getPatientConditions(patientId, activeOnly = false) {
    try {
      const response = await apiClient.get(
        `/patient-conditions/conditions/${patientId}?active_only=${activeOnly}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch patient conditions'));
    }
  }

  /**
   * Add a new condition for a patient
   * @param {Object} conditionData - { patient_id, condition_category_id, condition_name, diagnosed_date, is_chronic, current_status, notes }
   * @returns {Promise} Created condition
   */
  async addPatientCondition(conditionData) {
    try {
      const response = await apiClient.post('/patient-conditions/conditions', conditionData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to add condition'));
    }
  }

  /**
   * Update a patient condition
   * @param {string} patientId - Patient ID
   * @param {string} conditionId - Condition ID
   * @param {Object} updateData - { current_status, notes }
   * @returns {Promise} Updated condition
   */
  async updatePatientCondition(patientId, conditionId, updateData) {
    try {
      const params = new URLSearchParams();
      if (updateData.current_status) params.append('current_status', updateData.current_status);
      if (updateData.notes !== undefined) params.append('notes', updateData.notes);

      const response = await apiClient.patch(
        `/patient-conditions/conditions/${patientId}/${conditionId}?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update condition'));
    }
  }

  /**
   * Get all condition categories
   * @returns {Promise} List of condition categories
   */
  async getAllConditionCategories() {
    try {
      const response = await apiClient.get('/patient-conditions/categories');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch condition categories'));
    }
  }

  /**
   * Get all conditions in a specific category
   * @param {string} categoryId - Category ID
   * @returns {Promise} Conditions in the category
   */
  async getConditionsByCategory(categoryId) {
    try {
      const response = await apiClient.get(`/patient-conditions/categories/${categoryId}/conditions`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch conditions for category'));
    }
  }
}

export default new ConditionsService();
