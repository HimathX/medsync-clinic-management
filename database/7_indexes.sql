-- ============================================
-- EXISTING INDEXES (KEEP - 5 total)
-- ============================================

-- ❌ REMOVE: idx_user_email (UNIQUE auto-indexed)
-- ❌ REMOVE: idx_user_nic (UNIQUE auto-indexed)

-- Appointment queries (KEEP)
CREATE INDEX idx_appointment_patient_status_date 
ON appointment(patient_id, status, created_at DESC);

-- Time slot availability (KEEP)
CREATE INDEX idx_time_slot_doctor_date_booked 
ON time_slot(doctor_id, available_date, is_booked);

-- Medication search (KEEP)
CREATE INDEX idx_medication_by_generic_name
ON medication(generic_name);

-- Patient allergy lookup (KEEP)
CREATE INDEX idx_patient_allergy
ON patient_allergy(patient_id);

-- Patient condition history (KEEP)
CREATE INDEX idx_patient_condition_patient_date 
ON patient_condition(patient_id, diagnosed_date);

-- ============================================
-- TIER 1: CRITICAL FOREIGN KEY INDEXES
-- These are NON-NEGOTIABLE for JOIN performance
-- Add ALL 8 indexes below
-- ============================================

-- 1. Branch relationships (fixes slow employee/patient queries)
CREATE INDEX idx_patient_registered_branch ON patient(registered_branch_id);
CREATE INDEX idx_employee_branch ON employee(branch_id);

-- 2. Appointment relationships (fixes slow consultation lookups)
CREATE INDEX idx_appointment_time_slot ON appointment(time_slot_id);
CREATE INDEX idx_consultation_appointment ON consultation_record(appointment_id);

-- 3. Prescription relationships (fixes slow prescription queries)
CREATE INDEX idx_prescription_consultation ON prescription_item(consultation_rec_id);
CREATE INDEX idx_prescription_medication ON prescription_item(medication_id);

-- 4. Billing relationships (fixes slow invoice/payment queries)
CREATE INDEX idx_invoice_consultation ON invoice(consultation_rec_id);
CREATE INDEX idx_payment_patient ON payment(patient_id);

-- ============================================
-- TIER 2: HIGH-VALUE COMPOSITE INDEXES
-- Add ONLY if you experience slow queries
-- Monitor first, uncomment later if needed
-- ============================================

-- Insurance lookups (uncomment if insurance queries are slow)
-- CREATE INDEX idx_insurance_patient_status ON insurance(patient_id, status);

-- Treatment lookups (uncomment if treatment history is slow)
-- CREATE INDEX idx_treatment_consultation ON treatment(consultation_rec_id);

-- Doctor specialization (uncomment if doctor search is slow)
-- CREATE INDEX idx_doctor_specialization_doctor ON doctor_specialization(doctor_id);
-- CREATE INDEX idx_doctor_specialization_spec ON doctor_specialization(specialization_id);

-- ============================================
-- TIER 3: OPTIONAL OPTIMIZATION INDEXES
-- Add ONLY if specific queries show in slow query log
-- DO NOT add preemptively
-- ============================================

-- Status-based filtering
-- CREATE INDEX idx_appointment_status_created ON appointment(status, created_at DESC);
-- CREATE INDEX idx_employee_branch_active ON employee(branch_id, is_active);

-- Date-range queries
-- CREATE INDEX idx_payment_patient_date ON payment(patient_id, payment_date DESC);

-- Availability lookups
-- CREATE INDEX idx_time_slot_available ON time_slot(available_date, is_booked);

-- ============================================
-- MONITORING & MAINTENANCE
-- ============================================

/*
-- 1. Enable slow query log to identify bottlenecks
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- 2. Check slow queries (run weekly)
SELECT 
    query_time,
    lock_time,
    rows_examined,
    SUBSTRING(sql_text, 1, 100) AS query_preview
FROM mysql.slow_log 
ORDER BY query_time DESC 
LIMIT 20;

-- 3. Check index usage (run monthly)
SELECT 
    table_name,
    index_name,
    cardinality,
    ROUND(((index_length / 1024) / 1024), 2) AS index_size_mb
FROM information_schema.STATISTICS 
WHERE table_schema = 'medsync_db'
AND index_name != 'PRIMARY'
ORDER BY index_size_mb DESC;

-- 4. Find unused indexes (MySQL 8.0+)
SELECT * FROM sys.schema_unused_indexes 
WHERE object_schema = 'medsync_db';

-- 5. Check table/index sizes
SELECT 
    table_name,
    ROUND((data_length / 1024 / 1024), 2) AS data_mb,
    ROUND((index_length / 1024 / 1024), 2) AS index_mb,
    ROUND((index_length / data_length * 100), 2) AS index_ratio_percent
FROM information_schema.TABLES
WHERE table_schema = 'medsync_db'
AND table_type = 'BASE TABLE'
ORDER BY (data_length + index_length) DESC;

-- 6. Test query performance before/after
EXPLAIN SELECT 
    a.appointment_id,
    p.patient_id,
    u.full_name AS patient_name,
    d.doctor_id,
    u_doc.full_name AS doctor_name,
    ts.available_date,
    ts.start_time
FROM appointment a
JOIN patient p ON a.patient_id = p.patient_id
JOIN user u ON p.patient_id = u.user_id
JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
JOIN doctor d ON ts.doctor_id = d.doctor_id
JOIN user u_doc ON d.doctor_id = u_doc.user_id
WHERE a.status = 'Scheduled'
AND ts.available_date >= CURDATE();
*/