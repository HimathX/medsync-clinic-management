import apiClient, { handleApiError } from './api'

// ============================================
// PROFILE UPDATE TYPES
// ============================================

interface PatientProfileUpdate {
  full_name?: string
  email?: string
  contact_num1?: string
  contact_num2?: string
  address_line1?: string
  address_line2?: string
  city?: string
  province?: string
  postal_code?: string
  country?: string
  emergency_contact_name?: string
  emergency_contact_relationship?: string
  emergency_contact_phone?: string
  allergies?: string
  chronic_conditions?: string
  current_medications?: string
  insurance_provider?: string
  insurance_policy_number?: string
}

interface PatientProfile {
  patient_id: string
  full_name: string
  email: string
  NIC: string
  gender: string
  DOB: string
  blood_group?: string
  contact_num1: string
  contact_num2?: string
  address_line1?: string
  address_line2?: string
  city?: string
  province?: string
  postal_code?: string
  country?: string
  emergency_contact_name?: string
  emergency_contact_relationship?: string
  emergency_contact_phone?: string
  allergies?: string
  chronic_conditions?: string
  current_medications?: string
  insurance_provider?: string
  insurance_policy_number?: string
  registered_branch: string
  registration_date: string
}

interface PatientStats {
  patient_id: string
  total_appointments: number
  upcoming_appointments: number
  completed_appointments: number
  last_visit?: string
  prescriptions: number
  lab_results: number
}

// ============================================
// MEDICAL TYPES
// ============================================

interface DetailedAllergy {
  allergy_name: string
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Life-threatening'
  reaction_description?: string
  diagnosed_date?: string
}

interface DetailedCondition {
  condition_name: string
  diagnosed_date: string
  is_chronic: boolean
  current_status: string
  notes?: string
  category_name: string
}

interface RecentDiagnosis {
  diagnosis: string
  diagnosis_date: string
  doctor_name: string
}

interface MedicalSummary {
  patient_id: string
  blood_group?: string
  allergies?: string
  chronic_conditions?: string
  detailed_allergies: DetailedAllergy[]
  detailed_conditions: DetailedCondition[]
  current_medications?: string
  recent_diagnoses: RecentDiagnosis[]
}

interface ProfileUpdateResponse {
  message: string
  patient_id: string
}

/**
 * Patient Profile Service
 * Handles patient profile management and medical summaries
 */
class PatientProfileService {
  // ============================================
  // PROFILE METHODS
  // ============================================

  /**
   * Get patient profile information
   * @param patientId - Patient UUID
   * @returns Complete patient profile
   */
  async getPatientProfile(patientId: string): Promise<PatientProfile> {
    try {
      const response = await apiClient.get<PatientProfile>(
        `/patients/${patientId}/profile`
      )
      console.log('✅ Fetched patient profile')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch patient profile'))
    }
  }

  /**
   * Update patient profile
   * @param patientId - Patient UUID
   * @param profileData - Profile data to update
   * @returns Update confirmation
   */
  async updatePatientProfile(
    patientId: string,
    profileData: PatientProfileUpdate
  ): Promise<ProfileUpdateResponse> {
    try {
      const response = await apiClient.put<ProfileUpdateResponse>(
        `/patients/${patientId}/profile`,
        profileData
      )
      console.log('✅ Patient profile updated')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update patient profile'))
    }
  }

  // ============================================
  // STATISTICS METHODS
  // ============================================

  /**
   * Get patient statistics for dashboard
   * @param patientId - Patient UUID
   * @returns Dashboard statistics
   */
  async getPatientStatistics(patientId: string): Promise<PatientStats> {
    try {
      const response = await apiClient.get<PatientStats>(
        `/patients/${patientId}/stats`
      )
      console.log('✅ Fetched patient statistics')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch statistics'))
    }
  }

  // ============================================
  // MEDICAL METHODS
  // ============================================

  /**
   * Get patient medical summary
   * @param patientId - Patient UUID
   * @returns Medical information including allergies, conditions, diagnoses
   */
  async getMedicalSummary(patientId: string): Promise<MedicalSummary> {
    try {
      const response = await apiClient.get<MedicalSummary>(
        `/patients/${patientId}/medical-summary`
      )
      console.log('✅ Fetched medical summary')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch medical summary'))
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Format address for display
   */
  formatAddress(profile: PatientProfile): string {
    const parts = [
      profile.address_line1,
      profile.address_line2,
      profile.city,
      profile.province,
      profile.postal_code,
      profile.country,
    ].filter(Boolean)

    return parts.join(', ')
  }

  /**
   * Check if profile is complete
   */
  isProfileComplete(profile: PatientProfile): {
    complete: boolean
    missing_fields: string[]
  } {
    const required_fields = [
      'full_name',
      'email',
      'contact_num1',
      'address_line1',
      'city',
      'province',
      'postal_code',
    ]
    const missing = required_fields.filter((field) => !profile[field as keyof PatientProfile])

    return {
      complete: missing.length === 0,
      missing_fields: missing,
    }
  }

  /**
   * Get profile completion percentage
   */
  getProfileCompleteness(profile: PatientProfile): {
    percentage: number
    level: 'Low' | 'Medium' | 'High'
  } {
    const optional_fields = [
      'address_line2',
      'allergies',
      'chronic_conditions',
      'current_medications',
      'emergency_contact_name',
      'emergency_contact_relationship',
      'emergency_contact_phone',
      'insurance_provider',
      'insurance_policy_number',
    ]

    const filled = optional_fields.filter((field) => profile[field as keyof PatientProfile]).length
    const percentage = Math.round((filled / optional_fields.length) * 100)

    let level: 'Low' | 'Medium' | 'High' = 'Low'
    if (percentage >= 70) level = 'High'
    else if (percentage >= 40) level = 'Medium'

    return { percentage, level }
  }

  /**
   * Format statistics summary
   */
  formatStatsSummary(stats: PatientStats): string {
    let summary = `📊 Patient Statistics\n`
    summary += `━━━━━━━━━━━━━━━━━━━━\n`
    summary += `📅 Total Appointments: ${stats.total_appointments}\n`
    summary += `⏳ Upcoming: ${stats.upcoming_appointments}\n`
    summary += `✅ Completed: ${stats.completed_appointments}\n`

    if (stats.last_visit) {
      summary += `👨‍⚕️ Last Visit: ${stats.last_visit}\n`
    }

    summary += `💊 Prescriptions: ${stats.prescriptions}\n`
    summary += `🧪 Lab Results: ${stats.lab_results}\n`

    return summary
  }

  /**
   * Get appointment health status
   */
  getAppointmentHealthStatus(stats: PatientStats): {
    status: string
    icon: string
    color: string
    message: string
  } {
    const ratio = stats.completed_appointments / Math.max(stats.total_appointments, 1)

    if (ratio >= 0.8) {
      return {
        status: 'Excellent',
        icon: '🟢',
        color: 'green',
        message: 'Very engaged with healthcare',
      }
    } else if (ratio >= 0.6) {
      return {
        status: 'Good',
        icon: '🟡',
        color: 'yellow',
        message: 'Regularly attending appointments',
      }
    }

    return {
      status: 'Needs Attention',
      icon: '🔴',
      color: 'red',
      message: 'Consider scheduling check-up',
    }
  }

  /**
   * Format medical summary for display
   */
  formatMedicalSummary(summary: MedicalSummary): string {
    let text = `⚕️ Medical Summary\n`
    text += `━━━━━━━━━━━━━━━━━━━\n`

    if (summary.blood_group) {
      text += `🩸 Blood Group: ${summary.blood_group}\n`
    }

    if (summary.detailed_allergies.length > 0) {
      text += `\n🚨 Allergies:\n`
      summary.detailed_allergies.forEach((allergy) => {
        text += `  • ${allergy.allergy_name} (${allergy.severity})\n`
        if (allergy.reaction_description) {
          text += `    └─ ${allergy.reaction_description}\n`
        }
      })
    } else {
      text += `\n✅ No known allergies\n`
    }

    if (summary.detailed_conditions.length > 0) {
      text += `\n📋 Chronic Conditions:\n`
      summary.detailed_conditions.filter((c) => c.is_chronic).forEach((condition) => {
        text += `  • ${condition.condition_name} (${condition.current_status})\n`
      })
    }

    if (summary.recent_diagnoses.length > 0) {
      text += `\n🩺 Recent Diagnoses:\n`
      summary.recent_diagnoses.forEach((diagnosis) => {
        text += `  • ${diagnosis.diagnosis} - Dr. ${diagnosis.doctor_name}\n`
      })
    }

    return text
  }

  /**
   * Check for critical medical alerts
   */
  getCriticalMedicalAlerts(summary: MedicalSummary): {
    has_critical: boolean
    alerts: string[]
  } {
    const alerts: string[] = []

    // Check for life-threatening allergies
    const criticalAllergies = summary.detailed_allergies.filter(
      (a) => a.severity === 'Life-threatening'
    )
    if (criticalAllergies.length > 0) {
      alerts.push(
        `🔴 CRITICAL ALLERGIES: ${criticalAllergies.map((a) => a.allergy_name).join(', ')}`
      )
    }

    // Check for severe allergies
    const severeAllergies = summary.detailed_allergies.filter((a) => a.severity === 'Severe')
    if (severeAllergies.length > 0) {
      alerts.push(`⚠️ Severe allergies detected: ${severeAllergies.map((a) => a.allergy_name).join(', ')}`)
    }

    return {
      has_critical: alerts.length > 0,
      alerts,
    }
  }

  /**
   * Get conditions grouped by category
   */
  getConditionsByCategory(summary: MedicalSummary): Record<string, DetailedCondition[]> {
    const grouped: Record<string, DetailedCondition[]> = {}

    summary.detailed_conditions.forEach((condition) => {
      if (!grouped[condition.category_name]) {
        grouped[condition.category_name] = []
      }
      grouped[condition.category_name].push(condition)
    })

    return grouped
  }

  /**
   * Get active conditions only
   */
  getActiveConditions(summary: MedicalSummary): DetailedCondition[] {
    return summary.detailed_conditions.filter((c) => c.current_status !== 'Resolved')
  }

  /**
   * Format emergency contact information
   */
  formatEmergencyContact(profile: PatientProfile): {
    has_contact: boolean
    contact_info: string
  } {
    if (
      !profile.emergency_contact_name ||
      !profile.emergency_contact_phone ||
      !profile.emergency_contact_relationship
    ) {
      return {
        has_contact: false,
        contact_info: 'No emergency contact on file',
      }
    }

    return {
      has_contact: true,
      contact_info: `${profile.emergency_contact_name} (${profile.emergency_contact_relationship}) - ${profile.emergency_contact_phone}`,
    }
  }

  /**
   * Check if emergency contact is set
   */
  hasEmergencyContact(profile: PatientProfile): boolean {
    return !!(
      profile.emergency_contact_name &&
      profile.emergency_contact_phone &&
      profile.emergency_contact_relationship
    )
  }

  /**
   * Check if insurance information is set
   */
  hasInsuranceInfo(profile: PatientProfile): boolean {
    return !!(profile.insurance_provider && profile.insurance_policy_number)
  }

  /**
   * Format insurance information
   */
  formatInsuranceInfo(profile: PatientProfile): {
    has_insurance: boolean
    insurance_info: string
  } {
    if (!profile.insurance_provider || !profile.insurance_policy_number) {
      return {
        has_insurance: false,
        insurance_info: 'No insurance information on file',
      }
    }

    return {
      has_insurance: true,
      insurance_info: `${profile.insurance_provider} - Policy: ${profile.insurance_policy_number}`,
    }
  }

  /**
   * Get profile update needed items
   */
  getProfileUpdateNeeded(profile: PatientProfile): {
    needed: boolean
    recommendations: string[]
  } {
    const recommendations: string[] = []

    if (!profile.emergency_contact_name) {
      recommendations.push('Add emergency contact information')
    }

    if (!profile.allergies) {
      recommendations.push('Document any known allergies')
    }

    if (!profile.chronic_conditions) {
      recommendations.push('List any chronic conditions')
    }

    if (!profile.insurance_provider) {
      recommendations.push('Add insurance information')
    }

    if (!profile.current_medications) {
      recommendations.push('Document current medications')
    }

    return {
      needed: recommendations.length > 0,
      recommendations,
    }
  }

  /**
   * Validate profile update data
   */
  validateProfileUpdate(data: PatientProfileUpdate): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (data.email && !data.email.includes('@')) {
      errors.push('Valid email address required')
    }

    if (data.contact_num1 && data.contact_num1.length < 10) {
      errors.push('Contact number must be at least 10 digits')
    }

    if (data.postal_code && !/^\d{5}$/.test(data.postal_code)) {
      errors.push('Postal code must be 5 digits')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Compare profile versions
   */
  compareProfiles(
    oldProfile: PatientProfile,
    newProfile: PatientProfile
  ): {
    changed: boolean
    changes: Array<{ field: string; old_value: unknown; new_value: unknown }>
  } {
    const changes: Array<{ field: string; old_value: unknown; new_value: unknown }> = []
    const fieldsToCheck = [
      'full_name',
      'email',
      'contact_num1',
      'contact_num2',
      'address_line1',
      'address_line2',
      'city',
      'province',
      'postal_code',
      'country',
      'allergies',
      'chronic_conditions',
      'current_medications',
      'insurance_provider',
      'insurance_policy_number',
    ]

    fieldsToCheck.forEach((field) => {
      const oldValue = oldProfile[field as keyof PatientProfile]
      const newValue = newProfile[field as keyof PatientProfile]
      if (oldValue !== newValue) {
        changes.push({
          field,
          old_value: oldValue,
          new_value: newValue,
        })
      }
    })

    return {
      changed: changes.length > 0,
      changes,
    }
  }

  /**
   * Generate profile summary for printing
   */
  generateProfileSummary(profile: PatientProfile, stats: PatientStats): string {
    let summary = `PATIENT PROFILE SUMMARY\n`
    summary += `${'='.repeat(50)}\n\n`

    summary += `PERSONAL INFORMATION\n`
    summary += `${'-'.repeat(50)}\n`
    summary += `Name: ${profile.full_name}\n`
    summary += `NIC: ${profile.NIC}\n`
    summary += `Gender: ${profile.gender}\n`
    summary += `DOB: ${profile.DOB}\n`
    summary += `Blood Group: ${profile.blood_group || 'Not specified'}\n\n`

    summary += `CONTACT INFORMATION\n`
    summary += `${'-'.repeat(50)}\n`
    summary += `Email: ${profile.email}\n`
    summary += `Primary Phone: ${profile.contact_num1}\n`
    if (profile.contact_num2) {
      summary += `Secondary Phone: ${profile.contact_num2}\n`
    }
    summary += `Address: ${this.formatAddress(profile)}\n\n`

    summary += `HEALTHCARE STATISTICS\n`
    summary += `${'-'.repeat(50)}\n`
    summary += `Total Appointments: ${stats.total_appointments}\n`
    summary += `Upcoming: ${stats.upcoming_appointments}\n`
    summary += `Completed: ${stats.completed_appointments}\n`
    summary += `Prescriptions: ${stats.prescriptions}\n\n`

    if (profile.emergency_contact_name) {
      summary += `EMERGENCY CONTACT\n`
      summary += `${'-'.repeat(50)}\n`
      summary += `Name: ${profile.emergency_contact_name}\n`
      summary += `Relationship: ${profile.emergency_contact_relationship}\n`
      summary += `Phone: ${profile.emergency_contact_phone}\n\n`
    }

    summary += `Report Generated: ${new Date().toLocaleDateString()}\n`

    return summary
  }
}

export default new PatientProfileService()