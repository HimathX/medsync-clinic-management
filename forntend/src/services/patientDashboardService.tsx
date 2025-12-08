import apiClient, { handleApiError } from './api'

// ============================================
// ALLERGY & CONDITION TYPES
// ============================================

interface AllergyInfo {
  allergy: string
  severity?: string
  reaction?: string
}

interface ChronicConditionInfo {
  condition: string
  diagnosed_date?: string
  status: 'Active' | 'Controlled' | 'Resolved'
}

// ============================================
// CONSULTATION TYPES
// ============================================

interface RecentConsultation {
  consultation_id: string
  appointment_id: string
  consultation_date: string
  doctor_name: string
  specialty: string
  diagnosis?: string
  symptoms?: string
  notes?: string
}

// ============================================
// PRESCRIPTION TYPES
// ============================================

interface MedicationDetail {
  generic_name: string
  manufacturer: string
  form: string
  dosage: string
  frequency: string
  duration: number
}

interface ActivePrescription {
  prescription_id: string
  prescription_date: string
  doctor_name: string
  medications: MedicationDetail[]
  days_since_prescribed: number
  is_active: boolean
}

// ============================================
// LAB & VITAL TYPES
// ============================================

interface LabResult {
  result_id: string
  test_name: string
  result_date: string
  result_value: string
  normal_range?: string
  status: 'Normal' | 'Abnormal' | 'Critical'
  doctor_name: string
}

interface VitalSigns {
  blood_pressure?: string
  heart_rate?: number
  temperature?: number
  weight?: number
  height?: number
  bmi?: number
  recorded_date?: string
}

// ============================================
// MAIN RESPONSE TYPES
// ============================================

interface MedicalSummary {
  patient_id: string
  patient_name: string
  age: number
  gender: string
  blood_group?: string
  registered_branch?: string
  allergies: string[]
  chronic_conditions: string[]
  current_medications: string[]
  recent_consultations: RecentConsultation[]
  active_prescriptions: ActivePrescription[]
  recent_lab_results: LabResult[]
  latest_vitals?: VitalSigns
  medical_alerts: string[]
  last_visit_date?: string
  next_appointment_date?: string
  summary_generated_at: string
  data_completeness: {
    has_allergies: boolean
    has_chronic_conditions: boolean
    has_current_medications: boolean
    has_recent_consultations: boolean
    has_active_prescriptions: boolean
    has_recent_labs: boolean
    has_vitals: boolean
  }
}

interface HealthMetrics {
  total_consultations: number
  total_prescriptions: number
  active_conditions: number
  known_allergies: number
  last_checkup_days_ago?: number
  upcoming_visits: number
}

interface MedicalAlert {
  type: 'critical' | 'warning' | 'info'
  message: string
  icon: string
}

/**
 * Patient Dashboard Service
 * Provides medical summary and health overview for patients
 */
class PatientDashboardService {
  /**
   * Get comprehensive medical summary for patient
   * @param patientId - Patient UUID
   * @param includeConsultations - Include recent consultations
   * @param includePrescriptions - Include active prescriptions
   * @param includeLabResults - Include recent lab results
   * @param consultationsLimit - Max consultations to fetch (1-20)
   * @param prescriptionsLimit - Max prescriptions to fetch (1-10)
   * @param labResultsLimit - Max lab results to fetch (1-20)
   * @returns Complete medical summary
   */
  async getMedicalSummary(
    patientId: string,
    options?: {
      includeConsultations?: boolean
      includePrescriptions?: boolean
      includeLabResults?: boolean
      consultationsLimit?: number
      prescriptionsLimit?: number
      labResultsLimit?: number
    }
  ): Promise<MedicalSummary> {
    try {
      const params = new URLSearchParams()
      params.append(
        'include_consultations',
        (options?.includeConsultations ?? true).toString()
      )
      params.append(
        'include_prescriptions',
        (options?.includePrescriptions ?? true).toString()
      )
      params.append('include_lab_results', (options?.includeLabResults ?? true).toString())
      params.append('consultations_limit', Math.min(options?.consultationsLimit ?? 5, 20).toString())
      params.append('prescriptions_limit', Math.min(options?.prescriptionsLimit ?? 3, 10).toString())
      params.append('lab_results_limit', Math.min(options?.labResultsLimit ?? 5, 20).toString())

      const response = await apiClient.get<MedicalSummary>(
        `/patients/${patientId}/medical-summary?${params.toString()}`
      )
      console.log('✅ Fetched medical summary')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch medical summary'))
    }
  }

  /**
   * Get quick health metrics for patient card
   * @param summary - Medical summary data
   * @returns Quick health metrics
   */
  getHealthMetrics(summary: MedicalSummary): HealthMetrics {
    let lastCheckupDaysAgo: number | undefined
    if (summary.last_visit_date) {
      const lastVisit = new Date(summary.last_visit_date)
      const today = new Date()
      lastCheckupDaysAgo = Math.floor(
        (today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
      )
    }

    return {
      total_consultations: summary.recent_consultations.length,
      total_prescriptions: summary.active_prescriptions.length,
      active_conditions: summary.chronic_conditions.length,
      known_allergies: summary.allergies.length,
      last_checkup_days_ago: lastCheckupDaysAgo,
      upcoming_visits: summary.next_appointment_date ? 1 : 0,
    }
  }

  /**
   * Parse and format medical alerts
   * @param summary - Medical summary data
   * @returns Formatted alerts with icons
   */
  parseAlerts(summary: MedicalSummary): MedicalAlert[] {
    const alerts: MedicalAlert[] = []

    // Critical allergy alerts
    const criticalAllergies = ['penicillin', 'aspirin', 'sulfa', 'latex', 'iodine']
    const criticalAllergy = summary.allergies.find((allergy) =>
      criticalAllergies.some((crit) => allergy.toLowerCase().includes(crit))
    )
    if (criticalAllergy) {
      alerts.push({
        type: 'critical',
        message: `CRITICAL ALLERGY: ${criticalAllergy}`,
        icon: '⚠️',
      })
    }

    // Chronic condition alerts
    if (summary.chronic_conditions.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${summary.chronic_conditions.length} chronic condition(s) on record`,
        icon: '📋',
      })
    }

    // Abnormal lab results
    const abnormalLabs = summary.recent_lab_results.filter((lab) =>
      ['Abnormal', 'Critical'].includes(lab.status)
    )
    if (abnormalLabs.length > 0) {
      alerts.push({
        type: 'critical',
        message: `${abnormalLabs.length} abnormal lab result(s) - review recommended`,
        icon: '⚕️',
      })
    }

    // Long time since last visit
    if (summary.last_visit_date) {
      const lastVisit = new Date(summary.last_visit_date)
      const today = new Date()
      const daysSince = Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
      if (daysSince > 365) {
        alerts.push({
          type: 'warning',
          message: `Last visit was ${daysSince} days ago - checkup recommended`,
          icon: '📅',
        })
      }
    }

    // Multiple active prescriptions
    if (summary.active_prescriptions.length > 3) {
      alerts.push({
        type: 'info',
        message: `${summary.active_prescriptions.length} active prescriptions - review for interactions`,
        icon: '💊',
      })
    }

    // No allergies recorded
    if (summary.allergies.length === 0 && summary.data_completeness.has_allergies === false) {
      alerts.push({
        type: 'info',
        message: 'No allergies recorded - consider adding if applicable',
        icon: 'ℹ️',
      })
    }

    return alerts
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Format allergy for display with severity
   * Example: "🔴 Peanuts (Life-threatening)"
   */
  formatAllergyDisplay(allergy: string, severity?: string): string {
    const icons: Record<string, string> = {
      'Life-threatening': '🔴',
      Severe: '🟠',
      Moderate: '🟡',
      Mild: '🟢',
    }
    const icon = severity && icons[severity] ? icons[severity] : '⚠️'
    return severity ? `${icon} ${allergy} (${severity})` : `${icon} ${allergy}`
  }

  /**
   * Get status badge for prescription
   */
  getPrescriptionStatus(prescription: ActivePrescription): {
    status: 'active' | 'expiring' | 'expired'
    label: string
    color: string
  } {
    const daysSince = prescription.days_since_prescribed
    if (daysSince > 30) {
      return { status: 'expired', label: 'Expired', color: 'red' }
    } else if (daysSince > 20) {
      return { status: 'expiring', label: 'Expiring Soon', color: 'yellow' }
    }
    return { status: 'active', label: 'Active', color: 'green' }
  }

  /**
   * Format medication for display
   * Example: "Amoxicillin 500mg - Twice daily"
   */
  formatMedication(med: MedicationDetail): string {
    return `${med.generic_name} ${med.dosage} - ${med.frequency}`
  }

  /**
   * Get all medications from active prescriptions
   */
  getAllMedications(prescriptions: ActivePrescription[]): MedicationDetail[] {
    const medications: MedicationDetail[] = []
    prescriptions.forEach((rx) => {
      medications.push(...rx.medications)
    })
    return medications
  }

  /**
   * Get medication interaction warnings (simple client-side)
   */
  checkMedicationInteractions(medications: MedicationDetail[]): string[] {
    const warnings: string[] = []
    const genericNames = medications.map((m) => m.generic_name.toLowerCase())

    // Common interactions
    const interactions: Record<string, string[]> = {
      warfarin: ['aspirin', 'ibuprofen', 'naproxen'],
      metformin: ['contrast dye'],
      lisinopril: ['potassium supplements'],
      'ace inhibitors': ['potassium sparing diuretics'],
    }

    for (const [drug, incompatible] of Object.entries(interactions)) {
      if (genericNames.some((name) => name.includes(drug))) {
        const found = genericNames.filter((name) =>
          incompatible.some((incompat) => name.includes(incompat))
        )
        if (found.length > 0) {
          warnings.push(`Potential interaction between ${drug} and ${found.join(', ')}`)
        }
      }
    }

    return warnings
  }

  /**
   * Calculate health score (0-100) based on available data
   */
  calculateHealthScore(summary: MedicalSummary): number {
    let score = 100
    const completeness = summary.data_completeness

    // Deduct for missing data
    if (!completeness.has_vitals) score -= 10
    if (!completeness.has_recent_labs) score -= 5
    if (!completeness.has_recent_consultations) score -= 5

    // Deduct for health issues
    if (summary.allergies.length > 0) score -= 5
    if (summary.chronic_conditions.length > 0) score -= 10
    if (summary.active_prescriptions.length > 3) score -= 5

    // Deduct for abnormal results
    const abnormalLabs = summary.recent_lab_results.filter((lab) =>
      ['Abnormal', 'Critical'].includes(lab.status)
    )
    score -= abnormalLabs.length * 5

    // Deduct for overdue checkups
    if (summary.last_visit_date) {
      const lastVisit = new Date(summary.last_visit_date)
      const today = new Date()
      const daysSince = Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
      if (daysSince > 365) score -= 10
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Get health status based on score
   */
  getHealthStatus(score: number): { status: string; color: string; icon: string } {
    if (score >= 80) return { status: 'Good', color: 'green', icon: '✅' }
    if (score >= 60) return { status: 'Fair', color: 'yellow', icon: '⚠️' }
    if (score >= 40) return { status: 'Needs Attention', color: 'orange', icon: '⚠️' }
    return { status: 'Critical', color: 'red', icon: '🚨' }
  }

  /**
   * Get consultation frequency analysis
   */
  getConsultationFrequency(consultations: RecentConsultation[]): {
    frequency: string
    lastVisit: number | null
    recommended_next_visit: string
  } {
    if (consultations.length === 0) {
      return {
        frequency: 'No consultations',
        lastVisit: null,
        recommended_next_visit: 'Schedule a checkup',
      }
    }

    const lastDate = new Date(consultations[0].consultation_date)
    const today = new Date()
    const daysSince = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

    let frequency = 'Regular'
    let recommended = 'Annual checkup'

    if (daysSince > 365) {
      frequency = 'Infrequent'
      recommended = 'Schedule appointment soon'
    } else if (daysSince > 180) {
      frequency = 'Moderate'
      recommended = 'Consider scheduling soon'
    }

    return {
      frequency,
      lastVisit: daysSince,
      recommended_next_visit: recommended,
    }
  }

  /**
   * Format lab result for display
   */
  formatLabResult(lab: LabResult): string {
    const statusIcon = {
      Normal: '✅',
      Abnormal: '⚠️',
      Critical: '🚨',
    }[lab.status] || '❓'

    return `${statusIcon} ${lab.test_name}: ${lab.result_value}${
      lab.normal_range ? ` (normal: ${lab.normal_range})` : ''
    }`
  }

  /**
   * Get summary text for medical conditions
   */
  getMedicalSummaryText(summary: MedicalSummary): string {
    const parts: string[] = []

    if (summary.allergies.length > 0) {
      parts.push(`${summary.allergies.length} known allergy(ies)`)
    }

    if (summary.chronic_conditions.length > 0) {
      parts.push(`${summary.chronic_conditions.length} chronic condition(s)`)
    }

    if (summary.active_prescriptions.length > 0) {
      parts.push(`${summary.active_prescriptions.length} active prescription(s)`)
    }

    if (parts.length === 0) {
      return 'No known conditions or allergies'
    }

    return parts.join(', ')
  }

  /**
   * Check if patient needs immediate attention
   */
  needsImmediateAttention(summary: MedicalSummary): boolean {
    // Critical allergies
    const criticalAllergies = ['penicillin', 'aspirin', 'sulfa', 'latex']
    if (
      summary.allergies.some((allergy) =>
        criticalAllergies.some((crit) => allergy.toLowerCase().includes(crit))
      )
    ) {
      return true
    }

    // Critical lab results
    if (summary.recent_lab_results.some((lab) => lab.status === 'Critical')) {
      return true
    }

    // Multiple conditions requiring urgent review
    if (summary.chronic_conditions.length > 5) {
      return true
    }

    return false
  }

  /**
   * Export medical summary as text
   */
  exportSummaryAsText(summary: MedicalSummary): string {
    const lines: string[] = [
      `MEDICAL SUMMARY - ${summary.patient_name}`,
      `Generated: ${new Date(summary.summary_generated_at).toLocaleString()}`,
      '',
      `PATIENT INFO:`,
      `  Age: ${summary.age} | Gender: ${summary.gender} | Blood Group: ${summary.blood_group || 'Unknown'}`,
      '',
    ]

    if (summary.allergies.length > 0) {
      lines.push(`ALLERGIES (${summary.allergies.length}):`)
      summary.allergies.forEach((allergy) => {
        lines.push(`  • ${allergy}`)
      })
      lines.push('')
    }

    if (summary.chronic_conditions.length > 0) {
      lines.push(`CHRONIC CONDITIONS (${summary.chronic_conditions.length}):`)
      summary.chronic_conditions.forEach((condition) => {
        lines.push(`  • ${condition}`)
      })
      lines.push('')
    }

    if (summary.medical_alerts.length > 0) {
      lines.push(`⚠️ ALERTS (${summary.medical_alerts.length}):`)
      summary.medical_alerts.forEach((alert) => {
        lines.push(`  • ${alert}`)
      })
      lines.push('')
    }

    if (summary.active_prescriptions.length > 0) {
      lines.push(`ACTIVE PRESCRIPTIONS (${summary.active_prescriptions.length}):`)
      summary.active_prescriptions.forEach((rx) => {
        lines.push(`  Doctor: ${rx.doctor_name}`)
        rx.medications.forEach((med) => {
          lines.push(`    • ${this.formatMedication(med)}`)
        })
      })
    }

    return lines.join('\n')
  }
}

export default new PatientDashboardService()