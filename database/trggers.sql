-- ============================================
-- MedSync Triggers Export
-- Generated: 2025-10-17 13:12:09
-- ============================================

USE `medsync_db`;

DELIMITER $$

-- Trigger: validate_patient_age
DROP TRIGGER IF EXISTS `validate_patient_age`$$

CREATE DEFINER=`root`@`localhost` TRIGGER `validate_patient_age` BEFORE INSERT ON `patient` FOR EACH ROW BEGIN
    DECLARE patient_age INT;
    SELECT TIMESTAMPDIFF(YEAR, DOB, CURDATE()) INTO patient_age
    FROM user WHERE user_id = NEW.patient_id;
    
    IF patient_age < 18 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Patient must be at least 18 years old';
    END IF;
END$$

-- Trigger: Auto-deduct balance on completed payment insert
DROP TRIGGER IF EXISTS trg_payment_after_insert_balance_update$$

CREATE TRIGGER trg_payment_after_insert_balance_update 
AFTER INSERT ON payment
FOR EACH ROW
BEGIN
    DECLARE v_current_balance DECIMAL(12,2);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Rollback the whole INSERT if balance update fails
        ROLLBACK;
    END;
    
    -- Only for completed payments
    IF NEW.status = 'Completed' AND NEW.amount_paid > 0 THEN
        -- Lock and get current balance
        SELECT total_balance INTO v_current_balance 
        FROM patient_balance 
        WHERE patient_id = NEW.patient_id 
        FOR UPDATE;
        
        -- Prevent overpayment (optional: raise error if exceeds)
        IF v_current_balance < NEW.amount_paid THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment exceeds patient balance';
        END IF;
        
        -- Deduct
        UPDATE patient_balance 
        SET total_balance = total_balance - NEW.amount_paid 
        WHERE patient_id = NEW.patient_id;
    END IF;
END$$
DELIMITER ;


