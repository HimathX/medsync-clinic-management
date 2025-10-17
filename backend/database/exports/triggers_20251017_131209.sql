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

DELIMITER ;
