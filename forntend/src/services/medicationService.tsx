import api from './api';


class MedicationService {
  private baseUrl = '/medications';

  /**
   * Create a new medication
   * @param name - Medication name (e.g., "Paracetamol")
   * @param manufacturer - Manufacturer name (e.g., "PharmaCorp")
   * @param form - Medication form: Tablet, Capsule, Injection, Syrup, or Other
   * @param contraindications - When NOT to use this medication (optional)
   * @param sideEffects - Possible side effects (optional)
   * @returns Success message with medication ID
   */
  async createMedication(
    name: string,
    manufacturer: string,
    form: 'Tablet' | 'Capsule' | 'Injection' | 'Syrup' | 'Other',
    contraindications?: string,
    sideEffects?: string
  ) {
    try {
      const response = await api.post(`${this.baseUrl}/bulk`, {
        medications: [
          {
            generic_name: name,
            manufacturer: manufacturer,
            form: form,
            contraindications: contraindications,
            side_effects: sideEffects,
          },
        ],
      });

      console.log('✅ Medication created successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating medication:', error);
      throw error;
    }
  }

  /**
   * Get all medications
   * @param skip - How many to skip (for pagination)
   * @param limit - How many to get
   * @returns List of medications
   */
  async getAllMedications(skip = 0, limit = 50) {
    try {
      const response = await api.get(`${this.baseUrl}/`, {
        params: {
          skip: skip,
          limit: limit,
        },
      });

      console.log(`✅ Fetched ${response.data.medications.length} medications`);
      return response.data.medications;
    } catch (error) {
      console.error('❌ Error fetching medications:', error);
      throw error;
    }
  }

  /**
   * Get one medication by ID
   * @param medicationId - The medication ID
   * @returns Medication details
   */
  async getMedicationById(medicationId: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${medicationId}`);
      console.log('✅ Fetched medication:', response.data.medication.generic_name);
      return response.data.medication;
    } catch (error) {
      console.error('❌ Error fetching medication:', error);
      throw error;
    }
  }

  /**
   * Search for medications by name
   * @param searchName - The medication name to search for
   * @returns List of matching medications
   */
  async searchMedications(searchName: string) {
    try {
      const response = await api.get(`${this.baseUrl}/search/advanced`, {
        params: {
          query: searchName,
        },
      });

      console.log(`✅ Found ${response.data.total_found} medications`);
      return response.data.medications;
    } catch (error) {
      console.error('❌ Error searching medications:', error);
      throw error;
    }
  }

  /**
   * Get medications by type (Tablet, Capsule, etc.)
   * @param form - Type of medication
   * @returns List of medications of that type
   */
  async getMedicationsByForm(form: 'Tablet' | 'Capsule' | 'Injection' | 'Syrup' | 'Other') {
    try {
      const response = await api.get(`${this.baseUrl}/by-form/${form}`);
      console.log(`✅ Found ${response.data.count} ${form}s`);
      return response.data.medications;
    } catch (error) {
      console.error('❌ Error fetching medications by form:', error);
      throw error;
    }
  }

  /**
   * Update a medication
   * @param medicationId - The medication ID
   * @param updates - What to update (name, form, side effects, etc.)
   * @returns Updated medication
   */
  async updateMedication(medicationId: string, updates: any) {
    try {
      const response = await api.patch(`${this.baseUrl}/${medicationId}`, updates);
      console.log('✅ Medication updated successfully');
      return response.data.medication;
    } catch (error) {
      console.error('❌ Error updating medication:', error);
      throw error;
    }
  }

  /**
   * Delete a medication
   * @param medicationId - The medication ID
   * @param force - If true, delete even if it's used in prescriptions
   * @returns Success message
   */
  async deleteMedication(medicationId: string, force = false) {
    try {
      const response = await api.delete(`${this.baseUrl}/${medicationId}`, {
        params: {
          force: force,
        },
      });

      console.log('✅ Medication deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting medication:', error);
      throw error;
    }
  }

  /**
   * Format medication nicely for display
   * Example: "Paracetamol (PharmaCorp) - Tablet"
   */
  formatMedication(medication: any): string {
    return `${medication.generic_name} (${medication.manufacturer}) - ${medication.form}`;
  }

  /**
   * Check if medication has warnings (contraindications or side effects)
   */
  hasWarnings(medication: any): boolean {
    return !!(medication.contraindications || medication.side_effects);
  }
}

// Create and export a single instance
export default new MedicationService();