-- ============================================
-- MedSync Functions Export
-- Generated: 2025-10-16 13:12:00
-- ============================================

USE `medsync_db`;

DELIMITER $$

-- Function: CalculateAge
DROP FUNCTION IF EXISTS `CalculateAge`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `CalculateAge`(p_dob DATE) RETURNS int
    DETERMINISTIC
BEGIN
    RETURN TIMESTAMPDIFF(YEAR, p_dob, CURDATE());
END$$

-- Function: CalculateDiscount
DROP FUNCTION IF EXISTS `CalculateDiscount`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `CalculateDiscount`(
    p_base_amount DECIMAL(10,2),
    p_discount_percentage DECIMAL(5,2)
) RETURNS decimal(10,2)
    DETERMINISTIC
BEGIN
    RETURN p_base_amount * (p_discount_percentage / 100);
END$$

-- Function: CalculateInsuranceCoverage
DROP FUNCTION IF EXISTS `CalculateInsuranceCoverage`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `CalculateInsuranceCoverage`(
    p_bill_amount DECIMAL(10,2),
    p_copayment_percentage DECIMAL(5,2)
) RETURNS decimal(10,2)
    DETERMINISTIC
BEGIN
    DECLARE coverage_amount DECIMAL(10,2);
    SET coverage_amount = p_bill_amount * ((100 - p_copayment_percentage) / 100);
    RETURN coverage_amount;
END$$

-- Function: CountPatientAppointments
DROP FUNCTION IF EXISTS `CountPatientAppointments`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `CountPatientAppointments`(
    p_patient_id CHAR(36),
    p_status VARCHAR(20)
) RETURNS int
    READS SQL DATA
BEGIN
    DECLARE appointment_count INT;
    
    SELECT COUNT(*) INTO appointment_count
    FROM appointment
    WHERE patient_id = p_patient_id
    AND (p_status IS NULL OR status = p_status);
    
    RETURN appointment_count;
END$$

-- Function: GenerateInvoiceNumber
DROP FUNCTION IF EXISTS `GenerateInvoiceNumber`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `GenerateInvoiceNumber`(p_branch_id CHAR(36)) RETURNS varchar(20) CHARSET utf8mb4
    READS SQL DATA
BEGIN
    DECLARE branch_code VARCHAR(5);
    DECLARE invoice_count INT;
    DECLARE invoice_number VARCHAR(20);
    
    SELECT UPPER(LEFT(branch_name, 3)) INTO branch_code
    FROM branch WHERE branch_id = p_branch_id;
    
    SELECT COUNT(*) + 1 INTO invoice_count
    FROM bill WHERE created_at >= CURDATE();
    
    SET invoice_number = CONCAT(
        branch_code, '-',
        DATE_FORMAT(NOW(), '%Y%m%d'), '-',
        LPAD(invoice_count, 4, '0')
    );
    
    RETURN invoice_number;
END$$

-- Function: GetBranchName
DROP FUNCTION IF EXISTS `GetBranchName`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `GetBranchName`(p_branch_id CHAR(36)) RETURNS varchar(50) CHARSET utf8mb4
    READS SQL DATA
BEGIN
    DECLARE branch_name VARCHAR(50);
    
    SELECT branch_name INTO branch_name
    FROM branch
    WHERE branch_id = p_branch_id;
    
    RETURN COALESCE(branch_name, 'Unknown');
END$$

-- Function: GetConsultationDuration
DROP FUNCTION IF EXISTS `GetConsultationDuration`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `GetConsultationDuration`(p_consultation_id CHAR(36)) RETURNS int
    READS SQL DATA
BEGIN
    DECLARE duration_minutes INT;
    
    SELECT TIMESTAMPDIFF(MINUTE, created_at, updated_at) INTO duration_minutes
    FROM consultation
    WHERE consultation_id = p_consultation_id;
    
    RETURN COALESCE(duration_minutes, 0);
END$$

-- Function: GetPatientName
DROP FUNCTION IF EXISTS `GetPatientName`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `GetPatientName`(p_patient_id CHAR(36)) RETURNS varchar(255) CHARSET utf8mb4
    READS SQL DATA
BEGIN
    DECLARE patient_name VARCHAR(255);
    
    SELECT u.full_name INTO patient_name
    FROM user u
    WHERE u.user_id = p_patient_id;
    
    RETURN COALESCE(patient_name, 'Unknown');
END$$

-- Function: IsDoctorAvailable
DROP FUNCTION IF EXISTS `IsDoctorAvailable`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `IsDoctorAvailable`(
    p_doctor_id CHAR(36),
    p_date DATE,
    p_time TIME
) RETURNS tinyint(1)
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

-- Function: IsInsuranceActive
DROP FUNCTION IF EXISTS `IsInsuranceActive`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `IsInsuranceActive`(p_patient_id CHAR(36)) RETURNS tinyint(1)
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

-- Function: IsValidEmail
DROP FUNCTION IF EXISTS `IsValidEmail`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `IsValidEmail`(p_email VARCHAR(255)) RETURNS tinyint(1)
    DETERMINISTIC
BEGIN
    RETURN p_email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$';
END$$

DELIMITER ;
