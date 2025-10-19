-- User Table: Frequent logins/searches by email/NIC (unique but index for speed)
CREATE INDEX idx_user_email ON user(email);
CREATE INDEX idx_user_nic ON user(NIC);

-- Appointment Table: Frequent check about appointment status
CREATE INDEX idx_appointment_patient_status_date 
ON appointment (patient_id, status, created_at DESC);

-- time_slot Table: Fast checking for availability of doctors 
CREATE INDEX idx_time_slot_doctor_date_booked 
ON time_slot (doctor_id, available_date, is_booked);

-- medication Table: Useful for frequent medication selections
CREATE INDEX idx_medication_by_generic_name
ON medication (generic_name);

-- patient_allergy Table: Useful for each consultation
CREATE INDEX idx_patient_allergy
ON patient_allergy(patient_id);

-- Patient Condition Table: Useful for frequent patient history 
CREATE INDEX idx_patient_condition_patient_date 
ON patient_condition(patient_id, diagnosed_date);