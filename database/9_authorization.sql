-- ============================================
-- MedSync Database Authorization & Security
-- Role-Based Access Control (RBAC) Implementation
-- ============================================

USE medsync_db;

-- ============================================
-- SECTION 1: DATABASE ROLES
-- ============================================

-- Drop existing roles if they exist (for clean re-deployment)
DROP ROLE IF EXISTS 'medsync_admin';
DROP ROLE IF EXISTS 'medsync_manager';
DROP ROLE IF EXISTS 'medsync_doctor';
DROP ROLE IF EXISTS 'medsync_nurse';
DROP ROLE IF EXISTS 'medsync_receptionist';
DROP ROLE IF EXISTS 'medsync_pharmacist';
DROP ROLE IF EXISTS 'medsync_patient';
DROP ROLE IF EXISTS 'medsync_readonly';

-- Role 1: Super Admin - Full database access
CREATE ROLE 'medsync_admin';

-- Role 2: Branch Manager - Manage branch operations and staff
CREATE ROLE 'medsync_manager';

-- Role 3: Doctor - Medical records, consultations, prescriptions
CREATE ROLE 'medsync_doctor';

-- Role 4: Nurse - Patient care, basic medical records
CREATE ROLE 'medsync_nurse';

-- Role 5: Receptionist - Appointments, patient registration
CREATE ROLE 'medsync_receptionist';

-- Role 6: Pharmacist - Prescriptions, medication inventory
CREATE ROLE 'medsync_pharmacist';

-- Role 7: Patient - Self-service portal (own data only)
CREATE ROLE 'medsync_patient';

-- Role 8: Readonly - Analytics and reporting
CREATE ROLE 'medsync_readonly';

-- ============================================
-- SECTION 2: ADMIN ROLE PERMISSIONS
-- Full access to entire database
-- ============================================

GRANT ALL PRIVILEGES ON medsync_db.* TO 'medsync_admin';
GRANT CREATE USER ON *.* TO 'medsync_admin';
GRANT GRANT OPTION ON medsync_db.* TO 'medsync_admin';
GRANT RELOAD ON *.* TO 'medsync_admin';
GRANT PROCESS ON *.* TO 'medsync_admin';
GRANT SHOW DATABASES ON *.* TO 'medsync_admin';

-- ============================================
-- SECTION 3: MANAGER ROLE PERMISSIONS
-- Branch-level management access
-- ============================================

-- Branch management
GRANT SELECT, UPDATE ON medsync_db.branch TO 'medsync_manager';

-- Employee management (within their branch)
GRANT SELECT, INSERT, UPDATE ON medsync_db.user TO 'medsync_manager';
GRANT SELECT, INSERT, UPDATE ON medsync_db.employee TO 'medsync_manager';
GRANT SELECT, INSERT, UPDATE ON medsync_db.doctor TO 'medsync_manager';
GRANT SELECT, INSERT, UPDATE ON medsync_db.doctor_specialization TO 'medsync_manager';
GRANT SELECT, INSERT, UPDATE ON medsync_db.address TO 'medsync_manager';
GRANT SELECT, INSERT, UPDATE ON medsync_db.contact TO 'medsync_manager';

-- Staff scheduling
GRANT SELECT, INSERT, UPDATE, DELETE ON medsync_db.time_slot TO 'medsync_manager';

-- Patient management (read-only for oversight)
GRANT SELECT ON medsync_db.patient TO 'medsync_manager';
GRANT SELECT ON medsync_db.appointment TO 'medsync_manager';

-- Financial oversight
GRANT SELECT ON medsync_db.invoice TO 'medsync_manager';
GRANT SELECT ON medsync_db.payment TO 'medsync_manager';
GRANT SELECT ON medsync_db.claim TO 'medsync_manager';

-- Reference data
GRANT SELECT ON medsync_db.specialization TO 'medsync_manager';
GRANT SELECT ON medsync_db.treatment_catalogue TO 'medsync_manager';
GRANT SELECT ON medsync_db.insurance_package TO 'medsync_manager';
GRANT SELECT ON medsync_db.medication TO 'medsync_manager';
GRANT SELECT ON medsync_db.conditions TO 'medsync_manager';
GRANT SELECT ON medsync_db.conditions_category TO 'medsync_manager';

-- Reports and analytics
GRANT EXECUTE ON PROCEDURE medsync_db.GetBranchStatistics TO 'medsync_manager';
GRANT EXECUTE ON PROCEDURE medsync_db.GetStaffByBranch TO 'medsync_manager';
GRANT EXECUTE ON PROCEDURE medsync_db.RegisterDoctor TO 'medsync_manager';
GRANT EXECUTE ON PROCEDURE medsync_db.RegisterStaff TO 'medsync_manager';
GRANT EXECUTE ON PROCEDURE medsync_db.DeactivateStaff TO 'medsync_manager';
GRANT EXECUTE ON PROCEDURE medsync_db.UpdateStaffSalary TO 'medsync_manager';
GRANT EXECUTE ON PROCEDURE medsync_db.AddTimeSlot TO 'medsync_manager';

-- ============================================
-- SECTION 4: DOCTOR ROLE PERMISSIONS
-- Medical records and patient care
-- ============================================

-- Patient information (READ)
GRANT SELECT ON medsync_db.patient TO 'medsync_doctor';
GRANT SELECT ON medsync_db.user TO 'medsync_doctor';
GRANT SELECT ON medsync_db.address TO 'medsync_doctor';
GRANT SELECT ON medsync_db.contact TO 'medsync_doctor';

-- Medical history (READ)
GRANT SELECT ON medsync_db.patient_allergy TO 'medsync_doctor';
GRANT SELECT ON medsync_db.patient_condition TO 'medsync_doctor';
GRANT SELECT ON medsync_db.conditions TO 'medsync_doctor';
GRANT SELECT ON medsync_db.conditions_category TO 'medsync_doctor';

-- Appointments (READ/UPDATE)
GRANT SELECT, UPDATE ON medsync_db.appointment TO 'medsync_doctor';
GRANT SELECT ON medsync_db.time_slot TO 'medsync_doctor';

-- Consultations (FULL ACCESS)
GRANT SELECT, INSERT, UPDATE ON medsync_db.consultation_record TO 'medsync_doctor';

-- Treatments (FULL ACCESS)
GRANT SELECT, INSERT, UPDATE ON medsync_db.treatment TO 'medsync_doctor';
GRANT SELECT ON medsync_db.treatment_catalogue TO 'medsync_doctor';

-- Prescriptions (FULL ACCESS)
GRANT SELECT, INSERT, UPDATE ON medsync_db.prescription_item TO 'medsync_doctor';
GRANT SELECT ON medsync_db.medication TO 'medsync_doctor';

-- Insurance (READ for verification)
GRANT SELECT ON medsync_db.insurance TO 'medsync_doctor';
GRANT SELECT ON medsync_db.insurance_package TO 'medsync_doctor';

-- Billing (READ ONLY)
GRANT SELECT ON medsync_db.invoice TO 'medsync_doctor';

-- Reference data
GRANT SELECT ON medsync_db.branch TO 'medsync_doctor';
GRANT SELECT ON medsync_db.specialization TO 'medsync_doctor';

-- Procedures
GRANT EXECUTE ON PROCEDURE medsync_db.GetMyPatientsAsDoctor TO 'medsync_doctor';
GRANT EXECUTE ON PROCEDURE medsync_db.GetPatientMedicalHistory TO 'medsync_doctor';
GRANT EXECUTE ON PROCEDURE medsync_db.CreateConsultationWithDetails TO 'medsync_doctor';
GRANT EXECUTE ON PROCEDURE medsync_db.AddTreatment TO 'medsync_doctor';
GRANT EXECUTE ON PROCEDURE medsync_db.AddPrescriptionWithItems TO 'medsync_doctor';
GRANT EXECUTE ON PROCEDURE medsync_db.AddPatientAllergy TO 'medsync_doctor';
GRANT EXECUTE ON PROCEDURE medsync_db.AddPatientCondition TO 'medsync_doctor';

-- ============================================
-- SECTION 5: NURSE ROLE PERMISSIONS
-- Patient care support
-- ============================================

-- Patient information (READ)
GRANT SELECT ON medsync_db.patient TO 'medsync_nurse';
GRANT SELECT ON medsync_db.user TO 'medsync_nurse';
GRANT SELECT ON medsync_db.address TO 'medsync_nurse';
GRANT SELECT ON medsync_db.contact TO 'medsync_nurse';

-- Medical history (READ)
GRANT SELECT ON medsync_db.patient_allergy TO 'medsync_nurse';
GRANT SELECT ON medsync_db.patient_condition TO 'medsync_nurse';
GRANT SELECT ON medsync_db.conditions TO 'medsync_nurse';

-- Appointments (READ/UPDATE STATUS)
GRANT SELECT, UPDATE ON medsync_db.appointment TO 'medsync_nurse';
GRANT SELECT ON medsync_db.time_slot TO 'medsync_nurse';

-- Consultations (READ ONLY)
GRANT SELECT ON medsync_db.consultation_record TO 'medsync_nurse';

-- Prescriptions (READ ONLY)
GRANT SELECT ON medsync_db.prescription_item TO 'medsync_nurse';
GRANT SELECT ON medsync_db.medication TO 'medsync_nurse';

-- Reference data
GRANT SELECT ON medsync_db.branch TO 'medsync_nurse';
GRANT SELECT ON medsync_db.doctor TO 'medsync_nurse';
GRANT SELECT ON medsync_db.employee TO 'medsync_nurse';

-- ============================================
-- SECTION 6: RECEPTIONIST ROLE PERMISSIONS
-- Front desk operations
-- ============================================

-- Patient management (FULL ACCESS)
GRANT SELECT, INSERT, UPDATE ON medsync_db.patient TO 'medsync_receptionist';
GRANT SELECT, INSERT, UPDATE ON medsync_db.user TO 'medsync_receptionist';
GRANT SELECT, INSERT, UPDATE ON medsync_db.address TO 'medsync_receptionist';
GRANT SELECT, INSERT, UPDATE ON medsync_db.contact TO 'medsync_receptionist';

-- Appointment management (FULL ACCESS)
GRANT SELECT, INSERT, UPDATE, DELETE ON medsync_db.appointment TO 'medsync_receptionist';
GRANT SELECT, UPDATE ON medsync_db.time_slot TO 'medsync_receptionist';

-- Insurance (FULL ACCESS)
GRANT SELECT, INSERT, UPDATE ON medsync_db.insurance TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.insurance_package TO 'medsync_receptionist';

-- Billing (READ/CREATE)
GRANT SELECT, INSERT ON medsync_db.invoice TO 'medsync_receptionist';
GRANT SELECT, INSERT, UPDATE ON medsync_db.payment TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.patient_balance TO 'medsync_receptionist';

-- Claims processing
GRANT SELECT, INSERT, UPDATE ON medsync_db.claim TO 'medsync_receptionist';

-- Doctor information (READ for scheduling)
GRANT SELECT ON medsync_db.doctor TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.doctor_specialization TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.specialization TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.employee TO 'medsync_receptionist';

-- Reference data
GRANT SELECT ON medsync_db.branch TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.treatment_catalogue TO 'medsync_receptionist';

-- Procedures
GRANT EXECUTE ON PROCEDURE medsync_db.RegisterPatient TO 'medsync_receptionist';
GRANT EXECUTE ON PROCEDURE medsync_db.BookAppointment TO 'medsync_receptionist';
GRANT EXECUTE ON PROCEDURE medsync_db.CancelAppointment TO 'medsync_receptionist';
GRANT EXECUTE ON PROCEDURE medsync_db.AddPatientInsurance TO 'medsync_receptionist';
GRANT EXECUTE ON PROCEDURE medsync_db.AddPayment TO 'medsync_receptionist';
GRANT EXECUTE ON PROCEDURE medsync_db.AddClaim TO 'medsync_receptionist';
GRANT EXECUTE ON PROCEDURE medsync_db.GenerateInvoice TO 'medsync_receptionist';

-- ============================================
-- SECTION 7: PHARMACIST ROLE PERMISSIONS
-- Medication and prescription management
-- ============================================

-- Patient information (LIMITED READ)
GRANT SELECT (patient_id) ON medsync_db.patient TO 'medsync_pharmacist';
GRANT SELECT (user_id, full_name, NIC) ON medsync_db.user TO 'medsync_pharmacist';

-- Prescriptions (READ/UPDATE for fulfillment)
GRANT SELECT, UPDATE ON medsync_db.prescription_item TO 'medsync_pharmacist';

-- Medication management (FULL ACCESS)
GRANT SELECT, INSERT, UPDATE ON medsync_db.medication TO 'medsync_pharmacist';

-- Consultation (READ ONLY - for prescription context)
GRANT SELECT ON medsync_db.consultation_record TO 'medsync_pharmacist';

-- Patient allergies (READ - important for safety)
GRANT SELECT ON medsync_db.patient_allergy TO 'medsync_pharmacist';

-- Appointments (READ ONLY)
GRANT SELECT ON medsync_db.appointment TO 'medsync_pharmacist';

-- Reference data
GRANT SELECT ON medsync_db.branch TO 'medsync_pharmacist';

-- Grant only procedures that exist
GRANT EXECUTE ON PROCEDURE medsync_db.AddMedication TO 'medsync_pharmacist';

-- ============================================
-- SECTION 8: PATIENT ROLE PERMISSIONS
-- Self-service portal (own data only via views)
-- ============================================

-- Note: Patients access data through restricted views only
-- Direct table access is denied for security

-- Own profile (via view - created in 9_views.sql)
GRANT SELECT ON medsync_db.v_patient_profile TO 'medsync_patient';

-- Own appointments (via view)
GRANT SELECT ON medsync_db.v_patient_appointments TO 'medsync_patient';

-- Own medical history (via view)
GRANT SELECT ON medsync_db.v_patient_medical_history TO 'medsync_patient';

-- Own invoices (via view)
GRANT SELECT ON medsync_db.v_patient_invoices TO 'medsync_patient';

-- Own payments (via view)
GRANT SELECT ON medsync_db.v_patient_payments TO 'medsync_patient';

-- Own prescriptions (via view)
GRANT SELECT ON medsync_db.v_patient_prescriptions TO 'medsync_patient';

-- Own insurance (via view)
GRANT SELECT ON medsync_db.v_patient_insurance TO 'medsync_patient';

-- Appointment booking (limited via procedure)
GRANT EXECUTE ON PROCEDURE medsync_db.BookAppointmentAsPatient TO 'medsync_patient';

-- Available slots (READ)
GRANT SELECT ON medsync_db.v_available_time_slots TO 'medsync_patient';

-- ============================================
-- SECTION 9: READONLY ROLE PERMISSIONS
-- Analytics and reporting only
-- ============================================

-- All tables (SELECT ONLY)
GRANT SELECT ON medsync_db.* TO 'medsync_readonly';

-- All views (SELECT ONLY)
GRANT SELECT ON medsync_db.v_daily_appointment_summary TO 'medsync_readonly';
GRANT SELECT ON medsync_db.v_revenue_summary TO 'medsync_readonly';
GRANT SELECT ON medsync_db.v_medication_inventory TO 'medsync_readonly';
GRANT SELECT ON medsync_db.v_doctor_performance TO 'medsync_readonly';

-- Analytics procedures
GRANT EXECUTE ON PROCEDURE medsync_db.GetBranchStatistics TO 'medsync_readonly';
GRANT EXECUTE ON PROCEDURE medsync_db.GetRevenueReport TO 'medsync_readonly';

-- ============================================
-- SECTION 10: APPLICATION USERS
-- Create actual users and assign roles
-- ============================================

-- Drop existing users if they exist
DROP USER IF EXISTS 'admin_app'@'localhost';
DROP USER IF EXISTS 'manager_app'@'localhost';
DROP USER IF EXISTS 'doctor_app'@'localhost';
DROP USER IF EXISTS 'nurse_app'@'localhost';
DROP USER IF EXISTS 'reception_app'@'localhost';
DROP USER IF EXISTS 'pharmacy_app'@'localhost';
DROP USER IF EXISTS 'patient_app'@'localhost';
DROP USER IF EXISTS 'reports_app'@'localhost';

-- Admin application user
CREATE USER 'admin_app'@'localhost' IDENTIFIED BY 'Admin@MedSync2025!';
GRANT 'medsync_admin' TO 'admin_app'@'localhost';
SET DEFAULT ROLE 'medsync_admin' TO 'admin_app'@'localhost';

-- Manager application user
CREATE USER 'manager_app'@'localhost' IDENTIFIED BY 'Manager@MedSync2025!';
GRANT 'medsync_manager' TO 'manager_app'@'localhost';
SET DEFAULT ROLE 'medsync_manager' TO 'manager_app'@'localhost';

-- Doctor application user
CREATE USER 'doctor_app'@'localhost' IDENTIFIED BY 'Doctor@MedSync2025!';
GRANT 'medsync_doctor' TO 'doctor_app'@'localhost';
SET DEFAULT ROLE 'medsync_doctor' TO 'doctor_app'@'localhost';

-- Nurse application user
CREATE USER 'nurse_app'@'localhost' IDENTIFIED BY 'Nurse@MedSync2025!';
GRANT 'medsync_nurse' TO 'nurse_app'@'localhost';
SET DEFAULT ROLE 'medsync_nurse' TO 'nurse_app'@'localhost';

-- Receptionist application user
CREATE USER 'reception_app'@'localhost' IDENTIFIED BY 'Reception@MedSync2025!';
GRANT 'medsync_receptionist' TO 'reception_app'@'localhost';
SET DEFAULT ROLE 'medsync_receptionist' TO 'reception_app'@'localhost';

-- Pharmacist application user
CREATE USER 'pharmacy_app'@'localhost' IDENTIFIED BY 'Pharmacy@MedSync2025!';
GRANT 'medsync_pharmacist' TO 'pharmacy_app'@'localhost';
SET DEFAULT ROLE 'medsync_pharmacist' TO 'pharmacy_app'@'localhost';

-- Patient portal application user
CREATE USER 'patient_app'@'localhost' IDENTIFIED BY 'Patient@MedSync2025!';
GRANT 'medsync_patient' TO 'patient_app'@'localhost';
SET DEFAULT ROLE 'medsync_patient' TO 'patient_app'@'localhost';

-- Reports/Analytics application user
CREATE USER 'reports_app'@'localhost' IDENTIFIED BY 'Reports@MedSync2025!';
GRANT 'medsync_readonly' TO 'reports_app'@'localhost';
SET DEFAULT ROLE 'medsync_readonly' TO 'reports_app'@'localhost';

-- ============================================
-- SECTION 11: ROW-LEVEL SECURITY PROCEDURES
-- Note: user_session table created in 10_audit_security.sql
-- ============================================

DELIMITER $$

-- Set current user context (called on login)
DROP PROCEDURE IF EXISTS SetUserContext$$
CREATE PROCEDURE SetUserContext(
    IN p_session_id VARCHAR(255),
    IN p_user_id CHAR(36),
    IN p_user_role VARCHAR(20),
    IN p_branch_id CHAR(36),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent VARCHAR(255)
)
BEGIN
    -- Deactivate old sessions for this user
    UPDATE user_session
    SET is_active = FALSE,
        logout_time = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id
    AND session_id != p_session_id
    AND is_active = TRUE;
    
    -- Create new session
    INSERT INTO user_session 
        (session_id, user_id, user_role, branch_id, ip_address, user_agent)
    VALUES 
        (p_session_id, p_user_id, p_user_role, p_branch_id, p_ip_address, p_user_agent)
    ON DUPLICATE KEY UPDATE
        user_role = p_user_role,
        branch_id = p_branch_id,
        ip_address = p_ip_address,
        user_agent = p_user_agent,
        is_active = TRUE,
        last_activity = CURRENT_TIMESTAMP,
        logout_time = NULL;
END$$

-- Get current user ID from session
DROP FUNCTION IF EXISTS GetCurrentUserId$$
CREATE FUNCTION GetCurrentUserId(p_session_id VARCHAR(255))
RETURNS CHAR(36)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_user_id CHAR(36);
    
    SELECT user_id INTO v_user_id
    FROM user_session
    WHERE session_id = p_session_id
    AND is_active = TRUE
    AND last_activity > DATE_SUB(NOW(), INTERVAL 24 HOUR);
    
    RETURN v_user_id;
END$$

-- Get current user role from session
DROP FUNCTION IF EXISTS GetCurrentUserRole$$
CREATE FUNCTION GetCurrentUserRole(p_session_id VARCHAR(255))
RETURNS VARCHAR(20)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_user_role VARCHAR(20);
    
    SELECT user_role INTO v_user_role
    FROM user_session
    WHERE session_id = p_session_id
    AND is_active = TRUE
    AND last_activity > DATE_SUB(NOW(), INTERVAL 24 HOUR);
    
    RETURN v_user_role;
END$$

-- Get current user branch from session
DROP FUNCTION IF EXISTS GetCurrentUserBranch$$
CREATE FUNCTION GetCurrentUserBranch(p_session_id VARCHAR(255))
RETURNS CHAR(36)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_branch_id CHAR(36);
    
    SELECT branch_id INTO v_branch_id
    FROM user_session
    WHERE session_id = p_session_id
    AND is_active = TRUE
    AND last_activity > DATE_SUB(NOW(), INTERVAL 24 HOUR);
    
    RETURN v_branch_id;
END$$

-- Verify user owns resource (for RLS enforcement)
DROP FUNCTION IF EXISTS VerifyPatientAccess$$
CREATE FUNCTION VerifyPatientAccess(
    p_session_id VARCHAR(255),
    p_patient_id CHAR(36)
)
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_user_id CHAR(36);
    DECLARE v_user_role VARCHAR(20);
    
    SELECT user_id, user_role INTO v_user_id, v_user_role
    FROM user_session
    WHERE session_id = p_session_id
    AND is_active = TRUE;
    
    -- Admin and staff have access to all patients
    IF v_user_role IN ('admin', 'manager', 'doctor', 'nurse', 'receptionist', 'pharmacist') THEN
        RETURN TRUE;
    END IF;
    
    -- Patients can only access their own data
    IF v_user_role = 'patient' AND v_user_id = p_patient_id THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END$$

-- Verify doctor owns patient (for consultations/prescriptions)
DROP FUNCTION IF EXISTS VerifyDoctorPatientRelation$$
CREATE FUNCTION VerifyDoctorPatientRelation(
    p_session_id VARCHAR(255),
    p_patient_id CHAR(36)
)
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_user_id CHAR(36);
    DECLARE v_user_role VARCHAR(20);
    DECLARE v_has_relation INT DEFAULT 0;
    
    SELECT user_id, user_role INTO v_user_id, v_user_role
    FROM user_session
    WHERE session_id = p_session_id
    AND is_active = TRUE;
    
    -- Admin and managers have access
    IF v_user_role IN ('admin', 'manager') THEN
        RETURN TRUE;
    END IF;
    
    -- Check if doctor has treated this patient
    IF v_user_role = 'doctor' THEN
        SELECT COUNT(*) INTO v_has_relation
        FROM appointment a
        INNER JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
        WHERE a.patient_id = p_patient_id
        AND ts.doctor_id = v_user_id;
        
        RETURN v_has_relation > 0;
    END IF;
    
    RETURN FALSE;
END$$

-- Verify manager owns branch
DROP FUNCTION IF EXISTS VerifyBranchAccess$$
CREATE FUNCTION VerifyBranchAccess(
    p_session_id VARCHAR(255),
    p_branch_id CHAR(36)
)
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_user_id CHAR(36);
    DECLARE v_user_role VARCHAR(20);
    DECLARE v_user_branch_id CHAR(36);
    
    SELECT user_id, user_role, branch_id 
    INTO v_user_id, v_user_role, v_user_branch_id
    FROM user_session
    WHERE session_id = p_session_id
    AND is_active = TRUE;
    
    -- Admin has access to all branches
    IF v_user_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Manager can only access their own branch
    IF v_user_role = 'manager' AND v_user_branch_id = p_branch_id THEN
        RETURN TRUE;
    END IF;
    
    -- Staff can access their assigned branch
    IF v_user_role IN ('doctor', 'nurse', 'receptionist', 'pharmacist') 
       AND v_user_branch_id = p_branch_id THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END$$

-- Logout user (mark session inactive)
DROP PROCEDURE IF EXISTS LogoutUser$$
CREATE PROCEDURE LogoutUser(
    IN p_session_id VARCHAR(255)
)
BEGIN
    UPDATE user_session
    SET is_active = FALSE,
        logout_time = CURRENT_TIMESTAMP
    WHERE session_id = p_session_id;
END$$

-- Clear expired sessions (call periodically)
DROP PROCEDURE IF EXISTS CleanupExpiredSessions$$
CREATE PROCEDURE CleanupExpiredSessions()
BEGIN
    UPDATE user_session
    SET is_active = FALSE,
        logout_time = CURRENT_TIMESTAMP
    WHERE last_activity < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    AND is_active = TRUE;
    
    DELETE FROM user_session
    WHERE last_activity < DATE_SUB(NOW(), INTERVAL 7 DAY);
END$$

DELIMITER ;

-- ============================================
-- SECTION 12: GRANT PERMISSIONS ON SESSION
-- ============================================

-- Grant permissions on user_session table (created in 10_audit_security.sql)
GRANT SELECT, INSERT, UPDATE, DELETE ON medsync_db.user_session TO 'medsync_admin';
GRANT SELECT, INSERT, UPDATE ON medsync_db.user_session TO 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist', 'medsync_patient';

-- Grant execute permissions on RLS procedures/functions
GRANT EXECUTE ON PROCEDURE medsync_db.SetUserContext TO 'medsync_admin', 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist', 'medsync_patient';
GRANT EXECUTE ON PROCEDURE medsync_db.LogoutUser TO 'medsync_admin', 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist', 'medsync_patient';
GRANT EXECUTE ON FUNCTION medsync_db.GetCurrentUserId TO 'medsync_admin', 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist', 'medsync_patient';
GRANT EXECUTE ON FUNCTION medsync_db.GetCurrentUserRole TO 'medsync_admin', 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist', 'medsync_patient';
GRANT EXECUTE ON FUNCTION medsync_db.GetCurrentUserBranch TO 'medsync_admin', 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist', 'medsync_patient';
GRANT EXECUTE ON FUNCTION medsync_db.VerifyPatientAccess TO 'medsync_admin', 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist', 'medsync_patient';
GRANT EXECUTE ON FUNCTION medsync_db.VerifyDoctorPatientRelation TO 'medsync_admin', 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist';
GRANT EXECUTE ON FUNCTION medsync_db.VerifyBranchAccess TO 'medsync_admin', 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist';
GRANT EXECUTE ON PROCEDURE medsync_db.CleanupExpiredSessions TO 'medsync_admin';

-- ============================================
-- SECTION 13: FLUSH PRIVILEGES
-- ============================================

FLUSH PRIVILEGES;

-- ============================================
-- VERIFICATION QUERIES (FOR TESTING)
-- ============================================

/*
-- 1. List all roles
SELECT * FROM mysql.user WHERE User LIKE 'medsync_%';

-- 2. Show role grants
SHOW GRANTS FOR 'medsync_admin';
SHOW GRANTS FOR 'medsync_manager';
SHOW GRANTS FOR 'medsync_doctor';
SHOW GRANTS FOR 'medsync_receptionist';
SHOW GRANTS FOR 'medsync_patient';

-- 3. Show user-role assignments
SELECT User, Host, default_role FROM mysql.user WHERE User LIKE '%_app';

-- 4. Test session context
CALL SetUserContext('test_session_123', 'patient_uuid', 'patient', 'branch_uuid', '127.0.0.1', 'Mozilla/5.0');
SELECT GetCurrentUserId('test_session_123');
SELECT GetCurrentUserRole('test_session_123');

-- 5. Test access verification
SELECT VerifyPatientAccess('test_session_123', 'patient_uuid');
SELECT VerifyBranchAccess('test_session_123', 'branch_uuid');

-- 6. View active sessions
SELECT * FROM user_session WHERE is_active = TRUE;

-- 7. Logout user
CALL LogoutUser('test_session_123');

-- 8. Cleanup test sessions
CALL CleanupExpiredSessions();
*/

-- ============================================
-- IMPORTANT SECURITY NOTES
-- ============================================

/*
⚠️ BEFORE PRODUCTION DEPLOYMENT:

1. CHANGE ALL DEFAULT PASSWORDS:
   ALTER USER 'admin_app'@'localhost' IDENTIFIED BY '<strong-password>';
   ALTER USER 'manager_app'@'localhost' IDENTIFIED BY '<strong-password>';
   ... etc for all users

2. RESTRICT HOST ACCESS:
   Change 'localhost' to specific IP addresses if needed
   Example: CREATE USER 'doctor_app'@'192.168.1.%' ...

3. ENABLE SSL/TLS:
   ALTER USER 'admin_app'@'localhost' REQUIRE SSL;

4. SET PASSWORD EXPIRATION:
   ALTER USER 'admin_app'@'localhost' PASSWORD EXPIRE INTERVAL 90 DAY;

5. LIMIT CONNECTION RESOURCES:
   ALTER USER 'patient_app'@'localhost' WITH MAX_QUERIES_PER_HOUR 1000;

6. AUDIT ALL PRIVILEGE CHANGES:
   Enable general_log for privilege changes during setup

7. TEST THOROUGHLY:
   - Test each role with actual application
   - Verify RLS prevents unauthorized access
   - Check session cleanup works
   - Validate all procedures execute correctly

8. SCHEDULE SESSION CLEANUP:
   Create event to run CleanupExpiredSessions() daily

9. MONITOR FAILED LOGIN ATTEMPTS:
   Set up alerting for suspicious activity

10. DOCUMENT ALL CREDENTIALS:
    Store securely in password manager or vault
*/