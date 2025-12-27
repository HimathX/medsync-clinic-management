import apiClient, { handleApiError } from './api'

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Treatment {
  treatment_service_code?: string
  treatment_name: string
  base_price: number
  duration: string | number // Can be HH:MM:SS or seconds
  description?: string
  [key: string]: unknown
}

export interface TreatmentCreateRequest {
  treatment_name: string
  base_price: number
  duration: string
  description?: string
}

export interface TreatmentUpdateRequest {
  treatment_name?: string
  base_price?: number
  duration?: string
  description?: string
}

export interface BulkTreatmentCreate {
  treatments: TreatmentCreateRequest[]
}

export interface BulkTreatmentResult {
  treatment_name: string
  success: boolean
  treatment_service_code?: string
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
  treatment_service_code?: string
}

export interface TreatmentListResponse {
  total: number
  returned: number
  treatments: Treatment[]
}

export interface TreatmentDetailsResponse {
  treatment: Treatment
  usage_stats: {
    total_treatments_performed: number
  }
}

export interface TreatmentUpdateResponse {
  success: boolean
  message: string
  treatment: Treatment
}

export interface TreatmentDeleteResponse {
  success: boolean
  message: string
  treatment_service_code: string
  was_forced: boolean
  had_treatments: boolean
}

export interface TreatmentStatistics {
  treatment_service_code: string
  treatment_name: string
  base_price: number
  duration: string | number
  times_performed: number
  total_revenue: number
}

export interface TreatmentStatisticsResponse {
  top_treatments: TreatmentStatistics[]
}

export interface PriceRangeResponse {
  price_range: {
    min: number
    max: number
  }
  count: number
  treatments: Treatment[]
}

// ============================================
// TREATMENT CATALOGUE SERVICE
// ============================================

class TreatmentCatalogueService {
  // ============================================
  // CREATE METHODS
  // ============================================

  /**
   * Create single treatment
   * POST /treatment-catalogue/
   */
  async createTreatment(treatmentData: TreatmentCreateRequest): Promise<TreatmentResponse> {
    try {
      const response = await apiClient.post<TreatmentResponse>(
        '/treatment-catalogue/',
        treatmentData
      )
      console.log('✅ Treatment created')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create treatment'))
    }
  }

  /**
   * Create bulk treatments
   * POST /treatment-catalogue/bulk
   */
  async createBulkTreatments(
    bulkData: BulkTreatmentCreate
  ): Promise<BulkTreatmentResponse> {
    try {
      const response = await apiClient.post<BulkTreatmentResponse>(
        '/treatment-catalogue/bulk',
        bulkData
      )
      console.log('✅ Bulk treatments created')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create bulk treatments'))
    }
  }

  // ============================================
  // GET METHODS
  // ============================================

  /**
   * Get all treatments with filters
   * GET /treatment-catalogue/?skip=0&limit=100&search=&min_price=&max_price=
   */
  async getAllTreatments(
    skip: number = 0,
    limit: number = 100,
    search?: string,
    minPrice?: number,
    maxPrice?: number
  ): Promise<TreatmentListResponse> {
    try {
      const params = new URLSearchParams()
      params.append('skip', skip.toString())
      params.append('limit', Math.min(Math.max(limit, 1), 500).toString())
      if (search) params.append('search', search)
      if (minPrice !== undefined) params.append('min_price', minPrice.toString())
      if (maxPrice !== undefined) params.append('max_price', maxPrice.toString())

      const response = await apiClient.get<TreatmentListResponse>(
        `/treatment-catalogue/?${params.toString()}`
      )
      console.log('✅ Fetched all treatments')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatments'))
    }
  }

  /**
   * Get treatment by ID
   * GET /treatment-catalogue/{treatment_service_code}
   */
  async getTreatmentById(serviceCode: string): Promise<TreatmentDetailsResponse> {
    try {
      const response = await apiClient.get<TreatmentDetailsResponse>(
        `/treatment-catalogue/${serviceCode}`
      )
      console.log('✅ Fetched treatment details')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatment'))
    }
  }

  /**
   * Get treatments by price range
   * GET /treatment-catalogue/price-range/{min_price}/{max_price}
   */
  async getTreatmentsByPriceRange(
    minPrice: number,
    maxPrice: number
  ): Promise<PriceRangeResponse> {
    try {
      if (maxPrice < minPrice) {
        throw new Error('Max price must be greater than or equal to min price')
      }

      const response = await apiClient.get<PriceRangeResponse>(
        `/treatment-catalogue/price-range/${minPrice}/${maxPrice}`
      )
      console.log('✅ Fetched treatments by price range')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatments by price range'))
    }
  }

  /**
   * Get treatment statistics
   * GET /treatment-catalogue/statistics/usage?limit=10
   */
  async getTreatmentStatistics(limit: number = 10): Promise<TreatmentStatisticsResponse> {
    try {
      const params = new URLSearchParams()
      params.append('limit', Math.min(Math.max(limit, 1), 100).toString())

      const response = await apiClient.get<TreatmentStatisticsResponse>(
        `/treatment-catalogue/statistics/usage?${params.toString()}`
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
   * Update treatment
   * PATCH /treatment-catalogue/{treatment_service_code}
   */
  async updateTreatment(
    serviceCode: string,
    updateData: TreatmentUpdateRequest
  ): Promise<TreatmentUpdateResponse> {
    try {
      const response = await apiClient.patch<TreatmentUpdateResponse>(
        `/treatment-catalogue/${serviceCode}`,
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
   * Delete treatment
   * DELETE /treatment-catalogue/{treatment_service_code}?force=false
   */
  async deleteTreatment(
    serviceCode: string,
    force: boolean = false
  ): Promise<TreatmentDeleteResponse> {
    try {
      const params = new URLSearchParams()
      params.append('force', force.toString())

      const response = await apiClient.delete<TreatmentDeleteResponse>(
        `/treatment-catalogue/${serviceCode}?${params.toString()}`
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
   * Search treatments by name/description
   */
  searchTreatments(treatments: Treatment[], query: string): Treatment[] {
    if (!query || query.trim().length === 0) {
      return treatments
    }

    const lowerQuery = query.toLowerCase()
    return treatments.filter(
      (treatment) =>
        treatment.treatment_name.toLowerCase().includes(lowerQuery) ||
        treatment.description?.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Filter treatments by price range
   */
  filterByPrice(
    treatments: Treatment[],
    minPrice: number,
    maxPrice: number
  ): Treatment[] {
    return treatments.filter(
      (treatment) => treatment.base_price >= minPrice && treatment.base_price <= maxPrice
    )
  }

  /**
   * Format duration for display - handles both HH:MM:SS string and seconds (number)
   * @param duration - Can be "HH:MM:SS" string or seconds as number
   * @returns Readable format like "1h 30m" or "45s"
   */
  formatDuration(duration: string | number | undefined): string {
    if (!duration && duration !== 0) return '0s'

    let seconds = 0

    // If duration is a number, treat it as seconds
    if (typeof duration === 'number') {
      seconds = Math.round(duration)
    }
    // If duration is a string, try to parse it
    else if (typeof duration === 'string') {
      // Check if it's HH:MM:SS format
      if (duration.includes(':')) {
        const parts = duration.split(':').map(Number)
        if (parts.length === 3) {
          const [hours, minutes, secs] = parts
          seconds = hours * 3600 + minutes * 60 + secs
        } else {
          return duration // Return as-is if format is unexpected
        }
      } else {
        // Try to parse as number
        const parsed = parseInt(duration, 10)
        if (!isNaN(parsed)) {
          seconds = parsed
        } else {
          return duration // Return as-is if not a valid format
        }
      }
    }

    // Convert seconds to readable format
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts: string[] = []
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

    return parts.join(' ')
  }

  /**
   * Validate duration format (HH:MM:SS)
   */
  isValidDuration(duration: string): boolean {
    const regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/
    if (!regex.test(duration)) {
      return false
    }

    const [hours, minutes, seconds] = duration.split(':').map(Number)
    return !(hours === 0 && minutes === 0 && seconds === 0)
  }

  /**
   * Format currency for display
   */
  formatPrice(price: number, currency: string = 'LKR'): string {
    return `${currency} ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  /**
   * Sort treatments by price
   */
  sortByPrice(
    treatments: Treatment[],
    order: 'asc' | 'desc' = 'asc'
  ): Treatment[] {
    return [...treatments].sort((a, b) => {
      return order === 'asc' ? a.base_price - b.base_price : b.base_price - a.base_price
    })
  }

  /**
   * Sort treatments by name
   */
  sortByName(
    treatments: Treatment[],
    order: 'asc' | 'desc' = 'asc'
  ): Treatment[] {
    return [...treatments].sort((a, b) => {
      const comparison = a.treatment_name.localeCompare(b.treatment_name)
      return order === 'asc' ? comparison : -comparison
    })
  }

  /**
   * Get average treatment price
   */
  getAveragePrice(treatments: Treatment[]): number {
    if (treatments.length === 0) return 0
    const total = treatments.reduce((sum, t) => sum + t.base_price, 0)
    return Math.round((total / treatments.length) * 100) / 100
  }

  /**
   * Get total revenue from statistics
   */
  getTotalRevenue(stats: TreatmentStatistics[]): number {
    return stats.reduce((total, stat) => total + (stat.total_revenue || 0), 0)
  }

  /**
   * Get most performed treatment
   */
  getMostPerformedTreatment(stats: TreatmentStatistics[]): TreatmentStatistics | null {
    if (stats.length === 0) return null
    return stats.reduce((max, stat) =>
      stat.times_performed > max.times_performed ? stat : max
    )
  }

  /**
   * Export treatments as CSV
   */
  exportAsCSV(treatments: Treatment[], filename: string = 'treatments.csv'): void {
    const headers = ['Treatment Name', 'Price', 'Duration', 'Description']

    const rows = treatments.map((treatment) => [
      treatment.treatment_name,
      this.formatPrice(treatment.base_price),
      this.formatDuration(treatment.duration),
      treatment.description || '',
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
   * Generate treatment summary
   */
  generateSummary(treatments: Treatment[]): {
    total: number
    average_price: number
    min_price: number
    max_price: number
    by_price_range: Record<string, number>
  } {
    if (treatments.length === 0) {
      return {
        total: 0,
        average_price: 0,
        min_price: 0,
        max_price: 0,
        by_price_range: {},
      }
    }

    const prices = treatments.map((t) => t.base_price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)

    const priceRanges: Record<string, number> = {
      'Under 1000': 0,
      '1000-5000': 0,
      '5000-10000': 0,
      'Above 10000': 0,
    }

    treatments.forEach((treatment) => {
      if (treatment.base_price < 1000) priceRanges['Under 1000']++
      else if (treatment.base_price <= 5000) priceRanges['1000-5000']++
      else if (treatment.base_price <= 10000) priceRanges['5000-10000']++
      else priceRanges['Above 10000']++
    })

    return {
      total: treatments.length,
      average_price: this.getAveragePrice(treatments),
      min_price: minPrice,
      max_price: maxPrice,
      by_price_range: priceRanges,
    }
  }
}

export default new TreatmentCatalogueService()