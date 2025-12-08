import apiClient, { handleApiError } from './api'


interface PrescriptionItem {
  prescription_item_id: string
  consultation_rec_id: string
  medication_id: string
  generic_name: string
  manufacturer: string
  form: string
  dosage: string
  frequency: 'Once daily' | 'Twice daily' | 'Three times daily' | 'As needed'
  duration_days: number
  instructions?: string
  contraindications?: string
  side_effects?: string
  created_at?: string
}

interface PrescriptionItemInput {
  medication_id: string
  dosage: string
  frequency: 'Once daily' | 'Twice daily' | 'Three times daily' | 'As needed'
  duration_days: number
  instructions?: string
}

// ============================================
// TREATMENT TYPES
// ============================================

interface Treatment {
  treatment_id: string
  consultation_rec_id: string
  treatment_service_code: string
  treatment_name: string
  base_price: number
  duration?: string
  notes?: string
  description?: string
  created_at?: string
}

interface TreatmentInput {
  treatment_service_code: string
  notes?: string
}

// ============================================
// CONSULTATION TYPES
// ============================================

interface Consultation {
  consultation_rec_id: string
  appointment_id: string
  patient_id: string
  doctor_id: string
  symptoms: string
  diagnoses: string
  follow_up_required: boolean
  follow_up_date?: string
  appointment_status: string
  appointment_notes?: string
  available_date: string
  start_time: string
  end_time: string
  patient_name: string
  patient_email: string
  doctor_name: string
  doctor_email: string
  consultation_fee: number
  branch_name: string
  created_at?: string
  updated_at?: string
}

interface ConsultationSummary {
  consultation_rec_id: string
  appointment_id: string
  patient_id: string
  patient_name: string
  doctor_id: string
  doctor_name: string
  available_date: string
  symptoms: string
  diagnoses: string
  follow_up_required: boolean
  prescription_count: number
  treatment_count: number
  created_at?: string
}

interface CreateConsultationData {
  appointment_id: string
  symptoms: string
  diagnoses: string
  follow_up_required: boolean
  follow_up_date?: string
  prescription_items?: PrescriptionItemInput[]
  treatments?: TreatmentInput[]
}

interface UpdateConsultationData {
  symptoms?: string
  diagnoses?: string
  follow_up_required?: boolean
  follow_up_date?: string
}

interface ConsultationResponse {
  success: boolean
  message: string
  consultation_rec_id?: string
  items_added?: number
  treatments_added?: number
}

interface ConsultationDetailResponse {
  consultation: Consultation
  prescription_items: PrescriptionItem[]
  treatments: Treatment[]
  summary: {
    total_prescriptions: number
    total_treatments: number
  }
}

interface ConsultationsListResponse {
  total: number
  returned: number
  consultations: ConsultationSummary[]
}

interface PatientHistoryResponse {
  patient_id: string
  total_consultations: number
  consultations: ConsultationSummary[]
}

interface ConsultationStats {
  period: {
    start_date?: string
    end_date?: string
  }
  summary: {
    total_consultations: number
    follow_up_required: number
    follow_up_percentage: number
  }
  top_doctors: Array<{ doctor_name: string; consultation_count: number }>
  common_diagnoses: Array<{ diagnoses: string; frequency: number }>
}

/**
 * Consultation Service
 * Manages patient consultations, prescriptions, and treatments
 */
class ConsultationService {
  /**
   * Create comprehensive consultation with prescriptions and treatments
   * @param consultationData - Consultation, prescriptions, and treatments data
   * @returns Created consultation record with item counts
   */
  async createConsultation(
    consultationData: CreateConsultationData
  ): Promise<ConsultationResponse> {
    try {
      const response = await apiClient.post<ConsultationResponse>(
        '/consultations/',
        consultationData
      )
      console.log('✅ Consultation created successfully')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create consultation'))
    }
  }

  /**
   * Get consultation by ID with full details
   * @param consultationRecId - Consultation record ID
   * @returns Full consultation details including prescriptions and treatments
   */
  async getConsultationById(consultationRecId: string): Promise<ConsultationDetailResponse> {
    try {
      const response = await apiClient.get<ConsultationDetailResponse>(
        `/consultations/${consultationRecId}`
      )
      console.log('✅ Fetched consultation details')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch consultation'))
    }
  }

  /**
   * Get all consultations with optional filters
   * @param skip - Number of records to skip
   * @param limit - Maximum records to return
   * @param patientId - Filter by patient ID
   * @param doctorId - Filter by doctor ID
   * @param startDate - Filter from date (YYYY-MM-DD)
   * @param endDate - Filter to date (YYYY-MM-DD)
   * @param followUpRequired - Filter by follow-up requirement
   * @returns List of consultations
   */
  async getAllConsultations(
    skip: number = 0,
    limit: number = 100,
    filters?: {
      patientId?: string
      doctorId?: string
      startDate?: string
      endDate?: string
      followUpRequired?: boolean
    }
  ): Promise<ConsultationsListResponse> {
    try {
      const params = new URLSearchParams()
      params.append('skip', skip.toString())
      params.append('limit', Math.min(limit, 500).toString())

      if (filters?.patientId) params.append('patient_id', filters.patientId)
      if (filters?.doctorId) params.append('doctor_id', filters.doctorId)
      if (filters?.startDate) params.append('start_date', filters.startDate)
      if (filters?.endDate) params.append('end_date', filters.endDate)
      if (filters?.followUpRequired !== undefined)
        params.append('follow_up_required', filters.followUpRequired.toString())

      const response = await apiClient.get<ConsultationsListResponse>(
        `/consultations/?${params.toString()}`
      )
      console.log(`✅ Fetched ${response.data.returned} consultations`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch consultations'))
    }
  }

  /**
   * Get consultation by appointment ID
   * @param appointmentId - Appointment ID
   * @returns Consultation details for that appointment
   */
  async getConsultationByAppointment(appointmentId: string): Promise<ConsultationDetailResponse> {
    try {
      const response = await apiClient.get<ConsultationDetailResponse>(
        `/consultations/appointment/${appointmentId}`
      )
      console.log('✅ Fetched consultation by appointment')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch consultation by appointment'))
    }
  }

  /**
   * Update consultation record
   * @param consultationRecId - Consultation record ID
   * @param updateData - Fields to update
   * @returns Updated consultation
   */
  async updateConsultation(
    consultationRecId: string,
    updateData: UpdateConsultationData
  ): Promise<{ success: boolean; message: string; consultation: Consultation }> {
    try {
      const response = await apiClient.patch<{
        success: boolean
        message: string
        consultation: Consultation
      }>(`/consultations/${consultationRecId}`, updateData)
      console.log('✅ Consultation updated successfully')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update consultation'))
    }
  }

  /**
   * Delete consultation record
   * @param consultationRecId - Consultation record ID
   * @param force - Force delete even if has prescriptions/treatments
   * @returns Deletion confirmation
   */
  async deleteConsultation(
    consultationRecId: string,
    force: boolean = false
  ): Promise<{ success: boolean; message: string; consultation_rec_id: string }> {
    try {
      const response = await apiClient.delete<{
        success: boolean
        message: string
        consultation_rec_id: string
      }>(`/consultations/${consultationRecId}?force=${force}`)
      console.log('✅ Consultation deleted successfully')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete consultation'))
    }
  }

  /**
   * Get patient consultation history
   * @param patientId - Patient ID
   * @returns Complete consultation history for patient
   */
  async getPatientHistory(patientId: string): Promise<PatientHistoryResponse> {
    try {
      const response = await apiClient.get<PatientHistoryResponse>(
        `/consultations/patient/${patientId}/history`
      )
      console.log(`✅ Fetched ${response.data.total_consultations} consultation records`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch patient history'))
    }
  }

  /**
   * Get consultation statistics and analytics
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param doctorId - Filter by doctor
   * @param branchId - Filter by branch
   * @returns Statistics including top doctors and common diagnoses
   */
  async getStatistics(filters?: {
    startDate?: string
    endDate?: string
    doctorId?: string
    branchId?: string
  }): Promise<ConsultationStats> {
    try {
      const params = new URLSearchParams()
      if (filters?.startDate) params.append('start_date', filters.startDate)
      if (filters?.endDate) params.append('end_date', filters.endDate)
      if (filters?.doctorId) params.append('doctor_id', filters.doctorId)
      if (filters?.branchId) params.append('branch_id', filters.branchId)

      const response = await apiClient.get<ConsultationStats>(
        `/consultations/statistics/summary?${params.toString()}`
      )
      console.log('✅ Fetched consultation statistics')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch statistics'))
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Format consultation for display
   * Example: "2025-12-15 10:00 AM - Dr. Smith - Upper respiratory tract infection"
   */
  formatConsultation(consultation: ConsultationSummary): string {
    const date = new Date(consultation.available_date).toLocaleDateString()
    const doctor = consultation.doctor_name || 'Dr. Unknown'
    const diagnosis = consultation.diagnoses || 'Unknown'
    return `${date} - ${doctor} - ${diagnosis}`
  }

  /**
   * Check if consultation needs follow-up
   */
  needsFollowUp(consultation: Consultation): boolean {
    return consultation.follow_up_required
  }

  /**
   * Get follow-up status
   */
  getFollowUpStatus(consultation: Consultation): string {
    if (!consultation.follow_up_required) return 'Not required'
    if (!consultation.follow_up_date) return 'Pending'
    const followUpDate = new Date(consultation.follow_up_date)
    const today = new Date()
    return followUpDate < today ? 'Overdue' : 'Scheduled'
  }

  /**
   * Calculate consultation duration
   */
  calculateDuration(consultation: Consultation): string {
    try {
      const start = new Date(`1970-01-01T${consultation.start_time}`)
      const end = new Date(`1970-01-01T${consultation.end_time}`)
      const minutes = (end.getTime() - start.getTime()) / (1000 * 60)
      return `${Math.round(minutes)} minutes`
    } catch {
      return 'Unknown'
    }
  }

  /**
   * Group consultations by status
   */
  groupByFollowUp(
    consultations: ConsultationSummary[]
  ): { followUp: ConsultationSummary[]; noFollowUp: ConsultationSummary[] } {
    return {
      followUp: consultations.filter((c) => c.follow_up_required),
      noFollowUp: consultations.filter((c) => !c.follow_up_required),
    }
  }

  /**
   * Get summary statistics from consultations
   */
  getConsultationsSummary(
    consultations: ConsultationSummary[]
  ): {
    total: number
    withFollowUp: number
    totalPrescriptions: number
    totalTreatments: number
  } {
    return {
      total: consultations.length,
      withFollowUp: consultations.filter((c) => c.follow_up_required).length,
      totalPrescriptions: consultations.reduce((sum, c) => sum + (c.prescription_count || 0), 0),
      totalTreatments: consultations.reduce((sum, c) => sum + (c.treatment_count || 0), 0),
    }
  }

  /**
   * Format diagnoses for display (split by commas if multiple)
   */
  formatDiagnoses(diagnoses: string): string[] {
    return diagnoses
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d.length > 0)
  }

  /**
   * Format symptoms for display
   */
  formatSymptoms(symptoms: string): string[] {
    return symptoms
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }

  /**
   * Calculate average time between consultations
   */
  calculateAverageGap(consultations: ConsultationSummary[]): number {
    if (consultations.length < 2) return 0

    const sorted = [...consultations].sort(
      (a, b) =>
        new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    )

    let totalGap = 0
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = new Date(sorted[i].created_at || '')
      const next = new Date(sorted[i + 1].created_at || '')
      totalGap += (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
    }

    return Math.round(totalGap / (sorted.length - 1))
  }

  /**
   * Get follow-up badge color
   */
  getFollowUpColor(consultation: Consultation): string {
    if (!consultation.follow_up_required) return 'gray'
    const followUpDate = new Date(consultation.follow_up_date || '')
    const today = new Date()
    return followUpDate < today ? 'red' : 'yellow'
  }

  /**
   * Extract medication list from prescriptions
   */
  getMedicationList(items: PrescriptionItem[]): string {
    return items.map((item) => `${item.generic_name} ${item.dosage}`).join(', ')
  }

  /**
   * Extract treatment list
   */
  getTreatmentList(treatments: Treatment[]): string {
    return treatments.map((t) => t.treatment_name).join(', ')
  }

  /**
   * Check if consultation has all required data
   */
  isComplete(consultation: Consultation): boolean {
    return !!(
      consultation.appointment_id &&
      consultation.symptoms &&
      consultation.diagnoses &&
      consultation.patient_id &&
      consultation.doctor_id
    )
  }
}

export default new ConsultationService()