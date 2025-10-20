const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const conditionService = {
  // Get all condition categories
  getCategories: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/conditions/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get conditions by category
  getConditionsByCategory: async (categoryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/conditions/categories/${categoryId}/conditions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch conditions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching conditions:', error);
      throw error;
    }
  },

  // Get patient conditions
  getPatientConditions: async (patientId, activeOnly = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/conditions/conditions/${patientId}?active_only=${activeOnly}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch patient conditions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching patient conditions:', error);
      throw error;
    }
  },

  // Add condition to patient
  addCondition: async (conditionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/conditions/conditions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(conditionData)
      });
      if (!response.ok) throw new Error('Failed to add condition');
      return await response.json();
    } catch (error) {
      console.error('Error adding condition:', error);
      throw error;
    }
  },

  // Update patient condition
  updateCondition: async (patientId, conditionId, updateData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/conditions/conditions/${patientId}/${conditionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      if (!response.ok) throw new Error('Failed to update condition');
      return await response.json();
    } catch (error) {
      console.error('Error updating condition:', error);
      throw error;
    }
  }
};

export default conditionService;
