import api from './api';

export interface Specialization {
  specialization_id: string;
  specialization_title: string;
  other_details?: string;
}

export interface Doctor {
  doctor_id: string;
  user_id: string;
  full_name: string;
  email: string;
  specialization_title?: string;
  room_no?: string;
  consultation_fee: number;
  branch_name: string;
}

export interface DoctorTimeSlot {
  time_slot_id: string;
  doctor_id: string;
  branch_id: string;
  available_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  doctor_name?: string;
  branch_name?: string;
}

export const doctorService = {
  // Get all specializations
  getAllSpecializations: async (): Promise<Specialization[]> => {
    const response = await api.get('/api/doctors/specializations/all');
    return response.data.specializations || [];
  },

  // Get doctors by specialization
  getDoctorsBySpecialization: async (specializationId: string): Promise<Doctor[]> => {
    const response = await api.get(`/api/doctors/specialization/${specializationId}`);
    return response.data.doctors || [];
  },

  // Get time slots for a specific doctor
  getTimeSlotsByDoctor: async (
    doctorId: string,
    includePast: boolean = false,
    isBooked?: boolean
  ): Promise<DoctorTimeSlot[]> => {
    const params = new URLSearchParams();
    if (includePast) params.append('include_past', 'true');
    if (isBooked !== undefined) params.append('is_booked', isBooked.toString());

    const response = await api.get(
      `/api/timeslots/doctor/${doctorId}?${params.toString()}`
    );
    return response.data.time_slots || [];
  },
};
