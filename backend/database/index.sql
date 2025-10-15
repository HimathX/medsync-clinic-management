-- User Table: Frequent logins/searches by email/NIC (unique but index for speed)
CREATE INDEX idx_user_email ON user(email);
CREATE INDEX idx_user_nic ON user(NIC);

-- Branch Table: Queries for active branches or by manager
CREATE INDEX idx_branch_active ON branch(is_active);
CREATE INDEX idx_branch_manager ON branch(manager_id);

-- Patient Table: Lookups by registered branch (branch-level reports)
CREATE INDEX idx_patient_branch ON patient(registered_branch_id);

-- Patient Allergy Table: Patient-specific allergy checks
CREATE INDEX idx_patient_allergy_patient ON patient_allergy(patient_id);

-- Patient Condition Table: Composite for patient history queries
CREATE INDEX idx_patient_condition_patient_date ON patient_condition(patient_id, diagnosed_date);

-- Employee Table: Active employees by branch/role
CREATE INDEX idx_employee_active_branch ON employee(branch_id, is_active);

-- Doctor Table: Availability checks
CREATE INDEX idx_doctor_available ON doctor(is_available);

-- Time Slot Table: Critical for booking—composite on doctor/date/time
CREATE INDEX idx_time_slot_doctor_date ON time_slot(doctor_id, available_date);
CREATE INDEX idx_time_slot_booked ON time_slot(is_booked);

-- Appointment Table: Status and patient filters
CREATE INDEX idx_appointment_status_patient ON appointment(patient_id, status);

-- Consultation Record Table: Joined to appointments (already unique, but index for notes/search)
-- (No new index needed; leverage existing FK)

-- Treatment Table: Lookup by consultation
CREATE INDEX idx_treatment_consultation ON treatment(consultation_rec_id);

-- Prescription Item Table: By consultation for dispensing
CREATE INDEX idx_prescription_consultation ON prescription_item(consultation_rec_id);

-- Insurance Table: Patient insurance status checks
CREATE INDEX idx_insurance_patient_status ON insurance(patient_id, status);

-- Payment Table: By patient for billing history
CREATE INDEX idx_payment_patient_date ON payment(patient_id, payment_date);

-- Claim Table: By insurance for processing
CREATE INDEX idx_claim_insurance_date ON claim(insurance_id, claim_date);

-- Appointment Table: Status grouping per branch/day (report 1)
CREATE INDEX idx_appointment_time_slot_status ON appointment(time_slot_id, status);

-- Invoice Table: Revenue by doctor (via chain to time_slot.doctor_id) and date periods (report 2)
CREATE INDEX idx_invoice_consult_date ON invoice(consultation_rec_id, created_at);

-- Payment Table: Outstanding balances by patient (report 3; pairs with existing idx_payment_patient_date)
CREATE INDEX idx_payment_patient_status ON payment(patient_id, status);

-- Treatment Table: Count per category/period (report 4; assumes grouping by treatment_service_code from catalogue)
CREATE INDEX idx_treatment_consult_date ON treatment(consultation_rec_id, created_at);