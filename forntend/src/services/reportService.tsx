import { apiClient, handleApiError } from '@/services/api'

export interface ReportFilters {
  dateFrom?: string
  dateTo?: string
  branchName?: string
  year?: number
  month?: string
  doctorId?: string
  minBalance?: string
  maxBalance?: string
}

export interface BranchAppointment {
  branch_name: string
  available_date: string
  status: string
  appointment_count: number
}

export interface BranchAppointmentsReport {
  total_records: number
  data: BranchAppointment[]
}

export interface DoctorRevenueItem {
  doctor_name: string
  month: string
  revenue: number
}

export interface DoctorRevenueReport {
  total_revenue: number
  total_records: number
  data: DoctorRevenueItem[]
}

export interface OutstandingBalance {
  patient_id: string
  patient_name: string
  patient_balance: number
}

export interface OutstandingBalancesReport {
  total_outstanding: number
  total_patients: number
  data: OutstandingBalance[]
}

export interface TreatmentItem {
  treatment_name: string
  treatment_count: number
  total_revenue: number
}

export interface TreatmentsByCategoryReport {
  total_treatments: number
  total_revenue: number
  data: TreatmentItem[]
}

export interface InsuranceDetail {
  payment_method: string
  patient_count: number
  avg_payment: number
  total: number
}

export interface InsuranceVsOutOfPocketReport {
  insurance_total: number
  out_of_pocket_total: number
  details: InsuranceDetail[]
}

type ReportType = 
  | 'branch-appointments' 
  | 'doctor-revenue' 
  | 'outstanding-balances' 
  | 'treatments' 
  | 'insurance'

class ReportService {
  /**
   * Fetch branch appointments report data
   */
  async getBranchAppointments(
    filters: ReportFilters
  ): Promise<BranchAppointmentsReport> {
    try {
      let url = '/reports/branch-appointments/data?'
      const params = new URLSearchParams()
      
      if (filters.dateFrom) params.append('date_from', filters.dateFrom)
      if (filters.dateTo) params.append('date_to', filters.dateTo)
      if (filters.branchName) params.append('branch_name', filters.branchName)
      
      url += params.toString()
      const response = await apiClient.get<BranchAppointmentsReport>(url)
      return response.data
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch branch appointments report')
      )
    }
  }

  /**
   * Fetch doctor revenue report data
   */
  async getDoctorRevenue(
    filters: ReportFilters
  ): Promise<DoctorRevenueReport> {
    try {
      let url = '/reports/doctor-revenue/data?'
      const params = new URLSearchParams()
      
      if (filters.year) params.append('year', filters.year.toString())
      if (filters.month) params.append('month', filters.month)
      if (filters.doctorId) params.append('doctor_id', filters.doctorId)
      
      url += params.toString()
      const response = await apiClient.get<DoctorRevenueReport>(url)
      return response.data
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch doctor revenue report')
      )
    }
  }

  /**
   * Fetch outstanding balances report data
   */
  async getOutstandingBalances(
    filters: ReportFilters
  ): Promise<OutstandingBalancesReport> {
    try {
      let url = '/reports/outstanding-balances/data?'
      const params = new URLSearchParams()
      
      if (filters.minBalance) params.append('min_balance', filters.minBalance)
      if (filters.maxBalance) params.append('max_balance', filters.maxBalance)
      
      url += params.toString()
      const response = await apiClient.get<OutstandingBalancesReport>(url)
      return response.data
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch outstanding balances report')
      )
    }
  }

  /**
   * Fetch treatments by category report data
   */
  async getTreatmentsByCategory(
    filters: ReportFilters
  ): Promise<TreatmentsByCategoryReport> {
    try {
      let url = '/reports/treatments-by-category/data?'
      const params = new URLSearchParams()
      
      if (filters.dateFrom) params.append('date_from', filters.dateFrom)
      if (filters.dateTo) params.append('date_to', filters.dateTo)
      
      url += params.toString()
      const response = await apiClient.get<TreatmentsByCategoryReport>(url)
      return response.data
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch treatments report')
      )
    }
  }

  /**
   * Fetch insurance vs out-of-pocket report data
   */
  async getInsuranceVsOutOfPocket(
    filters: ReportFilters
  ): Promise<InsuranceVsOutOfPocketReport> {
    try {
      let url = '/reports/insurance-vs-outofpocket/data?'
      const params = new URLSearchParams()
      
      if (filters.dateFrom) params.append('date_from', filters.dateFrom)
      if (filters.dateTo) params.append('date_to', filters.dateTo)
      
      url += params.toString()
      const response = await apiClient.get<InsuranceVsOutOfPocketReport>(url)
      return response.data
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch insurance report')
      )
    }
  }

  /**
   * Download PDF report
   */
  async downloadPDF(
    reportType: ReportType,
    filters: ReportFilters
  ): Promise<void> {
    try {
      let url = `/reports/${reportType}/pdf?`
      const params = new URLSearchParams()
      
      if (filters.dateFrom) params.append('date_from', filters.dateFrom)
      if (filters.dateTo) params.append('date_to', filters.dateTo)
      if (filters.branchName) params.append('branch_name', filters.branchName)
      if (filters.year) params.append('year', filters.year.toString())
      if (filters.month) params.append('month', filters.month)
      if (filters.doctorId) params.append('doctor_id', filters.doctorId)
      if (filters.minBalance) params.append('min_balance', filters.minBalance)
      if (filters.maxBalance) params.append('max_balance', filters.maxBalance)
      
      url += params.toString()
      const response = await apiClient.get<Blob>(url, {
        responseType: 'blob' as any,
      })
      
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to download PDF report'))
    }
  }
}

export default new ReportService()