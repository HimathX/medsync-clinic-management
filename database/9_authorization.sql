-- ============================================
-- MedSync Database Authorization & Security
-- Role-Based Access Control (RBAC) Implementation
-- ============================================

USE medsync_db;

-- ============================================
-- SECTION 1: DATABASE ROLES
-- ============================================

DROP ROLE IF EXISTS 'medsync_admin';
DROP ROLE IF EXISTS 'medsync_manager';
DROP ROLE IF EXISTS 'medsync_doctor';
DROP ROLE IF EXISTS 'medsync_nurse';
DROP ROLE IF EXISTS 'medsync_receptionist';
DROP ROLE IF EXISTS 'medsync_pharmacist';
DROP ROLE IF EXISTS 'medsync_patient';
DROP ROLE IF EXISTS 'medsync_readonly';

CREATE ROLE 'medsync_admin';
CREATE ROLE 'medsync_manager';
CREATE ROLE 'medsync_doctor';
CREATE ROLE 'medsync_nurse';
CREATE ROLE 'medsync_receptionist';
CREATE ROLE 'medsync_pharmacist';
CREATE ROLE 'medsync_patient';
CREATE ROLE 'medsync_readonly';

-- ============================================
-- SECTION 2: ADMIN ROLE PERMISSIONS
-- ============================================

GRANT ALL PRIVILEGES ON medsync_db.* TO 'medsync_admin';
GRANT CREATE USER ON *.* TO 'medsync_admin';
GRANT GRANT OPTION ON medsync_db.* TO 'medsync_admin';
GRANT RELOAD ON *.* TO 'medsync_admin';
GRANT PROCESS ON *.* TO 'medsync_admin';
GRANT SHOW DATABASES ON *.* TO 'medsync_admin';

-- ============================================
-- SECTION 3: MANAGER ROLE PERMISSIONS
-- ============================================

GRANT SELECT, UPDATE ON medsync_db.branch TO 'medsync_manager';
GRANT SELECT, INSERT, UPDATE ON medsync_db.user TO 'medsync_manager';
GRANT SELECT, INSERT, UPDATE ON medsync_db.employee TO 'medsync_manager';
GRANT SELECT, INSERT, UPDATE ON medsync_db.doctor TO 'medsync_manager';
GRANT SELECT, INSERT, UPDATE ON medsync_db.doctor_specialization TO 'medsync_manager';
GRANT SELECT, INSERT, UPDATE ON medsync_db.address TO 'medsync_manager';
GRANT SELECT, INSERT, UPDATE ON medsync_db.contact TO 'medsync_manager';
GRANT SELECT, INSERT, UPDATE, DELETE ON medsync_db.time_slot TO 'medsync_manager';
GRANT SELECT ON medsync_db.patient TO 'medsync_manager';
GRANT SELECT ON medsync_db.appointment TO 'medsync_manager';
GRANT SELECT ON medsync_db.invoice TO 'medsync_manager';
GRANT SELECT ON medsync_db.payment TO 'medsync_manager';
GRANT SELECT ON medsync_db.claim TO 'medsync_manager';
GRANT SELECT ON medsync_db.specialization TO 'medsync_manager';
GRANT SELECT ON medsync_db.treatment_catalogue TO 'medsync_manager';
GRANT SELECT ON medsync_db.insurance_package TO 'medsync_manager';
GRANT SELECT ON medsync_db.medication TO 'medsync_manager';
GRANT SELECT ON medsync_db.conditions TO 'medsync_manager';
GRANT SELECT ON medsync_db.conditions_category TO 'medsync_manager';

-- Procedures that EXIST
GRANT EXECUTE ON PROCEDURE medsync_db.GetStaffByBranch TO 'medsync_manager';
GRANT EXECUTE ON PROCEDURE medsync_db.RegisterDoctor TO 'medsync_manager';
GRANT EXECUTE ON PROCEDURE medsync_db.RegisterEmployee TO 'medsync_manager';
GRANT EXECUTE ON PROCEDURE medsync_db.RegisterStaff TO 'medsync_manager';
GRANT EXECUTE ON PROCEDURE medsync_db.DeactivateStaff TO 'medsync_manager';
GRANT EXECUTE ON PROCEDURE medsync_db.UpdateStaffSalary TO 'medsync_manager';
GRANT EXECUTE ON PROCEDURE medsync_db.AddTimeSlot TO 'medsync_manager';
GRANT EXECUTE ON PROCEDURE medsync_db.CreateTimeSlot TO 'medsync_manager';
GRANT EXECUTE ON PROCEDURE medsync_db.AddDoctorSpecialization TO 'medsync_manager';

-- ============================================
-- SECTION 4: DOCTOR ROLE PERMISSIONS
-- ============================================

GRANT SELECT ON medsync_db.patient TO 'medsync_doctor';
GRANT SELECT ON medsync_db.user TO 'medsync_doctor';
GRANT SELECT ON medsync_db.address TO 'medsync_doctor';
GRANT SELECT ON medsync_db.contact TO 'medsync_doctor';
GRANT SELECT ON medsync_db.patient_allergy TO 'medsync_doctor';
GRANT SELECT ON medsync_db.patient_condition TO 'medsync_doctor';
GRANT SELECT ON medsync_db.conditions TO 'medsync_doctor';
GRANT SELECT ON medsync_db.conditions_category TO 'medsync_doctor';
GRANT SELECT, UPDATE ON medsync_db.appointment TO 'medsync_doctor';
GRANT SELECT ON medsync_db.time_slot TO 'medsync_doctor';
GRANT SELECT, INSERT, UPDATE ON medsync_db.consultation_record TO 'medsync_doctor';
GRANT SELECT, INSERT, UPDATE ON medsync_db.treatment TO 'medsync_doctor';
GRANT SELECT ON medsync_db.treatment_catalogue TO 'medsync_doctor';
GRANT SELECT, INSERT, UPDATE ON medsync_db.prescription_item TO 'medsync_doctor';
GRANT SELECT ON medsync_db.medication TO 'medsync_doctor';
GRANT SELECT ON medsync_db.insurance TO 'medsync_doctor';
GRANT SELECT ON medsync_db.insurance_package TO 'medsync_doctor';
GRANT SELECT ON medsync_db.invoice TO 'medsync_doctor';
GRANT SELECT ON medsync_db.branch TO 'medsync_doctor';
GRANT SELECT ON medsync_db.specialization TO 'medsync_doctor';

-- Procedures that EXIST
GRANT EXECUTE ON PROCEDURE medsync_db.CreateConsultationWithDetails TO 'medsync_doctor';
GRANT EXECUTE ON PROCEDURE medsync_db.AddTreatment TO 'medsync_doctor';
GRANT EXECUTE ON PROCEDURE medsync_db.AddPrescriptionWithItems TO 'medsync_doctor';
GRANT EXECUTE ON PROCEDURE medsync_db.AddPatientAllergy TO 'medsync_doctor';
GRANT EXECUTE ON PROCEDURE medsync_db.AddPatientCondition TO 'medsync_doctor';
GRANT EXECUTE ON PROCEDURE medsync_db.GenerateInvoice TO 'medsync_doctor';

-- ============================================
-- SECTION 5: NURSE ROLE PERMISSIONS
-- ============================================

GRANT SELECT ON medsync_db.patient TO 'medsync_nurse';
GRANT SELECT ON medsync_db.user TO 'medsync_nurse';
GRANT SELECT ON medsync_db.address TO 'medsync_nurse';
GRANT SELECT ON medsync_db.contact TO 'medsync_nurse';
GRANT SELECT ON medsync_db.patient_allergy TO 'medsync_nurse';
GRANT SELECT ON medsync_db.patient_condition TO 'medsync_nurse';
GRANT SELECT ON medsync_db.conditions TO 'medsync_nurse';
GRANT SELECT, UPDATE ON medsync_db.appointment TO 'medsync_nurse';
GRANT SELECT ON medsync_db.time_slot TO 'medsync_nurse';
GRANT SELECT ON medsync_db.consultation_record TO 'medsync_nurse';
GRANT SELECT ON medsync_db.prescription_item TO 'medsync_nurse';
GRANT SELECT ON medsync_db.medication TO 'medsync_nurse';
GRANT SELECT ON medsync_db.branch TO 'medsync_nurse';
GRANT SELECT ON medsync_db.doctor TO 'medsync_nurse';
GRANT SELECT ON medsync_db.employee TO 'medsync_nurse';

-- ============================================
-- SECTION 6: RECEPTIONIST ROLE PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE ON medsync_db.patient TO 'medsync_receptionist';
GRANT SELECT, INSERT, UPDATE ON medsync_db.user TO 'medsync_receptionist';
GRANT SELECT, INSERT, UPDATE ON medsync_db.address TO 'medsync_receptionist';
GRANT SELECT, INSERT, UPDATE ON medsync_db.contact TO 'medsync_receptionist';
GRANT SELECT, INSERT, UPDATE, DELETE ON medsync_db.appointment TO 'medsync_receptionist';
GRANT SELECT, UPDATE ON medsync_db.time_slot TO 'medsync_receptionist';
GRANT SELECT, INSERT, UPDATE ON medsync_db.insurance TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.insurance_package TO 'medsync_receptionist';
GRANT SELECT, INSERT ON medsync_db.invoice TO 'medsync_receptionist';
GRANT SELECT, INSERT, UPDATE ON medsync_db.payment TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.patient_balance TO 'medsync_receptionist';
GRANT SELECT, INSERT, UPDATE ON medsync_db.claim TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.doctor TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.doctor_specialization TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.specialization TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.employee TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.branch TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.treatment_catalogue TO 'medsync_receptionist';
GRANT SELECT ON medsync_db.consultation_record TO 'medsync_receptionist';

-- Procedures that EXIST
GRANT EXECUTE ON PROCEDURE medsync_db.RegisterPatient TO 'medsync_receptionist';
GRANT EXECUTE ON PROCEDURE medsync_db.BookAppointment TO 'medsync_receptionist';
GRANT EXECUTE ON PROCEDURE medsync_db.CancelAppointment TO 'medsync_receptionist';
GRANT EXECUTE ON PROCEDURE medsync_db.AddPatientInsurance TO 'medsync_receptionist';
GRANT EXECUTE ON PROCEDURE medsync_db.AddPayment TO 'medsync_receptionist';
GRANT EXECUTE ON PROCEDURE medsync_db.AddClaim TO 'medsync_receptionist';
GRANT EXECUTE ON PROCEDURE medsync_db.GenerateInvoice TO 'medsync_receptionist';

-- ============================================
-- SECTION 7: PHARMACIST ROLE PERMISSIONS
-- ============================================

GRANT SELECT (patient_id) ON medsync_db.patient TO 'medsync_pharmacist';
GRANT SELECT (user_id, full_name, NIC) ON medsync_db.user TO 'medsync_pharmacist';
GRANT SELECT, UPDATE ON medsync_db.prescription_item TO 'medsync_pharmacist';
GRANT SELECT, INSERT, UPDATE ON medsync_db.medication TO 'medsync_pharmacist';
GRANT SELECT ON medsync_db.consultation_record TO 'medsync_pharmacist';
GRANT SELECT ON medsync_db.patient_allergy TO 'medsync_pharmacist';
GRANT SELECT ON medsync_db.appointment TO 'medsync_pharmacist';
GRANT SELECT ON medsync_db.branch TO 'medsync_pharmacist';

-- Procedures that EXIST
GRANT EXECUTE ON PROCEDURE medsync_db.AddMedication TO 'medsync_pharmacist';

-- ============================================
-- SECTION 8: PATIENT ROLE PERMISSIONS
-- ============================================

-- Direct table access (views will be granted in 10_views.sql)
GRANT SELECT ON medsync_db.patient TO 'medsync_patient';
GRANT SELECT ON medsync_db.user TO 'medsync_patient';
GRANT SELECT ON medsync_db.appointment TO 'medsync_patient';
GRANT SELECT ON medsync_db.consultation_record TO 'medsync_patient';
GRANT SELECT ON medsync_db.prescription_item TO 'medsync_patient';
GRANT SELECT ON medsync_db.invoice TO 'medsync_patient';
GRANT SELECT ON medsync_db.payment TO 'medsync_patient';
GRANT SELECT ON medsync_db.insurance TO 'medsync_patient';
GRANT SELECT ON medsync_db.time_slot TO 'medsync_patient';
GRANT SELECT ON medsync_db.doctor TO 'medsync_patient';
GRANT SELECT ON medsync_db.branch TO 'medsync_patient';
GRANT SELECT ON medsync_db.medication TO 'medsync_patient';

-- Procedures that EXIST
GRANT EXECUTE ON PROCEDURE medsync_db.BookAppointment TO 'medsync_patient';
GRANT EXECUTE ON PROCEDURE medsync_db.CancelAppointment TO 'medsync_patient';

-- ============================================
-- SECTION 9: READONLY ROLE PERMISSIONS
-- ============================================

GRANT SELECT ON medsync_db.* TO 'medsync_readonly';

-- ============================================
-- SECTION 10: APPLICATION USERS
-- ============================================

DROP USER IF EXISTS 'admin_app'@'localhost';
DROP USER IF EXISTS 'manager_app'@'localhost';
DROP USER IF EXISTS 'doctor_app'@'localhost';
DROP USER IF EXISTS 'nurse_app'@'localhost';
DROP USER IF EXISTS 'reception_app'@'localhost';
DROP USER IF EXISTS 'pharmacy_app'@'localhost';
DROP USER IF EXISTS 'patient_app'@'localhost';
DROP USER IF EXISTS 'reports_app'@'localhost';

CREATE USER 'admin_app'@'localhost' IDENTIFIED BY 'Admin@MedSync2025!';
GRANT 'medsync_admin' TO 'admin_app'@'localhost';
SET DEFAULT ROLE 'medsync_admin' TO 'admin_app'@'localhost';

CREATE USER 'manager_app'@'localhost' IDENTIFIED BY 'Manager@MedSync2025!';
GRANT 'medsync_manager' TO 'manager_app'@'localhost';
SET DEFAULT ROLE 'medsync_manager' TO 'manager_app'@'localhost';

CREATE USER 'doctor_app'@'localhost' IDENTIFIED BY 'Doctor@MedSync2025!';
GRANT 'medsync_doctor' TO 'doctor_app'@'localhost';
SET DEFAULT ROLE 'medsync_doctor' TO 'doctor_app'@'localhost';

CREATE USER 'nurse_app'@'localhost' IDENTIFIED BY 'Nurse@MedSync2025!';
GRANT 'medsync_nurse' TO 'nurse_app'@'localhost';
SET DEFAULT ROLE 'medsync_nurse' TO 'nurse_app'@'localhost';

CREATE USER 'reception_app'@'localhost' IDENTIFIED BY 'Reception@MedSync2025!';
GRANT 'medsync_receptionist' TO 'reception_app'@'localhost';
SET DEFAULT ROLE 'medsync_receptionist' TO 'reception_app'@'localhost';

CREATE USER 'pharmacy_app'@'localhost' IDENTIFIED BY 'Pharmacy@MedSync2025!';
GRANT 'medsync_pharmacist' TO 'pharmacy_app'@'localhost';
SET DEFAULT ROLE 'medsync_pharmacist' TO 'pharmacy_app'@'localhost';

CREATE USER 'patient_app'@'localhost' IDENTIFIED BY 'Patient@MedSync2025!';
GRANT 'medsync_patient' TO 'patient_app'@'localhost';
SET DEFAULT ROLE 'medsync_patient' TO 'patient_app'@'localhost';

CREATE USER 'reports_app'@'localhost' IDENTIFIED BY 'Reports@MedSync2025!';
GRANT 'medsync_readonly' TO 'reports_app'@'localhost';
SET DEFAULT ROLE 'medsync_readonly' TO 'reports_app'@'localhost';

-- ============================================
-- SECTION 11: ROW-LEVEL SECURITY PROCEDURES
-- ============================================

DELIMITER $$

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
    UPDATE user_session
    SET is_active = FALSE, logout_time = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id AND session_id != p_session_id AND is_active = TRUE;
    
    INSERT INTO user_session (session_id, user_id, user_role, branch_id, ip_address, user_agent)
    VALUES (p_session_id, p_user_id, p_user_role, p_branch_id, p_ip_address, p_user_agent)
    ON DUPLICATE KEY UPDATE
        user_role = p_user_role, branch_id = p_branch_id, ip_address = p_ip_address,
        user_agent = p_user_agent, is_active = TRUE, last_activity = CURRENT_TIMESTAMP, logout_time = NULL;
END$$

DROP FUNCTION IF EXISTS GetCurrentUserId$$
CREATE FUNCTION GetCurrentUserId(p_session_id VARCHAR(255))
RETURNS CHAR(36) DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE v_user_id CHAR(36);
    SELECT user_id INTO v_user_id FROM user_session
    WHERE session_id = p_session_id AND is_active = TRUE AND last_activity > DATE_SUB(NOW(), INTERVAL 24 HOUR);
    RETURN v_user_id;
END$$

DROP FUNCTION IF EXISTS GetCurrentUserRole$$
CREATE FUNCTION GetCurrentUserRole(p_session_id VARCHAR(255))
RETURNS VARCHAR(20) DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE v_user_role VARCHAR(20);
    SELECT user_role INTO v_user_role FROM user_session
    WHERE session_id = p_session_id AND is_active = TRUE AND last_activity > DATE_SUB(NOW(), INTERVAL 24 HOUR);
    RETURN v_user_role;
END$$

DROP FUNCTION IF EXISTS GetCurrentUserBranch$$
CREATE FUNCTION GetCurrentUserBranch(p_session_id VARCHAR(255))
RETURNS CHAR(36) DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE v_branch_id CHAR(36);
    SELECT branch_id INTO v_branch_id FROM user_session
    WHERE session_id = p_session_id AND is_active = TRUE AND last_activity > DATE_SUB(NOW(), INTERVAL 24 HOUR);
    RETURN v_branch_id;
END$$

DROP FUNCTION IF EXISTS VerifyPatientAccess$$
CREATE FUNCTION VerifyPatientAccess(p_session_id VARCHAR(255), p_patient_id CHAR(36))
RETURNS BOOLEAN DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE v_user_id CHAR(36);
    DECLARE v_user_role VARCHAR(20);
    SELECT user_id, user_role INTO v_user_id, v_user_role FROM user_session WHERE session_id = p_session_id AND is_active = TRUE;
    IF v_user_role IN ('admin', 'manager', 'doctor', 'nurse', 'receptionist', 'pharmacist') THEN RETURN TRUE; END IF;
    IF v_user_role = 'patient' AND v_user_id = p_patient_id THEN RETURN TRUE; END IF;
    RETURN FALSE;
END$$

DROP FUNCTION IF EXISTS VerifyDoctorPatientRelation$$
CREATE FUNCTION VerifyDoctorPatientRelation(p_session_id VARCHAR(255), p_patient_id CHAR(36))
RETURNS BOOLEAN DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE v_user_id CHAR(36);
    DECLARE v_user_role VARCHAR(20);
    DECLARE v_has_relation INT DEFAULT 0;
    SELECT user_id, user_role INTO v_user_id, v_user_role FROM user_session WHERE session_id = p_session_id AND is_active = TRUE;
    IF v_user_role IN ('admin', 'manager') THEN RETURN TRUE; END IF;
    IF v_user_role = 'doctor' THEN
        SELECT COUNT(*) INTO v_has_relation FROM appointment a
        INNER JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
        WHERE a.patient_id = p_patient_id AND ts.doctor_id = v_user_id;
        RETURN v_has_relation > 0;
    END IF;
    RETURN FALSE;
END$$

DROP FUNCTION IF EXISTS VerifyBranchAccess$$
CREATE FUNCTION VerifyBranchAccess(p_session_id VARCHAR(255), p_branch_id CHAR(36))
RETURNS BOOLEAN DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE v_user_id CHAR(36);
    DECLARE v_user_role VARCHAR(20);
    DECLARE v_user_branch_id CHAR(36);
    SELECT user_id, user_role, branch_id INTO v_user_id, v_user_role, v_user_branch_id FROM user_session WHERE session_id = p_session_id AND is_active = TRUE;
    IF v_user_role = 'admin' THEN RETURN TRUE; END IF;
    IF v_user_role = 'manager' AND v_user_branch_id = p_branch_id THEN RETURN TRUE; END IF;
    IF v_user_role IN ('doctor', 'nurse', 'receptionist', 'pharmacist') AND v_user_branch_id = p_branch_id THEN RETURN TRUE; END IF;
    RETURN FALSE;
END$$

DROP PROCEDURE IF EXISTS LogoutUser$$
CREATE PROCEDURE LogoutUser(IN p_session_id VARCHAR(255))
BEGIN
    UPDATE user_session SET is_active = FALSE, logout_time = CURRENT_TIMESTAMP WHERE session_id = p_session_id;
END$$

DROP PROCEDURE IF EXISTS CleanupExpiredSessions$$
CREATE PROCEDURE CleanupExpiredSessions()
BEGIN
    UPDATE user_session SET is_active = FALSE, logout_time = CURRENT_TIMESTAMP
    WHERE last_activity < DATE_SUB(NOW(), INTERVAL 24 HOUR) AND is_active = TRUE;
    DELETE FROM user_session WHERE last_activity < DATE_SUB(NOW(), INTERVAL 7 DAY);
END$$

DELIMITER ;

-- ============================================
-- SECTION 12: GRANT PERMISSIONS ON SESSION
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON medsync_db.user_session TO 'medsync_admin';
GRANT SELECT, INSERT, UPDATE ON medsync_db.user_session TO 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist', 'medsync_patient';

GRANT EXECUTE ON PROCEDURE medsync_db.SetUserContext TO 'medsync_admin', 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist', 'medsync_patient';
GRANT EXECUTE ON PROCEDURE medsync_db.LogoutUser TO 'medsync_admin', 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist', 'medsync_patient';
GRANT EXECUTE ON PROCEDURE medsync_db.AuthenticateUser TO 'medsync_admin', 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist', 'medsync_patient';
GRANT EXECUTE ON FUNCTION medsync_db.GetCurrentUserId TO 'medsync_admin', 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist', 'medsync_patient';
GRANT EXECUTE ON FUNCTION medsync_db.GetCurrentUserRole TO 'medsync_admin', 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist', 'medsync_patient';
GRANT EXECUTE ON FUNCTION medsync_db.GetCurrentUserBranch TO 'medsync_admin', 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist', 'medsync_patient';
GRANT EXECUTE ON FUNCTION medsync_db.VerifyPatientAccess TO 'medsync_admin', 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist', 'medsync_patient';
GRANT EXECUTE ON FUNCTION medsync_db.VerifyDoctorPatientRelation TO 'medsync_admin', 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist';
GRANT EXECUTE ON FUNCTION medsync_db.VerifyBranchAccess TO 'medsync_admin', 'medsync_manager', 'medsync_doctor', 'medsync_nurse', 'medsync_receptionist', 'medsync_pharmacist';
GRANT EXECUTE ON PROCEDURE medsync_db.CleanupExpiredSessions TO 'medsync_admin';

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