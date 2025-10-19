const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class TimeSlotService {
  // Get all time slots with filters
  async getAllTimeSlots(skip = 0, limit = 100, isBooked = null, dateFilter = null) {
    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString()
      });

      if (isBooked !== null) {
        params.append('is_booked', isBooked.toString());
      }

      if (dateFilter) {
        params.append('date_filter', dateFilter);
      }

      const response = await fetch(`${API_BASE_URL}/timeslots/?${params}`, {
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
      console.error('Error fetching time slots:', error);
      throw error;
    }
  }

  // Get time slot by ID
  async getTimeSlotById(timeSlotId) {
    try {
      const response = await fetch(`${API_BASE_URL}/timeslots/${timeSlotId}`, {
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
      console.error('Error fetching time slot:', error);
      throw error;
    }
  }

  // Get doctor's time slots
  async getDoctorTimeSlots(doctorId, availableOnly = true) {
    try {
      const params = new URLSearchParams({
        available_only: availableOnly.toString()
      });

      const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/time-slots?${params}`, {
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
      console.error('Error fetching doctor time slots:', error);
      throw error;
    }
  }

  // Get available time slots for a doctor
  async getAvailableTimeSlots(doctorId, dateFrom = null, dateTo = null) {
    try {
      const params = new URLSearchParams();
      
      if (dateFrom) {
        params.append('date_from', dateFrom);
      }
      
      if (dateTo) {
        params.append('date_to', dateTo);
      }

      const response = await fetch(`${API_BASE_URL}/appointments/available-slots/${doctorId}?${params}`, {
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
      console.error('Error fetching available time slots:', error);
      throw error;
    }
  }

  // Create a single time slot
  async createTimeSlot(timeSlotData) {
    try {
      const response = await fetch(`${API_BASE_URL}/timeslots/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(timeSlotData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating time slot:', error);
      throw error;
    }
  }

  // Create multiple time slots (bulk)
  async createBulkTimeSlots(bulkData) {
    try {
      const response = await fetch(`${API_BASE_URL}/timeslots/create-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bulkData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating bulk time slots:', error);
      throw error;
    }
  }

  // Create multiple time slots for a date range
  async createMultipleTimeSlots(multipleData) {
    try {
      const response = await fetch(`${API_BASE_URL}/timeslots/create-multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(multipleData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating multiple time slots:', error);
      throw error;
    }
  }

  // Update time slot
  async updateTimeSlot(timeSlotId, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/timeslots/${timeSlotId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating time slot:', error);
      throw error;
    }
  }

  // Delete time slot
  async deleteTimeSlot(timeSlotId) {
    try {
      const response = await fetch(`${API_BASE_URL}/timeslots/${timeSlotId}`, {
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
      console.error('Error deleting time slot:', error);
      throw error;
    }
  }

  // Get time slots by branch
  async getTimeSlotsByBranch(branchId, dateFilter = null) {
    try {
      const params = new URLSearchParams();
      
      if (dateFilter) {
        params.append('date_filter', dateFilter);
      }

      const response = await fetch(`${API_BASE_URL}/appointments/available-slots/branch/${branchId}?${params}`, {
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
      console.error('Error fetching time slots by branch:', error);
      throw error;
    }
  }
}

export default new TimeSlotService();
