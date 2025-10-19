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

DELIMITER ;




