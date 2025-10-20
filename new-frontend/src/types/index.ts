// API Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  access_token: string;
  token_type: string;
  user_id: string;
  user_type: 'patient' | 'employee';
  full_name: string;
  email: string;
  role?: string;
  branch_id?: string;
  expires_at: string;
}

export interface User {
  user_id: string;
  email: string;
  full_name: string;
  user_type: 'patient' | 'employee';
  role?: string;
  branch_id?: string;
  patient_id?: string;
  employee_id?: string;
}

// Patient Profile
export interface PatientProfile {
  patient_id: string;
  full_name: string;
  email: string;
  NIC: string;
  gender: string;
  DOB: string;
  blood_group?: string;
  contact_num1: string;
  contact_num2?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  registered_branch: string;
  registration_date: string;
}

// Appointments
export interface Appointment {
  appointment_id: string;
  time_slot_id: string;
  patient_id: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No-Show';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Fields from joined time_slot and doctor
  available_date: string; // The appointment date
  start_time: string;
  end_time: string;
  doctor_name: string;
  branch_name: string;
}

export interface TimeSlot {
  time_slot_id: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  available_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  branch_id: string;
  branch_name: string;
}

export interface AppointmentBookingRequest {
  patient_id: string;
  time_slot_id: string;
  notes?: string;
}

// Medical Records
export interface Consultation {
  consultation_id: string;
  appointment_id: string;
  consultation_date: string;
  doctor_name: string;
  specialty?: string;
  diagnosis?: string;
  symptoms?: string;
  notes?: string;
}

export interface Prescription {
  prescription_id: string;
  prescription_date: string;
  doctor_name: string;
  medications: Medication[];
  duration_days?: number;
  is_active: boolean;
}

export interface Medication {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days?: number;
  instructions?: string;
}

export interface LabResult {
  result_id: string;
  test_name: string;
  result_date: string;
  result_value: string;
  normal_range?: string;
  status: 'Normal' | 'Abnormal' | 'Critical';
  doctor_name: string;
}

export interface VitalSigns {
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  recorded_date?: string;
}

// Medical Summary
export interface MedicalSummary {
  patient_id: string;
  patient_name: string;
  age: number;
  gender: string;
  blood_group?: string;
  allergies: string[];
  chronic_conditions: string[];
  current_medications: string[];
  recent_consultations: Consultation[];
  active_prescriptions: Prescription[];
  recent_lab_results: LabResult[];
  latest_vitals?: VitalSigns;
  medical_alerts: string[];
  last_visit_date?: string;
  next_appointment_date?: string;
}

// Patient Stats
export interface PatientStats {
  total_appointments: number;
  upcoming_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  total_consultations: number;
  active_prescriptions: number;
  last_visit_date?: string;
  next_appointment_date?: string;
  registered_since: string;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
