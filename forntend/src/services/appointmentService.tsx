import apiClient, { handleApiError } from './api'

interface AppointmentData {
  patient_id: string
  time_slot_id: string
  notes?: string
}

interface AppointmentFilters {
  status?: string
  date_filter?: string
}

interface AppointmentResponse {
  success: boolean
  message?: string
  appointment_id?: string
  [key: string]: unknown
}

interface AppointmentDetails {
  appointments?: Array<Record<string, unknown>>
  time_slots?: Array<Record<string, unknown>>
  [key: string]: unknown
}

class AppointmentService {
  /**
   * Book new appointment
   * @param appointmentData - Patient ID, time slot ID, and optional notes
   * @returns Booking confirmation with appointment ID
   */
  async bookAppointment(appointmentData: AppointmentData): Promise<AppointmentResponse> {
    try {
      const response = await apiClient.post('/appointments/book', appointmentData)
      console.log('✅ Appointment booked successfully')
      return response.data
    } catch (error) {
      const errorMsg = handleApiError(error, 'Failed to book appointment')
      throw new Error(errorMsg)
    }
  }

  /**
   * Get all appointments with optional filters
   * @param filters - Status and/or date filters
   * @returns List of all appointments
   */
  async getAllAppointments(
    filters: AppointmentFilters = {},
    skip: number = 0,
    limit: number = 100
  ): Promise<AppointmentDetails> {
    try {
      const params = new URLSearchParams()

      // Add pagination
      params.append('skip', skip.toString())
      params.append('limit', limit.toString())

      // Add optional filters
      if (filters.status) params.append('status_filter', filters.status)
      if (filters.date_filter) params.append('date_filter', filters.date_filter)

      const response = await apiClient.get(`/appointments/?${params.toString()}`)
      console.log(`✅ Fetched ${response.data.returned} appointments`)
      return response.data
    } catch (error) {
      const errorMsg = handleApiError(error, 'Failed to fetch appointments')
      throw new Error(errorMsg)
    }
  }

  /**
   * Get appointment by ID with full details
   * @param appointmentId - The appointment ID
   * @returns Full appointment details including patient, doctor, and consultation info
   */
  async getAppointmentById(appointmentId: string): Promise<AppointmentDetails> {
    try {
      const response = await apiClient.get(`/appointments/${appointmentId}`)
      console.log('✅ Fetched appointment details')
      return response.data
    } catch (error) {
      const errorMsg = handleApiError(error, 'Failed to fetch appointment')
      throw new Error(errorMsg)
    }
  }

  /**
   * Update appointment status or notes
   * @param appointmentId - The appointment ID
   * @param updateData - Status and/or notes to update
   * @returns Updated appointment
   */
  async updateAppointment(
    appointmentId: string,
    updateData: Record<string, unknown>
  ): Promise<AppointmentResponse> {
    try {
      const response = await apiClient.patch(`/appointments/${appointmentId}`, updateData)
      console.log('✅ Appointment updated successfully')
      return response.data
    } catch (error) {
      const errorMsg = handleApiError(error, 'Failed to update appointment')
      throw new Error(errorMsg)
    }
  }

  /**
   * Cancel appointment and free up time slot
   * @param appointmentId - The appointment ID
   * @returns Success message
   */
  async cancelAppointment(appointmentId: string): Promise<AppointmentResponse> {
    try {
      const response = await apiClient.delete(`/appointments/${appointmentId}`)
      console.log('✅ Appointment cancelled successfully')
      return response.data
    } catch (error) {
      const errorMsg = handleApiError(error, 'Failed to cancel appointment')
      throw new Error(errorMsg)
    }
  }

  /**
   * Get all appointments for a specific patient
   * @param patientId - The patient ID
   * @param includePast - Include past appointments (default: false)
   * @returns Array of patient's appointments
   */
  async getPatientAppointments(
    patientId: string,
    includePast: boolean = false
  ): Promise<Array<Record<string, unknown>>> {
    try {
      const response = await apiClient.get(
        `/appointments/patient/${patientId}?include_past=${includePast}`
      )
      console.log(`✅ Fetched ${response.data.total} appointments for patient`)
      return response.data.appointments || []
    } catch (error) {
      const errorMsg = handleApiError(error, 'Failed to fetch patient appointments')
      throw new Error(errorMsg)
    }
  }

  /**
   * Get all appointments for a specific doctor
   * @param doctorId - The doctor ID
   * @param includePast - Include past appointments (default: false)
   * @returns Array of doctor's appointments
   */
  async getDoctorAppointments(
    doctorId: string,
    includePast: boolean = false
  ): Promise<Array<Record<string, unknown>>> {
    try {
      const response = await apiClient.get(
        `/appointments/doctor/${doctorId}?include_past=${includePast}`
      )
      console.log(`✅ Fetched ${response.data.total} appointments for doctor`)
      return response.data.appointments || []
    } catch (error) {
      const errorMsg = handleApiError(error, 'Failed to fetch doctor appointments')
      throw new Error(errorMsg)
    }
  }

  /**
   * Get all appointments for a specific date
   * @param date - The date in YYYY-MM-DD format
   * @returns Array of appointments on that date
   */
  async getAppointmentsByDate(date: string): Promise<Array<Record<string, unknown>>> {
    try {
      const response = await apiClient.get(`/appointments/date/${date}`)
      console.log(`✅ Fetched ${response.data.total} appointments for ${date}`)
      return response.data.appointments || []
    } catch (error) {
      const errorMsg = handleApiError(error, 'Failed to fetch appointments for date')
      throw new Error(errorMsg)
    }
  }

  /**
   * Get available time slots for a doctor
   * @param doctorId - The doctor ID
   * @param dateFrom - Start date (optional, YYYY-MM-DD format)
   * @param dateTo - End date (optional, YYYY-MM-DD format)
   * @returns Array of available time slots
   */
  async getAvailableSlots(
    doctorId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<Array<Record<string, unknown>>> {
    try {
      let url = `/appointments/available-slots/${doctorId}`
      const params = new URLSearchParams()

      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await apiClient.get(url)
      console.log(`✅ Found ${response.data.total_available} available slots`)
      return response.data.time_slots || []
    } catch (error) {
      const errorMsg = handleApiError(error, 'Failed to fetch available time slots')
      throw new Error(errorMsg)
    }
  }

  /**
   * Get available time slots for a specific branch
   * @param branchId - The branch ID
   * @param dateFilter - Optional date filter (YYYY-MM-DD format)
   * @returns Array of available time slots with doctor info
   */
  async getAvailableSlotsByBranch(
    branchId: string,
    dateFilter?: string
  ): Promise<AppointmentDetails> {
    try {
      let url = `/appointments/available-slots/branch/${branchId}`
      if (dateFilter) {
        url += `?date_filter=${dateFilter}`
      }

      const response = await apiClient.get(url)
      console.log(`✅ Found ${response.data.total_available} available slots for branch`)
      return response.data
    } catch (error) {
      const errorMsg = handleApiError(error, 'Failed to fetch available time slots for branch')
      throw new Error(errorMsg)
    }
  }

  /**
   * Format appointment for display
   * Example: "2025-12-15 10:00 AM - Dr. Smith"
   */
  formatAppointment(appointment: any): string {
    const date = new Date(appointment.available_date).toLocaleDateString()
    const time = appointment.start_time
    const doctor = appointment.doctor_name || 'Dr. Unknown'
    return `${date} ${time} - ${doctor}`
  }

  /**
   * Check if appointment is in the past
   */
  isAppointmentPast(appointment: any): boolean {
    const appointmentDate = new Date(`${appointment.available_date}T${appointment.start_time}`)
    return appointmentDate < new Date()
  }

  /**
   * Check if appointment is within 24 hours
   */
  isAppointmentSoon(appointment: any): boolean {
    const appointmentDate = new Date(`${appointment.available_date}T${appointment.start_time}`)
    const now = new Date()
    const hoursUntil = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursUntil > 0 && hoursUntil <= 24
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'Scheduled':
        return 'blue'
      case 'Completed':
        return 'green'
      case 'Cancelled':
        return 'red'
      case 'No-Show':
        return 'orange'
      default:
        return 'gray'
    }
  }
}

export default new AppointmentService()