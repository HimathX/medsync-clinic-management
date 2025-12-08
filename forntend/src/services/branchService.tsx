import apiClient, { handleApiError } from './api'

interface Branch {
  branch_id: string
  branch_name: string
  address_line1?: string
  address_line2?: string
  city?: string
  province?: string
  postal_code?: string
  country?: string
  contact_num1?: string
  contact_num2?: string
  manager_name?: string
  manager_email?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

interface BranchCreateData {
  branch_name: string
  address_line1?: string
  address_line2?: string
  city?: string
  province?: string
  postal_code?: string
  country?: string
  contact_num1?: string
  contact_num2?: string
}

interface BranchUpdateData {
  branch_name?: string
  address_line1?: string
  address_line2?: string
  city?: string
  province?: string
  postal_code?: string
  country?: string
  contact_num1?: string
  contact_num2?: string
  is_active?: boolean
}

interface BranchResponse {
  branch: Branch
}

interface BranchesListResponse {
  total: number
  returned: number
  branches: Branch[]
}

interface EmployeesResponse {
  branch_id: string
  branch_name: string
  total: number
  employees: Array<Record<string, unknown>>
}

interface DoctorsResponse {
  branch_id: string
  branch_name: string
  total: number
  doctors: Array<Record<string, unknown>>
}

interface PatientsResponse {
  branch_id: string
  branch_name: string
  total: number
  returned: number
  patients: Array<Record<string, unknown>>
}

interface AppointmentsResponse {
  branch_id: string
  branch_name: string
  total: number
  returned: number
  appointments: Array<Record<string, unknown>>
}

interface BranchStats {
  branch_id: string
  branch_name: string
  total_employees: number
  total_doctors: number
  total_patients: number
  total_appointments: number
  scheduled_appointments: number
}

interface SearchResponse {
  search_term?: string
  city?: string
  total: number
  branches: Branch[]
}

/**
 * Branch Service
 * Manages branch information, employees, doctors, patients, and appointments
 */
class BranchService {
  /**
   * Get all branches with pagination
   * @param skip - Number of records to skip
   * @param limit - Maximum records to return (max 500)
   * @param isActive - Filter by active status (default: true)
   * @returns List of branches
   */
  async getAllBranches(
    skip: number = 0,
    limit: number = 100,
    isActive: boolean = true
  ): Promise<Branch[]> {
    try {
      const params = new URLSearchParams()
      params.append('skip', skip.toString())
      params.append('limit', Math.min(limit, 500).toString())
      params.append('is_active', isActive.toString())

      const response = await apiClient.get<BranchesListResponse>(
        `/branches/?${params.toString()}`
      )
      console.log(`✅ Fetched ${response.data.returned} branches`)
      return response.data.branches || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch branches'))
    }
  }

  /**
   * Get branch by ID with full details
   * @param branchId - Branch ID
   * @returns Branch details with address, contact, and manager info
   */
  async getBranchById(branchId: string): Promise<Branch> {
    try {
      const response = await apiClient.get<BranchResponse>(`/branches/${branchId}`)
      console.log('✅ Fetched branch details')
      return response.data.branch
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch branch'))
    }
  }

  /**
   * Search branches by name (partial match, case-insensitive)
   * @param branchName - Branch name to search
   * @returns Matching branches
   */
  async searchBranchByName(branchName: string): Promise<Branch[]> {
    try {
      const response = await apiClient.get<SearchResponse>(
        `/branches/search/by-name/${branchName}`
      )
      console.log(`✅ Found ${response.data.total} matching branches`)
      return response.data.branches || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to search branches by name'))
    }
  }

  /**
   * Search branches by city
   * @param city - City name
   * @returns Branches in that city
   */
  async searchBranchesByCity(city: string): Promise<Branch[]> {
    try {
      const response = await apiClient.get<SearchResponse>(
        `/branches/search/by-city/${city}`
      )
      console.log(`✅ Found ${response.data.total} branches in ${city}`)
      return response.data.branches || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to search branches by city'))
    }
  }

  /**
   * Get all employees in a branch
   * @param branchId - Branch ID
   * @param isActive - Filter by active status
   * @param role - Filter by role (doctor, nurse, admin, receptionist, manager, pharmacist, lab_technician)
   * @returns List of employees
   */
  async getBranchEmployees(
    branchId: string,
    isActive: boolean = true,
    role?: string
  ): Promise<Array<Record<string, unknown>>> {
    try {
      let url = `/branches/${branchId}/employees?is_active=${isActive}`
      if (role) {
        url += `&role=${role}`
      }

      const response = await apiClient.get<EmployeesResponse>(url)
      console.log(`✅ Fetched ${response.data.total} employees`)
      return response.data.employees || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch branch employees'))
    }
  }

  /**
   * Get all doctors in a branch
   * @param branchId - Branch ID
   * @param isAvailable - Filter by availability
   * @returns List of doctors
   */
  async getBranchDoctors(
    branchId: string,
    isAvailable: boolean = true
  ): Promise<Array<Record<string, unknown>>> {
    try {
      const response = await apiClient.get<DoctorsResponse>(
        `/branches/${branchId}/doctors?is_available=${isAvailable}`
      )
      console.log(`✅ Fetched ${response.data.total} doctors`)
      return response.data.doctors || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch branch doctors'))
    }
  }

  /**
   * Get all patients registered in a branch
   * @param branchId - Branch ID
   * @param skip - Number of records to skip
   * @param limit - Maximum records to return
   * @returns List of patients
   */
  async getBranchPatients(
    branchId: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<Array<Record<string, unknown>>> {
    try {
      const params = new URLSearchParams()
      params.append('skip', skip.toString())
      params.append('limit', Math.min(limit, 500).toString())

      const response = await apiClient.get<PatientsResponse>(
        `/branches/${branchId}/patients?${params.toString()}`
      )
      console.log(`✅ Fetched ${response.data.returned} patients`)
      return response.data.patients || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch branch patients'))
    }
  }

  /**
   * Get all appointments in a branch
   * @param branchId - Branch ID
   * @param skip - Number of records to skip
   * @param limit - Maximum records to return
   * @param statusFilter - Filter by status (Scheduled, Completed, Cancelled, No-Show)
   * @returns List of appointments
   */
  async getBranchAppointments(
    branchId: string,
    skip: number = 0,
    limit: number = 100,
    statusFilter?: string
  ): Promise<Array<Record<string, unknown>>> {
    try {
      let url = `/branches/${branchId}/appointments`
      const params = new URLSearchParams()
      params.append('skip', skip.toString())
      params.append('limit', Math.min(limit, 500).toString())

      if (statusFilter) {
        params.append('status_filter', statusFilter)
      }

      const response = await apiClient.get<AppointmentsResponse>(`${url}?${params.toString()}`)
      console.log(`✅ Fetched ${response.data.returned} appointments`)
      return response.data.appointments || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch branch appointments'))
    }
  }

  /**
   * Get branch statistics
   * @param branchId - Branch ID
   * @returns Branch statistics (employees, doctors, patients, appointments)
   */
  async getBranchStats(branchId: string): Promise<BranchStats> {
    try {
      const response = await apiClient.get<BranchStats>(`/branches/${branchId}/stats`)
      console.log('✅ Fetched branch statistics')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch branch statistics'))
    }
  }

  /**
   * Format branch info for display
   * Example: "Colombo Branch - Colombo, Western Province"
   */
  formatBranch(branch: Branch): string {
    const location = [branch.city, branch.province].filter(Boolean).join(', ')
    return `${branch.branch_name}${location ? ` - ${location}` : ''}`
  }

  /**
   * Check if branch is active
   */
  isBranchActive(branch: Branch): boolean {
    return branch.is_active
  }

  /**
   * Get branch status badge color
   */
  getStatusColor(isActive: boolean): string {
    return isActive ? 'green' : 'red'
  }

  /**
   * Count active vs inactive branches
   */
  countActiveInactive(branches: Branch[]): { active: number; inactive: number } {
    return {
      active: branches.filter((b) => b.is_active).length,
      inactive: branches.filter((b) => !b.is_active).length,
    }
  }

  /**
   * Group branches by city
   */
  groupByCity(branches: Branch[]): Record<string, Branch[]> {
    return branches.reduce(
      (acc, branch) => {
        const city = branch.city || 'Unknown'
        if (!acc[city]) acc[city] = []
        acc[city].push(branch)
        return acc
      },
      {} as Record<string, Branch[]>
    )
  }

  /**
   * Sort branches alphabetically
   */
  sortBranchesByName(branches: Branch[]): Branch[] {
    return [...branches].sort((a, b) => a.branch_name.localeCompare(b.branch_name))
  }
}

export default new BranchService()