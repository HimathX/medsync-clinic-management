-- ============================================
-- MedSync Audit & Security Tables + Triggers
-- Comprehensive audit trail and security logging
-- Note: Grants are in 9_authorization.sql
-- ============================================

USE medsync_db;

-- ============================================
-- SECTION 1: AUDIT TABLES
-- ============================================

-- Table: Audit Log (Main audit trail)
CREATE TABLE IF NOT EXISTS audit_log (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36),
    action_type ENUM('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS_DENIED', 'PERMISSION_CHANGE') NOT NULL,
    table_name VARCHAR(64),
    record_id CHAR(36),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    session_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action_type),
    INDEX idx_audit_table (table_name),
    INDEX idx_audit_timestamp (timestamp),
    INDEX idx_audit_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: User Session Management
CREATE TABLE IF NOT EXISTS user_session (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    user_role ENUM('admin', 'manager', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'patient') NOT NULL,
    branch_id CHAR(36),
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    logout_time TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE SET NULL,
    INDEX idx_session_user (user_id),
    INDEX idx_session_active (is_active, last_activity),
    INDEX idx_session_login_time (login_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Failed Login Attempts
CREATE TABLE IF NOT EXISTS failed_login_attempt (
    attempt_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(255),
    failure_reason ENUM('INVALID_EMAIL', 'INVALID_PASSWORD', 'ACCOUNT_LOCKED', 'ACCOUNT_INACTIVE', 'OTHER') NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_failed_email (email),
    INDEX idx_failed_ip (ip_address),
    INDEX idx_failed_time (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Data Access Log (for sensitive data views)
CREATE TABLE IF NOT EXISTS data_access_log (
    access_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    accessed_user_id CHAR(36),
    access_type ENUM('VIEW', 'DOWNLOAD', 'EXPORT', 'PRINT') NOT NULL,
    resource_type ENUM('MEDICAL_RECORD', 'PRESCRIPTION', 'INVOICE', 'PAYMENT', 'INSURANCE', 'ALLERGY', 'CONDITION') NOT NULL,
    resource_id CHAR(36),
    ip_address VARCHAR(45),
    session_id VARCHAR(255),
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (accessed_user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    INDEX idx_access_user (user_id),
    INDEX idx_access_patient (accessed_user_id),
    INDEX idx_access_type (resource_type),
    INDEX idx_access_time (accessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SECTION 2: AUDIT TRIGGERS
-- Track changes to sensitive tables
-- ============================================

DELIMITER $$

-- Trigger: Audit User Updates
DROP TRIGGER IF EXISTS trg_user_audit_update$$
CREATE TRIGGER trg_user_audit_update
AFTER UPDATE ON user
FOR EACH ROW
BEGIN
    -- Only log if email or password changed
    IF OLD.email != NEW.email OR OLD.password_hash != NEW.password_hash THEN
        INSERT INTO audit_log (
            user_id, action_type, table_name, record_id, old_values, new_values
        ) VALUES (
            NEW.user_id, 'UPDATE', 'user', NEW.user_id,
            JSON_OBJECT('email', OLD.email, 'password_hash', LEFT(OLD.password_hash, 10), 'last_login', OLD.last_login),
            JSON_OBJECT('email', NEW.email, 'password_hash', LEFT(NEW.password_hash, 10), 'last_login', NEW.last_login)
        );
    END IF;
END$$

-- Trigger: Audit Patient Data Updates
DROP TRIGGER IF EXISTS trg_patient_audit_update$$
CREATE TRIGGER trg_patient_audit_update
AFTER UPDATE ON patient
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (
        user_id, action_type, table_name, record_id, old_values, new_values
    ) VALUES (
        NEW.patient_id, 'UPDATE', 'patient', NEW.patient_id,
        JSON_OBJECT('blood_group', OLD.blood_group, 'registered_branch_id', OLD.registered_branch_id),
        JSON_OBJECT('blood_group', NEW.blood_group, 'registered_branch_id', NEW.registered_branch_id)
    );
END$$

-- Trigger: Audit Patient Deletions
DROP TRIGGER IF EXISTS trg_patient_audit_delete$$
CREATE TRIGGER trg_patient_audit_delete
BEFORE DELETE ON patient
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (
        user_id, action_type, table_name, record_id, old_values
    ) VALUES (
        OLD.patient_id, 'DELETE', 'patient', OLD.patient_id,
        JSON_OBJECT('blood_group', OLD.blood_group, 'registered_branch_id', OLD.registered_branch_id, 'created_at', OLD.created_at)
    );
END$$

-- Trigger: Audit Consultation Record Creation
DROP TRIGGER IF EXISTS trg_consultation_audit_insert$$
CREATE TRIGGER trg_consultation_audit_insert
AFTER INSERT ON consultation_record
FOR EACH ROW
BEGIN
    DECLARE v_patient_id CHAR(36);
    
    -- Get patient_id from appointment
    SELECT a.patient_id INTO v_patient_id
    FROM appointment a
    WHERE a.appointment_id = NEW.appointment_id;
    
    INSERT INTO audit_log (user_id, action_type, table_name, record_id, new_values)
    VALUES (v_patient_id, 'INSERT', 'consultation_record', NEW.consultation_rec_id,
            JSON_OBJECT('appointment_id', NEW.appointment_id, 'symptoms', NEW.symptoms, 'diagnoses', NEW.diagnoses));
END$$

-- Trigger: Audit Prescription Creation
DROP TRIGGER IF EXISTS trg_prescription_audit_insert$$
CREATE TRIGGER trg_prescription_audit_insert
AFTER INSERT ON prescription_item
FOR EACH ROW
BEGIN
    DECLARE v_patient_id CHAR(36);
    
    -- Get patient_id from consultation -> appointment
    SELECT a.patient_id INTO v_patient_id
    FROM appointment a
    INNER JOIN consultation_record cr ON a.appointment_id = cr.appointment_id
    WHERE cr.consultation_rec_id = NEW.consultation_rec_id;
    
    INSERT INTO audit_log (user_id, action_type, table_name, record_id, new_values)
    VALUES (v_patient_id, 'INSERT', 'prescription_item', NEW.prescription_item_id,
            JSON_OBJECT('medication_id', NEW.medication_id, 'dosage', NEW.dosage, 'frequency', NEW.frequency));
END$$

-- Trigger: Audit Payment Creation
DROP TRIGGER IF EXISTS trg_payment_audit_insert$$
CREATE TRIGGER trg_payment_audit_insert
AFTER INSERT ON payment
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, table_name, record_id, new_values)
    VALUES (NEW.patient_id, 'INSERT', 'payment', NEW.payment_id,
            JSON_OBJECT('patient_id', NEW.patient_id, 'amount_paid', NEW.amount_paid, 'payment_method', NEW.payment_method));
END$$

-- Trigger: Audit Invoice Creation
DROP TRIGGER IF EXISTS trg_invoice_audit_insert$$
CREATE TRIGGER trg_invoice_audit_insert
AFTER INSERT ON invoice
FOR EACH ROW
BEGIN
    DECLARE v_patient_id CHAR(36);
    
    SELECT a.patient_id INTO v_patient_id
    FROM appointment a
    INNER JOIN consultation_record cr ON a.appointment_id = cr.appointment_id
    WHERE cr.consultation_rec_id = NEW.consultation_rec_id;
    
    INSERT INTO audit_log (user_id, action_type, table_name, record_id, new_values)
    VALUES (v_patient_id, 'INSERT', 'invoice', NEW.invoice_id,
            JSON_OBJECT('consultation_rec_id', NEW.consultation_rec_id, 'sub_total', NEW.sub_total, 'tax_amount', NEW.tax_amount));
END$$

-- Trigger: Audit Employee Role Changes
DROP TRIGGER IF EXISTS trg_employee_audit_update$$
CREATE TRIGGER trg_employee_audit_update
AFTER UPDATE ON employee
FOR EACH ROW
BEGIN
    IF OLD.role != NEW.role OR OLD.is_active != NEW.is_active OR OLD.salary != NEW.salary THEN
        INSERT INTO audit_log (user_id, action_type, table_name, record_id, old_values, new_values)
        VALUES (NEW.employee_id, 'UPDATE', 'employee', NEW.employee_id,
                JSON_OBJECT('role', OLD.role, 'salary', OLD.salary, 'is_active', OLD.is_active),
                JSON_OBJECT('role', NEW.role, 'salary', NEW.salary, 'is_active', NEW.is_active));
    END IF;
END$$

-- Trigger: Audit Insurance Status Changes
DROP TRIGGER IF EXISTS trg_insurance_audit_update$$
CREATE TRIGGER trg_insurance_audit_update
AFTER UPDATE ON insurance
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO audit_log (user_id, action_type, table_name, record_id, old_values, new_values)
        VALUES (NEW.patient_id, 'UPDATE', 'insurance', NEW.insurance_id,
                JSON_OBJECT('status', OLD.status, 'start_date', OLD.start_date, 'end_date', OLD.end_date),
                JSON_OBJECT('status', NEW.status, 'start_date', NEW.start_date, 'end_date', NEW.end_date));
    END IF;
END$$

DELIMITER ;

-- ============================================
-- SECTION 3: SECURITY HELPER PROCEDURES
-- ============================================

DELIMITER $$

-- Procedure: Log Failed Login
DROP PROCEDURE IF EXISTS LogFailedLogin$$
CREATE PROCEDURE LogFailedLogin(
    IN p_email VARCHAR(255),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent VARCHAR(255),
    IN p_failure_reason VARCHAR(50)
)
BEGIN
    INSERT INTO failed_login_attempt (email, ip_address, user_agent, failure_reason)
    VALUES (p_email, p_ip_address, p_user_agent, p_failure_reason);
END$$

-- Procedure: Check Failed Login Attempts
DROP PROCEDURE IF EXISTS CheckFailedLoginAttempts$$
CREATE PROCEDURE CheckFailedLoginAttempts(
    IN p_email VARCHAR(255),
    IN p_ip_address VARCHAR(45),
    IN p_time_window_minutes INT,
    OUT p_attempt_count INT,
    OUT p_should_lock BOOLEAN
)
BEGIN
    SELECT COUNT(*) INTO p_attempt_count
    FROM failed_login_attempt
    WHERE (email = p_email OR ip_address = p_ip_address)
    AND attempted_at >= DATE_SUB(NOW(), INTERVAL p_time_window_minutes MINUTE);
    
    SET p_should_lock = (p_attempt_count >= 5);
END$$

-- Procedure: Log Data Access
DROP PROCEDURE IF EXISTS LogDataAccess$$
CREATE PROCEDURE LogDataAccess(
    IN p_user_id CHAR(36),
    IN p_accessed_user_id CHAR(36),
    IN p_access_type VARCHAR(20),
    IN p_resource_type VARCHAR(50),
    IN p_resource_id CHAR(36),
    IN p_ip_address VARCHAR(45),
    IN p_session_id VARCHAR(255)
)
BEGIN
    INSERT INTO data_access_log (user_id, accessed_user_id, access_type, resource_type, resource_id, ip_address, session_id)
    VALUES (p_user_id, p_accessed_user_id, p_access_type, p_resource_type, p_resource_id, p_ip_address, p_session_id);
END$$

-- Procedure: Cleanup Old Audit Logs
DROP PROCEDURE IF EXISTS CleanupOldAuditLogs$$
CREATE PROCEDURE CleanupOldAuditLogs(IN p_retention_days INT)
BEGIN
    DELETE FROM audit_log WHERE timestamp < DATE_SUB(NOW(), INTERVAL p_retention_days DAY);
    DELETE FROM failed_login_attempt WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    DELETE FROM data_access_log WHERE accessed_at < DATE_SUB(NOW(), INTERVAL 365 DAY);
END$$

-- Procedure: Get User Audit Trail
DROP PROCEDURE IF EXISTS GetUserAuditTrail$$
CREATE PROCEDURE GetUserAuditTrail(
    IN p_user_id CHAR(36),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_limit INT
)
BEGIN
    SELECT audit_id, action_type, table_name, record_id, old_values, new_values, ip_address, timestamp
    FROM audit_log
    WHERE user_id = p_user_id AND timestamp BETWEEN p_start_date AND p_end_date
    ORDER BY timestamp DESC LIMIT p_limit;
END$$

DELIMITER ;

-- ============================================
-- NOTE: Grants are in 9_authorization.sql
-- ============================================