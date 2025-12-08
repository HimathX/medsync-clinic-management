import apiClient, { handleApiError } from './api'


interface Doctor {
  doctor_id?: string
  full_name?: string
  name?: string
  qualifications?: string
  email?: string
  room_no?: string
  consultation_fee?: number
  medical_licence_no?: string
  branch_id?: string
  is_available?: boolean
  [key: string]: unknown
}

interface DoctorResponse {
  doctors?: Doctor[]
  doctor?: Doctor
  total?: number
  [key: string]: unknown
}

// ============================================
// SPECIALIZATION TYPES
// ============================================

interface Specialization {
  specialization_id: string
  specialization_title: string
  other_details?: string
  doctor_count?: number
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

interface SpecializationResponse {
  specializations?: Specialization[]
  success?: boolean
  count?: number
  total?: number
  [key: string]: unknown
}

interface SpecializationDetails {
  success: boolean
  specialization: Specialization
  doctors: Doctor[]
  statistics: {
    total_doctors: number
    available_doctors: number
    total_time_slots: number
    available_slots: number
  }
}

// ============================================
// TIME SLOT TYPES
// ============================================

interface TimeSlot {
  time_slot_id: string
  doctor_id: string
  available_date: string
  start_time: string | number
  end_time: string | number
  is_booked: boolean
  branch_id?: string
  branch_name?: string
  appointment_id?: string
  patient_id?: string
  patient_name?: string
  appointment_status?: string
  [key: string]: unknown
}

interface TimeSlotResponse {
  time_slots?: TimeSlot[]
  doctor_id?: string
  total?: number
  [key: string]: unknown
}

// ============================================
// DASHBOARD TYPES
// ============================================

interface DashboardStats {
  today_appointments: number
  pending_consultations: number
  completed_today: number
  patients_seen: number
  upcoming_appointments: number
  total_patients: number
}

interface PerformanceMetrics {
  doctor_id: string
  total_consultations: number
  completed_consultations: number
  cancelled_appointments: number
  no_shows: number
  unique_patients: number
  completion_rate: number
  no_show_rate: number
  consultation_fee: number
  total_revenue: number
  avg_revenue_per_consultation: number
  is_available: boolean
}

interface ConsultationAnalytics {
  success: boolean
  doctor_id: string
  analysis_period_days: number
  daily_analytics: Array<{
    consultation_date: string
    total_consultations: number
    completed: number
    no_shows: number
  }>
  peak_hours: Array<{
    hour: number
    total_consultations: number
    completed: number
  }>
  most_treated_conditions: Array<{
    condition_name: string
    category_name: string
    frequency: number
  }>
  patient_demographics: Array<{
    gender: string
    patient_count: number
    avg_age: number
  }>
}

interface DoctorSchedule {
  success: boolean
  doctor_id: string
  start_date: string
  end_date: string
  statistics: {
    total_slots: number
    booked_slots: number
    available_slots: number
    utilization_rate: number
  }
  schedule_by_date: Record<string, TimeSlot[]>
}

interface PerformanceReport {
  success: boolean
  total_doctors: number
  period: string
  sort_by: string
  summary: {
    average_consultations: number
    average_completion_rate: number
    average_no_show_rate: number
    average_revenue: number
  }
  top_performers: Array<{
    doctor_id: string
    doctor_name: string
    total_consultations: number
    completion_rate: number
    total_revenue: number
    [key: string]: unknown
  }>
  bottom_performers: Array<{
    doctor_id: string
    doctor_name: string
    total_consultations: number
    completion_rate: number
    total_revenue: number
    [key: string]: unknown
  }>
  all_doctors: Array<{
    doctor_id: string
    doctor_name: string
    total_consultations: number
    completion_rate: number
    total_revenue: number
    [key: string]: unknown
  }>
}

interface AvailabilityReport {
  success: boolean
  total_doctors: number
  branch_filter?: string
  availability_by_branch: Record<
    string,
    Array<{
      doctor_id: string
      doctor_name: string
      is_available: boolean
      specializations: string
      available_slots: number
      booked_slots: number
      total_slots: number
      utilization_rate: number
    }>
  >
}

/**
 * Doctor Service
 * Handles doctor profile, specializations, schedules, and analytics
 */
class DoctorService {
  // ============================================
  // CORE METHODS
  // ============================================

  /**
   * Get all doctors with pagination
   * @returns List of all doctors
   */
  async getAllDoctors(): Promise<DoctorResponse> {
    try {
      const response = await apiClient.get('/doctors/')
      console.log('✅ Fetched all doctors')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch doctors'))
    }
  }

  /**
   * Get doctor by ID with full details
   * @param doctorId - Doctor UUID
   * @returns Doctor details and specializations
   */
  async getDoctorById(doctorId: string): Promise<DoctorResponse> {
    try {
      const response = await apiClient.get(`/doctors/${doctorId}`)
      console.log('✅ Fetched doctor details')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch doctor'))
    }
  }

  /**
   * Get doctors by branch
   * @param branchId - Branch UUID
   * @returns Doctors working in the branch
   */
  async getDoctorsByBranch(branchId: string): Promise<DoctorResponse> {
    try {
      const response = await apiClient.get(`/doctors/branch/${branchId}`)
      console.log('✅ Fetched doctors by branch')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch doctors'))
    }
  }

  // ============================================
  // SPECIALIZATION METHODS
  // ============================================

  /**
   * Get all available specializations
   * @param activeOnly - Filter only active specializations
   * @returns List of specializations
   */
  async getAllSpecializations(activeOnly: boolean = true): Promise<Specialization[]> {
    try {
      const response = await apiClient.get<SpecializationResponse>(
        `/doctors/specializations/all?active_only=${activeOnly}&limit=1000`
      )
      console.log('✅ Fetched all specializations')
      return response.data.specializations || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch specializations'))
    }
  }

  /**
   * Get specialization details with doctors
   * @param specializationId - Specialization UUID
   * @returns Specialization with associated doctors
   */
  async getSpecializationDetails(specializationId: string): Promise<SpecializationDetails> {
    try {
      const response = await apiClient.get<SpecializationDetails>(
        `/doctors/specializations/${specializationId}/details`
      )
      console.log('✅ Fetched specialization details')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch specialization details'))
    }
  }

  /**
   * Get doctors by specialization
   * @param specializationId - Specialization UUID
   * @returns Doctors with this specialization
   */
  async getDoctorsBySpecialization(specializationId: string): Promise<Doctor[]> {
    try {
      const response = await apiClient.get<DoctorResponse>(
        `/doctors/specialization/${specializationId}`
      )
      console.log('✅ Fetched doctors by specialization')
      return response.data.doctors || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch doctors by specialization'))
    }
  }

  /**
   * Get doctor specializations
   * @param doctorId - Doctor UUID
   * @returns Doctor's specializations with certification dates
   */
  async getDoctorSpecializations(
    doctorId: string
  ): Promise<{ doctor_id: string; total: number; specializations: Specialization[] }> {
    try {
      const response = await apiClient.get(
        `/doctors/${doctorId}/specializations`
      )
      console.log('✅ Fetched doctor specializations')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch specializations'))
    }
  }

  /**
   * Search specializations by keyword
   * @param searchTerm - Search keyword
   * @returns Matching specializations
   */
  async searchSpecializations(searchTerm: string): Promise<Specialization[]> {
    try {
      const response = await apiClient.get<SpecializationResponse>(
        `/doctors/specializations/search/${searchTerm}`
      )
      console.log('✅ Searched specializations')
      return response.data.specializations || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to search specializations'))
    }
  }

  // ============================================
  // TIME SLOT METHODS
  // ============================================

  /**
   * Get available time slots for doctor
   * @param doctorId - Doctor UUID
   * @param availableOnly - Filter only available slots
   * @returns Doctor's time slots
   */
  async getDoctorTimeSlots(
    doctorId: string,
    availableOnly: boolean = true
  ): Promise<TimeSlotResponse> {
    try {
      const response = await apiClient.get<TimeSlotResponse>(
        `/doctors/${doctorId}/time-slots?available_only=${availableOnly}`
      )
      console.log('✅ Fetched time slots')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch time slots'))
    }
  }

  // ============================================
  // DASHBOARD METHODS
  // ============================================

  /**
   * Get doctor dashboard statistics
   * @param doctorId - Doctor UUID
   * @returns Dashboard metrics
   */
  async getDashboardStats(doctorId: string): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<DashboardStats>(
        `/doctors/${doctorId}/dashboard/stats`
      )
      console.log('✅ Fetched dashboard stats')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch dashboard stats'))
    }
  }

  /**
   * Get today's appointments for doctor
   * @param doctorId - Doctor UUID
   * @returns Today's appointment list
   */
  async getTodayAppointments(
    doctorId: string
  ): Promise<{ appointments: TimeSlot[] }> {
    try {
      const response = await apiClient.get(
        `/doctors/${doctorId}/dashboard/today-appointments`
      )
      console.log('✅ Fetched today appointments')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch today appointments'))
    }
  }

  /**
   * Get upcoming appointments for doctor
   * @param doctorId - Doctor UUID
   * @param days - Number of days to look ahead
   * @returns Upcoming appointment list
   */
  async getUpcomingAppointments(
    doctorId: string,
    days: number = 7
  ): Promise<{ appointments: TimeSlot[] }> {
    try {
      const response = await apiClient.get(
        `/doctors/${doctorId}/dashboard/upcoming?days=${days}`
      )
      console.log('✅ Fetched upcoming appointments')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch upcoming appointments'))
    }
  }

  // ============================================
  // ANALYTICS METHODS
  // ============================================

  /**
   * Get doctor performance metrics
   * @param doctorId - Doctor UUID
   * @returns Comprehensive performance data
   */
  async getPerformanceMetrics(doctorId: string): Promise<PerformanceMetrics> {
    try {
      const response = await apiClient.get<PerformanceMetrics>(
        `/doctors/${doctorId}/metrics`
      )
      console.log('✅ Fetched performance metrics')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch metrics'))
    }
  }

  /**
   * Get detailed consultation analytics
   * @param doctorId - Doctor UUID
   * @param days - Number of days to analyze
   * @returns Consultation analytics
   */
  async getConsultationAnalytics(
    doctorId: string,
    days: number = 30
  ): Promise<ConsultationAnalytics> {
    try {
      const response = await apiClient.get<ConsultationAnalytics>(
        `/doctors/${doctorId}/consultation-analytics?days=${days}`
      )
      console.log('✅ Fetched consultation analytics')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch analytics'))
    }
  }

  /**
   * Get system-wide performance report
   * @param period - Period to analyze (daily, weekly, monthly, yearly)
   * @param topCount - Number of top performers to return
   * @param sortBy - Sort criteria
   * @returns Performance report for all doctors
   */
  async getPerformanceReport(
    period: string = 'monthly',
    topCount: number = 10,
    sortBy: string = 'revenue'
  ): Promise<PerformanceReport> {
    try {
      const response = await apiClient.get<PerformanceReport>(
        `/doctors/performance-report?period=${period}&top_count=${topCount}&sort_by=${sortBy}`
      )
      console.log('✅ Fetched performance report')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch performance report'))
    }
  }

  /**
   * Get availability report across doctors
   * @param branchId - Optional branch UUID filter
   * @returns Availability status by branch
   */
  async getAvailabilityReport(branchId?: string): Promise<AvailabilityReport> {
    try {
      const url = branchId
        ? `/doctors/availability-report?branch_id=${branchId}`
        : `/doctors/availability-report`
      const response = await apiClient.get<AvailabilityReport>(url)
      console.log('✅ Fetched availability report')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch availability report'))
    }
  }

  // ============================================
  // SCHEDULE METHODS
  // ============================================

  /**
   * Get doctor's complete schedule
   * @param doctorId - Doctor UUID
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param includeBooked - Include booked slots
   * @returns Doctor's schedule overview
   */
  async getSchedule(
    doctorId: string,
    startDate?: string,
    endDate?: string,
    includeBooked: boolean = true
  ): Promise<DoctorSchedule> {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      params.append('include_booked', includeBooked.toString())

      const response = await apiClient.get<DoctorSchedule>(
        `/doctors/${doctorId}/schedule?${params.toString()}`
      )
      console.log('✅ Fetched schedule')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch schedule'))
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Format doctor name with specialty
   * Example: "Dr. John Smith - Cardiology, General Medicine"
   */
  formatDoctorName(doctor: Doctor, specializations?: Specialization[]): string {
    const specs = specializations?.map((s) => s.specialization_title).join(', ') || ''
    return specs ? `Dr. ${doctor.full_name || doctor.name} - ${specs}` : `Dr. ${doctor.full_name || doctor.name}`
  }

  /**
   * Get availability status with icon
   */
  getAvailabilityStatus(doctor: Doctor): { status: string; icon: string; color: string } {
    if (!doctor.is_available) {
      return { status: 'Unavailable', icon: '🔴', color: 'red' }
    }
    return { status: 'Available', icon: '🟢', color: 'green' }
  }

  /**
   * Format consultation fee for display
   */
  formatFee(fee?: number): string {
    if (!fee) return 'N/A'
    return `LKR ${fee.toLocaleString()}`
  }

  /**
   * Get performance rating based on metrics
   */
  getPerformanceRating(metrics: PerformanceMetrics): {
    rating: number
    label: string
    icon: string
  } {
    const score =
      metrics.completion_rate * 0.4 +
      (100 - metrics.no_show_rate) * 0.3 +
      Math.min((metrics.unique_patients / 500) * 100, 100) * 0.3

    if (score >= 90) return { rating: 5, label: 'Excellent', icon: '⭐⭐⭐⭐⭐' }
    if (score >= 80) return { rating: 4, label: 'Very Good', icon: '⭐⭐⭐⭐' }
    if (score >= 70) return { rating: 3, label: 'Good', icon: '⭐⭐⭐' }
    if (score >= 60) return { rating: 2, label: 'Fair', icon: '⭐⭐' }
    return { rating: 1, label: 'Needs Improvement', icon: '⭐' }
  }

  /**
   * Compare two doctors by performance
   */
  compareDoctors(
    doctor1: PerformanceMetrics,
    doctor2: PerformanceMetrics
  ): {
    by_consultations: string
    by_completion_rate: string
    by_revenue: string
    overall: string
  } {
    return {
      by_consultations:
        doctor1.total_consultations > doctor2.total_consultations ? 'Doctor 1' : 'Doctor 2',
      by_completion_rate:
        doctor1.completion_rate > doctor2.completion_rate ? 'Doctor 1' : 'Doctor 2',
      by_revenue: doctor1.total_revenue > doctor2.total_revenue ? 'Doctor 1' : 'Doctor 2',
      overall:
        doctor1.total_revenue + doctor1.completion_rate >
        doctor2.total_revenue + doctor2.completion_rate
          ? 'Doctor 1'
          : 'Doctor 2',
    }
  }

  /**
   * Get busiest hours from analytics
   */
  getBusiestHours(analytics: ConsultationAnalytics): Array<{
    hour: number
    time: string
    consultations: number
  }> {
    return analytics.peak_hours.map((hour) => ({
      hour: hour.hour,
      time: `${String(hour.hour).padStart(2, '0')}:00`,
      consultations: hour.total_consultations,
    }))
  }

  /**
   * Get most treated conditions
   */
  getMostTreatedConditions(analytics: ConsultationAnalytics): string {
    return analytics.most_treated_conditions
      .slice(0, 5)
      .map((c) => `${c.condition_name} (${c.frequency})`)
      .join(', ')
  }

  /**
   * Calculate average patient age from demographics
   */
  getAveragePatientAge(analytics: ConsultationAnalytics): number {
    if (analytics.patient_demographics.length === 0) return 0
    const totalAge = analytics.patient_demographics.reduce((sum, d) => sum + d.avg_age, 0)
    return Math.round(totalAge / analytics.patient_demographics.length)
  }

  /**
   * Get gender distribution from analytics
   */
  getGenderDistribution(analytics: ConsultationAnalytics): Record<string, number> {
    const distribution: Record<string, number> = {}
    analytics.patient_demographics.forEach((demo) => {
      distribution[demo.gender] = demo.patient_count
    })
    return distribution
  }

  /**
   * Get schedule utilization percentage
   */
  getScheduleUtilization(schedule: DoctorSchedule): number {
    return schedule.statistics.utilization_rate
  }

  /**
   * Get available slots count
   */
  getAvailableSlots(schedule: DoctorSchedule): number {
    return schedule.statistics.available_slots
  }

  /**
   * Format appointment list for display
   */
  formatAppointmentsList(appointments: TimeSlot[]): string {
    return appointments
      .map((apt) => `${apt.patient_name} at ${apt.start_time}`)
      .join('\n')
  }

  /**
   * Check if doctor has high no-show rate
   */
  hasHighNoShowRate(metrics: PerformanceMetrics, threshold: number = 10): boolean {
    return metrics.no_show_rate > threshold
  }

  /**
   * Check if doctor is top performer
   */
  isTopPerformer(metrics: PerformanceMetrics, avgMetrics: PerformanceMetrics): boolean {
    return (
      metrics.completion_rate > avgMetrics.completion_rate &&
      metrics.total_revenue > avgMetrics.total_revenue
    )
  }

  /**
   * Get doctor status summary
   */
  getSummary(
    doctor: Doctor,
    metrics?: PerformanceMetrics,
    specializations?: Specialization[]
  ): string {
    const availability = doctor.is_available ? 'Available' : 'Unavailable'
    const fee = doctor.consultation_fee ? ` • Fee: LKR ${doctor.consultation_fee}` : ''
    const room = doctor.room_no ? ` • Room: ${doctor.room_no}` : ''
    const specs = specializations?.length ? ` • Specializations: ${specializations.length}` : ''
    const patients = metrics ? ` • Patients: ${metrics.unique_patients}` : ''

    return `${availability}${fee}${room}${specs}${patients}`
  }
}

export default new DoctorService()