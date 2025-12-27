import apiClient, { handleApiError } from './api'

// ============================================
// PRESCRIPTION TYPES
// ============================================

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

export interface Consultation {
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

export interface ConsultationSummary {
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

interface DoctorConsultationDetail extends ConsultationSummary {
  patient_email: string
  start_time: string
  end_time: string
  branch_name: string
  branch_id: string
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

interface DoctorConsultationsResponse {
  doctor_id: string
  total: number
  returned: number
  filters: {
    start_date?: string
    end_date?: string
    follow_up_required?: boolean
  }
  pagination: {
    skip: number
    limit: number
  }
  consultations: DoctorConsultationDetail[]
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
   * @param filters - Optional filters (patientId, doctorId, date range, follow-up)
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
   * Get consultations for a specific doctor
   * @param doctorId - Doctor ID
   * @param skip - Number of records to skip (default: 0)
   * @param limit - Maximum records to return (default: 100)
   * @param filters - Optional filters (date range, follow-up requirement)
   * @returns List of consultations for the doctor with patient details
   */
  async getConsultationsByDoctor(
    doctorId: string,
    skip: number = 0,
    limit: number = 100,
    filters?: {
      startDate?: string
      endDate?: string
      followUpRequired?: boolean
    }
  ): Promise<DoctorConsultationsResponse> {
    try {
      const params = new URLSearchParams()
      params.append('skip', skip.toString())
      params.append('limit', Math.min(limit, 500).toString())

      if (filters?.startDate) params.append('start_date', filters.startDate)
      if (filters?.endDate) params.append('end_date', filters.endDate)
      if (filters?.followUpRequired !== undefined)
        params.append('follow_up_required', filters.followUpRequired.toString())

      const response = await apiClient.get<DoctorConsultationsResponse>(
        `/consultations/doctor/${doctorId}?${params.toString()}`
      )
      console.log(`✅ Fetched ${response.data.returned} consultations for doctor ${doctorId}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch doctor consultations'))
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
   * @param force - Force delete even if it has prescriptions/treatments
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
   * @returns Complete consultation history for the patient
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
   * @param filters - Optional filters (date range, doctor, branch)
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
   * Example: "2025-12-15 - Dr. Smith - Upper respiratory tract infection"
   */
  formatConsultation(consultation: ConsultationSummary): string {
    const date = new Date(consultation.available_date).toLocaleDateString()
    const doctor = consultation.doctor_name || 'Dr. Unknown'
    const diagnosis = consultation.diagnoses || 'Unknown'
    return `${date} - ${doctor} - ${diagnosis}`
  }

  /**
   * Check if a consultation needs follow-up
   */
  needsFollowUp(consultation: Consultation): boolean {
    return consultation.follow_up_required
  }

  /**
   * Get the follow-up status string
   */
  getFollowUpStatus(consultation: Consultation): string {
    if (!consultation.follow_up_required) return 'Not required'
    if (!consultation.follow_up_date) return 'Pending'
    const followUpDate = new Date(consultation.follow_up_date)
    const today = new Date()
    return followUpDate < today ? 'Overdue' : 'Scheduled'
  }

  /**
   * Calculate consultation duration in minutes
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
   * Group consultations by follow-up status
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
   * Group doctor consultations by follow-up status
   */
  groupDoctorConsultationsByFollowUp(
    consultations: DoctorConsultationDetail[]
  ): { followUp: DoctorConsultationDetail[]; noFollowUp: DoctorConsultationDetail[] } {
    return {
      followUp: consultations.filter((c) => c.follow_up_required),
      noFollowUp: consultations.filter((c) => !c.follow_up_required),
    }
  }

  /**
   * Get summary statistics from a list of consultations
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
   * Get summary statistics from a list of doctor-specific consultations
   */
  getDoctorConsultationsSummary(
    consultations: DoctorConsultationDetail[]
  ): {
    total: number
    withFollowUp: number
    totalPrescriptions: number
    totalTreatments: number
    byBranch: Record<string, number>
  } {
    const byBranch: Record<string, number> = {}
    consultations.forEach((c) => {
      byBranch[c.branch_name] = (byBranch[c.branch_name] || 0) + 1
    })

    return {
      total: consultations.length,
      withFollowUp: consultations.filter((c) => c.follow_up_required).length,
      totalPrescriptions: consultations.reduce((sum, c) => sum + (c.prescription_count || 0), 0),
      totalTreatments: consultations.reduce((sum, c) => sum + (c.treatment_count || 0), 0),
      byBranch,
    }
  }

  /**
   * Format diagnoses string into an array
   */
  formatDiagnoses(diagnoses: string): string[] {
    return diagnoses
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d.length > 0)
  }

  /**
   * Format symptoms string into an array
   */
  formatSymptoms(symptoms: string): string[] {
    return symptoms
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }

  /**
   * Calculate average days between consultations
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
      totalGap += (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24) // gap in days
    }

    return Math.round(totalGap / (sorted.length - 1))
  }

  /**
   * Get a color based on follow-up status for UI badges
   */
  getFollowUpColor(consultation: Consultation): string {
    if (!consultation.follow_up_required) return 'gray'
    const followUpDate = new Date(consultation.follow_up_date || '')
    const today = new Date()
    return followUpDate < today ? 'red' : 'yellow'
  }

  /**
   * Extract a comma-separated list of medication names
   */
  getMedicationList(items: PrescriptionItem[]): string {
    return items.map((item) => `${item.generic_name} ${item.dosage}`).join(', ')
  }

  /**
   * Extract a comma-separated list of treatment names
   */
  getTreatmentList(treatments: Treatment[]): string {
    return treatments.map((t) => t.treatment_name).join(', ')
  }

  /**
   * Check if a consultation object has all required data
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

  /**
   * Filter doctor consultations by a date range
   */
  filterByDateRange(
    consultations: DoctorConsultationDetail[],
    startDate: Date,
    endDate: Date
  ): DoctorConsultationDetail[] {
    return consultations.filter((c) => {
      const consultDate = new Date(c.available_date)
      return consultDate >= startDate && consultDate <= endDate
    })
  }

  /**
   * Filter doctor consultations by patient name (case-insensitive)
   */
  filterByPatient(
    consultations: DoctorConsultationDetail[],
    patientName: string
  ): DoctorConsultationDetail[] {
    return consultations.filter((c) =>
      c.patient_name.toLowerCase().includes(patientName.toLowerCase())
    )
  }

  /**
   * Sort doctor consultations by date (newest first)
   */
  sortByDateNewest(consultations: DoctorConsultationDetail[]): DoctorConsultationDetail[] {
    return [...consultations].sort(
      (a, b) =>
        new Date(b.available_date).getTime() - new Date(a.available_date).getTime()
    )
  }

  /**
   * Sort doctor consultations by patient name (alphabetical)
   */
  sortByPatientName(consultations: DoctorConsultationDetail[]): DoctorConsultationDetail[] {
    return [...consultations].sort((a, b) =>
      a.patient_name.localeCompare(b.patient_name)
    )
  }

  /**
   * Get a unique list of patients who have consulted a doctor
   */
  getUniquePatients(consultations: DoctorConsultationDetail[]): Array<{
    patient_id: string
    patient_name: string
    patient_email: string
    total_consultations: number
  }> {
    const patients: Record<
      string,
      {
        patient_id: string
        patient_name: string
        patient_email: string
        total_consultations: number
      }
    > = {}

    consultations.forEach((c) => {
      if (!patients[c.patient_id]) {
        patients[c.patient_id] = {
          patient_id: c.patient_id,
          patient_name: c.patient_name,
          patient_email: c.patient_email,
          total_consultations: 0,
        }
      }
      patients[c.patient_id].total_consultations += 1
    })

    return Object.values(patients).sort(
      (a, b) => b.total_consultations - a.total_consultations
    )
  }

  /**
   * Get consultation counts grouped by branch for a doctor
   */
  getConsultationsByBranch(
    consultations: DoctorConsultationDetail[]
  ): Array<{ branch_name: string; branch_id: string; count: number }> {
    const branches: Record<string, { branch_name: string; branch_id: string; count: number }> = {}

    consultations.forEach((c) => {
      if (!branches[c.branch_id]) {
        branches[c.branch_id] = {
          branch_name: c.branch_name,
          branch_id: c.branch_id,
          count: 0,
        }
      }
      branches[c.branch_id].count += 1
    })

    return Object.values(branches).sort((a, b) => b.count - a.count)
  }
}

export default new ConsultationService()
