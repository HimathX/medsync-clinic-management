const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class AppointmentService {
  // Get all appointments with filters
  async getAllAppointments(skip = 0, limit = 100, statusFilter = null, dateFilter = null) {
    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString()
      });

      if (statusFilter) {
        params.append('status_filter', statusFilter);
      }

      if (dateFilter) {
        params.append('date_filter', dateFilter);
      }

      const response = await fetch(`${API_BASE_URL}/appointments/?${params}`, {
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
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  // Get appointment by ID
  async getAppointmentById(appointmentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
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
      console.error('Error fetching appointment:', error);
      throw error;
    }
  }

  // Get appointments by patient
  async getAppointmentsByPatient(patientId, includePast = false) {
    try {
      const params = new URLSearchParams({
        include_past: includePast.toString()
      });

      const response = await fetch(`${API_BASE_URL}/appointments/patient/${patientId}?${params}`, {
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
      console.error('Error fetching patient appointments:', error);
      throw error;
    }
  }

  // Get appointments by doctor
  async getAppointmentsByDoctor(doctorId, includePast = false) {
    try {
      const params = new URLSearchParams({
        include_past: includePast.toString()
      });

      const response = await fetch(`${API_BASE_URL}/appointments/doctor/${doctorId}?${params}`, {
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
      console.error('Error fetching doctor appointments:', error);
      throw error;
    }
  }

  // Get appointments by date
  async getAppointmentsByDate(appointmentDate) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/date/${appointmentDate}`, {
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
      console.error('Error fetching appointments by date:', error);
      throw error;
    }
  }

  // Book appointment
  async bookAppointment(bookingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error booking appointment:', error);
      throw error;
    }
  }

  // Update appointment
  async updateAppointment(appointmentId, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
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
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  // Cancel appointment
  async cancelAppointment(appointmentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
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
      console.error('Error cancelling appointment:', error);
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

  // Get available time slots by branch
  async getAvailableTimeSlotsByBranch(branchId, dateFilter = null) {
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
      console.error('Error fetching available time slots by branch:', error);
      throw error;
    }
  }

  // Get doctor's upcoming appointments (next 7 days)
  async getUpcomingAppointments(doctorId) {
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      return await this.getAppointmentsByDoctor(doctorId, false);
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw error;
    }
  }

  // Get doctor's today's appointments
  async getTodaysAppointments(doctorId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      return await this.getAppointmentsByDate(today);
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
      throw error;
    }
  }

  // Get appointment statistics for doctor
  async getDoctorAppointmentStats(doctorId) {
    try {
      const appointments = await this.getAppointmentsByDoctor(doctorId, true);
      const stats = {
        total: appointments.appointments.length,
        scheduled: appointments.appointments.filter(apt => apt.status === 'Scheduled').length,
        completed: appointments.appointments.filter(apt => apt.status === 'Completed').length,
        cancelled: appointments.appointments.filter(apt => apt.status === 'Cancelled').length,
        noShow: appointments.appointments.filter(apt => apt.status === 'No-Show').length
      };
      
      return stats;
    } catch (error) {
      console.error('Error fetching appointment statistics:', error);
      throw error;
    }
  }
}

export default new AppointmentService();