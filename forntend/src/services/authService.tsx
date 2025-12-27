import api from './api'
import { handleApiError } from './api'

// Types for authentication
type LoginType = 'patient' | 'doctor' | 'staff'
type UserType = 'patient' | 'doctor' | 'staff'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  success: boolean
  message: string
  user_id?: string
  user_type?: UserType
  full_name?: string
  email?: string
  specialization?: string
  branch_name?: string
  branch_id?: string
  phone?: string
  license_number?: string
}

interface DoctorLoginResponse extends LoginResponse {
  specialization?: string
  branch_name?: string
  phone?: string
  license_number?: string
}

interface VerifyUserResponse {
  success: boolean
  user?: {
    user_id: string
    email: string
    full_name: string
    user_type: UserType
    created_at?: string
    updated_at?: string
  }
  exists?: boolean
}

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  service: string
  database: 'connected' | 'disconnected'
  error?: string
  timestamp: string
}

interface CurrentUser {
  userId: string | null
  userType: UserType | null
  fullName: string | null
  email: string | null
  isAuthenticated: boolean
  specialization?: string | null
  branch_name?: string | null
  branch_id?: string | null
  phone?: string | null
  license_number?: string | null
}

/**
 * Authentication Service (FIXED)
 * Manages user login, logout, and session management
 * Now properly handles branch_id storage
 */
class AuthService {
  private storageKeys = {
    userId: 'userId',
    userType: 'userType',
    fullName: 'fullName',
    email: 'email',
    token: 'auth_token',
    isAuthenticated: 'isAuthenticated',
    doctor_id: 'doctor_id',
    specialization: 'specialization',
    branch_name: 'branch_name',
    branch_id: 'branch_id', // ✅ FIXED: Added to storage keys
    phone: 'phone',
    license_number: 'license_number',
  }

  /**
   * Login user with email and password
   * @param email - User's email address
   * @param password - User's password (min 6 characters)
   * @returns Login response with user details
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const credentials: LoginRequest = { email, password }

      const response = await api.post<LoginResponse>('/auth/login', credentials)

      if (response.data.success) {
        this.storeUserData(response.data)
        console.log('✅ Login successful')
      }

      return response.data
    } catch (error) {
      const errorMsg = handleApiError(error, 'Failed to login')
      throw new Error(errorMsg)
    }
  }

  /**
   * Doctor-specific login handler
   * @param email - Doctor's email address
   * @param password - Doctor's password
   * @returns Doctor login response with specialization and branch info
   */
  async doctorLogin(email: string, password: string): Promise<DoctorLoginResponse> {
    try {
      const credentials: LoginRequest = { email, password }

      const response = await api.post<DoctorLoginResponse>('/doctors/login', credentials)

      if (response.data.success) {
        // Verify user is doctor
        if (response.data.user_type !== 'doctor') {
          throw new Error('This account is not registered as a doctor. Please use the correct portal.')
        }

        this.storeDoctorData(response.data)
        console.log('✅ Doctor login successful')
      }

      return response.data
    } catch (error) {
      const errorMsg = handleApiError(error, 'Failed to login as doctor')
      throw new Error(errorMsg)
    }
  }

  /**
   * Store user data in localStorage
   * @param data - Login response data
   */
  private storeUserData(data: LoginResponse): void {
    if (data.user_id) {
      localStorage.setItem(this.storageKeys.userId, data.user_id)
    }

    if (data.user_type) {
      localStorage.setItem(this.storageKeys.userType, data.user_type)
    }

    if (data.full_name) {
      localStorage.setItem(this.storageKeys.fullName, data.full_name)
    }

    if (data.email) {
      localStorage.setItem(this.storageKeys.email, data.email)
    }

    localStorage.setItem(this.storageKeys.isAuthenticated, 'true')
  }

  /**
   * Store doctor-specific data in localStorage
   * @param data - Doctor login response data
   */
  private storeDoctorData(data: DoctorLoginResponse): void {
    // Store base user data
    this.storeUserData(data)

    // Store doctor-specific data
    if (data.user_id) {
      localStorage.setItem(this.storageKeys.doctor_id, data.user_id)
    }

    if (data.specialization) {
      localStorage.setItem(this.storageKeys.specialization, data.specialization)
    }

    if (data.branch_name) {
      localStorage.setItem(this.storageKeys.branch_name, data.branch_name)
    }

    if (data.branch_id) {
      localStorage.setItem(this.storageKeys.branch_id, data.branch_id) 
    }

    if (data.phone) {
      localStorage.setItem(this.storageKeys.phone, data.phone)
    }

    if (data.license_number) {
      localStorage.setItem(this.storageKeys.license_number, data.license_number)
    }

    console.log('✅ Doctor-specific data stored')
  }

  /**
   * Logout user and clear all session data
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post<{ success: boolean; message: string }>('/auth/logout', {})
      this.clearUserData()
      console.log('✅ Logout successful')
      return response.data
    } catch (error) {
      // Clear data even if logout fails
      this.clearUserData()
      const errorMsg = handleApiError(error, 'Logout completed locally')
      console.warn(errorMsg)
      return { success: true, message: 'Logged out' }
    }
  }

  /**
   * Clear all user session data from localStorage
   */
  private clearUserData(): void {
    Object.values(this.storageKeys).forEach((key) => localStorage.removeItem(key))
    sessionStorage.clear()
  }

  /**
   * Verify if user exists and get their details
   * @param userId - User ID (UUID)
   * @returns User details if found
   */
  async verifyUser(userId: string): Promise<VerifyUserResponse> {
    try {
      const response = await api.get<VerifyUserResponse>(`/auth/verify/${userId}`)
      console.log('✅ User verified')
      return response.data
    } catch (error) {
      const errorMsg = handleApiError(error, 'Failed to verify user')
      throw new Error(errorMsg)
    }
  }

  /**
   * Check if authentication service is healthy
   * @returns Service health status
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await api.get<HealthCheckResponse>('/auth/health')
      return response.data
    } catch (error) {
      const errorMsg = handleApiError(error, 'Health check failed')
      throw new Error(errorMsg)
    }
  }

  /**
   * Check if user is authenticated
   * @returns True if user has valid session
   */
  isAuthenticated(): boolean {
    const hasFlag = localStorage.getItem(this.storageKeys.isAuthenticated) === 'true'
    const hasUserId = !!localStorage.getItem(this.storageKeys.userId)
    const hasUserType = !!localStorage.getItem(this.storageKeys.userType)

    return hasFlag && hasUserId && hasUserType
  }

  /**
   * Get current user data from localStorage
   * @returns Current user object
   */
  getCurrentUser(): CurrentUser {
    const userId = localStorage.getItem(this.storageKeys.userId)
    const userType = localStorage.getItem(this.storageKeys.userType) as UserType | null
    const fullName = localStorage.getItem(this.storageKeys.fullName)
    const email = localStorage.getItem(this.storageKeys.email)
    const specialization = localStorage.getItem(this.storageKeys.specialization)
    const branch_name = localStorage.getItem(this.storageKeys.branch_name)
    const branch_id = localStorage.getItem(this.storageKeys.branch_id) // ✅ FIXED: Now retrieved
    const phone = localStorage.getItem(this.storageKeys.phone)
    const license_number = localStorage.getItem(this.storageKeys.license_number)

    return {
      userId,
      userType,
      fullName,
      email,
      specialization: specialization || undefined,
      branch_name: branch_name || undefined,
      branch_id: branch_id || undefined, 
      phone: phone || undefined,
      license_number: license_number || undefined,
      isAuthenticated: this.isAuthenticated(),
    }
  }

  /**
   * Get current user type
   * @returns User type or null
   */
  getUserType(): UserType | null {
    return localStorage.getItem(this.storageKeys.userType) as UserType | null
  }

  /**
   * Get current user ID
   * @returns User ID or null
   */
  getUserId(): string | null {
    return localStorage.getItem(this.storageKeys.userId)
  }

  /**
   * Get current doctor ID (alias for getUserId for doctors)
   * @returns Doctor ID or null
   */
  getDoctorId(): string | null {
    return localStorage.getItem(this.storageKeys.doctor_id)
  }

  /**
   * Get current branch ID
   * @returns Branch ID or null
   */
  getBranchId(): string | null {
    return localStorage.getItem(this.storageKeys.branch_id)
  }

  /**
   * Get current user full name
   * @returns Full name or null
   */
  getFullName(): string | null {
    return localStorage.getItem(this.storageKeys.fullName)
  }

  /**
   * Get current user email
   * @returns Email or null
   */
  getEmail(): string | null {
    return localStorage.getItem(this.storageKeys.email)
  }

  /**
   * Get doctor specialization
   * @returns Specialization or null
   */
  getSpecialization(): string | null {
    return localStorage.getItem(this.storageKeys.specialization)
  }

  /**
   * Get doctor branch name
   * @returns Branch name or null
   */
  getBranchName(): string | null {
    return localStorage.getItem(this.storageKeys.branch_name)
  }

  /**
   * Get doctor phone number
   * @returns Phone number or null
   */
  getPhone(): string | null {
    return localStorage.getItem(this.storageKeys.phone)
  }

  /**
   * Get doctor license number
   * @returns License number or null
   */
  getLicenseNumber(): string | null {
    return localStorage.getItem(this.storageKeys.license_number)
  }

  /**
   * Check if user is authenticated as a specific type
   * @param type - User type to check
   * @returns True if user is authenticated as that type
   */
  isUserType(type: UserType): boolean {
    return this.isAuthenticated() && this.getUserType() === type
  }

  /**
   * Check if user is a patient
   * @returns True if user is authenticated as patient
   */
  isPatient(): boolean {
    return this.isUserType('patient')
  }

  /**
   * Check if user is a doctor
   * @returns True if user is authenticated as doctor
   */
  isDoctor(): boolean {
    return this.isUserType('doctor')
  }

  /**
   * Check if user is staff
   * @returns True if user is authenticated as staff
   */
  isStaff(): boolean {
    return this.isUserType('staff')
  }

  /**
   * Refresh user data from server
   * Useful after user profile updates
   * @returns Updated user data
   */
  async refreshUserData(): Promise<CurrentUser> {
    try {
      const userId = this.getUserId()
      if (!userId) {
        throw new Error('No user ID found')
      }

      const result = await this.verifyUser(userId)
      if (result.user) {
        // Update stored data
        localStorage.setItem(this.storageKeys.fullName, result.user.full_name)
        localStorage.setItem(this.storageKeys.email, result.user.email)
        localStorage.setItem(this.storageKeys.userType, result.user.user_type)
        console.log('✅ User data refreshed')
      }

      return this.getCurrentUser()
    } catch (error) {
      const errorMsg = handleApiError(error, 'Failed to refresh user data')
      throw new Error(errorMsg)
    }
  }

  /**
   * Validate email format (basic client-side validation)
   * @param email - Email to validate
   * @returns True if email format is valid
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate password strength (client-side)
   * @param password - Password to validate
   * @returns True if password meets minimum requirements
   */
  isValidPassword(password: string): boolean {
    return password && password.length >= 6 && password.length <= 100
  }

  /**
   * Get authentication token (if stored)
   * @returns Auth token or null
   */
  getToken(): string | null {
    return localStorage.getItem(this.storageKeys.token)
  }

  /**
   * Check if authentication is still valid
   * Useful before making API calls
   * @returns True if authenticated
   */
  hasValidSession(): boolean {
    return this.isAuthenticated() && !!this.getUserId() && !!this.getUserType()
  }

}

export default new AuthService()