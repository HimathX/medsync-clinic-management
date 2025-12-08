import apiClient, { handleApiError } from './api' 

// Types for patient-related data
interface Patient {
  id: string
  full_name: string
  NIC: string
  email: string
  phone?: string
  gender: 'Male' | 'Female' | 'Other'
  DOB: string
  blood_group: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-'
  contact_num1: string
  contact_num2?: string
  address_line1: string
  address_line2?: string
  city: string
  province: string
  postal_code: string
  country: string
  registered_branch_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PatientRegistrationData {
  full_name: string
  NIC: string
  email: string
  gender: 'Male' | 'Female' | 'Other'
  DOB: string
  password: string
  blood_group: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-'
  contact_num1: string
  contact_num2?: string
  address_line1: string
  address_line2?: string
  city: string
  province: string
  postal_code: string
  country: string
  registered_branch_name: string
}

interface PatientResponse {
  patient: Patient
}

interface PatientsListResponse {
  patients: Patient[]
  total: number
  skip: number
  limit: number
}

interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  time_slot_id: string
  status: string
  created_at: string
}

interface AppointmentsResponse {
  appointments: Appointment[]
  total?: number
}

interface Allergy {
  id: string
  patient_id: string
  allergy_name: string
  severity: 'mild' | 'moderate' | 'severe'
  description?: string
  created_at: string
}

interface AllergiesResponse {
  allergies: Allergy[]
  total?: number
}

interface RegistrationResponse {
  success: boolean
  message?: string
  patient_id?: string
}

interface SearchResponse {
  patient: Patient
}

/**
 * Patient Service
 * Handles all patient-related API operations
 */
class PatientService {
  /**
   * Get all patients with pagination
   * @param skip - Number of records to skip (default: 0)
   * @param limit - Maximum number of records to return (default: 100)
   * @returns Promise with paginated patients list
   */
  async getAllPatients(skip: number = 0, limit: number = 100): Promise<PatientsListResponse> {
    try {
      const response = await apiClient.get<PatientsListResponse>(
        `/patients/?skip=${skip}&limit=${limit}`
      )
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch patients'))
    }
  }

  /**
   * Get patient by ID
   * @param patientId - Patient ID
   * @returns Promise with patient details
   */
  async getPatientById(patientId: string): Promise<Patient> {
    try {
      const response = await apiClient.get<Patient>(`/patients/${patientId}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch patient details'))
    }
  }

  /**
   * Register new patient
   * @param patientData - Patient registration data
   * @returns Promise with registration response
   */
  async registerPatient(patientData: PatientRegistrationData): Promise<RegistrationResponse> {
    try {
      const response = await apiClient.post<RegistrationResponse>(
        '/patients/register',
        patientData
      )
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to register patient'))
    }
  }

  /**
   * Search patient by NIC
   * @param nic - National Identity Card number
   * @returns Promise with patient data
   */
  async searchByNIC(nic: string): Promise<Patient> {
    try {
      const response = await apiClient.get<Patient>(`/patients/search/by-nic/${nic}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Patient not found'))
    }
  }

  /**
   * Get patient appointments
   * @param patientId - Patient ID
   * @returns Promise with patient appointments
   */
  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    try {
      const response = await apiClient.get<AppointmentsResponse>(
        `/patients/${patientId}/appointments`
      )
      return response.data.appointments || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch appointments'))
    }
  }

  /**
   * Get patient allergies
   * @param patientId - Patient ID
   * @returns Promise with patient allergies
   */
  async getPatientAllergies(patientId: string): Promise<Allergy[]> {
    try {
      const response = await apiClient.get<AllergiesResponse>(
        `/patients/${patientId}/allergies`
      )
      return response.data.allergies || []
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch allergies'))
    }
  }

  /**
   * Update patient profile
   * @param patientId - Patient ID
   * @param updateData - Patient data to update
   * @returns Promise with updated patient
   */
  async updatePatientProfile(patientId: string, updateData: Partial<Patient>): Promise<Patient> {
    try {
      const response = await apiClient.patch<Patient>(`/patients/${patientId}`, updateData)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update patient profile'))
    }
  }

  /**
   * Add allergy to patient
   * @param patientId - Patient ID
   * @param allergyData - Allergy information
   * @returns Promise with created allergy
   */
  async addAllergy(
    patientId: string,
    allergyData: Omit<Allergy, 'id' | 'patient_id' | 'created_at'>
  ): Promise<Allergy> {
    try {
      const response = await apiClient.post<Allergy>(
        `/patients/${patientId}/allergies`,
        allergyData
      )
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to add allergy'))
    }
  }

  /**
   * Delete allergy from patient
   * @param patientId - Patient ID
   * @param allergyId - Allergy ID
   * @returns Promise with deletion response
   */
  async deleteAllergy(patientId: string, allergyId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(
        `/patients/${patientId}/allergies/${allergyId}`
      )
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete allergy'))
    }
  }

  /**
   * Get patient medical history
   * @param patientId - Patient ID
   * @returns Promise with medical history
   */
  async getPatientMedicalHistory(
    patientId: string
  ): Promise<{
    appointments: Appointment[]
    allergies: Allergy[]
    conditions?: unknown[]
  }> {
    try {
      const response = await apiClient.get<{
        appointments: Appointment[]
        allergies: Allergy[]
        conditions?: unknown[]
      }>(`/patients/${patientId}/medical-history`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to fetch medical history'))
    }
  }

  /**
   * Check if NIC already exists
   * @param nic - National Identity Card number
   * @returns Promise with existence status
   */
  async checkNICExists(nic: string): Promise<{ exists: boolean }> {
    try {
      const response = await apiClient.get<{ exists: boolean }>(
        `/patients/check-nic/${nic}`
      )
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to check NIC'))
    }
  }

  /**
   * Check if email already exists
   * @param email - Email address
   * @returns Promise with existence status
   */
  async checkEmailExists(email: string): Promise<{ exists: boolean }> {
    try {
      const response = await apiClient.get<{ exists: boolean }>(
        `/patients/check-email/${email}`
      )
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to check email'))
    }
  }
}

export default new PatientService()