-- ============================================
-- MedSync Triggers Export
-- Generated: 2025-10-18 (Fixed - Clean)
-- ============================================

USE `medsync_db`;

DELIMITER $$

-- =============================================
-- Trigger: validate_patient_age
-- =============================================
DROP TRIGGER IF EXISTS `validate_patient_age`$$

CREATE DEFINER=`root`@`localhost` TRIGGER `validate_patient_age` 
BEFORE INSERT ON `patient` 
FOR EACH ROW 
BEGIN
    DECLARE patient_age INT;
    
    SELECT TIMESTAMPDIFF(YEAR, DOB, CURDATE()) INTO patient_age
    FROM user WHERE user_id = NEW.patient_id;
    
    IF patient_age < 18 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Patient must be at least 18 years old';
    END IF;
END$$

-- =============================================
-- Trigger: Auto-deduct balance on payment
-- =============================================
DROP TRIGGER IF EXISTS `trg_payment_after_insert_balance_update`$$

CREATE TRIGGER `trg_payment_after_insert_balance_update` 
AFTER INSERT ON `payment`
FOR EACH ROW
BEGIN
    DECLARE v_current_balance DECIMAL(12,2);
    
    -- Only process completed payments with amount > 0
    IF NEW.status = 'Completed' AND NEW.amount_paid > 0 THEN
        
        -- Get current balance
        SELECT total_balance INTO v_current_balance 
        FROM patient_balance 
        WHERE patient_id = NEW.patient_id;
        
        -- Validate payment doesn't exceed balance
        IF v_current_balance < NEW.amount_paid THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Payment exceeds patient balance';
        END IF;
        
        -- Deduct payment from balance
        UPDATE patient_balance 
        SET total_balance = total_balance - NEW.amount_paid 
        WHERE patient_id = NEW.patient_id;
        
    END IF;
END$$

-- Trigger: Auto-complete appointment on consultation record insert
DROP TRIGGER IF EXISTS trg_appointment_complete_on_consult$$

CREATE TRIGGER trg_appointment_complete_on_consult 
AFTER INSERT ON consultation_record
FOR EACH ROW
BEGIN
    UPDATE appointment 
    SET status = 'Completed' 
    WHERE appointment_id = NEW.appointment_id;
END$$

CREATE TRIGGER trg_insurance_auto_expire 
AFTER UPDATE ON insurance
FOR EACH ROW
BEGIN
    IF NEW.end_date < CURDATE() AND NEW.status != 'Expired' THEN
        UPDATE insurance SET status = 'Expired' WHERE insurance_id = NEW.insurance_id;
    END IF;
END$$

-- Trigger: Free time slot on appointment cancellation
DROP TRIGGER IF EXISTS trg_appointment_cancel_free_slot$$

CREATE TRIGGER trg_appointment_cancel_free_slot 
AFTER UPDATE ON appointment
FOR EACH ROW
BEGIN
    -- Only if status changed to 'Cancelled'
    IF NEW.status = 'Cancelled' AND OLD.status != 'Cancelled' THEN
        UPDATE time_slot 
        SET is_booked = FALSE 
        WHERE time_slot_id = NEW.time_slot_id;
    END IF;
END$$



-- ==================== VALIDATION TRIGGERS ====================

-- Trigger: Prevent overlapping doctor schedules
DROP TRIGGER IF EXISTS trg_timeslot_validate_overlap$$
CREATE TRIGGER trg_timeslot_validate_overlap
BEFORE INSERT ON time_slot
FOR EACH ROW
BEGIN
    DECLARE v_overlap_count INT;
    
    SELECT COUNT(*) INTO v_overlap_count
    FROM time_slot
    WHERE doctor_id = NEW.doctor_id
    AND branch_id = NEW.branch_id
    AND available_date = NEW.available_date
    AND (
        (NEW.start_time >= start_time AND NEW.start_time < end_time)
        OR (NEW.end_time > start_time AND NEW.end_time <= end_time)
        OR (NEW.start_time <= start_time AND NEW.end_time >= end_time)
    );
    
    IF v_overlap_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Time slot overlaps with existing schedule';
    END IF;
END$$

-- Trigger: Validate insurance dates
DROP TRIGGER IF EXISTS trg_insurance_validate_dates$$
CREATE TRIGGER trg_insurance_validate_dates
BEFORE INSERT ON insurance
FOR EACH ROW
BEGIN
    IF NEW.end_date <= NEW.start_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insurance end date must be after start date';
    END IF;
    
    IF NEW.start_date < CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insurance start date cannot be in the past';
    END IF;
END$$

-- Trigger: Prevent double-booking appointments
DROP TRIGGER IF EXISTS trg_appointment_prevent_double_booking$$
CREATE TRIGGER trg_appointment_prevent_double_booking
BEFORE INSERT ON appointment
FOR EACH ROW
BEGIN
    DECLARE v_patient_scheduled INT;
    DECLARE v_slot_date DATE;
    
    -- Get the date of the new appointment
    SELECT available_date INTO v_slot_date
    FROM time_slot
    WHERE time_slot_id = NEW.time_slot_id;
    
    -- Check if patient already has appointment on same date
    SELECT COUNT(*) INTO v_patient_scheduled
    FROM appointment a
    INNER JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id
    WHERE a.patient_id = NEW.patient_id
    AND ts.available_date = v_slot_date
    AND a.status IN ('Scheduled', 'Completed');
    
    IF v_patient_scheduled > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Patient already has an appointment on this date';
    END IF;
END$$

-- Trigger: Validate claim amount doesn't exceed invoice
DROP TRIGGER IF EXISTS trg_claim_validate_amount$$
CREATE TRIGGER trg_claim_validate_amount
BEFORE INSERT ON claim
FOR EACH ROW
BEGIN
    DECLARE v_invoice_total DECIMAL(12,2);
    DECLARE v_total_claimed DECIMAL(12,2);
    
    -- Get invoice total
    SELECT (sub_total + tax_amount) INTO v_invoice_total
    FROM invoice
    WHERE invoice_id = NEW.invoice_id;
    
    -- Get total already claimed
    SELECT COALESCE(SUM(claim_amount), 0) INTO v_total_claimed
    FROM claim
    WHERE invoice_id = NEW.invoice_id;
    
    -- Check if new claim exceeds invoice amount
    IF (v_total_claimed + NEW.claim_amount) > v_invoice_total THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Total claim amount exceeds invoice total';
    END IF;
END$$

-- Trigger: Prevent consultation without completed appointment
DROP TRIGGER IF EXISTS trg_consultation_validate_appointment$$
CREATE TRIGGER trg_consultation_validate_appointment
BEFORE INSERT ON consultation_record
FOR EACH ROW
BEGIN
    DECLARE v_appointment_status VARCHAR(20);
    
    SELECT status INTO v_appointment_status
    FROM appointment
    WHERE appointment_id = NEW.appointment_id;
    
    IF v_appointment_status NOT IN ('Scheduled', 'Completed') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot create consultation for cancelled/no-show appointment';
    END IF;
END$$

-- Trigger: Validate employee salary on update
DROP TRIGGER IF EXISTS trg_employee_validate_salary$$
CREATE TRIGGER trg_employee_validate_salary
BEFORE UPDATE ON employee
FOR EACH ROW
BEGIN
    IF NEW.salary < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Employee salary cannot be negative';
    END IF;
    
    -- Prevent salary decrease by more than 20% (business rule)
    IF NEW.salary < (OLD.salary * 0.8) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Salary cannot be decreased by more than 20%';
    END IF;
END$$

-- Trigger: Validate prescription duration
DROP TRIGGER IF EXISTS trg_prescription_validate_duration$$
CREATE TRIGGER trg_prescription_validate_duration
BEFORE INSERT ON prescription_item
FOR EACH ROW
BEGIN
    IF NEW.duration_days IS NULL OR NEW.duration_days <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Prescription duration must be greater than 0 days';
    END IF;
    
    IF NEW.duration_days > 365 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Prescription duration cannot exceed 365 days';
    END IF;
END$$

-- Trigger: Validate payment doesn't exceed patient balance
DROP TRIGGER IF EXISTS trg_payment_validate_balance$$
CREATE TRIGGER trg_payment_validate_balance
BEFORE INSERT ON payment
FOR EACH ROW
BEGIN
    DECLARE v_balance DECIMAL(12,2);
    
    IF NEW.status = 'Completed' THEN
        SELECT total_balance INTO v_balance
        FROM patient_balance
        WHERE patient_id = NEW.patient_id;
        
        IF v_balance < NEW.amount_paid THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Payment amount exceeds patient balance';
        END IF;
    END IF;
END$$

DELIMITER ;