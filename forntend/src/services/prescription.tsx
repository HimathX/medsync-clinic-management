import apiClient, { handleApiError } from './api';

// ===== TYPES =====

interface PrescriptionItem {
  prescription_item_id: string;
  prescription_id: string;
  medication_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions?: string;
  created_at?: string;
  updated_at?: string;
}

interface Prescription {
  prescription_id: string;
  consultation_rec_id: string;
  patient_id: string;
  doctor_id: string;
  items: PrescriptionItem[];
  created_at?: string;
  updated_at?: string;
}

interface CreatePrescriptionInput {
  consultation_rec_id: string;
  items: CreatePrescriptionItemInput[];
}

interface CreatePrescriptionItemInput {
  medication_id: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions?: string;
}

interface UpdatePrescriptionItemInput {
  dosage?: string;
  frequency?: string;
  duration_days?: number;
  instructions?: string;
}

interface PaginationParams {
  skip: number;
  limit: number;
  total?: number;
  total_pages?: number;
}

interface PrescriptionsResponse extends PaginationParams {
  prescriptions: Prescription[];
}

interface PrescriptionHistoryItem {
  consultation_rec_id: string;
  consultation_date: string;
  doctor_name: string;
  items: PrescriptionItem[];
}

interface PrescriptionHistoryResponse {
  patient_id: string;
  total_consultations: number;
  history: PrescriptionHistoryItem[];
}

interface PatientPrescriptionsResponse extends PaginationParams {
  patient_id: string;
  prescriptions: Prescription[];
}

interface MedicationUsage {
  medication_id: string;
  medication_name: string;
  total_prescriptions: number;
  total_patients: number;
  prescribe_percentage: number;
}

interface MedicationUsageStatisticsResponse {
  period: {
    start_date?: string;
    end_date?: string;
  };
  total_medications: number;
  top_medications: MedicationUsage[];
}

type SortOption = 'recent' | 'oldest' | 'medication';

interface PrescriptionConsultationResponse {
  consultation_rec_id: string;
  items: PrescriptionItem[];
  total_items: number;
}

// ===== SERVICE CLASS =====

class PrescriptionService {
  // ============================================
  // CREATE PRESCRIPTION
  // ============================================

  /**
   * Create prescription with multiple items
   * @param prescriptionData - Prescription creation data
   * @returns Created prescription response
   */
  async createPrescription(
    prescriptionData: CreatePrescriptionInput
  ): Promise<Prescription> {
    try {
      const response = await apiClient.post<Prescription>(
        '/prescriptions/',
        prescriptionData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to create prescription')
      );
    }
  }

  // ============================================
  // GET PRESCRIPTIONS
  // ============================================

  /**
   * Get all prescriptions with optional filters
   * @param skip - Pagination offset (default: 0)
   * @param limit - Number of records (default: 100)
   * @param patientId - Filter by patient
   * @param doctorId - Filter by doctor
   * @param medicationId - Filter by medication
   * @returns Prescriptions list
   */
  async getAllPrescriptions(
    skip = 0,
    limit = 100,
    patientId: string | null = null,
    doctorId: string | null = null,
    medicationId: string | null = null
  ): Promise<PrescriptionsResponse> {
    try {
      const params = new URLSearchParams();
      params.append('skip', skip.toString());
      params.append('limit', limit.toString());
      if (patientId) params.append('patient_id', patientId);
      if (doctorId) params.append('doctor_id', doctorId);
      if (medicationId) params.append('medication_id', medicationId);

      const response = await apiClient.get<PrescriptionsResponse>(
        `/prescriptions/?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch prescriptions')
      );
    }
  }

  /**
   * Get prescription by consultation ID
   * @param consultationRecId - Consultation record ID
   * @returns Prescription items for consultation
   */
  async getPrescriptionByConsultation(
    consultationRecId: string
  ): Promise<PrescriptionConsultationResponse> {
    try {
      const response = await apiClient.get<PrescriptionConsultationResponse>(
        `/prescriptions/consultation/${consultationRecId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch prescription for consultation')
      );
    }
  }

  /**
   * Get prescription item by ID
   * @param prescriptionItemId - Prescription item ID
   * @returns Prescription item details
   */
  async getPrescriptionItem(
    prescriptionItemId: string
  ): Promise<PrescriptionItem> {
    try {
      const response = await apiClient.get<PrescriptionItem>(
        `/prescriptions/item/${prescriptionItemId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch prescription item')
      );
    }
  }

  /**
   * Get patient prescription history
   * @param patientId - Patient ID
   * @returns Complete prescription history grouped by consultation
   */
  async getPatientPrescriptionHistory(
    patientId: string
  ): Promise<PrescriptionHistoryResponse> {
    try {
      const response = await apiClient.get<PrescriptionHistoryResponse>(
        `/prescriptions/patient/${patientId}/history`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch patient prescription history')
      );
    }
  }

  /**
   * Get all prescriptions for a patient with pagination and sorting
   * @param patientId - Patient ID
   * @param skip - Pagination offset (default: 0)
   * @param limit - Maximum records (default: 10)
   * @param sortBy - Sort option: recent, oldest, medication (default: recent)
   * @returns Prescriptions grouped by consultation
   */
  async getPatientPrescriptions(
    patientId: string,
    skip = 0,
    limit = 10,
    sortBy: SortOption = 'recent'
  ): Promise<PatientPrescriptionsResponse> {
    try {
      const params = new URLSearchParams();
      params.append('skip', skip.toString());
      params.append('limit', limit.toString());
      params.append('sort_by', sortBy);

      const response = await apiClient.get<PatientPrescriptionsResponse>(
        `/prescriptions/patient/${patientId}?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch patient prescriptions')
      );
    }
  }

  // ============================================
  // UPDATE PRESCRIPTION
  // ============================================

  /**
   * Update prescription item
   * @param prescriptionItemId - Prescription item ID
   * @param updateData - Fields to update
   * @returns Updated prescription item
   */
  async updatePrescriptionItem(
    prescriptionItemId: string,
    updateData: UpdatePrescriptionItemInput
  ): Promise<PrescriptionItem> {
    try {
      const response = await apiClient.patch<PrescriptionItem>(
        `/prescriptions/item/${prescriptionItemId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to update prescription item')
      );
    }
  }

  // ============================================
  // DELETE PRESCRIPTION
  // ============================================

  /**
   * Delete prescription item
   * @param prescriptionItemId - Prescription item ID
   * @returns Success response
   */
  async deletePrescriptionItem(prescriptionItemId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(
        `/prescriptions/item/${prescriptionItemId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to delete prescription item')
      );
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get medication usage statistics
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param limit - Number of top medications (default: 10)
   * @returns Most prescribed medications statistics
   */
  async getMedicationUsageStatistics(
    startDate: string | null = null,
    endDate: string | null = null,
    limit = 10
  ): Promise<MedicationUsageStatisticsResponse> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('limit', limit.toString());

      const response = await apiClient.get<MedicationUsageStatisticsResponse>(
        `/prescriptions/statistics/medication-usage?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        handleApiError(error, 'Failed to fetch medication usage statistics')
      );
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get all medications from a prescription
   * @param prescriptionId - Prescription ID
   * @returns Array of medications
   */
  async getPrescriptionMedications(prescriptionId: string): Promise<PrescriptionItem[]> {
    try {
      // Assuming prescription items are included in the prescription object
      const response = await apiClient.get<Prescription>(
        `/prescriptions/${prescriptionId}`
      );
      return response.data.items;
    } catch (error) {
      console.error('Error fetching prescription medications:', error);
      return [];
    }
  }

  /**
   * Get patient's current active prescriptions
   * @param patientId - Patient ID
   * @returns Active prescriptions (not expired)
   */
  async getActivePrescriptions(patientId: string): Promise<Prescription[]> {
    try {
      const response = await this.getPatientPrescriptions(patientId, 0, 100, 'recent');
      const today = new Date();

      return response.prescriptions.filter(prescription => {
        // Check if any item in prescription is still active
        return prescription.items.some(item => {
          if (!item.created_at) return true; // If no created_at, assume active

          const createdDate = new Date(item.created_at);
          const expiryDate = new Date(createdDate);
          expiryDate.setDate(expiryDate.getDate() + item.duration_days);

          return expiryDate > today;
        });
      });
    } catch (error) {
      console.error('Error fetching active prescriptions:', error);
      return [];
    }
  }

  /**
   * Get patient's expired prescriptions
   * @param patientId - Patient ID
   * @returns Expired prescriptions
   */
  async getExpiredPrescriptions(patientId: string): Promise<Prescription[]> {
    try {
      const response = await this.getPatientPrescriptions(patientId, 0, 100, 'recent');
      const today = new Date();

      return response.prescriptions.filter(prescription => {
        // All items must be expired
        return prescription.items.every(item => {
          if (!item.created_at) return false;

          const createdDate = new Date(item.created_at);
          const expiryDate = new Date(createdDate);
          expiryDate.setDate(expiryDate.getDate() + item.duration_days);

          return expiryDate <= today;
        });
      });
    } catch (error) {
      console.error('Error fetching expired prescriptions:', error);
      return [];
    }
  }

  /**
   * Get prescription expiry date for an item
   * @param item - Prescription item
   * @returns Expiry date
   */
  getItemExpiryDate(item: PrescriptionItem): Date | null {
    if (!item.created_at) return null;

    const createdDate = new Date(item.created_at);
    const expiryDate = new Date(createdDate);
    expiryDate.setDate(expiryDate.getDate() + item.duration_days);

    return expiryDate;
  }

  /**
   * Check if prescription item is expired
   * @param item - Prescription item
   * @returns Boolean indicating if item is expired
   */
  isItemExpired(item: PrescriptionItem): boolean {
    const expiryDate = this.getItemExpiryDate(item);
    if (!expiryDate) return false;
    return expiryDate <= new Date();
  }

  /**
   * Get days remaining for prescription item
   * @param item - Prescription item
   * @returns Days remaining (negative if expired)
   */
  getDaysRemaining(item: PrescriptionItem): number {
    const expiryDate = this.getItemExpiryDate(item);
    if (!expiryDate) return 0;

    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Format prescription item for display
   * @param item - Prescription item
   * @returns Formatted string
   */
  formatPrescriptionItem(item: PrescriptionItem): string {
    return `${item.medication_name} - ${item.dosage} ${item.frequency} for ${item.duration_days} days`;
  }

  /**
   * Get total number of medications in a prescription
   * @param prescription - Prescription object
   * @returns Count of medications
   */
  getMedicationCount(prescription: Prescription): number {
    return prescription.items.length;
  }

  /**
   * Search medications in patient's prescription history
   * @param patientId - Patient ID
   * @param medicationName - Medication name to search (case-insensitive)
   * @returns Prescription items matching search
   */
  async searchMedications(
    patientId: string,
    medicationName: string
  ): Promise<PrescriptionItem[]> {
    try {
      const history = await this.getPatientPrescriptionHistory(patientId);
      const searchTerm = medicationName.toLowerCase();

      return history.history.flatMap(item =>
        item.items.filter(med =>
          med.medication_name.toLowerCase().includes(searchTerm)
        )
      );
    } catch (error) {
      console.error('Error searching medications:', error);
      return [];
    }
  }

  /**
   * Export prescription as formatted text
   * @param prescription - Prescription object
   * @returns Formatted prescription text
   */
  exportAsText(prescription: Prescription): string {
    const items = prescription.items
      .map(
        (item, index) =>
          `${index + 1}. ${this.formatPrescriptionItem(item)}${
            item.instructions ? `\n   Instructions: ${item.instructions}` : ''
          }`
      )
      .join('\n');

    return `Prescription ID: ${prescription.prescription_id}\nConsultation: ${prescription.consultation_rec_id}\n\nMedications:\n${items}`;
  }
}

export default new PrescriptionService();

// ===== EXPORT TYPES =====

export type {
  PrescriptionItem,
  Prescription,
  CreatePrescriptionInput,
  CreatePrescriptionItemInput,
  UpdatePrescriptionItemInput,
  PaginationParams,
  PrescriptionsResponse,
  PrescriptionHistoryItem,
  PrescriptionHistoryResponse,
  PatientPrescriptionsResponse,
  MedicationUsage,
  MedicationUsageStatisticsResponse,
  SortOption,
  PrescriptionConsultationResponse,
};
