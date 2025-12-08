import apiClient, { handleApiError } from './api'

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Treatment {
  treatment_id?: string
  consultation_rec_id: string
  treatment_service_code: string
  notes?: string
  created_at?: string
  treatment_name?: string
  base_price?: number
  duration?: string
  appointment_id?: string
  patient_id?: string
  [key: string]: unknown
}

export interface TreatmentCreateRequest {
  consultation_rec_id: string
  treatment_service_code: string
  notes?: string
}

export interface TreatmentUpdateRequest {
  notes?: string
}

export interface BulkTreatmentItem {
  treatment_service_code: string
  notes?: string
}

export interface BulkTreatmentCreateRequest {
  consultation_rec_id: string
  treatments: BulkTreatmentItem[]
}

export interface BulkTreatmentResult {
  treatment_service_code: string
  success: boolean
  treatment_id?: string
  error_message?: string
}

export interface BulkTreatmentResponse {
  total_attempted: number
  successful: number
  failed: number
  results: BulkTreatmentResult[]
}

export interface TreatmentResponse {
  success: boolean
  message: string
  treatment_id?: string
}

export interface TreatmentListResponse {
  total: number
  returned: number
  treatments: Treatment[]
}

export interface TreatmentDetailsResponse {
  treatment: Treatment
}

export interface ConsultationTreatmentsResponse {
  consultation_rec_id: string
  total: number
  treatments: Treatment[]
}

export interface TreatmentUpdateResponse {
  success: boolean
  message: string
  treatment: Treatment
}

export interface TreatmentDeleteResponse {
  success: boolean
  message: string
  treatment_id: string
}

export interface TreatmentStatistics {
  treatment_service_code: string
  treatment_name: string
  base_price: number
  times_used: number
  total_revenue: number
}

export interface TreatmentStatisticsResponse {
  top_treatments: TreatmentStatistics[]
}

// ============================================
// TREATMENT SERVICE
// ============================================

class TreatmentService {
  // ============================================
  // CREATE METHODS
  // ============================================

  /**
   * Add single treatment to consultation record
   * POST /treatment-records/
   */
  async addTreatment(treatmentData: TreatmentCreateRequest): Promise<TreatmentResponse> {
    try {
      const response = await apiClient.post<TreatmentResponse>(
        '/treatment-records/',
        treatmentData
      )
      console.log('✅ Treatment added')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to add treatment'))
    }
  }

  /**
   * Add bulk treatments to consultation record
   * POST /treatment-records/bulk
   */
  async addTreatmentsBulk(
    bulkData: BulkTreatmentCreateRequest
  ): Promise<BulkTreatmentResponse> {
    try {
      const response = await apiClient.post<BulkTreatmentResponse>(
        '/treatment-records/bulk',
        bulkData
      )
      console.log('✅ Bulk treatments added')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to add bulk treatments'))
    }
  }

  // ============================================
  // GET METHODS
  // ============================================

  /**
   * Get all treatment records with pagination
   * GET /treatment-records/?skip=0&limit=100
   */
  async getAllTreatments(
    skip: number = 0,
    limit: number = 100
  ): Promise<TreatmentListResponse> {
    try {
      const params = new URLSearchParams()
      params.append('skip', skip.toString())
      params.append('limit', Math.min(Math.max(limit, 1), 500).toString())

      const response = await apiClient.get<TreatmentListResponse>(
        `/treatment-records/?${params.toString()}`
      )
      console.log('✅ Fetched all treatments')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatments'))
    }
  }

  /**
   * Get treatment record by ID
   * GET /treatment-records/{treatment_id}
   */
  async getTreatmentById(treatmentId: string): Promise<TreatmentDetailsResponse> {
    try {
      const response = await apiClient.get<TreatmentDetailsResponse>(
        `/treatment-records/${treatmentId}`
      )
      console.log('✅ Fetched treatment details')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatment'))
    }
  }

  /**
   * Get all treatments for a consultation record
   * GET /treatment-records/consultation/{consultation_rec_id}
   */
  async getTreatmentsByConsultation(
    consultationRecId: string
  ): Promise<ConsultationTreatmentsResponse> {
    try {
      const response = await apiClient.get<ConsultationTreatmentsResponse>(
        `/treatment-records/consultation/${consultationRecId}`
      )
      console.log('✅ Fetched treatments by consultation')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatments for consultation'))
    }
  }

  /**
   * Get treatment usage statistics
   * GET /treatment-records/statistics/by-service?limit=10
   */
  async getTreatmentStatistics(limit: number = 10): Promise<TreatmentStatisticsResponse> {
    try {
      const params = new URLSearchParams()
      params.append('limit', Math.min(Math.max(limit, 1), 100).toString())

      const response = await apiClient.get<TreatmentStatisticsResponse>(
        `/treatment-records/statistics/by-service?${params.toString()}`
      )
      console.log('✅ Fetched treatment statistics')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatment statistics'))
    }
  }

  // ============================================
  // UPDATE METHODS
  // ============================================

  /**
   * Update treatment notes
   * PATCH /treatment-records/{treatment_id}
   */
  async updateTreatment(
    treatmentId: string,
    updateData: TreatmentUpdateRequest
  ): Promise<TreatmentUpdateResponse> {
    try {
      const response = await apiClient.patch<TreatmentUpdateResponse>(
        `/treatment-records/${treatmentId}`,
        updateData
      )
      console.log('✅ Treatment updated')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update treatment'))
    }
  }

  // ============================================
  // DELETE METHODS
  // ============================================

  /**
   * Delete treatment record
   * DELETE /treatment-records/{treatment_id}
   */
  async deleteTreatment(treatmentId: string): Promise<TreatmentDeleteResponse> {
    try {
      const response = await apiClient.delete<TreatmentDeleteResponse>(
        `/treatment-records/${treatmentId}`
      )
      console.log('✅ Treatment deleted')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete treatment'))
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Filter treatments by consultation ID
   */
  filterByConsultation(treatments: Treatment[], consultationId: string): Treatment[] {
    return treatments.filter((t) => t.consultation_rec_id === consultationId)
  }

  /**
   * Filter treatments by treatment service code
   */
  filterByServiceCode(treatments: Treatment[], serviceCode: string): Treatment[] {
    return treatments.filter((t) => t.treatment_service_code === serviceCode)
  }

  /**
   * Format treatment display (name + price)
   */
  formatTreatmentDisplay(treatment: Treatment): string {
    const name = treatment.treatment_name || 'Unknown'
    const price = treatment.base_price ? `LKR ${treatment.base_price.toLocaleString()}` : ''
    return price ? `${name} (${price})` : name
  }

  /**
   * Calculate total cost for treatments
   */
  calculateTotalCost(treatments: Treatment[]): number {
    return treatments.reduce((total, t) => total + (t.base_price || 0), 0)
  }

  /**
   * Get treatment duration display
   */
  formatDuration(duration?: string): string {
    if (!duration) return 'N/A'

    const [hours, minutes, seconds] = duration.split(':').map(Number)
    const parts: string[] = []

    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (seconds > 0) parts.push(`${seconds}s`)

    return parts.length > 0 ? parts.join(' ') : '0s'
  }

  /**
   * Sort treatments by date (newest first)
   */
  sortByDate(
    treatments: Treatment[],
    order: 'asc' | 'desc' = 'desc'
  ): Treatment[] {
    return [...treatments].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return order === 'asc' ? dateA - dateB : dateB - dateA
    })
  }

  /**
   * Sort treatments by cost
   */
  sortByCost(
    treatments: Treatment[],
    order: 'asc' | 'desc' = 'asc'
  ): Treatment[] {
    return [...treatments].sort((a, b) => {
      const costA = a.base_price || 0
      const costB = b.base_price || 0
      return order === 'asc' ? costA - costB : costB - costA
    })
  }

  /**
   * Get most expensive treatment
   */
  getMostExpensive(treatments: Treatment[]): Treatment | null {
    if (treatments.length === 0) return null
    return treatments.reduce((max, t) =>
      (t.base_price || 0) > (max.base_price || 0) ? t : max
    )
  }

  /**
   * Get cheapest treatment
   */
  getCheapest(treatments: Treatment[]): Treatment | null {
    if (treatments.length === 0) return null
    return treatments.reduce((min, t) =>
      (t.base_price || 0) < (min.base_price || 0) ? t : min
    )
  }

  /**
   * Get average treatment cost
   */
  getAverageCost(treatments: Treatment[]): number {
    if (treatments.length === 0) return 0
    const total = this.calculateTotalCost(treatments)
    return Math.round((total / treatments.length) * 100) / 100
  }

  /**
   * Group treatments by service code
   */
  groupByServiceCode(treatments: Treatment[]): Record<string, Treatment[]> {
    const grouped: Record<string, Treatment[]> = {}

    treatments.forEach((treatment) => {
      const code = treatment.treatment_service_code
      if (!grouped[code]) {
        grouped[code] = []
      }
      grouped[code].push(treatment)
    })

    return grouped
  }

  /**
   * Group treatments by consultation
   */
  groupByConsultation(treatments: Treatment[]): Record<string, Treatment[]> {
    const grouped: Record<string, Treatment[]> = {}

    treatments.forEach((treatment) => {
      const consultationId = treatment.consultation_rec_id
      if (!grouped[consultationId]) {
        grouped[consultationId] = []
      }
      grouped[consultationId].push(treatment)
    })

    return grouped
  }

  /**
   * Search treatments by name or notes
   */
  searchTreatments(treatments: Treatment[], query: string): Treatment[] {
    if (!query || query.trim().length === 0) {
      return treatments
    }

    const lowerQuery = query.toLowerCase()
    return treatments.filter(
      (treatment) =>
        treatment.treatment_name?.toLowerCase().includes(lowerQuery) ||
        treatment.notes?.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Create treatment summary for consultation
   */
  generateConsultationSummary(treatments: Treatment[]): {
    total_treatments: number
    total_cost: number
    average_cost: number
    by_service: Record<string, { count: number; total_cost: number }>
  } {
    const byService: Record<string, { count: number; total_cost: number }> = {}

    treatments.forEach((treatment) => {
      const serviceName = treatment.treatment_name || 'Unknown'
      if (!byService[serviceName]) {
        byService[serviceName] = { count: 0, total_cost: 0 }
      }
      byService[serviceName].count++
      byService[serviceName].total_cost += treatment.base_price || 0
    })

    return {
      total_treatments: treatments.length,
      total_cost: this.calculateTotalCost(treatments),
      average_cost: this.getAverageCost(treatments),
      by_service: byService,
    }
  }

  /**
   * Get revenue statistics from treatment stats
   */
  getRevenueStats(stats: TreatmentStatistics[]): {
    total_treatments: number
    total_revenue: number
    average_revenue_per_treatment: number
    top_revenue_treatment: TreatmentStatistics | null
  } {
    if (stats.length === 0) {
      return {
        total_treatments: 0,
        total_revenue: 0,
        average_revenue_per_treatment: 0,
        top_revenue_treatment: null,
      }
    }

    const totalTreatments = stats.reduce((sum, s) => sum + s.times_used, 0)
    const totalRevenue = stats.reduce((sum, s) => sum + s.total_revenue, 0)
    const topRevenue = stats.reduce((max, s) =>
      s.total_revenue > max.total_revenue ? s : max
    )

    return {
      total_treatments: totalTreatments,
      total_revenue: totalRevenue,
      average_revenue_per_treatment: Math.round((totalRevenue / totalTreatments) * 100) / 100,
      top_revenue_treatment: topRevenue,
    }
  }

  /**
   * Export treatments as CSV
   */
  exportAsCSV(treatments: Treatment[], filename: string = 'treatments.csv'): void {
    const headers = [
      'Treatment ID',
      'Service Code',
      'Treatment Name',
      'Price',
      'Duration',
      'Notes',
      'Created At',
    ]

    const rows = treatments.map((treatment) => [
      treatment.treatment_id || '',
      treatment.treatment_service_code,
      treatment.treatment_name || '',
      treatment.base_price?.toString() || '',
      this.formatDuration(treatment.duration),
      treatment.notes || '',
      treatment.created_at || '',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /**
   * Validate treatment data before submission
   */
  validateTreatmentData(data: TreatmentCreateRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.consultation_rec_id || data.consultation_rec_id.trim().length === 0) {
      errors.push('Consultation record ID is required')
    }

    if (!data.treatment_service_code || data.treatment_service_code.trim().length === 0) {
      errors.push('Treatment service code is required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

export default new TreatmentService()