-- ============================================
-- MedSync Database Views
-- Patient, Doctor, and Analytics Views
-- ============================================

USE medsync_db;

-- ============================================
-- SECTION 1: PATIENT VIEWS (Row-Level Security)
-- These views enforce patient data isolation
-- ============================================

-- View: Patient Profile (Own data only)
DROP VIEW IF EXISTS v_patient_profile;
CREATE VIEW v_patient_profile AS
SELECT 
    p.patient_id,
    u.full_name,
    u.email,
    u.NIC,
    u.gender,
    u.DOB,
    TIMESTAMPDIFF(YEAR, u.DOB, CURDATE()) AS age,
    p.blood_group,
    b.branch_name AS registered_branch,
    c.contact_num1,
    c.contact_num2,
    a.address_line1,
    a.address_line2,
    a.city,
    a.province,
    a.postal_code,
    a.country,
    pb.total_balance,
    u.last_login,
    p.created_at AS registration_date
FROM patient p
INNER JOIN user u ON p.patient_id = u.user_id
INNER JOIN branch b ON p.registered_branch_id = b.branch_id
LEFT JOIN contact c ON u.contact_id = c.contact_id
LEFT JOIN address a ON u.address_id = a.address_id
LEFT JOIN patient_balance pb ON p.patient_id = pb.patient_id;

-- View: Patient Appointments
DROP VIEW IF EXISTS v_patient_appointments;
CREATE VIEW v_patient_appointments AS
SELECT 
    a.appointment_id,
    a.patient_id,
    u_patient.full_name AS patient_name,
    u_doctor.full_name AS doctor_name,
    sp.specialization_title AS doctor_specialization,
    ts.available_date AS appointment_date,
    ts.start_time,
    ts.end_time,
    a.status,
    a.notes,
    b.branch_name,
    d.consultation_fee,
    a.created_at AS booked_at
FROM appointment a
INNER JOIN patient p ON a.patient_id = p.patient_id
INNER JOIN user u_patient ON p.patient_id = u_patient.user_id
INNER JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
INNER JOIN doctor d ON ts.doctor_id = d.doctor_id
INNER JOIN user u_doctor ON d.doctor_id = u_doctor.user_id
INNER JOIN branch b ON ts.branch_id = b.branch_id
LEFT JOIN doctor_specialization ds ON d.doctor_id = ds.doctor_id
LEFT JOIN specialization sp ON ds.specialization_id = sp.specialization_id;

-- View: Patient Medical History
DROP VIEW IF EXISTS v_patient_medical_history;
CREATE VIEW v_patient_medical_history AS
SELECT 
    cr.consultation_rec_id,
    a.patient_id,
    u_patient.full_name AS patient_name,
    u_doctor.full_name AS doctor_name,
    ts.available_date AS consultation_date,
    cr.symptoms,
    cr.diagnoses,
    cr.follow_up_required,
    cr.follow_up_date,
    GROUP_CONCAT(DISTINCT m.generic_name ORDER BY m.generic_name SEPARATOR ', ') AS medications,
    GROUP_CONCAT(DISTINCT tc.treatment_name ORDER BY tc.treatment_name SEPARATOR ', ') AS treatments,
    cr.created_at
FROM consultation_record cr
INNER JOIN appointment a ON cr.appointment_id = a.appointment_id
INNER JOIN user u_patient ON a.patient_id = u_patient.user_id
INNER JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
INNER JOIN doctor d ON ts.doctor_id = d.doctor_id
INNER JOIN user u_doctor ON d.doctor_id = u_doctor.user_id
LEFT JOIN prescription_item pi ON cr.consultation_rec_id = pi.consultation_rec_id
LEFT JOIN medication m ON pi.medication_id = m.medication_id
LEFT JOIN treatment t ON cr.consultation_rec_id = t.consultation_rec_id
LEFT JOIN treatment_catalogue tc ON t.treatment_service_code = tc.treatment_service_code
GROUP BY cr.consultation_rec_id;

-- View: Patient Invoices
DROP VIEW IF EXISTS v_patient_invoices;
CREATE VIEW v_patient_invoices AS
SELECT 
    i.invoice_id,
    a.patient_id,
    u.full_name AS patient_name,
    cr.consultation_rec_id,
    i.sub_total,
    i.tax_amount,
    (i.sub_total + i.tax_amount) AS total_amount,
    COALESCE(SUM(cl.claim_amount), 0) AS total_claimed,
    ((i.sub_total + i.tax_amount) - COALESCE(SUM(cl.claim_amount), 0)) AS balance_due,
    i.due_date,
    CASE 
        WHEN i.due_date < CURDATE() THEN 'Overdue'
        WHEN ((i.sub_total + i.tax_amount) - COALESCE(SUM(cl.claim_amount), 0)) <= 0 THEN 'Paid'
        ELSE 'Pending'
    END AS payment_status,
    i.created_at AS invoice_date
FROM invoice i
INNER JOIN consultation_record cr ON i.consultation_rec_id = cr.consultation_rec_id
INNER JOIN appointment a ON cr.appointment_id = a.appointment_id
INNER JOIN user u ON a.patient_id = u.user_id
LEFT JOIN claim cl ON i.invoice_id = cl.invoice_id
GROUP BY i.invoice_id;

-- View: Patient Payments
DROP VIEW IF EXISTS v_patient_payments;
CREATE VIEW v_patient_payments AS
SELECT 
    py.payment_id,
    py.patient_id,
    u.full_name AS patient_name,
    py.amount_paid,
    py.payment_method,
    py.status,
    py.payment_date,
    py.notes,
    py.created_at
FROM payment py
INNER JOIN user u ON py.patient_id = u.user_id;

-- View: Patient Prescriptions
DROP VIEW IF EXISTS v_patient_prescriptions;
CREATE VIEW v_patient_prescriptions AS
SELECT 
    pi.prescription_item_id,
    a.patient_id,
    u_patient.full_name AS patient_name,
    u_doctor.full_name AS prescribed_by,
    ts.available_date AS prescription_date,
    m.generic_name,
    m.manufacturer,
    m.form,
    pi.dosage,
    pi.frequency,
    pi.duration_days,
    pi.instructions,
    m.contraindications,
    m.side_effects,
    pi.created_at
FROM prescription_item pi
INNER JOIN medication m ON pi.medication_id = m.medication_id
INNER JOIN consultation_record cr ON pi.consultation_rec_id = cr.consultation_rec_id
INNER JOIN appointment a ON cr.appointment_id = a.appointment_id
INNER JOIN user u_patient ON a.patient_id = u_patient.user_id
INNER JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
INNER JOIN doctor d ON ts.doctor_id = d.doctor_id
INNER JOIN user u_doctor ON d.doctor_id = u_doctor.user_id;

-- View: Patient Insurance
DROP VIEW IF EXISTS v_patient_insurance;
CREATE VIEW v_patient_insurance AS
SELECT 
    ins.insurance_id,
    ins.patient_id,
    u.full_name AS patient_name,
    ip.package_name,
    ip.annual_limit,
    ip.copayment_percentage,
    ins.status,
    ins.start_date,
    ins.end_date,
    DATEDIFF(ins.end_date, CURDATE()) AS days_until_expiry,
    CASE 
        WHEN ins.end_date < CURDATE() THEN 'Expired'
        WHEN DATEDIFF(ins.end_date, CURDATE()) <= 30 THEN 'Expiring Soon'
        ELSE 'Active'
    END AS coverage_status,
    ins.created_at
FROM insurance ins
INNER JOIN patient p ON ins.patient_id = p.patient_id
INNER JOIN user u ON p.patient_id = u.user_id
INNER JOIN insurance_package ip ON ins.insurance_package_id = ip.insurance_package_id;

-- View: Patient Allergies
DROP VIEW IF EXISTS v_patient_allergies;
CREATE VIEW v_patient_allergies AS
SELECT 
    pa.patient_allergy_id,
    pa.patient_id,
    u.full_name AS patient_name,
    pa.allergy_name,
    pa.severity,
    pa.reaction_description,
    pa.diagnosed_date,
    pa.created_at
FROM patient_allergy pa
INNER JOIN user u ON pa.patient_id = u.user_id;

-- View: Patient Conditions
DROP VIEW IF EXISTS v_patient_conditions;
CREATE VIEW v_patient_conditions AS
SELECT 
    pc.patient_id,
    u.full_name AS patient_name,
    cc.category_name AS condition_category,
    c.condition_name,
    c.severity,
    pc.diagnosed_date,
    pc.is_chronic,
    pc.current_status,
    pc.notes,
    pc.created_at
FROM patient_condition pc
INNER JOIN user u ON pc.patient_id = u.user_id
INNER JOIN conditions c ON pc.condition_id = c.condition_id
INNER JOIN conditions_category cc ON c.condition_category_id = cc.condition_category_id;

-- ============================================
-- SECTION 2: DOCTOR VIEWS
-- ============================================

-- View: Doctor Schedule
DROP VIEW IF EXISTS v_doctor_schedule;
CREATE VIEW v_doctor_schedule AS
SELECT 
    ts.time_slot_id,
    d.doctor_id,
    u_doctor.full_name AS doctor_name,
    d.medical_licence_no,
    sp.specialization_title,
    b.branch_name,
    ts.available_date,
    ts.start_time,
    ts.end_time,
    ts.is_booked,
    CASE 
        WHEN a.appointment_id IS NOT NULL THEN u_patient.full_name
        ELSE NULL
    END AS patient_name,
    CASE 
        WHEN a.appointment_id IS NOT NULL THEN a.status
        ELSE 'Available'
    END AS appointment_status,
    a.appointment_id,
    a.notes AS appointment_notes
FROM time_slot ts
INNER JOIN doctor d ON ts.doctor_id = d.doctor_id
INNER JOIN user u_doctor ON d.doctor_id = u_doctor.user_id
INNER JOIN branch b ON ts.branch_id = b.branch_id
LEFT JOIN doctor_specialization ds ON d.doctor_id = ds.doctor_id
LEFT JOIN specialization sp ON ds.specialization_id = sp.specialization_id
LEFT JOIN appointment a ON ts.time_slot_id = a.time_slot_id
LEFT JOIN user u_patient ON a.patient_id = u_patient.user_id;

-- View: Doctor Performance
DROP VIEW IF EXISTS v_doctor_performance;
CREATE VIEW v_doctor_performance AS
SELECT 
    d.doctor_id,
    u.full_name AS doctor_name,
    sp.specialization_title,
    b.branch_name,
    d.consultation_fee,
    COUNT(DISTINCT a.appointment_id) AS total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'Completed' THEN a.appointment_id END) AS completed_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'Cancelled' THEN a.appointment_id END) AS cancelled_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'No-Show' THEN a.appointment_id END) AS no_show_appointments,
    COUNT(DISTINCT cr.consultation_rec_id) AS total_consultations,
    ROUND(AVG(TIMESTAMPDIFF(MINUTE, a.created_at, cr.created_at)), 2) AS avg_consultation_duration_mins,
    SUM(d.consultation_fee) AS total_revenue,
    ROUND((COUNT(DISTINCT CASE WHEN a.status = 'Completed' THEN a.appointment_id END) / 
           NULLIF(COUNT(DISTINCT a.appointment_id), 0) * 100), 2) AS completion_rate_percentage
FROM doctor d
INNER JOIN user u ON d.doctor_id = u.user_id
INNER JOIN employee e ON d.doctor_id = e.employee_id
INNER JOIN branch b ON e.branch_id = b.branch_id
LEFT JOIN doctor_specialization ds ON d.doctor_id = ds.doctor_id
LEFT JOIN specialization sp ON ds.specialization_id = sp.specialization_id
LEFT JOIN time_slot ts ON d.doctor_id = ts.doctor_id
LEFT JOIN appointment a ON ts.time_slot_id = a.time_slot_id
LEFT JOIN consultation_record cr ON a.appointment_id = cr.appointment_id
GROUP BY d.doctor_id;

-- View: Doctor Patient List
DROP VIEW IF EXISTS v_doctor_patients;
CREATE VIEW v_doctor_patients AS
SELECT DISTINCT
    d.doctor_id,
    u_doctor.full_name AS doctor_name,
    a.patient_id,
    u_patient.full_name AS patient_name,
    u_patient.email AS patient_email,
    u_patient.NIC AS patient_nic,
    p.blood_group,
    COUNT(DISTINCT a.appointment_id) AS total_appointments,
    MAX(ts.available_date) AS last_visit_date,
    MAX(CASE WHEN a.status = 'Scheduled' THEN ts.available_date END) AS next_appointment_date
FROM doctor d
INNER JOIN user u_doctor ON d.doctor_id = u_doctor.user_id
INNER JOIN time_slot ts ON d.doctor_id = ts.doctor_id
INNER JOIN appointment a ON ts.time_slot_id = a.time_slot_id
INNER JOIN patient p ON a.patient_id = p.patient_id
INNER JOIN user u_patient ON p.patient_id = u_patient.user_id
GROUP BY d.doctor_id, a.patient_id;

-- ============================================
-- SECTION 3: ANALYTICS VIEWS
-- ============================================

-- View: Daily Appointment Summary
DROP VIEW IF EXISTS v_daily_appointment_summary;
CREATE VIEW v_daily_appointment_summary AS
SELECT 
    DATE(a.created_at) AS appointment_date,
    b.branch_id,
    b.branch_name,
    COUNT(DISTINCT a.appointment_id) AS total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'Scheduled' THEN a.appointment_id END) AS scheduled,
    COUNT(DISTINCT CASE WHEN a.status = 'Completed' THEN a.appointment_id END) AS completed,
    COUNT(DISTINCT CASE WHEN a.status = 'Cancelled' THEN a.appointment_id END) AS cancelled,
    COUNT(DISTINCT CASE WHEN a.status = 'No-Show' THEN a.appointment_id END) AS no_show,
    COUNT(DISTINCT a.patient_id) AS unique_patients,
    COUNT(DISTINCT ts.doctor_id) AS active_doctors
FROM appointment a
INNER JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
INNER JOIN branch b ON ts.branch_id = b.branch_id
GROUP BY DATE(a.created_at), b.branch_id;

-- View: Revenue Summary
DROP VIEW IF EXISTS v_revenue_summary;
CREATE VIEW v_revenue_summary AS
SELECT 
    DATE(i.created_at) AS invoice_date,
    b.branch_id,
    b.branch_name,
    COUNT(DISTINCT i.invoice_id) AS total_invoices,
    SUM(i.sub_total) AS total_sub_total,
    SUM(i.tax_amount) AS total_tax,
    SUM(i.sub_total + i.tax_amount) AS total_revenue,
    COALESCE(SUM(cl.claim_amount), 0) AS total_insurance_claims,
    COALESCE(SUM(py.amount_paid), 0) AS total_payments_received,
    (SUM(i.sub_total + i.tax_amount) - COALESCE(SUM(cl.claim_amount), 0) - COALESCE(SUM(py.amount_paid), 0)) AS outstanding_balance
FROM invoice i
INNER JOIN consultation_record cr ON i.consultation_rec_id = cr.consultation_rec_id
INNER JOIN appointment a ON cr.appointment_id = a.appointment_id
INNER JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
INNER JOIN branch b ON ts.branch_id = b.branch_id
LEFT JOIN claim cl ON i.invoice_id = cl.invoice_id
LEFT JOIN payment py ON a.patient_id = py.patient_id AND DATE(py.payment_date) = DATE(i.created_at)
GROUP BY DATE(i.created_at), b.branch_id;

-- View: Medication Inventory Summary
DROP VIEW IF EXISTS v_medication_inventory;
CREATE VIEW v_medication_inventory AS
SELECT 
    m.medication_id,
    m.generic_name,
    m.manufacturer,
    m.form,
    COUNT(DISTINCT pi.prescription_item_id) AS times_prescribed,
    COUNT(DISTINCT cr.consultation_rec_id) AS total_consultations,
    MIN(pi.created_at) AS first_prescribed_date,
    MAX(pi.created_at) AS last_prescribed_date,
    GROUP_CONCAT(DISTINCT c.condition_name ORDER BY c.condition_name SEPARATOR ', ') AS commonly_for_conditions
FROM medication m
LEFT JOIN prescription_item pi ON m.medication_id = pi.medication_id
LEFT JOIN consultation_record cr ON pi.consultation_rec_id = cr.consultation_rec_id
LEFT JOIN appointment a ON cr.appointment_id = a.appointment_id
LEFT JOIN patient_condition pc ON a.patient_id = pc.patient_id
LEFT JOIN conditions c ON pc.condition_id = c.condition_id
GROUP BY m.medication_id;

-- View: Active Insurance Coverage
DROP VIEW IF EXISTS v_active_insurance;
CREATE VIEW v_active_insurance AS
SELECT 
    b.branch_id,
    b.branch_name,
    ip.package_name,
    COUNT(DISTINCT ins.patient_id) AS active_patients,
    SUM(ip.annual_limit) AS total_coverage_limit,
    AVG(ip.copayment_percentage) AS avg_copayment_percentage,
    MIN(ins.start_date) AS earliest_start_date,
    MAX(ins.end_date) AS latest_end_date
FROM insurance ins
INNER JOIN patient p ON ins.patient_id = p.patient_id
INNER JOIN branch b ON p.registered_branch_id = b.branch_id
INNER JOIN insurance_package ip ON ins.insurance_package_id = ip.insurance_package_id
WHERE ins.status = 'Active' 
AND ins.end_date >= CURDATE()
GROUP BY b.branch_id, ip.package_name;

-- View: Branch Performance Summary
DROP VIEW IF EXISTS v_branch_performance;
CREATE VIEW v_branch_performance AS
SELECT 
    b.branch_id,
    b.branch_name,
    b.is_active,
    COUNT(DISTINCT CASE WHEN e.is_active = TRUE THEN e.employee_id END) AS total_active_staff,
    COUNT(DISTINCT CASE WHEN e.role = 'doctor' AND e.is_active = TRUE THEN e.employee_id END) AS total_doctors,
    COUNT(DISTINCT CASE WHEN e.role = 'nurse' AND e.is_active = TRUE THEN e.employee_id END) AS total_nurses,
    COUNT(DISTINCT p.patient_id) AS total_registered_patients,
    COUNT(DISTINCT a.appointment_id) AS total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'Completed' THEN a.appointment_id END) AS completed_appointments,
    COALESCE(SUM(i.sub_total + i.tax_amount), 0) AS total_revenue,
    COALESCE(SUM(py.amount_paid), 0) AS total_payments_collected
FROM branch b
LEFT JOIN employee e ON b.branch_id = e.branch_id
LEFT JOIN patient p ON b.branch_id = p.registered_branch_id
LEFT JOIN time_slot ts ON b.branch_id = ts.branch_id
LEFT JOIN appointment a ON ts.time_slot_id = a.time_slot_id
LEFT JOIN consultation_record cr ON a.appointment_id = cr.appointment_id
LEFT JOIN invoice i ON cr.consultation_rec_id = i.consultation_rec_id
LEFT JOIN payment py ON a.patient_id = py.patient_id
GROUP BY b.branch_id;

-- View: Available Time Slots (for patient booking)
DROP VIEW IF EXISTS v_available_time_slots;
CREATE VIEW v_available_time_slots AS
SELECT 
    ts.time_slot_id,
    d.doctor_id,
    u.full_name AS doctor_name,
    sp.specialization_title,
    b.branch_name,
    b.branch_id,
    ts.available_date,
    ts.start_time,
    ts.end_time,
    d.consultation_fee,
    d.room_no
FROM time_slot ts
INNER JOIN doctor d ON ts.doctor_id = d.doctor_id
INNER JOIN user u ON d.doctor_id = u.user_id
INNER JOIN branch b ON ts.branch_id = b.branch_id
LEFT JOIN doctor_specialization ds ON d.doctor_id = ds.doctor_id
LEFT JOIN specialization sp ON ds.specialization_id = sp.specialization_id
WHERE ts.is_booked = FALSE
AND ts.available_date >= CURDATE()
AND d.is_available = TRUE
ORDER BY ts.available_date, ts.start_time;

-- View: Treatment Statistics
DROP VIEW IF EXISTS v_treatment_statistics;
CREATE VIEW v_treatment_statistics AS
SELECT 
    tc.treatment_service_code,
    tc.treatment_name,
    tc.base_price,
    tc.duration,
    COUNT(DISTINCT t.treatment_id) AS times_performed,
    COUNT(DISTINCT t.consultation_rec_id) AS total_consultations,
    SUM(tc.base_price) AS total_revenue,
    AVG(tc.base_price) AS avg_price,
    MIN(t.created_at) AS first_performed_date,
    MAX(t.created_at) AS last_performed_date
FROM treatment_catalogue tc
LEFT JOIN treatment t ON tc.treatment_service_code = t.treatment_service_code
GROUP BY tc.treatment_service_code;

-- ============================================
-- GRANT PERMISSIONS ON VIEWS
-- ============================================

-- Patient role can only see their own data (handled in application with WHERE clause)
GRANT SELECT ON medsync_db.v_patient_profile TO 'medsync_patient';
GRANT SELECT ON medsync_db.v_patient_appointments TO 'medsync_patient';
GRANT SELECT ON medsync_db.v_patient_medical_history TO 'medsync_patient';
GRANT SELECT ON medsync_db.v_patient_invoices TO 'medsync_patient';
GRANT SELECT ON medsync_db.v_patient_payments TO 'medsync_patient';
GRANT SELECT ON medsync_db.v_patient_prescriptions TO 'medsync_patient';
GRANT SELECT ON medsync_db.v_patient_insurance TO 'medsync_patient';
GRANT SELECT ON medsync_db.v_patient_allergies TO 'medsync_patient';
GRANT SELECT ON medsync_db.v_patient_conditions TO 'medsync_patient';
GRANT SELECT ON medsync_db.v_available_time_slots TO 'medsync_patient';

-- Doctor role
GRANT SELECT ON medsync_db.v_doctor_schedule TO 'medsync_doctor';
GRANT SELECT ON medsync_db.v_doctor_performance TO 'medsync_doctor';
GRANT SELECT ON medsync_db.v_doctor_patients TO 'medsync_doctor';
GRANT SELECT ON medsync_db.v_patient_medical_history TO 'medsync_doctor';
GRANT SELECT ON medsync_db.v_patient_allergies TO 'medsync_doctor';
GRANT SELECT ON medsync_db.v_patient_conditions TO 'medsync_doctor';
GRANT SELECT ON medsync_db.v_medication_inventory TO 'medsync_doctor';
GRANT SELECT ON medsync_db.v_treatment_statistics TO 'medsync_doctor';

-- Manager role
GRANT SELECT ON medsync_db.* TO 'medsync_manager';  -- All views

-- Receptionist role
GRANT SELECT ON medsync_db.v_patient_profile TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.v_patient_appointments TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.v_available_time_slots TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.v_doctor_schedule TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.v_patient_invoices TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.v_patient_payments TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.v_patient_insurance TO 'medsync_receptionist';

-- Pharmacist role
GRANT SELECT ON medsync_db.v_patient_prescriptions TO 'medsync_pharmacist';
GRANT SELECT ON medsync_db.v_medication_inventory TO 'medsync_pharmacist';
GRANT SELECT ON medsync_db.v_patient_allergies TO 'medsync_pharmacist';

-- Readonly role (all analytics)
GRANT SELECT ON medsync_db.v_daily_appointment_summary TO 'medsync_readonly';
GRANT SELECT ON medsync_db.v_revenue_summary TO 'medsync_readonly';
GRANT SELECT ON medsync_db.v_medication_inventory TO 'medsync_readonly';
GRANT SELECT ON medsync_db.v_active_insurance TO 'medsync_readonly';
GRANT SELECT ON medsync_db.v_branch_performance TO 'medsync_readonly';
GRANT SELECT ON medsync_db.v_treatment_statistics TO 'medsync_readonly';
GRANT SELECT ON medsync_db.v_doctor_performance TO 'medsync_readonly';

-- Admin role (everything)
GRANT SELECT ON medsync_db.* TO 'medsync_admin';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

/*
-- Test views exist
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Test patient view
SELECT * FROM v_patient_profile LIMIT 5;

-- Test doctor schedule
SELECT * FROM v_doctor_schedule WHERE available_date >= CURDATE() LIMIT 10;

-- Test analytics
SELECT * FROM v_daily_appointment_summary WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY);

-- Test revenue
SELECT * FROM v_revenue_summary WHERE invoice_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);
*/