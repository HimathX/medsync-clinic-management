import api from './api';
import {
  Appointment,
  TimeSlot,
  AppointmentBookingRequest,
} from '../types';

export const appointmentService = {
  // Book an appointment
  bookAppointment: async (data: AppointmentBookingRequest): Promise<any> => {
    const response = await api.post('/api/appointments/book', data);
    return response.data;
  },

  // Get patient appointments
  getPatientAppointments: async (
    patientId: string,
    options?: {
      status?: string;
      from_date?: string;
      to_date?: string;
      branch_id?: string;
    }
  ): Promise<Appointment[]> => {
    // Backend expects patient_id in path, not query parameter
    // Backend route: GET /api/appointments/patient/{patient_id}
    const response = await api.get<{ patient_id: string; total: number; appointments: Appointment[] }>(
      `/api/appointments/patient/${patientId}`
    );
    
    // Backend returns {patient_id, total, appointments}, extract appointments array
    let appointments = response.data.appointments || [];
    
    // Filter by status on frontend (backend doesn't support status filter)
    if (options?.status) {
      appointments = appointments.filter(apt => apt.status === options.status);
    }
    
    // Filter by date range if provided
    if (options?.from_date) {
      appointments = appointments.filter(apt => apt.available_date >= options.from_date!);
    }
    if (options?.to_date) {
      appointments = appointments.filter(apt => apt.available_date <= options.to_date!);
    }
    
    // Filter by branch if provided
    if (options?.branch_id) {
      appointments = appointments.filter(apt => 
        // Note: Backend doesn't return branch_id, only branch_name
        // This filter may not work unless backend is updated
        apt.branch_name === options.branch_id
      );
    }
    
    return appointments;
  },

  // Get available time slots
  getAvailableTimeSlots: async (options?: {
    doctor_id?: string;
    branch_id?: string;
    from_date?: string;
    to_date?: string;
    specialty?: string;
  }): Promise<TimeSlot[]> => {
    const params = new URLSearchParams();
    if (options?.doctor_id) params.append('doctor_id', options.doctor_id);
    if (options?.branch_id) params.append('branch_id', options.branch_id);
    if (options?.from_date) params.append('from_date', options.from_date);
    if (options?.to_date) params.append('to_date', options.to_date);
    if (options?.specialty) params.append('specialty', options.specialty);

    const response = await api.get<TimeSlot[]>(
      `/api/appointments/available-slots?${params.toString()}`
    );
    return response.data;
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId: string, reason?: string): Promise<any> => {
    const response = await api.delete(`/api/appointments/${appointmentId}`, {
      data: { reason },
    });
    return response.data;
  },

  // Update appointment
  updateAppointment: async (
    appointmentId: string,
    data: { status?: string; notes?: string }
  ): Promise<any> => {
    const response = await api.patch(`/api/appointments/${appointmentId}`, data);
    return response.data;
  },
};
