import apiClient, { handleApiError } from './api'

// ============================================
// ALLERGY TYPES
// ============================================

interface PatientAllergy {
  patient_allergy_id: string
  patient_id: string
  allergy_name: string
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Life-threatening'
  reaction_description?: string
  diagnosed_date?: string
  created_at?: string
  updated_at?: string
}

interface AddAllergyData {
  patient_id: string
  allergy_name: string
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Life-threatening'
  reaction_description?: string
  diagnosed_date?: string
}

interface AllergyResponse {
  success: boolean
  message: string
  patient_allergy_id?: string
}

interface AllergiesListResponse {
  patient_id: string
  total: number
  allergies: PatientAllergy[]
}

// ============================================
// CONDITION TYPES
// ============================================

interface ConditionCategory {
  condition_category_id: string
  category_name: string
  description?: string
}

interface Condition {
  condition_id: string
  condition_category_id: string
  condition_name: string
  description?: string
  severity?: string
}

interface PatientCondition {
  patient_condition_id: string
  patient_id: string
  condition_id: string
  condition_name: string
  condition_description?: string
  severity?: string
  category_name: string
  category_description?: string
  diagnosed_date?: string
  is_chronic: boolean
  current_status: 'Active' | 'In Treatment' | 'Managed' | 'Resolved'
  notes?: string
  created_at?: string
  updated_at?: string
}

interface AddConditionData {
  patient_id: string
  condition_category_id: string
  condition_name: string
  diagnosed_date?: string
  is_chronic: boolean
  current_status: 'Active' | 'In Treatment' | 'Managed' | 'Resolved'
  notes?: string
}

interface UpdateConditionData {
  current_status?: 'Active' | 'In Treatment' | 'Managed' | 'Resolved'
  notes?: string
}

interface ConditionResponse {
  success: boolean
  message: string
  condition_id?: string
}

interface ConditionsListResponse {
  patient_id: string
  total: number
  conditions: PatientCondition[]
}

interface CategoriesResponse {
  total: number
  categories: ConditionCategory[]
}

interface ConditionsResponse {
  category: ConditionCategory
  total: number
  conditions: Condition[]
}

/**
 * Condition & Allergy Service
 * Handles patient allergies and medical conditions
 */
class ConditionService {
  // ============================================
  // ALLERGY METHODS
  // ============================================

  /**
   * Add allergy to patient
   * @param allergyData - Allergy information
   * @returns Success response with allergy ID
   */
  async addAllergy(allergyData: AddAllergyData): Promise<AllergyResponse> {
    try {
      const response = await apiClient.post<AllergyResponse>('/allergies', allergyData)
      console.log('✅ Allergy added successfully')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to add allergy'))
    }
  }

  /**
   * Get all allergies for a patient
   * @param patientId - Patient ID
   * @returns List of patient's allergies
   */
  async getPatientAllergies(patientId: string): Promise<PatientAllergy[]> {
    try {
      const response = await apiClient.get<AllergiesListResponse>(`/allergies/${patientId}`)
      console.log(`✅ Fetched ${response.data.total} allergies`)
      return response.data.allergies || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch allergies'))
    }
  }

  /**
   * Delete an allergy
   * @param allergyId - Allergy ID
   * @returns Success message
   */
  async deleteAllergy(allergyId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/allergies/${allergyId}`
      )
      console.log('✅ Allergy deleted successfully')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete allergy'))
    }
  }

  // ============================================
  // CONDITION METHODS
  // ============================================

  /**
   * Add condition to patient
   * @param conditionData - Condition information
   * @returns Success response with condition ID
   */
  async addCondition(conditionData: AddConditionData): Promise<ConditionResponse> {
    try {
      const response = await apiClient.post<ConditionResponse>('/conditions', conditionData)
      console.log('✅ Condition added successfully')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to add condition'))
    }
  }

  /**
   * Get all conditions for a patient
   * @param patientId - Patient ID
   * @param activeOnly - Filter only active/in treatment conditions (default: false)
   * @returns List of patient's conditions
   */
  async getPatientConditions(
    patientId: string,
    activeOnly: boolean = false
  ): Promise<PatientCondition[]> {
    try {
      const response = await apiClient.get<ConditionsListResponse>(
        `/conditions/${patientId}?active_only=${activeOnly}`
      )
      console.log(`✅ Fetched ${response.data.total} conditions`)
      return response.data.conditions || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch conditions'))
    }
  }

  /**
   * Update patient condition status and notes
   * @param patientId - Patient ID
   * @param conditionId - Condition ID
   * @param updateData - Updated status and/or notes
   * @returns Updated condition
   */
  async updateCondition(
    patientId: string,
    conditionId: string,
    updateData: UpdateConditionData
  ): Promise<{ success: boolean; message: string; patient_condition: PatientCondition }> {
    try {
      const response = await apiClient.patch<{
        success: boolean
        message: string
        patient_condition: PatientCondition
      }>(`/conditions/${patientId}/${conditionId}`, updateData)
      console.log('✅ Condition updated successfully')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update condition'))
    }
  }

  /**
   * Mark condition as resolved
   * @param patientId - Patient ID
   * @param conditionId - Condition ID
   * @returns Updated condition
   */
  async resolveCondition(
    patientId: string,
    conditionId: string
  ): Promise<{ success: boolean; message: string; patient_condition: PatientCondition }> {
    try {
      return await this.updateCondition(patientId, conditionId, {
        current_status: 'Resolved',
      })
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to resolve condition'))
    }
  }

  /**
   * Mark condition as managed
   * @param patientId - Patient ID
   * @param conditionId - Condition ID
   * @returns Updated condition
   */
  async markAsManaged(
    patientId: string,
    conditionId: string
  ): Promise<{ success: boolean; message: string; patient_condition: PatientCondition }> {
    try {
      return await this.updateCondition(patientId, conditionId, {
        current_status: 'Managed',
      })
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to mark condition as managed'))
    }
  }

  /**
   * Mark condition as in treatment
   * @param patientId - Patient ID
   * @param conditionId - Condition ID
   * @returns Updated condition
   */
  async markAsInTreatment(
    patientId: string,
    conditionId: string
  ): Promise<{ success: boolean; message: string; patient_condition: PatientCondition }> {
    try {
      return await this.updateCondition(patientId, conditionId, {
        current_status: 'In Treatment',
      })
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to mark condition as in treatment'))
    }
  }

  // ============================================
  // CATEGORY METHODS
  // ============================================

  /**
   * Get all condition categories
   * @returns List of condition categories
   */
  async getCategories(): Promise<ConditionCategory[]> {
    try {
      const response = await apiClient.get<CategoriesResponse>('/categories')
      console.log(`✅ Fetched ${response.data.total} categories`)
      return response.data.categories || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch categories'))
    }
  }

  /**
   * Get conditions in a specific category
   * @param categoryId - Category ID
   * @returns List of conditions in that category
   */
  async getConditionsByCategory(categoryId: string): Promise<Condition[]> {
    try {
      const response = await apiClient.get<ConditionsResponse>(
        `/categories/${categoryId}/conditions`
      )
      console.log(`✅ Fetched ${response.data.total} conditions in category`)
      return response.data.conditions || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch conditions'))
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Format allergy for display with severity icon
   * Example: "🔴 Peanuts - Life-threatening"
   */
  formatAllergy(allergy: PatientAllergy): string {
    const icons: Record<string, string> = {
      Mild: '🟢',
      Moderate: '🟡',
      Severe: '🟠',
      'Life-threatening': '🔴',
    }
    const icon = icons[allergy.severity] || '⚠️'
    return `${icon} ${allergy.allergy_name} - ${allergy.severity}`
  }

  /**
   * Format condition status with color
   */
  formatConditionStatus(status: string): string {
    const emojis: Record<string, string> = {
      Active: '🔴',
      'In Treatment': '🟡',
      Managed: '🟢',
      Resolved: '✅',
    }
    return `${emojis[status] || '⚫'} ${status}`
  }

  /**
   * Get allergy severity level (1-4)
   */
  getAllergySeverityLevel(severity: string): number {
    const levels: Record<string, number> = {
      Mild: 1,
      Moderate: 2,
      Severe: 3,
      'Life-threatening': 4,
    }
    return levels[severity] || 0
  }

  /**
   * Check if allergy is life-threatening
   */
  isLifeThreatening(allergy: PatientAllergy): boolean {
    return allergy.severity === 'Life-threatening'
  }

  /**
   * Filter allergies by severity
   */
  filterAllergiesBySeverity(
    allergies: PatientAllergy[],
    minSeverity: 'Mild' | 'Moderate' | 'Severe' | 'Life-threatening'
  ): PatientAllergy[] {
    const minLevel = this.getAllergySeverityLevel(minSeverity)
    return allergies.filter((a) => this.getAllergySeverityLevel(a.severity) >= minLevel)
  }

  /**
   * Group conditions by status
   */
  groupConditionsByStatus(
    conditions: PatientCondition[]
  ): Record<string, PatientCondition[]> {
    return conditions.reduce(
      (acc, condition) => {
        const status = condition.current_status
        if (!acc[status]) acc[status] = []
        acc[status].push(condition)
        return acc
      },
      {} as Record<string, PatientCondition[]>
    )
  }

  /**
   * Get chronic conditions only
   */
  getChronicConditions(conditions: PatientCondition[]): PatientCondition[] {
    return conditions.filter((c) => c.is_chronic)
  }

  /**
   * Count allergies by severity
   */
  countAllergiesBySeverity(
    allergies: PatientAllergy[]
  ): Record<string, number> {
    return allergies.reduce(
      (acc, allergy) => {
        acc[allergy.severity] = (acc[allergy.severity] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  }
}

export default new ConditionService()