import api from './api';
import {
  PatientProfile,
  MedicalSummary,
  PatientStats,
} from '../types';

export const patientService = {
  // Get patient profile
  getProfile: async (patientId: string): Promise<PatientProfile> => {
    const response = await api.get<PatientProfile>(`/patients/${patientId}/profile`);
    return response.data;
  },

  // Update patient profile
  updateProfile: async (patientId: string, data: Partial<PatientProfile>): Promise<any> => {
    const response = await api.put(`/patients/${patientId}/profile`, data);
    return response.data;
  },

  // Get medical summary
  getMedicalSummary: async (
    patientId: string,
    options?: {
      include_consultations?: boolean;
      include_prescriptions?: boolean;
      include_lab_results?: boolean;
      consultations_limit?: number;
      prescriptions_limit?: number;
      lab_results_limit?: number;
    }
  ): Promise<MedicalSummary> => {
    const params = new URLSearchParams();
    if (options?.include_consultations !== undefined) {
      params.append('include_consultations', String(options.include_consultations));
    }
    if (options?.include_prescriptions !== undefined) {
      params.append('include_prescriptions', String(options.include_prescriptions));
    }
    if (options?.include_lab_results !== undefined) {
      params.append('include_lab_results', String(options.include_lab_results));
    }
    if (options?.consultations_limit) {
      params.append('consultations_limit', String(options.consultations_limit));
    }
    if (options?.prescriptions_limit) {
      params.append('prescriptions_limit', String(options.prescriptions_limit));
    }
    if (options?.lab_results_limit) {
      params.append('lab_results_limit', String(options.lab_results_limit));
    }

    const response = await api.get<MedicalSummary>(
      `/patients/${patientId}/medical-summary?${params.toString()}`
    );
    return response.data;
  },

  // Get patient stats
  getStats: async (patientId: string): Promise<PatientStats> => {
    const response = await api.get<PatientStats>(`/patients/${patientId}/stats`);
    return response.data;
  },
};
