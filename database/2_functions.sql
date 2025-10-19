DELIMITER $$

-- ============================================
-- CALCULATION FUNCTIONS
-- ============================================

-- Calculate Patient Age
DROP FUNCTION IF EXISTS CalculateAge$$
CREATE FUNCTION CalculateAge(p_dob DATE)
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN TIMESTAMPDIFF(YEAR, p_dob, CURDATE());
END$$

-- Calculate Bill Discount
DROP FUNCTION IF EXISTS CalculateDiscount$$
CREATE FUNCTION CalculateDiscount(
    p_base_amount DECIMAL(10,2),
    p_discount_percentage DECIMAL(5,2)
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    RETURN p_base_amount * (p_discount_percentage / 100);
END$$

-- Calculate Insurance Coverage
DROP FUNCTION IF EXISTS CalculateInsuranceCoverage$$
CREATE FUNCTION CalculateInsuranceCoverage(
    p_bill_amount DECIMAL(10,2),
    p_copayment_percentage DECIMAL(5,2)
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE coverage_amount DECIMAL(10,2);
    SET coverage_amount = p_bill_amount * ((100 - p_copayment_percentage) / 100);
    RETURN coverage_amount;
END$$

-- ============================================
-- VALIDATION FUNCTIONS
-- ============================================

-- Validate Email Format
DROP FUNCTION IF EXISTS IsValidEmail$$
CREATE FUNCTION IsValidEmail(p_email VARCHAR(255))
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    RETURN p_email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$';
END$$

-- Check Doctor Availability
DROP FUNCTION IF EXISTS IsDoctorAvailable$$
CREATE FUNCTION IsDoctorAvailable(
    p_doctor_id CHAR(36),
    p_date DATE,
    p_time TIME
)
RETURNS BOOLEAN
READS SQL DATA
BEGIN
    DECLARE slot_available INT;
    
    SELECT COUNT(*) INTO slot_available
    FROM time_slot
    WHERE doctor_id = p_doctor_id
    AND available_date = p_date
    AND start_time <= p_time
    AND end_time > p_time
    AND is_booked = FALSE;
    
    RETURN slot_available > 0;
END$$

-- Check Insurance Active Status
DROP FUNCTION IF EXISTS IsInsuranceActive$$
CREATE FUNCTION IsInsuranceActive(p_patient_id CHAR(36))
RETURNS BOOLEAN
READS SQL DATA
BEGIN
    DECLARE active_count INT;
    
    SELECT COUNT(*) INTO active_count
    FROM insurance
    WHERE patient_id = p_patient_id
    AND status = 'Active'
    AND end_date >= CURDATE();
    
    RETURN active_count > 0;
END$$

-- ============================================
-- DATA RETRIEVAL FUNCTIONS
-- ============================================

-- Get Patient Full Name
DROP FUNCTION IF EXISTS GetPatientName$$
CREATE FUNCTION GetPatientName(p_patient_id CHAR(36))
RETURNS VARCHAR(255)
READS SQL DATA
BEGIN
    DECLARE patient_name VARCHAR(255);
    
    SELECT u.full_name INTO patient_name
    FROM user u
    WHERE u.user_id = p_patient_id;
    
    RETURN COALESCE(patient_name, 'Unknown');
END$$

-- Get Branch Name
DROP FUNCTION IF EXISTS GetBranchName$$
CREATE FUNCTION GetBranchName(p_branch_id CHAR(36))
RETURNS VARCHAR(50)
READS SQL DATA
BEGIN
    DECLARE branch_name VARCHAR(50);
    
    SELECT branch_name INTO branch_name
    FROM branch
    WHERE branch_id = p_branch_id;
    
    RETURN COALESCE(branch_name, 'Unknown');
END$$

-- Count Patient Appointments
DROP FUNCTION IF EXISTS CountPatientAppointments$$
CREATE FUNCTION CountPatientAppointments(
    p_patient_id CHAR(36),
    p_status VARCHAR(20)
)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE appointment_count INT;
    
    SELECT COUNT(*) INTO appointment_count
    FROM appointment
    WHERE patient_id = p_patient_id
    AND (p_status IS NULL OR status = p_status);
    
    RETURN appointment_count;
END$$

-- ============================================
-- BUSINESS LOGIC FUNCTIONS
-- ============================================

-- Generate Invoice Number
DROP FUNCTION IF EXISTS GenerateInvoiceNumber$$
CREATE FUNCTION GenerateInvoiceNumber(p_branch_id CHAR(36))
RETURNS VARCHAR(20)
READS SQL DATA
BEGIN
    DECLARE branch_code VARCHAR(5);
    DECLARE invoice_count INT;
    DECLARE invoice_number VARCHAR(20);
    
    -- Get branch code
    SELECT UPPER(LEFT(branch_name, 3)) INTO branch_code
    FROM branch WHERE branch_id = p_branch_id;
    
    -- FIX: Changed from 'bill' to 'invoice'
    SELECT COUNT(*) + 1 INTO invoice_count
    FROM invoice WHERE created_at >= CURDATE();
    
    -- Generate invoice number format: BRN-YYYYMMDD-0001
    SET invoice_number = CONCAT(
        COALESCE(branch_code, 'UNK'), '-',
        DATE_FORMAT(NOW(), '%Y%m%d'), '-',
        LPAD(invoice_count, 4, '0')
    );
    
    RETURN invoice_number;
END$$

-- Calculate Consultation Duration
DROP FUNCTION IF EXISTS GetConsultationDuration$$
CREATE FUNCTION GetConsultationDuration(p_consultation_rec_id CHAR(36))
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE duration_minutes INT;
    
    -- FIX: Changed from 'consultation' to 'consultation_record'
    -- Changed parameter name to match your schema
    SELECT TIMESTAMPDIFF(MINUTE, created_at, updated_at) INTO duration_minutes
    FROM consultation_record
    WHERE consultation_rec_id = p_consultation_rec_id;
    
    RETURN COALESCE(duration_minutes, 0);
END$$

DELIMITER ;