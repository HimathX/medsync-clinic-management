// src/services/staffService.ts

import apiClient, { handleApiError } from './api'

// ============================================
// STAFF TYPES
// ============================================

interface StaffAddress {
  address_line1: string
  address_line2?: string
  city: string
  province: string
  postal_code: string
  country?: string
}

interface StaffContact {
  contact_num1: string
  contact_num2?: string
}

interface StaffRegistrationData {
  // Address
  address_line1: string
  address_line2?: string
  city: string
  province: string
  postal_code: string
  country?: string

  // Contact
  contact_num1: string
  contact_num2?: string

  // User Info
  full_name: string
  NIC: string
  email: string
  gender: 'Male' | 'Female' | 'Other'
  DOB: string // YYYY-MM-DD
  password: string

  // Employee Info
  branch_name: string
  role: 'nurse' | 'admin' | 'receptionist' | 'manager' | 'pharmacist' | 'lab_technician' | 'doctor'
  salary: number
  joined_date: string // YYYY-MM-DD
}

interface RegistrationResponse {
  success: boolean
  message?: string
  staff_id?: string
}

interface StaffLoginRequest {
  email: string
  password: string
}

interface StaffLoginResponse {
  success: boolean
  message?: string
  user_id?: string
  user_type?: string
  full_name?: string
  email?: string
  role?: string
}

interface Staff {
  employee_id?: string
  id?: string
  user_id?: string
  full_name: string
  email: string
  NIC: string
  gender: 'Male' | 'Female' | 'Other'
  DOB: string
  branch_name?: string
  branch_id?: string
  role: 'nurse' | 'admin' | 'receptionist' | 'manager' | 'pharmacist' | 'lab_technician' | 'doctor'
  salary: number
  joined_date: string
  is_active?: boolean
  contact_num1?: string
  contact_num2?: string
  address_line1?: string
  address_line2?: string
  city?: string
  province?: string
  postal_code?: string
  country?: string
  [key: string]: unknown
}

interface StaffListResponse {
  success: boolean
  branch_name: string
  total: number
  returned: number
  staff: Staff[]
}

interface StaffDetailsResponse {
  staff: Staff
}

interface StaffByRoleResponse {
  role: string
  total: number
  staff: Staff[]
}

interface UpdateSalaryRequest {
  new_salary: number
}

interface UpdateResponse {
  success: boolean
  message: string
}

// ============================================
// ROLE TYPES
// ============================================

type StaffRole = 'nurse' | 'admin' | 'receptionist' | 'manager' | 'pharmacist' | 'lab_technician' | 'doctor'

interface RoleInfo {
  role: StaffRole
  display_name: string
  icon: string
  permissions: string[]
  department?: string
}

/**
 * Staff Service
 * Handles staff management, authentication, and operations
 */
class StaffService {
  // ============================================
  // AUTHENTICATION METHODS
  // ============================================

  /**
   * Staff login
   * @param email - Staff email
   * @param password - Staff password
   * @returns Login response with user details
   */
  async loginStaff(email: string, password: string): Promise<StaffLoginResponse> {
    try {
      const response = await apiClient.post<StaffLoginResponse>('/staff/login', {
        email,
        password,
      })
      console.log('✅ Staff login successful')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Staff login failed'))
    }
  }

  /**
   * Register new staff member
   * @param staffData - Staff registration data
   * @returns Registration response with staff ID
   */
  async registerStaff(staffData: StaffRegistrationData): Promise<RegistrationResponse> {
    try {
      const response = await apiClient.post<RegistrationResponse>('/staff/register', staffData)
      console.log('✅ Staff registered successfully')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Staff registration failed'))
    }
  }

  // ============================================
  // RETRIEVAL METHODS
  // ============================================

  /**
   * Get all staff by branch
   * @param branchName - Branch name (required)
   * @param skip - Number of records to skip
   * @param limit - Maximum records to return
   * @param role - Optional role filter
   * @param activeOnly - Get only active staff (default: true)
   * @returns List of staff members
   */
  async getStaffByBranch(
    branchName: string,
    skip: number = 0,
    limit: number = 100,
    role?: StaffRole,
    activeOnly: boolean = true
  ): Promise<StaffListResponse> {
    try {
      const params = new URLSearchParams()
      params.append('branch_name', branchName)
      params.append('skip', skip.toString())
      params.append('limit', limit.toString())
      params.append('active_only', activeOnly.toString())
      if (role) params.append('role', role)

      const response = await apiClient.get<StaffListResponse>(
        `/staff/?${params.toString()}`
      )
      console.log('✅ Fetched staff by branch')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch staff'))
    }
  }

  /**
   * Get staff by ID
   * @param staffId - Staff UUID
   * @returns Staff details
   */
  async getStaffById(staffId: string): Promise<Staff> {
    try {
      const response = await apiClient.get<StaffDetailsResponse>(`/staff/${staffId}`)
      console.log('✅ Fetched staff details')
      return response.data.staff
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch staff details'))
    }
  }

  /**
   * Get all staff with specific role
   * @param role - Staff role
   * @returns List of staff with that role
   */
  async getStaffByRole(role: StaffRole): Promise<Staff[]> {
    try {
      const response = await apiClient.get<StaffByRoleResponse>(`/staff/role/${role}`)
      console.log('✅ Fetched staff by role')
      return response.data.staff || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch staff by role'))
    }
  }

  // ============================================
  // UPDATE METHODS
  // ============================================

  /**
   * Update staff salary
   * @param staffId - Staff UUID
   * @param newSalary - New monthly salary
   * @returns Update confirmation
   */
  async updateStaffSalary(staffId: string, newSalary: number): Promise<UpdateResponse> {
    try {
      const response = await apiClient.patch<UpdateResponse>(
        `/staff/${staffId}/salary`,
        { new_salary: newSalary }
      )
      console.log('✅ Staff salary updated')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update staff salary'))
    }
  }

  /**
   * Deactivate staff member
   * @param staffId - Staff UUID
   * @returns Deactivation confirmation
   */
  async deactivateStaff(staffId: string): Promise<UpdateResponse> {
    try {
      const response = await apiClient.patch<UpdateResponse>(
        `/staff/${staffId}/deactivate`
      )
      console.log('✅ Staff member deactivated')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to deactivate staff'))
    }
  }

  /**
   * Reactivate staff member
   * @param staffId - Staff UUID
   * @returns Reactivation confirmation
   */
  async reactivateStaff(staffId: string): Promise<UpdateResponse> {
    try {
      const response = await apiClient.patch<UpdateResponse>(
        `/staff/${staffId}/reactivate`
      )
      console.log('✅ Staff member reactivated')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to reactivate staff'))
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get role information
   */
  getRoleInfo(role: StaffRole): RoleInfo {
    const roleMap: Record<StaffRole, RoleInfo> = {
      doctor: {
        role: 'doctor',
        display_name: 'Doctor',
        icon: '👨‍⚕️',
        permissions: ['view_patients', 'create_consultation', 'prescribe', 'view_reports'],
        department: 'Medical',
      },
      nurse: {
        role: 'nurse',
        display_name: 'Nurse',
        icon: '👩‍⚕️',
        permissions: ['view_patients', 'record_vitals', 'assist_consultation'],
        department: 'Nursing',
      },
      admin: {
        role: 'admin',
        display_name: 'Administrator',
        icon: '👔',
        permissions: [
          'manage_staff',
          'manage_patients',
          'system_settings',
          'view_reports',
        ],
        department: 'Administration',
      },
      receptionist: {
        role: 'receptionist',
        display_name: 'Receptionist',
        icon: '👩‍💼',
        permissions: [
          'schedule_appointments',
          'register_patients',
          'view_appointments',
        ],
        department: 'Front Desk',
      },
      manager: {
        role: 'manager',
        display_name: 'Manager',
        icon: '👨‍💼',
        permissions: [
          'manage_branch',
          'view_reports',
          'manage_schedule',
          'approve_leave',
        ],
        department: 'Management',
      },
      pharmacist: {
        role: 'pharmacist',
        display_name: 'Pharmacist',
        icon: '💊',
        permissions: [
          'view_prescriptions',
          'manage_inventory',
          'dispense_medications',
        ],
        department: 'Pharmacy',
      },
      lab_technician: {
        role: 'lab_technician',
        display_name: 'Lab Technician',
        icon: '🧪',
        permissions: [
          'manage_lab_tests',
          'record_results',
          'view_samples',
        ],
        department: 'Laboratory',
      },
    }

    return roleMap[role]
  }

  /**
   * Format staff name with role and branch
   * Example: "Dr. John Smith - Main Branch (Cardiologist)"
   */
  formatStaffInfo(staff: Staff): string {
    const roleInfo = this.getRoleInfo(staff.role as StaffRole)
    const branch = staff.branch_name ? ` - ${staff.branch_name}` : ''
    return `${roleInfo.icon} ${staff.full_name}${branch}`
  }

  /**
   * Get staff status
   */
  getStaffStatus(staff: Staff): { status: string; icon: string; color: string } {
    if (!staff.is_active) {
      return { status: 'Inactive', icon: '🔴', color: 'red' }
    }
    return { status: 'Active', icon: '🟢', color: 'green' }
  }

  /**
   * Format salary for display
   */
  formatSalary(salary: number): string {
    return `LKR ${salary.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  /**
   * Calculate years of service
   */
  calculateYearsOfService(joinedDate: string): number {
    const today = new Date()
    const joined = new Date(joinedDate)
    let years = today.getFullYear() - joined.getFullYear()
    const monthDiff = today.getMonth() - joined.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < joined.getDate())) {
      years--
    }

    return Math.max(0, years)
  }

  /**
   * Check if staff is senior (5+ years of service)
   */
  isSeniorStaff(joinedDate: string): boolean {
    return this.calculateYearsOfService(joinedDate) >= 5
  }

  /**
   * Format address
   */
  formatAddress(staff: Staff): string {
    const parts = [
      staff.address_line1,
      staff.address_line2,
      staff.city,
      staff.province,
      staff.postal_code,
      staff.country,
    ].filter(Boolean)

    return parts.join(', ')
  }

  /**
   * Get staff contact information
   */
  formatContactInfo(staff: Staff): {
    primary: string
    secondary?: string
  } {
    return {
      primary: staff.contact_num1 || 'Not provided',
      secondary: staff.contact_num2,
    }
  }

  /**
   * Count staff by role
   */
  countByRole(staffList: Staff[]): Record<StaffRole, number> {
    const counts: Record<StaffRole, number> = {
      doctor: 0,
      nurse: 0,
      admin: 0,
      receptionist: 0,
      manager: 0,
      pharmacist: 0,
      lab_technician: 0,
    }

    staffList.forEach((staff) => {
      counts[staff.role as StaffRole]++
    })

    return counts
  }

  /**
   * Get average salary by role
   */
  getAverageSalaryByRole(staffList: Staff[]): Record<StaffRole, number> {
    const salaries: Record<StaffRole, { total: number; count: number }> = {
      doctor: { total: 0, count: 0 },
      nurse: { total: 0, count: 0 },
      admin: { total: 0, count: 0 },
      receptionist: { total: 0, count: 0 },
      manager: { total: 0, count: 0 },
      pharmacist: { total: 0, count: 0 },
      lab_technician: { total: 0, count: 0 },
    }

    staffList.forEach((staff) => {
      const role = staff.role as StaffRole
      salaries[role].total += staff.salary
      salaries[role].count++
    })

    const averages: Record<StaffRole, number> = {
      doctor: 0,
      nurse: 0,
      admin: 0,
      receptionist: 0,
      manager: 0,
      pharmacist: 0,
      lab_technician: 0,
    }

    Object.keys(salaries).forEach((role) => {
      const key = role as StaffRole
      averages[key] = salaries[key].count > 0 ? salaries[key].total / salaries[key].count : 0
    })

    return averages
  }

  /**
   * Get total staff payroll
   */
  getTotalPayroll(staffList: Staff[]): number {
    return staffList.reduce((total, staff) => total + staff.salary, 0)
  }

  /**
   * Format comprehensive staff summary
   */
  formatStaffSummary(staff: Staff): string {
    const status = this.getStaffStatus(staff)
    const yearsService = this.calculateYearsOfService(staff.joined_date)
    const roleInfo = this.getRoleInfo(staff.role as StaffRole)

    let summary = `${roleInfo.icon} ${staff.full_name}\n`
    summary += `${'='.repeat(50)}\n\n`
    summary += `Status: ${status.icon} ${status.status}\n`
    summary += `Role: ${roleInfo.display_name}\n`
    summary += `Branch: ${staff.branch_name || 'Not assigned'}\n`
    summary += `Email: ${staff.email}\n`
    summary += `Contact: ${staff.contact_num1}\n`
    summary += `Salary: ${this.formatSalary(staff.salary)}\n`
    summary += `Joined: ${staff.joined_date}\n`
    summary += `Years of Service: ${yearsService}\n`

    if (staff.address_line1) {
      summary += `Address: ${this.formatAddress(staff)}\n`
    }

    return summary
  }

  /**
   * Get staff role distribution
   */
  getStaffDistribution(staffList: Staff[]): Array<{
    role: string
    display_name: string
    count: number
    percentage: number
  }> {
    const total = staffList.length
    const counts = this.countByRole(staffList)

    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([role, count]) => {
        const roleInfo = this.getRoleInfo(role as StaffRole)
        return {
          role,
          display_name: roleInfo.display_name,
          count,
          percentage: Math.round((count / total) * 100),
        }
      })
      .sort((a, b) => b.count - a.count)
  }

  /**
   * Validate staff registration data
   */
  validateRegistrationData(data: StaffRegistrationData): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!data.full_name || data.full_name.trim().length === 0) {
      errors.push('Full name is required')
    }

    if (!data.NIC || data.NIC.trim().length === 0) {
      errors.push('NIC is required')
    }

    if (!data.email || !data.email.includes('@')) {
      errors.push('Valid email is required')
    }

    if (!data.password || data.password.length < 8) {
      errors.push('Password must be at least 8 characters')
    }

    if (!data.contact_num1 || data.contact_num1.trim().length === 0) {
      errors.push('Contact number is required')
    }

    if (!data.branch_name || data.branch_name.trim().length === 0) {
      errors.push('Branch selection is required')
    }

    if (!data.role) {
      errors.push('Role is required')
    }

    if (!data.salary || data.salary <= 0) {
      errors.push('Valid salary amount is required')
    }

    if (!data.joined_date) {
      errors.push('Joining date is required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Filter staff by criteria
   */
  filterStaff(
    staffList: Staff[],
    criteria: {
      role?: StaffRole
      active?: boolean
      branch?: string
      minSalary?: number
      maxSalary?: number
    }
  ): Staff[] {
    return staffList.filter((staff) => {
      if (criteria.role && staff.role !== criteria.role) return false
      if (criteria.active !== undefined && staff.is_active !== criteria.active)
        return false
      if (criteria.branch && staff.branch_name !== criteria.branch) return false
      if (criteria.minSalary && staff.salary < criteria.minSalary) return false
      if (criteria.maxSalary && staff.salary > criteria.maxSalary) return false
      return true
    })
  }

  /**
   * Sort staff by field
   */
  sortStaff(
    staffList: Staff[],
    field: 'name' | 'salary' | 'joined_date' | 'role',
    order: 'asc' | 'desc' = 'asc'
  ): Staff[] {
    const sorted = [...staffList].sort((a, b) => {
      let aVal: unknown, bVal: unknown

      switch (field) {
        case 'name':
          aVal = a.full_name
          bVal = b.full_name
          break
        case 'salary':
          aVal = a.salary
          bVal = b.salary
          break
        case 'joined_date':
          aVal = new Date(a.joined_date).getTime()
          bVal = new Date(b.joined_date).getTime()
          break
        case 'role':
          aVal = a.role
          bVal = b.role
          break
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'asc' ? aVal - bVal : bVal - aVal
      }

      return 0
    })

    return sorted
  }

  /**
   * Export staff list as CSV
   */
  exportAsCSV(staffList: Staff[], filename: string = 'staff_list.csv'): void {
    const headers = [
      'Full Name',
      'Email',
      'Role',
      'Branch',
      'Salary',
      'Joined Date',
      'Status',
    ]

    const rows = staffList.map((staff) => [
      staff.full_name,
      staff.email,
      staff.role,
      staff.branch_name || '',
      this.formatSalary(staff.salary),
      staff.joined_date,
      staff.is_active ? 'Active' : 'Inactive',
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
}

export default new StaffService()