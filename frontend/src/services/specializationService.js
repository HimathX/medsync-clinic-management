const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class SpecializationService {
  // Get all specializations
  async getAllSpecializations(skip = 0, limit = 100, activeOnly = false) {
    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
        active_only: activeOnly.toString()
      });

      const response = await fetch(`${API_BASE_URL}/doctors/specializations/all?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching specializations:', error);
      throw error;
    }
  }

  // Get specialization details by ID
  async getSpecializationDetails(specializationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/specializations/${specializationId}/details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching specialization details:', error);
      throw error;
    }
  }

  // Search specializations
  async searchSpecializations(searchTerm) {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/specializations/search/${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching specializations:', error);
      throw error;
    }
  }

  // Get doctor's specializations
  async getDoctorSpecializations(doctorId) {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/specializations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching doctor specializations:', error);
      throw error;
    }
  }

  // Add specialization to doctor
  async addDoctorSpecialization(doctorId, specializationId, certificationDate) {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/specializations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          specialization_id: specializationId,
          certification_date: certificationDate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding doctor specialization:', error);
      throw error;
    }
  }

  // Remove specialization from doctor
  async removeDoctorSpecialization(doctorId, specializationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/specializations/${specializationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing doctor specialization:', error);
      throw error;
    }
  }

  // Get doctors by specialization
  async getDoctorsBySpecialization(specializationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/specialization/${specializationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching doctors by specialization:', error);
      throw error;
    }
  }
}

export default new SpecializationService();
