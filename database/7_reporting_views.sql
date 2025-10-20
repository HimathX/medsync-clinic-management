-- ============================================
-- REPORTING VIEWS FOR PDF GENERATION
-- ============================================
-- These views provide pre-aggregated data for generating PDF reports
-- Run this file after the main database setup

USE medisync;

-- ============================================
-- 1. BRANCH APPOINTMENT DAILY SUMMARY VIEW
-- ============================================
-- Provides appointment counts by branch, date, and status

DROP VIEW IF EXISTS branch_appointment_daily_summary;

CREATE VIEW branch_appointment_daily_summary AS
SELECT 
    b.branch_name,
    a.available_date,
    a.status,
    COUNT(*) as appointment_count
FROM appointment a
INNER JOIN branch b ON a.branch_id = b.branch_id
GROUP BY b.branch_name, a.available_date, a.status
ORDER BY a.available_date DESC, b.branch_name, a.status;


-- ============================================
-- 2. DOCTOR MONTHLY REVENUE VIEW
-- ============================================
-- Provides revenue aggregated by doctor and month

DROP VIEW IF EXISTS doctor_monthly_revenue;

CREATE VIEW doctor_monthly_revenue AS
SELECT 
    d.doctor_id,
    CONCAT(u.first_name, ' ', u.last_name) as doctor_name,
    DATE_FORMAT(p.payment_date, '%Y-%m') as month,
    SUM(p.amount_paid) as revenue
FROM payment p
INNER JOIN consultation_record cr ON p.consultation_rec_id = cr.consultation_rec_id
INNER JOIN doctor d ON cr.doctor_id = d.doctor_id
INNER JOIN user u ON d.user_id = u.user_id
WHERE p.payment_status = 'Completed'
GROUP BY d.doctor_id, doctor_name, month
ORDER BY month DESC, revenue DESC;


-- ============================================
-- 3. PATIENTS OUTSTANDING BALANCES VIEW
-- ============================================
-- Provides list of patients with outstanding balances > 0

DROP VIEW IF EXISTS patients_outstanding_balances;

CREATE VIEW patients_outstanding_balances AS
SELECT 
    pb.patient_id,
    u.full_name as patient_name,
    pb.total_balance as patient_balance
FROM patient_balance pb
INNER JOIN patient p ON pb.patient_id = p.patient_id
INNER JOIN user u ON p.patient_id = u.user_id
WHERE pb.total_balance > 0
ORDER BY pb.total_balance DESC;


-- ============================================
-- VERIFY VIEWS CREATED
-- ============================================

SELECT 'Views created successfully!' as Status;

-- Show sample data from each view
SELECT 'Branch Appointment Summary - Sample Data:' as Info;
SELECT * FROM branch_appointment_daily_summary LIMIT 5;

SELECT 'Doctor Monthly Revenue - Sample Data:' as Info;
SELECT * FROM doctor_monthly_revenue LIMIT 5;

SELECT 'Patients Outstanding Balances - Sample Data:' as Info;
SELECT * FROM patients_outstanding_balances LIMIT 5;
