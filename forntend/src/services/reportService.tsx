import apiClient, { handleApiError } from './api'

// ============================================
// REPORT DATA TYPES
// ============================================

interface BranchAppointmentData {
  branch_name: string
  available_date: string
  status: string
  appointment_count: number
}

interface BranchAppointmentResponse {
  success: boolean
  total_records: number
  data: BranchAppointmentData[]
}

interface DoctorRevenueData {
  doctor_id: string
  doctor_name: string
  month: string
  revenue: number
}

interface DoctorRevenueResponse {
  success: boolean
  total_records: number
  total_revenue: number
  data: DoctorRevenueData[]
}

interface OutstandingBalanceData {
  patient_id: string
  patient_name: string
  patient_balance: number
}

interface OutstandingBalanceResponse {
  success: boolean
  total_patients: number
  total_outstanding: number
  data: OutstandingBalanceData[]
}

interface TreatmentByCategoryData {
  treatment_name: string
  treatment_count: number
  total_revenue: number
}

interface TreatmentByCategoryResponse {
  success: boolean
  total_categories: number
  total_treatments: number
  total_revenue: number
  data: TreatmentByCategoryData[]
}

interface PaymentMethodDetail {
  payment_method: string
  patient_count: number
  avg_payment: number
  total: number
}

interface InsuranceVsOutOfPocketResponse {
  success: boolean
  insurance_total: number
  insurance_count: number
  out_of_pocket_total: number
  out_of_pocket_count: number
  grand_total: number
  insurance_percentage: number
  details: PaymentMethodDetail[]
}

interface BalanceStatusLevel {
  level: 'High' | 'Medium' | 'Low'
  icon: string
  color: string
  threshold: number
}

// ============================================
// QUERY PARAMETERS
// ============================================

interface DateRangeFilter {
  date_from?: string
  date_to?: string
}

interface DoctorRevenueFilter extends DateRangeFilter {
  year?: number
  month?: string
  doctor_id?: string
}

interface BalanceFilter {
  min_balance?: number
  max_balance?: number
  sort_by?: 'balance_desc' | 'balance_asc'
}

/**
 * Report Service
 * Handles PDF report generation and data fetching
 */
class ReportService {
  // ============================================
  // PDF GENERATION METHODS
  // ============================================

  /**
   * Generate branch appointment summary PDF
   * @param dateFrom - Start date (YYYY-MM-DD)
   * @param dateTo - End date (YYYY-MM-DD)
   * @param branchName - Filter by specific branch
   * @returns PDF blob for download
   */
  async generateBranchAppointmentPDF(
    dateFrom?: string,
    dateTo?: string,
    branchName?: string
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      if (branchName) params.append('branch_name', branchName)

      const response = await apiClient.get(
        `/reports/branch-appointments/pdf?${params.toString()}`,
        { responseType: 'blob' }
      )
      console.log('✅ Branch appointment PDF generated')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to generate branch appointment PDF'))
    }
  }

  /**
   * Generate doctor revenue PDF
   * @param year - Filter by year
   * @param month - Filter by month (YYYY-MM)
   * @param doctorId - Filter by specific doctor
   * @returns PDF blob for download
   */
  async generateDoctorRevenuePDF(
    year?: number,
    month?: string,
    doctorId?: string
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams()
      if (year) params.append('year', year.toString())
      if (month) params.append('month', month)
      if (doctorId) params.append('doctor_id', doctorId)

      const response = await apiClient.get(
        `/reports/doctor-revenue/pdf?${params.toString()}`,
        { responseType: 'blob' }
      )
      console.log('✅ Doctor revenue PDF generated')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to generate doctor revenue PDF'))
    }
  }

  /**
   * Generate outstanding balances PDF
   * @param minBalance - Minimum balance threshold
   * @param maxBalance - Maximum balance threshold
   * @param sortBy - Sort order (balance_desc or balance_asc)
   * @returns PDF blob for download
   */
  async generateOutstandingBalancesPDF(
    minBalance?: number,
    maxBalance?: number,
    sortBy: 'balance_desc' | 'balance_asc' = 'balance_desc'
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams()
      if (minBalance !== undefined) params.append('min_balance', minBalance.toString())
      if (maxBalance !== undefined) params.append('max_balance', maxBalance.toString())
      params.append('sort_by', sortBy)

      const response = await apiClient.get(
        `/reports/outstanding-balances/pdf?${params.toString()}`,
        { responseType: 'blob' }
      )
      console.log('✅ Outstanding balances PDF generated')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to generate outstanding balances PDF'))
    }
  }

  /**
   * Generate treatments by category PDF
   * @param dateFrom - Start date (YYYY-MM-DD)
   * @param dateTo - End date (YYYY-MM-DD)
   * @returns PDF blob for download
   */
  async generateTreatmentsByCategoryPDF(dateFrom?: string, dateTo?: string): Promise<Blob> {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      const response = await apiClient.get(
        `/reports/treatments-by-category/pdf?${params.toString()}`,
        { responseType: 'blob' }
      )
      console.log('✅ Treatments by category PDF generated')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to generate treatments by category PDF'))
    }
  }

  /**
   * Generate insurance vs out-of-pocket PDF
   * @param dateFrom - Start date (YYYY-MM-DD)
   * @param dateTo - End date (YYYY-MM-DD)
   * @returns PDF blob for download
   */
  async generateInsuranceVsOutOfPocketPDF(dateFrom?: string, dateTo?: string): Promise<Blob> {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      const response = await apiClient.get(
        `/reports/insurance-vs-outofpocket/pdf?${params.toString()}`,
        { responseType: 'blob' }
      )
      console.log('✅ Insurance vs out-of-pocket PDF generated')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to generate insurance vs out-of-pocket PDF'))
    }
  }

  // ============================================
  // DATA FETCHING METHODS
  // ============================================

  /**
   * Get branch appointment data
   * @param dateFrom - Start date (YYYY-MM-DD)
   * @param dateTo - End date (YYYY-MM-DD)
   * @param branchName - Filter by specific branch
   * @returns Raw data for preview
   */
  async getBranchAppointmentData(
    dateFrom?: string,
    dateTo?: string,
    branchName?: string
  ): Promise<BranchAppointmentResponse> {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      if (branchName) params.append('branch_name', branchName)

      const response = await apiClient.get<BranchAppointmentResponse>(
        `/reports/branch-appointments/data?${params.toString()}`
      )
      console.log('✅ Fetched branch appointment data')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch branch appointment data'))
    }
  }

  /**
   * Get doctor revenue data
   * @param year - Filter by year
   * @param month - Filter by month (YYYY-MM)
   * @param doctorId - Filter by specific doctor
   * @returns Raw data for preview
   */
  async getDoctorRevenueData(
    year?: number,
    month?: string,
    doctorId?: string
  ): Promise<DoctorRevenueResponse> {
    try {
      const params = new URLSearchParams()
      if (year) params.append('year', year.toString())
      if (month) params.append('month', month)
      if (doctorId) params.append('doctor_id', doctorId)

      const response = await apiClient.get<DoctorRevenueResponse>(
        `/reports/doctor-revenue/data?${params.toString()}`
      )
      console.log('✅ Fetched doctor revenue data')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch doctor revenue data'))
    }
  }

  /**
   * Get outstanding balances data
   * @param minBalance - Minimum balance threshold
   * @param maxBalance - Maximum balance threshold
   * @returns Raw data for preview
   */
  async getOutstandingBalancesData(
    minBalance?: number,
    maxBalance?: number
  ): Promise<OutstandingBalanceResponse> {
    try {
      const params = new URLSearchParams()
      if (minBalance !== undefined) params.append('min_balance', minBalance.toString())
      if (maxBalance !== undefined) params.append('max_balance', maxBalance.toString())

      const response = await apiClient.get<OutstandingBalanceResponse>(
        `/reports/outstanding-balances/data?${params.toString()}`
      )
      console.log('✅ Fetched outstanding balances data')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch outstanding balances data'))
    }
  }

  /**
   * Get treatments by category data
   * @param dateFrom - Start date (YYYY-MM-DD)
   * @param dateTo - End date (YYYY-MM-DD)
   * @returns Raw data for preview
   */
  async getTreatmentsByCategoryData(
    dateFrom?: string,
    dateTo?: string
  ): Promise<TreatmentByCategoryResponse> {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      const response = await apiClient.get<TreatmentByCategoryResponse>(
        `/reports/treatments-by-category/data?${params.toString()}`
      )
      console.log('✅ Fetched treatments by category data')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch treatments by category data'))
    }
  }

  /**
   * Get insurance vs out-of-pocket data
   * @param dateFrom - Start date (YYYY-MM-DD)
   * @param dateTo - End date (YYYY-MM-DD)
   * @returns Raw data for preview
   */
  async getInsuranceVsOutOfPocketData(
    dateFrom?: string,
    dateTo?: string
  ): Promise<InsuranceVsOutOfPocketResponse> {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      const response = await apiClient.get<InsuranceVsOutOfPocketResponse>(
        `/reports/insurance-vs-outofpocket/data?${params.toString()}`
      )
      console.log('✅ Fetched insurance vs out-of-pocket data')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch insurance vs out-of-pocket data'))
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Download PDF file
   */
  downloadPDF(blob: Blob, filename: string): void {
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
   * Get balance status level
   */
  getBalanceStatusLevel(balance: number): BalanceStatusLevel {
    if (balance > 10000) {
      return {
        level: 'High',
        icon: '🔴',
        color: 'red',
        threshold: 10000,
      }
    } else if (balance >= 5000) {
      return {
        level: 'Medium',
        icon: '🟠',
        color: 'orange',
        threshold: 5000,
      }
    }

    return {
      level: 'Low',
      icon: '🟢',
      color: 'green',
      threshold: 0,
    }
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency: string = 'LKR'): string {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  /**
   * Calculate percentage
   */
  calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
  }

  /**
   * Get top performer from doctor revenue data
   */
  getTopPerformer(data: DoctorRevenueData[]): DoctorRevenueData | null {
    if (data.length === 0) return null
    return data.reduce((max, current) =>
      current.revenue > max.revenue ? current : max
    )
  }

  /**
   * Get total appointments by status
   */
  getAppointmentsByStatus(
    data: BranchAppointmentData[]
  ): Record<string, number> {
    const status: Record<string, number> = {}
    data.forEach((item) => {
      status[item.status] = (status[item.status] || 0) + item.appointment_count
    })
    return status
  }

  /**
   * Group branch appointments by branch
   */
  groupByBranch(data: BranchAppointmentData[]): Record<string, BranchAppointmentData[]> {
    const grouped: Record<string, BranchAppointmentData[]> = {}
    data.forEach((item) => {
      if (!grouped[item.branch_name]) {
        grouped[item.branch_name] = []
      }
      grouped[item.branch_name].push(item)
    })
    return grouped
  }

  /**
   * Group doctor revenue by doctor
   */
  groupRevenueByDoctor(data: DoctorRevenueData[]): Record<string, DoctorRevenueData[]> {
    const grouped: Record<string, DoctorRevenueData[]> = {}
    data.forEach((item) => {
      if (!grouped[item.doctor_name]) {
        grouped[item.doctor_name] = []
      }
      grouped[item.doctor_name].push(item)
    })
    return grouped
  }

  /**
   * Get top balances
   */
  getTopBalances(
    data: OutstandingBalanceData[],
    limit: number = 10
  ): OutstandingBalanceData[] {
    return data.slice(0, limit)
  }

  /**
   * Get high-risk patients (balance > 10000)
   */
  getHighRiskPatients(data: OutstandingBalanceData[]): OutstandingBalanceData[] {
    return data.filter((item) => item.patient_balance > 10000)
  }

  /**
   * Get medium-risk patients (5000-10000)
   */
  getMediumRiskPatients(data: OutstandingBalanceData[]): OutstandingBalanceData[] {
    return data.filter(
      (item) => item.patient_balance >= 5000 && item.patient_balance <= 10000
    )
  }

  /**
   * Get low-risk patients (< 5000)
   */
  getLowRiskPatients(data: OutstandingBalanceData[]): OutstandingBalanceData[] {
    return data.filter((item) => item.patient_balance < 5000)
  }

  /**
   * Get top treatments by count
   */
  getTopTreatments(
    data: TreatmentByCategoryData[],
    limit: number = 5
  ): TreatmentByCategoryData[] {
    return data.slice(0, limit)
  }

  /**
   * Get top treatments by revenue
   */
  getTopTreatmentsByRevenue(
    data: TreatmentByCategoryData[],
    limit: number = 5
  ): TreatmentByCategoryData[] {
    return [...data]
      .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
      .slice(0, limit)
  }

  /**
   * Format branch appointment summary
   */
  formatBranchAppointmentSummary(data: BranchAppointmentData[]): string {
    let summary = `📋 BRANCH APPOINTMENT SUMMARY\n`
    summary += `${'='.repeat(50)}\n\n`

    const grouped = this.groupByBranch(data)
    const statusBreakdown = this.getAppointmentsByStatus(data)

    summary += `📍 BRANCHES: ${Object.keys(grouped).length}\n`
    summary += `📅 TOTAL APPOINTMENTS: ${data.reduce((sum, item) => sum + item.appointment_count, 0)}\n\n`

    summary += `STATUS BREAKDOWN:\n`
    summary += `${'-'.repeat(50)}\n`
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      summary += `${status}: ${count}\n`
    })

    summary += `\nBRANCH DETAILS:\n`
    summary += `${'-'.repeat(50)}\n`
    Object.entries(grouped).forEach(([branchName, items]) => {
      const total = items.reduce((sum, item) => sum + item.appointment_count, 0)
      summary += `${branchName}: ${total} appointments\n`
    })

    return summary
  }

  /**
   * Format doctor revenue summary
   */
  formatDoctorRevenueSummary(data: DoctorRevenueData[]): string {
    let summary = `💰 DOCTOR REVENUE SUMMARY\n`
    summary += `${'='.repeat(50)}\n\n`

    const total = data.reduce((sum, item) => sum + item.revenue, 0)
    const topPerformer = this.getTopPerformer(data)
    const grouped = this.groupRevenueByDoctor(data)

    summary += `💵 TOTAL REVENUE: ${this.formatCurrency(total)}\n`
    summary += `👨‍⚕️ DOCTORS: ${Object.keys(grouped).length}\n`
    summary += `📅 RECORDS: ${data.length}\n\n`

    if (topPerformer) {
      summary += `🏆 TOP PERFORMER: Dr. ${topPerformer.doctor_name}\n`
      summary += `   Revenue: ${this.formatCurrency(topPerformer.revenue)}\n\n`
    }

    summary += `DOCTOR BREAKDOWN:\n`
    summary += `${'-'.repeat(50)}\n`
    Object.entries(grouped).forEach(([doctorName, items]) => {
      const doctorTotal = items.reduce((sum, item) => sum + item.revenue, 0)
      const percentage = this.calculatePercentage(doctorTotal, total)
      summary += `${doctorName}: ${this.formatCurrency(doctorTotal)} (${percentage}%)\n`
    })

    return summary
  }

  /**
   * Format outstanding balances summary
   */
  formatOutstandingBalancesSummary(data: OutstandingBalanceResponse): string {
    let summary = `⚠️ OUTSTANDING BALANCES SUMMARY\n`
    summary += `${'='.repeat(50)}\n\n`

    const highRisk = this.getHighRiskPatients(data.data)
    const mediumRisk = this.getMediumRiskPatients(data.data)
    const lowRisk = this.getLowRiskPatients(data.data)

    summary += `💰 TOTAL OUTSTANDING: ${this.formatCurrency(data.total_outstanding)}\n`
    summary += `👥 PATIENTS: ${data.total_patients}\n`
    summary += `📊 AVERAGE BALANCE: ${this.formatCurrency(data.total_outstanding / Math.max(data.total_patients, 1))}\n\n`

    summary += `RISK BREAKDOWN:\n`
    summary += `${'-'.repeat(50)}\n`
    summary += `🔴 HIGH RISK (>10,000): ${highRisk.length} patients\n`
    summary += `🟠 MEDIUM RISK (5,000-10,000): ${mediumRisk.length} patients\n`
    summary += `🟢 LOW RISK (<5,000): ${lowRisk.length} patients\n\n`

    if (highRisk.length > 0) {
      summary += `TOP HIGH-RISK PATIENTS:\n`
      summary += `${'-'.repeat(50)}\n`
      highRisk.slice(0, 5).forEach((patient) => {
        summary += `${patient.patient_name}: ${this.formatCurrency(patient.patient_balance)}\n`
      })
    }

    return summary
  }

  /**
   * Format insurance vs out-of-pocket summary
   */
  formatInsuranceVsOutOfPocketSummary(data: InsuranceVsOutOfPocketResponse): string {
    let summary = `🏥 INSURANCE VS OUT-OF-POCKET ANALYSIS\n`
    summary += `${'='.repeat(50)}\n\n`

    summary += `💵 TOTAL PAYMENTS: ${this.formatCurrency(data.grand_total)}\n`
    summary += `🏢 Insurance: ${this.formatCurrency(data.insurance_total)} (${data.insurance_percentage.toFixed(1)}%)\n`
    summary += `💳 Out-of-Pocket: ${this.formatCurrency(data.out_of_pocket_total)} (${(100 - data.insurance_percentage).toFixed(1)}%)\n\n`

    summary += `TRANSACTION COUNT:\n`
    summary += `${'-'.repeat(50)}\n`
    summary += `Insurance: ${data.insurance_count} transactions\n`
    summary += `Out-of-Pocket: ${data.out_of_pocket_count} transactions\n\n`

    summary += `PAYMENT METHOD BREAKDOWN:\n`
    summary += `${'-'.repeat(50)}\n`
    data.details.forEach((detail) => {
      const percentage = this.calculatePercentage(detail.total, data.grand_total)
      summary += `${detail.payment_method}: ${this.formatCurrency(detail.total)} (${percentage}%) - ${detail.patient_count} patients\n`
    })

    return summary
  }

  /**
   * Export report data as CSV
   */
  exportAsCSV(data: unknown[], filename: string): void {
    if (data.length === 0) {
      console.warn('No data to export')
      return
    }

    const headers = Object.keys(data[0] as Record<string, unknown>)
    const csv = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = (row as Record<string, unknown>)[header]
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : value
          })
          .join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    this.downloadPDF(blob, filename)
  }

  /**
   * Get date range label
   */
  getDateRangeLabel(dateFrom?: string, dateTo?: string): string {
    if (!dateFrom && !dateTo) return 'All Time'
    if (dateFrom && dateTo) return `${dateFrom} to ${dateTo}`
    if (dateFrom) return `From ${dateFrom}`
    if (dateTo) return `Until ${dateTo}`
    return 'Custom Period'
  }

  /**
   * Validate date range
   */
  isValidDateRange(dateFrom?: string, dateTo?: string): boolean {
    if (!dateFrom || !dateTo) return true

    const from = new Date(dateFrom)
    const to = new Date(dateTo)
    return from <= to
  }
}

export default new ReportService()