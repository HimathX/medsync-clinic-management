// src/services/employeeService.ts

import apiClient, { handleApiError } from './api'

// ============================================
// EMPLOYEE TYPES
// ============================================

interface EmployeeAddress {
  address_line1: string
  address_line2?: string
  city: string
  province: string
  postal_code: string
  country?: string
}

interface EmployeeContact {
  contact_num1: string
  contact_num2?: string
}

interface EmployeeRegistrationData {
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
  staff_id?: string // backend contract, keep as is
}

interface EmployeeLoginRequest {
  email: string
  password: string
}

interface EmployeeLoginResponse {
  success: boolean
  message?: string
  user_id?: string
  user_type?: string
  full_name?: string
  email?: string
  role?: string
}

interface Employee {
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

interface EmployeeListResponse {
  success: boolean
  branch_name: string
  total: number
  returned: number
  staff: Employee[] // backend field name is `staff`, keep it
}

interface EmployeeDetailsResponse {
  staff: Employee // backend field name is `staff`, keep it
}

interface EmployeeByRoleResponse {
  role: string
  total: number
  staff: Employee[]
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

type EmployeeRole = 'nurse' | 'admin' | 'receptionist' | 'manager' | 'pharmacist' | 'lab_technician' | 'doctor'

interface RoleInfo {
  role: EmployeeRole
  display_name: string
  icon: string
  permissions: string[]
  department?: string
}

/**
 * Employee Service
 * Handles employee management, authentication, and operations
 */
class EmployeeService {
  // ============================================
  // AUTHENTICATION METHODS
  // ============================================

  /**
   * Employee registration
   */
  async registerEmployee(employeeData: EmployeeRegistrationData): Promise<RegistrationResponse> {
    try {
      const response = await apiClient.post<RegistrationResponse>('/staff/register', employeeData)
      console.log('✅ Employee registered successfully')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Employee registration failed'))
    }
  }

  // ============================================
  // RETRIEVAL METHODS
  // ============================================

  /**
   * Get all employees by branch
   * @param branchName - Branch name (required)
   * @param skip - Number of records to skip
   * @param limit - Maximum records to return
   * @param role - Optional role filter
   * @param activeOnly - Get only active employees (default: true)
   * @returns List of employee members
   */
  async getEmployeesByBranch(
    branchName: string,
    skip: number = 0,
    limit: number = 100,
    role?: EmployeeRole,
    activeOnly: boolean = true
  ): Promise<EmployeeListResponse> {
    try {
      const params = new URLSearchParams()
      params.append('branch_name', branchName)
      params.append('skip', skip.toString())
      params.append('limit', limit.toString())
      params.append('active_only', activeOnly.toString())
      if (role) params.append('role', role)

      const response = await apiClient.get<EmployeeListResponse>(
        `/staff/?${params.toString()}`
      )
      console.log('✅ Fetched employees by branch')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch employees'))
    }
  }

  /**
   * Get employee by ID
   * @param employeeId - Employee UUID
   * @returns Employee details
   */
  async getEmployeeById(employeeId: string): Promise<Employee> {
    try {
      const response = await apiClient.get<EmployeeDetailsResponse>(`/staff/${employeeId}`)
      console.log('✅ Fetched employee details')
      return response.data.staff
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch employee details'))
    }
  }

  /**
   * Get all employees with specific role
   * @param role - Employee role
   * @returns List of employees with that role
   */
  async getEmployeesByRole(role: EmployeeRole): Promise<Employee[]> {
    try {
      const response = await apiClient.get<EmployeeByRoleResponse>(`/staff/role/${role}`)
      console.log('✅ Fetched employees by role')
      return response.data.staff || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch employees by role'))
    }
  }

  // ============================================
  // UPDATE METHODS
  // ============================================

  /**
   * Update employee salary
   * @param employeeId - Employee UUID
   * @param newSalary - New monthly salary
   * @returns Update confirmation
   */
  async updateEmployeeSalary(employeeId: string, newSalary: number): Promise<UpdateResponse> {
    try {
      const response = await apiClient.patch<UpdateResponse>(
        `/staff/${employeeId}/salary`,
        { new_salary: newSalary }
      )
      console.log('✅ Employee salary updated')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update employee salary'))
    }
  }

  /**
   * Deactivate employee
   * @param employeeId - Employee UUID
   * @returns Deactivation confirmation
   */
  async deactivateEmployee(employeeId: string): Promise<UpdateResponse> {
    try {
      const response = await apiClient.patch<UpdateResponse>(
        `/staff/${employeeId}/deactivate`
      )
      console.log('✅ Employee deactivated')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to deactivate employee'))
    }
  }

  /**
   * Reactivate employee
   * @param employeeId - Employee UUID
   * @returns Reactivation confirmation
   */
  async reactivateEmployee(employeeId: string): Promise<UpdateResponse> {
    try {
      const response = await apiClient.patch<UpdateResponse>(
        `/staff/${employeeId}/reactivate`
      )
      console.log('✅ Employee reactivated')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to reactivate employee'))
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get role information
   */
  getRoleInfo(role: EmployeeRole): RoleInfo {
    const roleMap: Record<EmployeeRole, RoleInfo> = {
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
   * Format employee name with role and branch
   */
  formatEmployeeInfo(employee: Employee): string {
    const roleInfo = this.getRoleInfo(employee.role as EmployeeRole)
    const branch = employee.branch_name ? ` - ${employee.branch_name}` : ''
    return `${roleInfo.icon} ${employee.full_name}${branch}`
  }

  /**
   * Get employee status
   */
  getEmployeeStatus(employee: Employee): { status: string; icon: string; color: string } {
    if (!employee.is_active) {
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
   * Check if employee is senior (5+ years of service)
   */
  isSeniorEmployee(joinedDate: string): boolean {
    return this.calculateYearsOfService(joinedDate) >= 5
  }

  /**
   * Format address
   */
  formatAddress(employee: Employee): string {
    const parts = [
      employee.address_line1,
      employee.address_line2,
      employee.city,
      employee.province,
      employee.postal_code,
      employee.country,
    ].filter(Boolean)

    return parts.join(', ')
  }

  /**
   * Get employee contact information
   */
  formatContactInfo(employee: Employee): {
    primary: string
    secondary?: string
  } {
    return {
      primary: employee.contact_num1 || 'Not provided',
      secondary: employee.contact_num2,
    }
  }

  /**
   * Count employees by role
   */
  countByRole(employeeList: Employee[]): Record<EmployeeRole, number> {
    const counts: Record<EmployeeRole, number> = {
      doctor: 0,
      nurse: 0,
      admin: 0,
      receptionist: 0,
      manager: 0,
      pharmacist: 0,
      lab_technician: 0,
    }

    employeeList.forEach((employee) => {
      counts[employee.role as EmployeeRole]++
    })

    return counts
  }

  /**
   * Get average salary by role
   */
  getAverageSalaryByRole(employeeList: Employee[]): Record<EmployeeRole, number> {
    const salaries: Record<EmployeeRole, { total: number; count: number }> = {
      doctor: { total: 0, count: 0 },
      nurse: { total: 0, count: 0 },
      admin: { total: 0, count: 0 },
      receptionist: { total: 0, count: 0 },
      manager: { total: 0, count: 0 },
      pharmacist: { total: 0, count: 0 },
      lab_technician: { total: 0, count: 0 },
    }

    employeeList.forEach((employee) => {
      const role = employee.role as EmployeeRole
      salaries[role].total += employee.salary
      salaries[role].count++
    })

    const averages: Record<EmployeeRole, number> = {
      doctor: 0,
      nurse: 0,
      admin: 0,
      receptionist: 0,
      manager: 0,
      pharmacist: 0,
      lab_technician: 0,
    }

    Object.keys(salaries).forEach((role) => {
      const key = role as EmployeeRole
      averages[key] =
        salaries[key].count > 0 ? salaries[key].total / salaries[key].count : 0
    })

    return averages
  }

  /**
   * Get total employee payroll
   */
  getTotalPayroll(employeeList: Employee[]): number {
    return employeeList.reduce((total, employee) => total + employee.salary, 0)
  }

  /**
   * Format comprehensive employee summary
   */
  formatEmployeeSummary(employee: Employee): string {
    const status = this.getEmployeeStatus(employee)
    const yearsService = this.calculateYearsOfService(employee.joined_date)
    const roleInfo = this.getRoleInfo(employee.role as EmployeeRole)

    let summary = `${roleInfo.icon} ${employee.full_name}\n`
    summary += `${'='.repeat(50)}\n\n`
    summary += `Status: ${status.icon} ${status.status}\n`
    summary += `Role: ${roleInfo.display_name}\n`
    summary += `Branch: ${employee.branch_name || 'Not assigned'}\n`
    summary += `Email: ${employee.email}\n`
    summary += `Contact: ${employee.contact_num1}\n`
    summary += `Salary: ${this.formatSalary(employee.salary)}\n`
    summary += `Joined: ${employee.joined_date}\n`
    summary += `Years of Service: ${yearsService}\n`

    if (employee.address_line1) {
      summary += `Address: ${this.formatAddress(employee)}\n`
    }

    return summary
  }

  /**
   * Get employee role distribution
   */
  getEmployeeDistribution(employeeList: Employee[]): Array<{
    role: string
    display_name: string
    count: number
    percentage: number
  }> {
    const total = employeeList.length
    const counts = this.countByRole(employeeList)

    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([role, count]) => {
        const roleInfo = this.getRoleInfo(role as EmployeeRole)
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
   * Validate employee registration data
   */
  validateRegistrationData(data: EmployeeRegistrationData): {
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
   * Filter employees by criteria
   */
  filterEmployees(
    employeeList: Employee[],
    criteria: {
      role?: EmployeeRole
      active?: boolean
      branch?: string
      minSalary?: number
      maxSalary?: number
    }
  ): Employee[] {
    return employeeList.filter((employee) => {
      if (criteria.role && employee.role !== criteria.role) return false
      if (criteria.active !== undefined && employee.is_active !== criteria.active)
        return false
      if (criteria.branch && employee.branch_name !== criteria.branch) return false
      if (criteria.minSalary && employee.salary < criteria.minSalary) return false
      if (criteria.maxSalary && employee.salary > criteria.maxSalary) return false
      return true
    })
  }

  /**
   * Sort employees by field
   */
  sortEmployees(
    employeeList: Employee[],
    field: 'name' | 'salary' | 'joined_date' | 'role',
    order: 'asc' | 'desc' = 'asc'
  ): Employee[] {
    const sorted = [...employeeList].sort((a, b) => {
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
   * Export employee list as CSV
   */
  exportAsCSV(employeeList: Employee[], filename: string = 'employee_list.csv'): void {
    const headers = [
      'Full Name',
      'Email',
      'Role',
      'Branch',
      'Salary',
      'Joined Date',
      'Status',
    ]

    const rows = employeeList.map((employee) => [
      employee.full_name,
      employee.email,
      employee.role,
      employee.branch_name || '',
      this.formatSalary(employee.salary),
      employee.joined_date,
      employee.is_active ? 'Active' : 'Inactive',
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

export default new EmployeeService()
