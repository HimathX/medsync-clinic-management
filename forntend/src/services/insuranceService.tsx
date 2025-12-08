import apiClient, { handleApiError } from './api';

// ===== TYPES =====

interface InsurancePackage {
  insurance_package_id: string;
  package_name: string;
  annual_limit: number;
  copayment_percentage: number;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface InsurancePackageCreateInput {
  package_name: string;
  annual_limit: number;
  copayment_percentage: number;
  description?: string;
  is_active?: boolean;
}

interface InsurancePackageUpdateInput {
  package_name?: string;
  annual_limit?: number;
  copayment_percentage?: number;
  description?: string;
  is_active?: boolean;
}

interface PatientInsurance {
  insurance_id: string;
  patient_id: string;
  insurance_package_id: string;
  package_name: string;
  annual_limit: number;
  copayment_percentage: number;
  start_date: string;
  end_date: string;
  status: 'Active' | 'Inactive' | 'Expired' | 'Pending';
  package_description?: string;
  created_at?: string;
  updated_at?: string;
}

interface PatientInsuranceCreateInput {
  patient_id: string;
  insurance_package_id: string;
  start_date: string;
  end_date: string;
  status?: 'Active' | 'Inactive' | 'Expired' | 'Pending';
}

interface PatientInsuranceUpdateInput {
  status?: 'Active' | 'Inactive' | 'Expired' | 'Pending';
  end_date?: string;
}

interface PaginationParams {
  skip: number;
  limit: number;
  total?: number;
  total_pages?: number;
}

interface InsurancePackagesResponse extends PaginationParams {
  packages: InsurancePackage[];
}

interface PatientInsurancesResponse extends PaginationParams {
  insurances: PatientInsurance[];
}

interface InsuranceStatistics {
  total_packages: number;
  active_packages: number;
  total_patient_insurances: number;
  active_insurances: number;
  expired_insurances: number;
  expiring_soon_count: number;
  expiring_soon_list: PatientInsurance[];
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ===== SERVICE CLASS =====

class InsuranceService {
  // ============================================
  // INSURANCE PACKAGES
  // ============================================

  /**
   * Get all insurance packages
   * @param skip - Pagination offset (default: 0)
   * @param limit - Number of records (default: 100)
   * @param isActive - Filter by active status
   * @returns Insurance packages list with pagination
   */
  async getAllPackages(
    skip = 0,
    limit = 100,
    isActive: boolean | null = null
  ): Promise<InsurancePackagesResponse> {
    try {
      const params = new URLSearchParams();
      params.append('skip', skip.toString());
      params.append('limit', limit.toString());
      if (isActive !== null) {
        params.append('is_active', isActive.toString());
      }

      const response = await apiClient.get<InsurancePackagesResponse>(
        `/insurance/packages?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch insurance packages')
      );
    }
  }

  /**
   * Get insurance package by ID
   * @param packageId - Insurance package ID
   * @returns Package details with active insurance count
   */
  async getPackageById(packageId: string): Promise<InsurancePackage> {
    try {
      const response = await apiClient.get<InsurancePackage>(
        `/insurance/packages/${packageId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch insurance package')
      );
    }
  }

  /**
   * Create new insurance package (Admin only)
   * @param packageData - Package creation data
   * @returns Created package
   */
  async createPackage(
    packageData: InsurancePackageCreateInput
  ): Promise<InsurancePackage> {
    try {
      const response = await apiClient.post<InsurancePackage>(
        '/insurance/packages',
        packageData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to create insurance package')
      );
    }
  }

  /**
   * Update insurance package (Admin only)
   * @param packageId - Package ID
   * @param updateData - Fields to update
   * @returns Updated package
   */
  async updatePackage(
    packageId: string,
    updateData: InsurancePackageUpdateInput
  ): Promise<InsurancePackage> {
    try {
      const response = await apiClient.patch<InsurancePackage>(
        `/insurance/packages/${packageId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to update insurance package')
      );
    }
  }

  /**
   * Delete (deactivate) insurance package (Admin only)
   * @param packageId - Package ID
   * @returns Success response
   */
  async deletePackage(packageId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(
        `/insurance/packages/${packageId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to delete insurance package')
      );
    }
  }

  // ============================================
  // PATIENT INSURANCE
  // ============================================

  /**
   * Get all insurances for a specific patient
   * @param patientId - Patient ID
   * @returns Patient's insurance list
   */
  async getPatientInsurances(
    patientId: string
  ): Promise<PatientInsurancesResponse> {
    try {
      const response = await apiClient.get<PatientInsurancesResponse>(
        `/insurance/patient/${patientId}/insurances`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch patient insurances')
      );
    }
  }

  /**
   * Get all patient insurances with filters
   * @param skip - Pagination offset
   * @param limit - Number of records
   * @param statusFilter - Filter by status (Active, Inactive, Expired, Pending)
   * @returns All patient insurances
   */
  async getAllPatientInsurances(
    skip = 0,
    limit = 100,
    statusFilter: PatientInsurance['status'] | null = null
  ): Promise<PatientInsurancesResponse> {
    try {
      const params = new URLSearchParams();
      params.append('skip', skip.toString());
      params.append('limit', limit.toString());
      if (statusFilter) {
        params.append('status_filter', statusFilter);
      }

      const response = await apiClient.get<PatientInsurancesResponse>(
        `/insurance/patient-insurance?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch patient insurances')
      );
    }
  }

  /**
   * Get patient insurance by ID
   * @param insuranceId - Insurance ID
   * @returns Insurance details with patient and package info
   */
  async getPatientInsuranceById(insuranceId: string): Promise<PatientInsurance> {
    try {
      const response = await apiClient.get<PatientInsurance>(
        `/insurance/patient-insurance/${insuranceId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch insurance details')
      );
    }
  }

  /**
   * Get all insurances for a specific package
   * @param packageId - Package ID
   * @returns Insurances using this package
   */
  async getInsurancesByPackage(
    packageId: string
  ): Promise<PatientInsurancesResponse> {
    try {
      const response = await apiClient.get<PatientInsurancesResponse>(
        `/insurance/package/${packageId}/insurances`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch package insurances')
      );
    }
  }

  /**
   * Add insurance to a patient
   * @param insuranceData - Insurance creation data
   * @returns Created insurance
   */
  async addPatientInsurance(
    insuranceData: PatientInsuranceCreateInput
  ): Promise<PatientInsurance> {
    try {
      const response = await apiClient.post<PatientInsurance>(
        '/insurance/patient-insurance',
        insuranceData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to add patient insurance')
      );
    }
  }

  /**
   * Update patient insurance
   * @param insuranceId - Insurance ID
   * @param updateData - Update fields
   * @returns Updated insurance
   */
  async updatePatientInsurance(
    insuranceId: string,
    updateData: PatientInsuranceUpdateInput
  ): Promise<PatientInsurance> {
    try {
      const response = await apiClient.patch<PatientInsurance>(
        `/insurance/patient-insurance/${insuranceId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to update insurance')
      );
    }
  }

  /**
   * Delete (deactivate) patient insurance
   * @param insuranceId - Insurance ID
   * @returns Success response
   */
  async deletePatientInsurance(insuranceId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(
        `/insurance/patient-insurance/${insuranceId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to delete insurance')
      );
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get insurance statistics summary
   * @returns Statistics including package counts, status breakdown, expiring soon
   */
  async getInsuranceStatistics(): Promise<InsuranceStatistics> {
    try {
      const response = await apiClient.get<InsuranceStatistics>(
        '/insurance/statistics/summary'
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch insurance statistics')
      );
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get active patient insurances only
   * @param patientId - Patient ID
   * @returns Only active insurances
   */
  async getActivePatientInsurances(
    patientId: string
  ): Promise<PatientInsurance[]> {
    const response = await this.getPatientInsurances(patientId);
    return response.insurances.filter(i => i.status === 'Active');
  }

  /**
   * Check if patient has active insurance
   * @param patientId - Patient ID
   * @returns Boolean indicating if patient has active coverage
   */
  async hasActiveInsurance(patientId: string): Promise<boolean> {
    try {
      const insurances = await this.getActivePatientInsurances(patientId);
      return insurances.length > 0;
    } catch (error) {
      console.error('Error checking active insurance:', error);
      return false;
    }
  }

  /**
   * Get insurance expiring within days
   * @param patientId - Patient ID
   * @param days - Number of days threshold (default: 30)
   * @returns Insurances expiring soon
   */
  async getExpiringInsurances(
    patientId: string,
    days = 30
  ): Promise<PatientInsurance[]> {
    const response = await this.getPatientInsurances(patientId);
    const today = new Date();

    return response.insurances.filter(insurance => {
      if (insurance.status !== 'Active') return false;

      const endDate = new Date(insurance.end_date);
      const daysUntilExpiry =
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

      return daysUntilExpiry > 0 && daysUntilExpiry <= days;
    });
  }

  /**
   * Calculate total annual limit for patient
   * @param patientId - Patient ID
   * @returns Total coverage amount
   */
  async getTotalAnnualLimit(patientId: string): Promise<number> {
    const response = await this.getActivePatientInsurances(patientId);
    return response.reduce((sum, insurance) => sum + insurance.annual_limit, 0);
  }

  /**
   * Get insurance package by name
   * @param packageName - Package name to search
   * @returns Package details
   */
  async getPackageByName(packageName: string): Promise<InsurancePackage | null> {
    try {
      const response = await this.getAllPackages(0, 100, true);
      const pkg = response.packages.find(
        p => p.package_name.toLowerCase() === packageName.toLowerCase()
      );
      return pkg || null;
    } catch (error) {
      console.error('Error fetching package by name:', error);
      return null;
    }
  }
}

export default new InsuranceService();


export type {
  InsurancePackage,
  InsurancePackageCreateInput,
  InsurancePackageUpdateInput,
  PatientInsurance,
  PatientInsuranceCreateInput,
  PatientInsuranceUpdateInput,
  PaginationParams,
  InsurancePackagesResponse,
  PatientInsurancesResponse,
  InsuranceStatistics,
  ApiResponse,
};
