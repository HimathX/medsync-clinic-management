-- ============================================
-- MedSync Stored Procedures Export
-- Generated: 2025-10-17 13:12:09
-- ============================================

USE `medsync_db`;

DELIMITER $$

-- Procedure: AddDoctorSpecialization
DROP PROCEDURE IF EXISTS `AddDoctorSpecialization`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `AddDoctorSpecialization`(
    IN p_doctor_id CHAR(36),
    IN p_specialization_id CHAR(36),
    IN p_certification_date DATE,
   
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    -- ALL DECLARE STATEMENTS MUST COME FIRST
    DECLARE v_doctor_exists INT DEFAULT 0;
    DECLARE v_specialization_exists INT DEFAULT 0;
    DECLARE v_duplicate_exists INT DEFAULT 0;
   
    -- Error handler (must be declared AFTER variables but BEFORE any SET/SELECT)
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
   
    -- NOW executable statements can start
    -- Initialize outputs
    SET p_success = FALSE;
    SET p_error_message = NULL;
   
    -- Start transaction
    START TRANSACTION;
   
    -- Validation: Check if doctor exists
    SELECT COUNT(*) INTO v_doctor_exists
    FROM doctor
    WHERE doctor_id = p_doctor_id;
   
    IF v_doctor_exists = 0 THEN
        SET p_error_message = 'Doctor not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Validation: Check if specialization exists
    SELECT COUNT(*) INTO v_specialization_exists
    FROM specialization
    WHERE specialization_id = p_specialization_id;
   
    IF v_specialization_exists = 0 THEN
        SET p_error_message = 'Specialization not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Validation: Check for duplicate (doctor + specialization)
    SELECT COUNT(*) INTO v_duplicate_exists
    FROM doctor_specialization
    WHERE doctor_id = p_doctor_id AND specialization_id = p_specialization_id;
   
    IF v_duplicate_exists > 0 THEN
        SET p_error_message = 'Specialization already assigned to this doctor';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Insert doctor_specialization
    INSERT INTO doctor_specialization (
        doctor_id, specialization_id, certification_date
    ) VALUES (
        p_doctor_id, p_specialization_id, p_certification_date
    );
   
    -- Success
    SET p_success = TRUE;
    SET p_error_message = 'Doctor specialization added successfully';
   
    COMMIT;
END proc_label$$

-- Procedure: AddMedication
DROP PROCEDURE IF EXISTS `AddMedication`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `AddMedication`(
    IN p_generic_name VARCHAR(50),
    IN p_manufacturer VARCHAR(50),
    IN p_form ENUM('Tablet','Capsule','Injection','Syrup','Other'),
    IN p_contraindications TEXT,
    IN p_side_effects TEXT,
    
    OUT p_medication_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    DECLARE v_medication_id CHAR(36);
    DECLARE v_duplicate_count INT DEFAULT 0;
    
    -- Error handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
    
    -- Initialize outputs
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_medication_id = NULL;
    
    START TRANSACTION;
    
    -- Validate required fields
    IF p_generic_name IS NULL OR TRIM(p_generic_name) = '' THEN
        SET p_error_message = 'Generic name is required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    IF p_manufacturer IS NULL OR TRIM(p_manufacturer) = '' THEN
        SET p_error_message = 'Manufacturer is required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    IF p_form IS NULL THEN
        SET p_error_message = 'Medication form is required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Check for duplicate medication (same generic name and manufacturer)
    SELECT COUNT(*) INTO v_duplicate_count
    FROM medication
    WHERE generic_name = p_generic_name 
    AND manufacturer = p_manufacturer
    AND form = p_form;
    
    IF v_duplicate_count > 0 THEN
        SET p_error_message = 'Medication with same generic name, manufacturer, and form already exists';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Generate UUID
    SET v_medication_id = UUID();
    
    -- Insert medication
    INSERT INTO medication (
        medication_id, 
        generic_name, 
        manufacturer, 
        form, 
        contraindications, 
        side_effects
    ) VALUES (
        v_medication_id,
        p_generic_name,
        p_manufacturer,
        p_form,
        p_contraindications,
        p_side_effects
    );
    
    -- Verify insert
    IF ROW_COUNT() != 1 THEN
        SET p_error_message = 'Failed to insert medication';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Success
    SET p_medication_id = v_medication_id;
    SET p_success = TRUE;
    SET p_error_message = 'Medication added successfully';
    
    COMMIT;
END proc_label$$

-- Procedure: AddPatientAllergy
DROP PROCEDURE IF EXISTS `AddPatientAllergy`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `AddPatientAllergy`(
    IN p_patient_id CHAR(36),
    IN p_allergy_name VARCHAR(50),
    IN p_severity ENUM('Mild', 'Moderate', 'Severe', 'Life-threatening'),
    IN p_reaction_description VARCHAR(200),
    IN p_diagnosed_date DATE,
   
    OUT p_patient_allergy_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    -- ALL DECLARE STATEMENTS MUST COME FIRST
    DECLARE v_patient_allergy_id CHAR(36);
    DECLARE v_patient_exists INT DEFAULT 0;
   
    -- Error handler (must be declared AFTER variables but BEFORE any SET/SELECT)
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
        SET p_patient_allergy_id = NULL;
    END;
    
    -- NOW executable statements can start
    -- Initialize outputs
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_patient_allergy_id = NULL;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Validation: Check if patient exists
    SELECT COUNT(*) INTO v_patient_exists 
    FROM patient 
    WHERE patient_id = p_patient_id;
    
    IF v_patient_exists = 0 THEN
        SET p_error_message = 'Patient not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validation: Check if allergy name is provided
    IF p_allergy_name IS NULL OR TRIM(p_allergy_name) = '' THEN
        SET p_error_message = 'Allergy name is required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validation: Check for duplicate allergy for this patient
    IF EXISTS (
        SELECT 1 FROM patient_allergy 
        WHERE patient_id = p_patient_id 
        AND LOWER(allergy_name) = LOWER(TRIM(p_allergy_name))
    ) THEN
        SET p_error_message = 'This allergy is already recorded for the patient';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Generate UUID for patient_allergy_id
    SET v_patient_allergy_id = UUID();
    
    -- Insert patient allergy record
    INSERT INTO patient_allergy (
        patient_allergy_id,
        patient_id,
        allergy_name,
        severity,
        reaction_description,
        diagnosed_date
    ) VALUES (
        v_patient_allergy_id,
        p_patient_id,
        TRIM(p_allergy_name),
        p_severity,
        TRIM(p_reaction_description),
        p_diagnosed_date
    );
    
    -- Success
    SET p_patient_allergy_id = v_patient_allergy_id;
    SET p_success = TRUE;
    SET p_error_message = 'Patient allergy added successfully';
    
    COMMIT;
    
END proc_label$$

-- Procedure: AddPatientCondition
DROP PROCEDURE IF EXISTS `AddPatientCondition`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `AddPatientCondition`(
    IN p_patient_id CHAR(36),
    IN p_condition_category_id CHAR(36),
    IN p_condition_name VARCHAR(50),
    IN p_diagnosed_date DATE,
    IN p_is_chronic BOOL,
    IN p_current_status ENUM('Active', 'In Treatment', 'Managed', 'Resolved'),
    IN p_notes TEXT,
   
    OUT p_condition_id CHAR(36),  -- Output the new condition_id created
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    -- ALL DECLARE STATEMENTS MUST COME FIRST
    DECLARE v_condition_id CHAR(36);
    DECLARE v_patient_exists INT DEFAULT 0;
    DECLARE v_category_exists INT DEFAULT 0;
   
    -- Error handler (must be declared AFTER variables but BEFORE any SET/SELECT)
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
   
    -- NOW executable statements can start
    -- Initialize outputs
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_condition_id = NULL;
   
    -- Start transaction
    START TRANSACTION;
   
    -- Validation: Check if patient exists
    SELECT COUNT(*) INTO v_patient_exists
    FROM patient
    WHERE patient_id = p_patient_id;
   
    IF v_patient_exists = 0 THEN
        SET p_error_message = 'Patient not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Validation: Check if category exists
    SELECT COUNT(*) INTO v_category_exists
    FROM conditions_category
    WHERE condition_category_id = p_condition_category_id;
   
    IF v_category_exists = 0 THEN
        SET p_error_message = 'Condition category not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Validation: Check required fields
    IF TRIM(p_condition_name) IS NULL OR TRIM(p_condition_name) = '' THEN
        SET p_error_message = 'Condition name is required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Always create a new condition for this patient_condition
    SET v_condition_id = UUID();
   
    -- Insert new condition dynamically
    INSERT INTO conditions (
        condition_id, condition_category_id, condition_name, description, severity
    ) VALUES (
        v_condition_id, p_condition_category_id, TRIM(p_condition_name), NULL, NULL  -- Description and severity optional
    );
   
    -- Insert patient_condition
    INSERT INTO patient_condition (
        patient_id, condition_id, diagnosed_date, is_chronic, current_status, notes
    ) VALUES (
        p_patient_id, v_condition_id, p_diagnosed_date, p_is_chronic, 
        COALESCE(p_current_status, 'Active'), TRIM(p_notes)
    );
   
    -- Success
    SET p_condition_id = v_condition_id;
    SET p_success = TRUE;
    SET p_error_message = 'Patient condition added successfully';
   
    COMMIT;
END proc_label$$

-- Procedure: AddPatientInsurance
DROP PROCEDURE IF EXISTS `AddPatientInsurance`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `AddPatientInsurance`(
    IN p_patient_id CHAR(36),
    IN p_insurance_package_id CHAR(36),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_status ENUM('Active', 'Inactive', 'Expired', 'Pending'),
   
    OUT p_insurance_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    -- ALL DECLARE STATEMENTS MUST COME FIRST
    DECLARE v_insurance_id CHAR(36);
    DECLARE v_patient_exists INT DEFAULT 0;
    DECLARE v_package_exists INT DEFAULT 0;
    DECLARE v_duplicate_exists INT DEFAULT 0;
   
    -- Error handler (must be declared AFTER variables but BEFORE any SET/SELECT)
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
   
    -- NOW executable statements can start
    -- Initialize outputs
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_insurance_id = NULL;
   
    -- Start transaction
    START TRANSACTION;
   
    -- Validation: Check if patient exists
    SELECT COUNT(*) INTO v_patient_exists
    FROM patient
    WHERE patient_id = p_patient_id;
   
    IF v_patient_exists = 0 THEN
        SET p_error_message = 'Patient not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Validation: Check if insurance package exists and is active
    SELECT COUNT(*) INTO v_package_exists
    FROM insurance_package
    WHERE insurance_package_id = p_insurance_package_id AND is_active = TRUE;
   
    IF v_package_exists = 0 THEN
        SET p_error_message = 'Insurance package not found or inactive';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Validation: Check required fields
    IF p_start_date IS NULL THEN
        SET p_error_message = 'Start date is required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    IF p_end_date IS NULL THEN
        SET p_error_message = 'End date is required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Validation: Check dates (end > start)
    IF p_end_date <= p_start_date THEN
        SET p_error_message = 'End date must be after start date';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Validation: Check for duplicate (patient + package)
    SELECT COUNT(*) INTO v_duplicate_exists
    FROM insurance
    WHERE patient_id = p_patient_id AND insurance_package_id = p_insurance_package_id;
   
    IF v_duplicate_exists > 0 THEN
        SET p_error_message = 'Insurance package already assigned to this patient';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Generate UUID
    SET v_insurance_id = UUID();
   
    -- Insert insurance
    INSERT INTO insurance (
        insurance_id, patient_id, insurance_package_id, status, start_date, end_date
    ) VALUES (
        v_insurance_id, p_patient_id, p_insurance_package_id, 
        COALESCE(p_status, 'Pending'), p_start_date, p_end_date
    );
   
    -- Success
    SET p_insurance_id = v_insurance_id;
    SET p_success = TRUE;
    SET p_error_message = 'Patient insurance added successfully';
   
    COMMIT;
END proc_label$$

-- Procedure: AddPrescriptionWithItems
DROP PROCEDURE IF EXISTS `AddPrescriptionWithItems`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `AddPrescriptionWithItems`(
    IN p_consultation_rec_id CHAR(36),
    IN p_prescription_items JSON,  -- Array of items with medication details
    
    OUT p_items_added INT,
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    DECLARE v_consultation_exists INT DEFAULT 0;
    DECLARE v_medication_exists INT DEFAULT 0;
    DECLARE v_item_count INT DEFAULT 0;
    DECLARE v_idx INT DEFAULT 0;
    DECLARE v_prescription_item_id CHAR(36);
    DECLARE v_medication_id CHAR(36);
    DECLARE v_dosage VARCHAR(50);
    DECLARE v_frequency VARCHAR(50);
    DECLARE v_duration_days INT;
    DECLARE v_instructions VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
    
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_items_added = 0;
    
    START TRANSACTION;
    
    -- Check if consultation record exists
    SELECT COUNT(*) INTO v_consultation_exists
    FROM consultation_record
    WHERE consultation_rec_id = p_consultation_rec_id;
    
    IF v_consultation_exists = 0 THEN
        SET p_error_message = 'Consultation record not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validate JSON array
    IF p_prescription_items IS NULL OR JSON_TYPE(p_prescription_items) != 'ARRAY' THEN
        SET p_error_message = 'Prescription items must be a valid JSON array';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    SET v_item_count = JSON_LENGTH(p_prescription_items);
    
    IF v_item_count = 0 THEN
        SET p_error_message = 'At least one prescription item is required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Process each prescription item
    SET v_idx = 0;
    WHILE v_idx < v_item_count DO
        -- Extract item data
        SET v_medication_id = JSON_UNQUOTE(JSON_EXTRACT(p_prescription_items, CONCAT('$[', v_idx, '].medication_id')));
        SET v_dosage = JSON_UNQUOTE(JSON_EXTRACT(p_prescription_items, CONCAT('$[', v_idx, '].dosage')));
        SET v_frequency = JSON_UNQUOTE(JSON_EXTRACT(p_prescription_items, CONCAT('$[', v_idx, '].frequency')));
        SET v_duration_days = JSON_EXTRACT(p_prescription_items, CONCAT('$[', v_idx, '].duration_days'));
        SET v_instructions = JSON_UNQUOTE(JSON_EXTRACT(p_prescription_items, CONCAT('$[', v_idx, '].instructions')));
        
        -- Validate medication exists
        SELECT COUNT(*) INTO v_medication_exists
        FROM medication
        WHERE medication_id = v_medication_id;
        
        IF v_medication_exists = 0 THEN
            SET p_error_message = CONCAT('Medication with ID ', v_medication_id, ' not found');
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        -- Validate required fields
        IF v_dosage IS NULL OR TRIM(v_dosage) = '' THEN
            SET p_error_message = CONCAT('Dosage is required for item ', v_idx + 1);
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        IF v_frequency IS NULL THEN
            SET p_error_message = CONCAT('Frequency is required for item ', v_idx + 1);
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        IF v_duration_days IS NULL OR v_duration_days <= 0 THEN
            SET p_error_message = CONCAT('Valid duration is required for item ', v_idx + 1);
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        -- Generate UUID for prescription item
        SET v_prescription_item_id = UUID();
        
        -- Insert prescription item
        INSERT INTO prescription_item (
            prescription_item_id,
            medication_id,
            consultation_rec_id,
            dosage,
            frequency,
            duration_days,
            instructions
        ) VALUES (
            v_prescription_item_id,
            v_medication_id,
            p_consultation_rec_id,
            TRIM(v_dosage),
            v_frequency,
            v_duration_days,
            TRIM(v_instructions)
        );
        
        SET p_items_added = p_items_added + 1;
        SET v_idx = v_idx + 1;
    END WHILE;
    
    SET p_success = TRUE;
    SET p_error_message = CONCAT('Successfully added ', p_items_added, ' prescription item(s)');
    
    COMMIT;
END proc_label$$

-- Procedure: AddTimeSlot
DROP PROCEDURE IF EXISTS `AddTimeSlot`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `AddTimeSlot`(
    IN p_doctor_id CHAR(36),
    IN p_branch_id CHAR(36),
    IN p_available_date DATE,
    IN p_start_time TIME,
    IN p_end_time TIME,
   
    OUT p_time_slot_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    -- ALL DECLARE STATEMENTS MUST COME FIRST
    DECLARE v_time_slot_id CHAR(36);
    DECLARE v_doctor_exists INT DEFAULT 0;
    DECLARE v_branch_exists INT DEFAULT 0;
   
    -- Error handler (must be declared AFTER variables but BEFORE any SET/SELECT)
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
   
    -- NOW executable statements can start
    -- Initialize outputs
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_time_slot_id = NULL;
   
    -- Start transaction
    START TRANSACTION;
   
    -- Validation: Check if doctor exists
    SELECT COUNT(*) INTO v_doctor_exists
    FROM doctor
    WHERE doctor_id = p_doctor_id;
   
    IF v_doctor_exists = 0 THEN
        SET p_error_message = 'Doctor not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Validation: Check if branch exists and is active
    SELECT COUNT(*) INTO v_branch_exists
    FROM branch
    WHERE branch_id = p_branch_id AND is_active = TRUE;
   
    IF v_branch_exists = 0 THEN
        SET p_error_message = 'Branch not found or inactive';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Validation: Check required fields
    IF p_available_date IS NULL THEN
        SET p_error_message = 'Available date is required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    IF p_start_time IS NULL THEN
        SET p_error_message = 'Start time is required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    IF p_end_time IS NULL THEN
        SET p_error_message = 'End time is required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Validation: Check end_time > start_time
    IF p_end_time <= p_start_time THEN
        SET p_error_message = 'End time must be after start time';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Generate UUID
    SET v_time_slot_id = UUID();
   
    -- Insert time slot
    INSERT INTO time_slot (
        time_slot_id, doctor_id, branch_id, available_date, 
        is_booked, start_time, end_time
    ) VALUES (
        v_time_slot_id, p_doctor_id, p_branch_id, p_available_date, 
        FALSE, p_start_time, p_end_time
    );
   
    -- Success
    SET p_time_slot_id = v_time_slot_id;
    SET p_success = TRUE;
    SET p_error_message = 'Time slot added successfully';
   
    COMMIT;
END proc_label$$

-- Procedure: AddTreatment
DROP PROCEDURE IF EXISTS `AddTreatment`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `AddTreatment`(
    IN p_consultation_rec_id CHAR(36),
    IN p_treatment_service_code CHAR(36),
    IN p_notes TEXT,
   
    OUT p_treatment_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    -- ALL DECLARE STATEMENTS MUST COME FIRST
    DECLARE v_treatment_id CHAR(36);
    DECLARE v_consultation_exists INT DEFAULT 0;
    DECLARE v_treatment_service_exists INT DEFAULT 0;
   
    -- Error handler (must be declared AFTER variables but BEFORE any SET/SELECT)
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
   
    -- NOW executable statements can start
    -- Initialize outputs
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_treatment_id = NULL;
   
    -- Start transaction
    START TRANSACTION;
   
    -- Validation: Check if consultation record exists
    SELECT COUNT(*) INTO v_consultation_exists
    FROM consultation_record
    WHERE consultation_rec_id = p_consultation_rec_id;
   
    IF v_consultation_exists = 0 THEN
        SET p_error_message = 'Consultation record not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Validation: Check if treatment service exists
    SELECT COUNT(*) INTO v_treatment_service_exists
    FROM treatment_catalogue
    WHERE treatment_service_code = p_treatment_service_code;
   
    IF v_treatment_service_exists = 0 THEN
        SET p_error_message = 'Treatment service not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Generate UUID
    SET v_treatment_id = UUID();
   
    -- Insert treatment
    INSERT INTO treatment (
        treatment_id, consultation_rec_id, treatment_service_code, notes
    ) VALUES (
        v_treatment_id, p_consultation_rec_id, p_treatment_service_code, 
        TRIM(p_notes)
    );
   
    -- Success
    SET p_treatment_id = v_treatment_id;
    SET p_success = TRUE;
    SET p_error_message = 'Treatment added successfully';
   
    COMMIT;
END proc_label$$

-- Procedure: AuthenticateUser
DROP PROCEDURE IF EXISTS `AuthenticateUser`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `AuthenticateUser`(
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255),
    OUT p_user_id CHAR(36),
    OUT p_user_type VARCHAR(20),
    OUT p_full_name VARCHAR(100),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    DECLARE v_stored_password VARCHAR(255);
    DECLARE v_user_count INT DEFAULT 0;
    DECLARE v_user_type_db VARCHAR(20);
    DECLARE v_employee_role VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 p_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_user_id = NULL;
        SET p_user_type = NULL;
        SET p_full_name = NULL;
    END;
    
    -- Initialize output parameters
    SET p_success = FALSE;
    SET p_user_id = NULL;
    SET p_user_type = NULL;
    SET p_full_name = NULL;
    SET p_error_message = NULL;
    
    -- Check if user exists
    SELECT COUNT(*) INTO v_user_count
    FROM user
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(p_email));
    
    IF v_user_count = 0 THEN
        SET p_error_message = 'Invalid email or password';
        LEAVE proc_label;
    END IF;
    
    -- Get user details - CHANGED: role -> user_type
    SELECT user_id, password_hash, user_type, full_name
    INTO p_user_id, v_stored_password, v_user_type_db, p_full_name
    FROM user
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(p_email));
    
    -- Verify password hash
    IF LOWER(TRIM(v_stored_password)) = LOWER(TRIM(p_password_hash)) THEN
        -- Password is correct
        SET p_success = TRUE;
        SET p_error_message = NULL;
        
        -- Determine specific user type based on user_type column
        IF v_user_type_db = 'patient' THEN
            -- Check if patient record exists
            SELECT COUNT(*) INTO v_user_count 
            FROM patient 
            WHERE patient_id = p_user_id;
            
            IF v_user_count = 0 THEN
                SET p_error_message = 'User account not properly configured - Patient record missing';
                SET p_success = FALSE;
                SET p_user_id = NULL;
                SET p_user_type = NULL;
                SET p_full_name = NULL;
                LEAVE proc_label;
            END IF;
            
            SET p_user_type = 'patient';
            
        ELSEIF v_user_type_db = 'employee' THEN
            -- Check if employee record exists and get role
            SELECT COUNT(*), MAX(role) INTO v_user_count, v_employee_role
            FROM employee
            WHERE employee_id = p_user_id;
            
            IF v_user_count = 0 THEN
                SET p_error_message = 'User account not properly configured - Employee record missing';
                SET p_success = FALSE;
                SET p_user_id = NULL;
                SET p_user_type = NULL;
                SET p_full_name = NULL;
                LEAVE proc_label;
            END IF;
            
            -- Check specific employee role
            IF v_employee_role = 'doctor' THEN
                SELECT COUNT(*) INTO v_user_count 
                FROM doctor 
                WHERE doctor_id = p_user_id;
                
                IF v_user_count = 0 THEN
                    SET p_error_message = 'User account not properly configured - Doctor record missing';
                    SET p_success = FALSE;
                    SET p_user_id = NULL;
                    SET p_user_type = NULL;
                    SET p_full_name = NULL;
                    LEAVE proc_label;
                END IF;
                
                SET p_user_type = 'doctor';
            ELSE
                -- For other staff (nurse, admin, receptionist, manager)
                SET p_user_type = v_employee_role;
            END IF;
        ELSE
            SET p_error_message = CONCAT('Invalid user type: ', COALESCE(v_user_type_db, 'NULL'));
            SET p_success = FALSE;
            SET p_user_id = NULL;
            SET p_user_type = NULL;
            SET p_full_name = NULL;
        END IF;
    ELSE
        -- Password is incorrect
        SET p_success = FALSE;
        SET p_error_message = 'Invalid email or password';
        SET p_user_id = NULL;
        SET p_user_type = NULL;
        SET p_full_name = NULL;
    END IF;
END proc_label$$

-- Procedure: BookAppointment
DROP PROCEDURE IF EXISTS `BookAppointment`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `BookAppointment`(
    IN p_patient_id CHAR(36),
    IN p_time_slot_id CHAR(36),
    IN p_notes TEXT,
    
    OUT p_appointment_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    DECLARE v_appointment_id CHAR(36);
    DECLARE v_slot_exists INT DEFAULT 0;
    DECLARE v_slot_booked TINYINT DEFAULT 0;
    DECLARE v_patient_exists INT DEFAULT 0;
    DECLARE v_slot_date DATE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
    
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_appointment_id = NULL;
    
    START TRANSACTION;
    
    SELECT COUNT(*) INTO v_patient_exists 
    FROM patient 
    WHERE patient_id = p_patient_id;
    
    IF v_patient_exists = 0 THEN
        SET p_error_message = 'Patient not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    SELECT COUNT(*) INTO v_slot_exists
    FROM time_slot 
    WHERE time_slot_id = p_time_slot_id;
    
    IF v_slot_exists = 0 THEN
        SET p_error_message = 'Time slot not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    SELECT 
        is_booked,
        available_date
    INTO v_slot_booked, v_slot_date
    FROM time_slot 
    WHERE time_slot_id = p_time_slot_id
    FOR UPDATE;
    
    IF v_slot_booked = 1 THEN
        SET p_error_message = 'Time slot already booked';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    IF v_slot_date < CURDATE() THEN
        SET p_error_message = 'Cannot book time slot in the past';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    SET v_appointment_id = UUID();
    
    UPDATE time_slot 
    SET is_booked = 1
    WHERE time_slot_id = p_time_slot_id;
    
    IF ROW_COUNT() != 1 THEN
        SET p_error_message = 'Failed to mark time slot as booked';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    INSERT INTO appointment (appointment_id, time_slot_id, patient_id, status, notes)
    VALUES (v_appointment_id, p_time_slot_id, p_patient_id, 'Scheduled', p_notes);
    
    IF ROW_COUNT() != 1 THEN
        SET p_error_message = 'Failed to create appointment record';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    SET p_appointment_id = v_appointment_id;
    SET p_success = TRUE;
    SET p_error_message = 'Appointment booked successfully';
    
    COMMIT;
END proc_label$$

-- Procedure: CreateConsultationWithDetails
DROP PROCEDURE IF EXISTS `CreateConsultationWithDetails`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `CreateConsultationWithDetails`(
    IN p_appointment_id CHAR(36),
    IN p_symptoms TEXT,
    IN p_diagnoses TEXT,
    IN p_follow_up_required BOOL,
    IN p_follow_up_date DATE,
    IN p_prescription_items JSON,  -- Array of prescription items
    IN p_treatments JSON,          -- Array of treatment codes
    
    OUT p_consultation_rec_id CHAR(36),
    OUT p_items_added INT,
    OUT p_treatments_added INT,
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    DECLARE v_consultation_rec_id CHAR(36);
    DECLARE v_appointment_exists INT DEFAULT 0;
    DECLARE v_appointment_status VARCHAR(20);
    DECLARE v_consultation_exists INT DEFAULT 0;
    DECLARE v_medication_exists INT DEFAULT 0;
    DECLARE v_treatment_exists INT DEFAULT 0;
    DECLARE v_item_count INT DEFAULT 0;
    DECLARE v_treatment_count INT DEFAULT 0;
    DECLARE v_idx INT DEFAULT 0;
    DECLARE v_prescription_item_id CHAR(36);
    DECLARE v_treatment_id CHAR(36);
    DECLARE v_medication_id CHAR(36);
    DECLARE v_treatment_code CHAR(36);
    DECLARE v_dosage VARCHAR(50);
    DECLARE v_frequency VARCHAR(50);
    DECLARE v_duration_days INT;
    DECLARE v_instructions VARCHAR(500);
    DECLARE v_treatment_notes TEXT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
    
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_consultation_rec_id = NULL;
    SET p_items_added = 0;
    SET p_treatments_added = 0;
    
    START TRANSACTION;
    
    -- Check if appointment exists
    SELECT COUNT(*), MAX(status) INTO v_appointment_exists, v_appointment_status
    FROM appointment
    WHERE appointment_id = p_appointment_id;
    
    IF v_appointment_exists = 0 THEN
        SET p_error_message = 'Appointment not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Check if appointment is in valid status
    IF v_appointment_status = 'Cancelled' THEN
        SET p_error_message = 'Cannot create consultation for cancelled appointment';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Check if consultation already exists for this appointment
    SELECT COUNT(*) INTO v_consultation_exists
    FROM consultation_record
    WHERE appointment_id = p_appointment_id;
    
    IF v_consultation_exists > 0 THEN
        SET p_error_message = 'Consultation record already exists for this appointment';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validate required fields
    IF p_symptoms IS NULL OR TRIM(p_symptoms) = '' THEN
        SET p_error_message = 'Symptoms are required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    IF p_diagnoses IS NULL OR TRIM(p_diagnoses) = '' THEN
        SET p_error_message = 'Diagnoses are required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    IF p_follow_up_required = TRUE AND p_follow_up_date IS NULL THEN
        SET p_error_message = 'Follow-up date is required when follow-up is needed';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Generate UUID for consultation record
    SET v_consultation_rec_id = UUID();
    
    -- Insert consultation record
    INSERT INTO consultation_record (
        consultation_rec_id, appointment_id, symptoms, diagnoses, 
        follow_up_required, follow_up_date
    ) VALUES (
        v_consultation_rec_id, p_appointment_id, TRIM(p_symptoms), 
        TRIM(p_diagnoses), p_follow_up_required, p_follow_up_date
    );
    
    -- Update appointment status to Completed
    UPDATE appointment 
    SET status = 'Completed' 
    WHERE appointment_id = p_appointment_id;
    
    -- Process prescription items if provided
    IF p_prescription_items IS NOT NULL AND JSON_LENGTH(p_prescription_items) > 0 THEN
        IF JSON_TYPE(p_prescription_items) != 'ARRAY' THEN
            SET p_error_message = 'Prescription items must be a valid JSON array';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        SET v_item_count = JSON_LENGTH(p_prescription_items);
        SET v_idx = 0;
        
        WHILE v_idx < v_item_count DO
            SET v_medication_id = JSON_UNQUOTE(JSON_EXTRACT(p_prescription_items, CONCAT('$[', v_idx, '].medication_id')));
            SET v_dosage = JSON_UNQUOTE(JSON_EXTRACT(p_prescription_items, CONCAT('$[', v_idx, '].dosage')));
            SET v_frequency = JSON_UNQUOTE(JSON_EXTRACT(p_prescription_items, CONCAT('$[', v_idx, '].frequency')));
            SET v_duration_days = JSON_EXTRACT(p_prescription_items, CONCAT('$[', v_idx, '].duration_days'));
            SET v_instructions = JSON_UNQUOTE(JSON_EXTRACT(p_prescription_items, CONCAT('$[', v_idx, '].instructions')));
            
            -- Validate medication exists
            SELECT COUNT(*) INTO v_medication_exists FROM medication WHERE medication_id = v_medication_id;
            IF v_medication_exists = 0 THEN
                SET p_error_message = CONCAT('Medication with ID ', v_medication_id, ' not found');
                ROLLBACK;
                LEAVE proc_label;
            END IF;
            
            -- Validate required fields
            IF v_dosage IS NULL OR TRIM(v_dosage) = '' THEN
                SET p_error_message = CONCAT('Dosage is required for prescription item ', v_idx + 1);
                ROLLBACK;
                LEAVE proc_label;
            END IF;
            
            IF v_frequency IS NULL THEN
                SET p_error_message = CONCAT('Frequency is required for prescription item ', v_idx + 1);
                ROLLBACK;
                LEAVE proc_label;
            END IF;
            
            IF v_duration_days IS NULL OR v_duration_days <= 0 THEN
                SET p_error_message = CONCAT('Valid duration is required for prescription item ', v_idx + 1);
                ROLLBACK;
                LEAVE proc_label;
            END IF;
            
            SET v_prescription_item_id = UUID();
            
            INSERT INTO prescription_item (
                prescription_item_id, medication_id, consultation_rec_id, 
                dosage, frequency, duration_days, instructions
            ) VALUES (
                v_prescription_item_id, v_medication_id, v_consultation_rec_id, 
                TRIM(v_dosage), v_frequency, v_duration_days, TRIM(v_instructions)
            );
            
            SET p_items_added = p_items_added + 1;
            SET v_idx = v_idx + 1;
        END WHILE;
    END IF;
    
    -- Process treatments if provided
    IF p_treatments IS NOT NULL AND JSON_LENGTH(p_treatments) > 0 THEN
        IF JSON_TYPE(p_treatments) != 'ARRAY' THEN
            SET p_error_message = 'Treatments must be a valid JSON array';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        SET v_treatment_count = JSON_LENGTH(p_treatments);
        SET v_idx = 0;
        
        WHILE v_idx < v_treatment_count DO
            SET v_treatment_code = JSON_UNQUOTE(JSON_EXTRACT(p_treatments, CONCAT('$[', v_idx, '].treatment_service_code')));
            SET v_treatment_notes = JSON_UNQUOTE(JSON_EXTRACT(p_treatments, CONCAT('$[', v_idx, '].notes')));
            
            -- Validate treatment exists
            SELECT COUNT(*) INTO v_treatment_exists 
            FROM treatment_catalogue 
            WHERE treatment_service_code = v_treatment_code;
            
            IF v_treatment_exists = 0 THEN
                SET p_error_message = CONCAT('Treatment with code ', v_treatment_code, ' not found');
                ROLLBACK;
                LEAVE proc_label;
            END IF;
            
            SET v_treatment_id = UUID();
            
            INSERT INTO treatment (
                treatment_id, consultation_rec_id, treatment_service_code, notes
            ) VALUES (
                v_treatment_id, v_consultation_rec_id, v_treatment_code, TRIM(v_treatment_notes)
            );
            
            SET p_treatments_added = p_treatments_added + 1;
            SET v_idx = v_idx + 1;
        END WHILE;
    END IF;
    
    -- Success
    SET p_consultation_rec_id = v_consultation_rec_id;
    SET p_success = TRUE;
    SET p_error_message = CONCAT(
        'Consultation created successfully with ',
        p_items_added, ' prescription item(s) and ',
        p_treatments_added, ' treatment(s)'
    );
    
    COMMIT;
END proc_label$$

-- Procedure: CreateTimeSlot
DROP PROCEDURE IF EXISTS `CreateTimeSlot`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `CreateTimeSlot`(
    IN p_doctor_id CHAR(36),
    IN p_branch_id CHAR(36),
    IN p_available_date DATE,
    IN p_start_time TIME,
    IN p_end_time TIME,
    OUT p_time_slot_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    -- ...existing code from AddTimeSlot...
    DECLARE v_time_slot_id CHAR(36);
    DECLARE v_doctor_exists INT DEFAULT 0;
    DECLARE v_branch_exists INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_time_slot_id = NULL;
    START TRANSACTION;
    SELECT COUNT(*) INTO v_doctor_exists FROM doctor WHERE doctor_id = p_doctor_id;
    IF v_doctor_exists = 0 THEN
        SET p_error_message = 'Doctor not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    SELECT COUNT(*) INTO v_branch_exists FROM branch WHERE branch_id = p_branch_id AND is_active = TRUE;
    IF v_branch_exists = 0 THEN
        SET p_error_message = 'Branch not found or inactive';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    IF p_available_date IS NULL THEN
        SET p_error_message = 'Available date is required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    IF p_start_time IS NULL THEN
        SET p_error_message = 'Start time is required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    IF p_end_time IS NULL THEN
        SET p_error_message = 'End time is required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    IF p_end_time <= p_start_time THEN
        SET p_error_message = 'End time must be after start time';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    SET v_time_slot_id = UUID();
    INSERT INTO time_slot (
        time_slot_id, doctor_id, branch_id, available_date, 
        is_booked, start_time, end_time
    ) VALUES (
        v_time_slot_id, p_doctor_id, p_branch_id, p_available_date, 
        FALSE, p_start_time, p_end_time
    );
    SET p_time_slot_id = v_time_slot_id;
    SET p_success = TRUE;
    SET p_error_message = 'Time slot added successfully';
    COMMIT;
END proc_label$$

-- Procedure: DeactivateStaff
DROP PROCEDURE IF EXISTS `DeactivateStaff`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `DeactivateStaff`(
    IN p_employee_id CHAR(36),
    
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    DECLARE v_employee_exists INT DEFAULT 0;
    DECLARE v_role VARCHAR(50);
    DECLARE v_branch_id CHAR(36);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
    
    SET p_success = FALSE;
    SET p_error_message = NULL;
    
    START TRANSACTION;
    
    -- Check if employee exists and get role
    SELECT COUNT(*), role, branch_id INTO v_employee_exists, v_role, v_branch_id
    FROM employee
    WHERE employee_id = p_employee_id AND is_active = TRUE
    LIMIT 1;
    
    IF v_employee_exists = 0 THEN
        SET p_error_message = 'Employee not found or already inactive';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Deactivate employee
    UPDATE employee
    SET is_active = FALSE
    WHERE employee_id = p_employee_id;
    
    -- If manager, clear branch manager_id
    IF v_role = 'manager' THEN
        UPDATE branch
        SET manager_id = NULL
        WHERE branch_id = v_branch_id AND manager_id = p_employee_id;
    END IF;
    
    -- If doctor, mark as unavailable
    IF v_role = 'doctor' THEN
        UPDATE doctor
        SET is_available = FALSE
        WHERE doctor_id = p_employee_id;
    END IF;
    
    SET p_success = TRUE;
    SET p_error_message = 'Staff member deactivated successfully';
    
    COMMIT;
END proc_label$$

-- Procedure: GetStaffByBranch
DROP PROCEDURE IF EXISTS `GetStaffByBranch`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetStaffByBranch`(
    IN p_branch_name VARCHAR(50),
    IN p_role VARCHAR(50),              -- Optional: filter by role (NULL for all)
    IN p_active_only BOOLEAN,           -- TRUE to get only active staff
    IN p_limit INT,                     -- Pagination limit
    IN p_offset INT                     -- Pagination offset
)
proc_label: BEGIN
    DECLARE v_branch_id CHAR(36);
    DECLARE v_total_count INT DEFAULT 0;
    
    -- Get branch_id from branch_name
    SELECT branch_id INTO v_branch_id
    FROM branch
    WHERE branch_name = TRIM(p_branch_name)
    LIMIT 1;
    
    IF v_branch_id IS NULL THEN
        -- Return error result
        SELECT 
            FALSE as success,
            'Branch not found' as error_message,
            0 as total_count,
            NULL as employee_id,
            NULL as branch_id,
            NULL as role,
            NULL as salary,
            NULL as joined_date,
            NULL as is_active,
            NULL as full_name,
            NULL as email,
            NULL as NIC,
            NULL as gender,
            NULL as DOB,
            NULL as branch_name,
            NULL as contact_num1,
            NULL as contact_num2,
            NULL as address_line1,
            NULL as address_line2,
            NULL as city,
            NULL as province,
            NULL as postal_code,
            NULL as country;
        LEAVE proc_label;
    END IF;
    
    -- Get total count (for pagination)
    IF p_role IS NOT NULL AND p_role != '' THEN
        IF p_active_only THEN
            SELECT COUNT(*) INTO v_total_count
            FROM employee e
            JOIN user u ON e.employee_id = u.user_id
            WHERE e.branch_id = v_branch_id 
              AND e.role = p_role
              AND e.is_active = TRUE;
        ELSE
            SELECT COUNT(*) INTO v_total_count
            FROM employee e
            JOIN user u ON e.employee_id = u.user_id
            WHERE e.branch_id = v_branch_id 
              AND e.role = p_role;
        END IF;
    ELSE
        IF p_active_only THEN
            SELECT COUNT(*) INTO v_total_count
            FROM employee e
            WHERE e.branch_id = v_branch_id 
              AND e.is_active = TRUE;
        ELSE
            SELECT COUNT(*) INTO v_total_count
            FROM employee e
            WHERE e.branch_id = v_branch_id;
        END IF;
    END IF;
    
    -- Return staff data with metadata
    IF p_role IS NOT NULL AND p_role != '' THEN
        IF p_active_only THEN
            SELECT 
                TRUE as success,
                'Staff retrieved successfully' as error_message,
                v_total_count as total_count,
                e.employee_id,
                e.branch_id,
                e.role,
                e.salary,
                e.joined_date,
                e.is_active,
                u.full_name,
                u.email,
                u.NIC,
                u.gender,
                u.DOB,
                b.branch_name,
                c.contact_num1,
                c.contact_num2,
                a.address_line1,
                a.address_line2,
                a.city,
                a.province,
                a.postal_code,
                a.country
            FROM employee e
            JOIN user u ON e.employee_id = u.user_id
            JOIN branch b ON e.branch_id = b.branch_id
            LEFT JOIN contact c ON u.contact_id = c.contact_id
            LEFT JOIN address a ON u.address_id = a.address_id
            WHERE e.branch_id = v_branch_id 
              AND e.role = p_role
              AND e.is_active = TRUE
            ORDER BY u.full_name
            LIMIT p_limit OFFSET p_offset;
        ELSE
            SELECT 
                TRUE as success,
                'Staff retrieved successfully' as error_message,
                v_total_count as total_count,
                e.employee_id,
                e.branch_id,
                e.role,
                e.salary,
                e.joined_date,
                e.is_active,
                u.full_name,
                u.email,
                u.NIC,
                u.gender,
                u.DOB,
                b.branch_name,
                c.contact_num1,
                c.contact_num2,
                a.address_line1,
                a.address_line2,
                a.city,
                a.province,
                a.postal_code,
                a.country
            FROM employee e
            JOIN user u ON e.employee_id = u.user_id
            JOIN branch b ON e.branch_id = b.branch_id
            LEFT JOIN contact c ON u.contact_id = c.contact_id
            LEFT JOIN address a ON u.address_id = a.address_id
            WHERE e.branch_id = v_branch_id 
              AND e.role = p_role
            ORDER BY u.full_name
            LIMIT p_limit OFFSET p_offset;
        END IF;
    ELSE
        IF p_active_only THEN
            SELECT 
                TRUE as success,
                'Staff retrieved successfully' as error_message,
                v_total_count as total_count,
                e.employee_id,
                e.branch_id,
                e.role,
                e.salary,
                e.joined_date,
                e.is_active,
                u.full_name,
                u.email,
                u.NIC,
                u.gender,
                u.DOB,
                b.branch_name,
                c.contact_num1,
                c.contact_num2,
                a.address_line1,
                a.address_line2,
                a.city,
                a.province,
                a.postal_code,
                a.country
            FROM employee e
            JOIN user u ON e.employee_id = u.user_id
            JOIN branch b ON e.branch_id = b.branch_id
            LEFT JOIN contact c ON u.contact_id = c.contact_id
            LEFT JOIN address a ON u.address_id = a.address_id
            WHERE e.branch_id = v_branch_id 
              AND e.is_active = TRUE
            ORDER BY u.full_name
            LIMIT p_limit OFFSET p_offset;
        ELSE
            SELECT 
                TRUE as success,
                'Staff retrieved successfully' as error_message,
                v_total_count as total_count,
                e.employee_id,
                e.branch_id,
                e.role,
                e.salary,
                e.joined_date,
                e.is_active,
                u.full_name,
                u.email,
                u.NIC,
                u.gender,
                u.DOB,
                b.branch_name,
                c.contact_num1,
                c.contact_num2,
                a.address_line1,
                a.address_line2,
                a.city,
                a.province,
                a.postal_code,
                a.country
            FROM employee e
            JOIN user u ON e.employee_id = u.user_id
            JOIN branch b ON e.branch_id = b.branch_id
            LEFT JOIN contact c ON u.contact_id = c.contact_id
            LEFT JOIN address a ON u.address_id = a.address_id
            WHERE e.branch_id = v_branch_id
            ORDER BY u.full_name
            LIMIT p_limit OFFSET p_offset;
        END IF;
    END IF;
    
END proc_label$$

-- Procedure: RegisterDoctor
DROP PROCEDURE IF EXISTS `RegisterDoctor`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `RegisterDoctor`(
    -- Address inputs
    IN p_address_line1 VARCHAR(50),
    IN p_address_line2 VARCHAR(50),
    IN p_city VARCHAR(50),
    IN p_province VARCHAR(50),
    IN p_postal_code VARCHAR(20),
    IN p_country VARCHAR(50),
    
    -- Contact inputs
    IN p_contact_num1 VARCHAR(20),
    IN p_contact_num2 VARCHAR(20),
    
    -- User inputs
    IN p_full_name VARCHAR(255),
    IN p_NIC VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_gender ENUM('Male', 'Female', 'Other'),
    IN p_DOB DATE,
    IN p_password_hash VARCHAR(64),
    
    -- Employee inputs
    IN p_branch_name VARCHAR(50),
    IN p_salary DECIMAL(10,2),
    IN p_joined_date DATE,
    
    -- Doctor inputs
    IN p_room_no VARCHAR(5),
    IN p_medical_licence_no VARCHAR(50),
    IN p_consultation_fee DECIMAL(10,2),
    IN p_specialization_ids JSON,  -- Array of specialization IDs
    
    -- Outputs
    OUT p_user_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    -- All DECLARE statements must come first
    DECLARE v_address_id CHAR(36);
    DECLARE v_contact_id CHAR(36);
    DECLARE v_user_id CHAR(36);
    DECLARE v_branch_id CHAR(36);
    DECLARE v_email_exists INT DEFAULT 0;
    DECLARE v_nic_exists INT DEFAULT 0;
    DECLARE v_licence_exists INT DEFAULT 0;
    DECLARE v_room_taken INT DEFAULT 0;
    DECLARE v_spec_count INT DEFAULT 0;
    DECLARE v_spec_exists INT DEFAULT 0;
    DECLARE v_idx INT DEFAULT 0;
    DECLARE v_spec_id CHAR(36);
    
    -- Error handler must also be declared here
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
        SET p_user_id = NULL;
    END;
    
    -- Initialize outputs (now after all DECLAREs)
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_user_id = NULL;
    
    START TRANSACTION;
    
    -- Validation: Get branch_id
    SELECT branch_id INTO v_branch_id 
    FROM branch 
    WHERE branch_name = p_branch_name AND is_active = TRUE
    LIMIT 1;
    
    IF v_branch_id IS NULL THEN
        SET p_error_message = 'Branch not found or inactive';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validation: Check duplicate email
    SELECT COUNT(*) INTO v_email_exists 
    FROM user 
    WHERE email = p_email;
    
    IF v_email_exists > 0 THEN
        SET p_error_message = 'Email already registered';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validation: Check duplicate NIC
    SELECT COUNT(*) INTO v_nic_exists 
    FROM user 
    WHERE NIC = p_NIC;
    
    IF v_nic_exists > 0 THEN
        SET p_error_message = 'NIC already registered';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validation: Check duplicate medical licence
    SELECT COUNT(*) INTO v_licence_exists 
    FROM doctor 
    WHERE medical_licence_no = p_medical_licence_no;
    
    IF v_licence_exists > 0 THEN
        SET p_error_message = 'Medical licence already registered';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validation: Check if room is already occupied
    IF p_room_no IS NOT NULL THEN
        SELECT COUNT(*) INTO v_room_taken
        FROM doctor d
        INNER JOIN employee e ON d.doctor_id = e.employee_id
        WHERE d.room_no = p_room_no 
        AND e.branch_id = v_branch_id 
        AND e.is_active = TRUE;
        
        IF v_room_taken > 0 THEN
            SET p_error_message = CONCAT('Room ', p_room_no, ' is already occupied');
            ROLLBACK;
            LEAVE proc_label;
        END IF;
    END IF;
    
    -- Validation: Consultation fee
    IF p_consultation_fee < 0 THEN
        SET p_error_message = 'Consultation fee cannot be negative';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Generate UUIDs
    SET v_address_id = UUID();
    SET v_contact_id = UUID();
    SET v_user_id = UUID();
    
    -- Insert address
    INSERT INTO address (
        address_id, address_line1, address_line2, city, province, postal_code, country
    ) VALUES (
        v_address_id, 
        TRIM(p_address_line1), 
        TRIM(p_address_line2), 
        TRIM(p_city), 
        TRIM(p_province), 
        TRIM(p_postal_code), 
        COALESCE(TRIM(p_country), 'Sri Lanka')
    );
    
    -- Insert contact
    INSERT INTO contact (contact_id, contact_num1, contact_num2) 
    VALUES (v_contact_id, TRIM(p_contact_num1), TRIM(p_contact_num2));
    
    -- Insert user with user_type = 'doctor' (CHANGED HERE!)
    INSERT INTO user (
        user_id, address_id, user_type, full_name, NIC, email, gender, DOB, 
        contact_id, password_hash
    ) VALUES (
        v_user_id, v_address_id, 'doctor', TRIM(p_full_name), TRIM(p_NIC), 
        LOWER(TRIM(p_email)), p_gender, p_DOB, v_contact_id, p_password_hash
    );
    
    -- Insert employee
    INSERT INTO employee (employee_id, branch_id, role, salary, joined_date, is_active) 
    VALUES (v_user_id, v_branch_id, 'doctor', p_salary, p_joined_date, TRUE);
    
    -- Insert doctor
    INSERT INTO doctor (doctor_id, room_no, medical_licence_no, consultation_fee, is_available) 
    VALUES (v_user_id, p_room_no, TRIM(p_medical_licence_no), p_consultation_fee, TRUE);
    
    -- Insert specializations if provided
    IF p_specialization_ids IS NOT NULL AND JSON_LENGTH(p_specialization_ids) > 0 THEN
        IF JSON_TYPE(p_specialization_ids) != 'ARRAY' THEN
            SET p_error_message = 'Specialization IDs must be a valid JSON array';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        SET v_spec_count = JSON_LENGTH(p_specialization_ids);
        SET v_idx = 0;
        
        WHILE v_idx < v_spec_count DO
            SET v_spec_id = JSON_UNQUOTE(JSON_EXTRACT(p_specialization_ids, CONCAT('$[', v_idx, ']')));
            
            -- Validate specialization exists
            SELECT COUNT(*) INTO v_spec_exists FROM specialization WHERE specialization_id = v_spec_id;
            IF v_spec_exists = 0 THEN
                SET p_error_message = CONCAT('Specialization ID ', v_spec_id, ' not found');
                ROLLBACK;
                LEAVE proc_label;
            END IF;
            
            INSERT INTO doctor_specialization (doctor_id, specialization_id, certification_date)
            VALUES (v_user_id, v_spec_id, p_joined_date);
            
            SET v_idx = v_idx + 1;
        END WHILE;
    END IF;
    
    -- Success
    SET p_user_id = v_user_id;
    SET p_success = TRUE;
    SET p_error_message = 'Doctor registered successfully';
    
    COMMIT;
END proc_label$$

-- Procedure: RegisterEmployee
DROP PROCEDURE IF EXISTS `RegisterEmployee`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `RegisterEmployee`(
    -- Address inputs
    IN p_address_line1 VARCHAR(50),
    IN p_address_line2 VARCHAR(50),
    IN p_city VARCHAR(50),
    IN p_province VARCHAR(50),
    IN p_postal_code VARCHAR(20),
    IN p_country VARCHAR(50),
    
    -- Contact inputs
    IN p_contact_num1 VARCHAR(20),
    IN p_contact_num2 VARCHAR(20),
    
    -- User inputs
    IN p_full_name VARCHAR(255),
    IN p_NIC VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_gender ENUM('Male', 'Female', 'Other'),
    IN p_DOB DATE,
    IN p_password_hash VARCHAR(64),
    
    -- Employee inputs
    IN p_branch_name VARCHAR(50),
    IN p_role ENUM('doctor', 'nurse', 'admin', 'receptionist', 'manager'),
    IN p_salary DECIMAL(10,2),
    IN p_joined_date DATE,
    
    -- Outputs
    OUT p_user_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    DECLARE v_address_id CHAR(36);
    DECLARE v_contact_id CHAR(36);
    DECLARE v_user_id CHAR(36);
    DECLARE v_branch_id CHAR(36);
    DECLARE v_email_exists INT DEFAULT 0;
    DECLARE v_nic_exists INT DEFAULT 0;
    DECLARE v_manager_exists INT DEFAULT 0;
    
    -- Error handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
    
    -- Initialize outputs
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_user_id = NULL;
    
    START TRANSACTION;
    
    -- Validation: Get branch_id
    SELECT branch_id INTO v_branch_id 
    FROM branch 
    WHERE branch_name = p_branch_name AND is_active = TRUE
    LIMIT 1;
    
    IF v_branch_id IS NULL THEN
        SET p_error_message = 'Branch not found or inactive';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validation: Check for duplicate email
    SELECT COUNT(*) INTO v_email_exists 
    FROM user 
    WHERE email = p_email;
    
    IF v_email_exists > 0 THEN
        SET p_error_message = 'Email already registered';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validation: Check for duplicate NIC
    SELECT COUNT(*) INTO v_nic_exists 
    FROM user 
    WHERE NIC = p_NIC;
    
    IF v_nic_exists > 0 THEN
        SET p_error_message = 'NIC already registered';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validation: Check if branch already has a manager
    IF p_role = 'manager' THEN
        SELECT COUNT(*) INTO v_manager_exists
        FROM employee
        WHERE branch_id = v_branch_id AND role = 'manager' AND is_active = TRUE;
        
        IF v_manager_exists > 0 THEN
            SET p_error_message = 'Branch already has an active manager';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
    END IF;
    
    -- Validation: Salary check
    IF p_salary <= 0 THEN
        SET p_error_message = 'Salary must be greater than zero';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validation: Joined date
    IF p_joined_date > CURDATE() THEN
        SET p_error_message = 'Joined date cannot be in the future';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Generate UUIDs
    SET v_address_id = UUID();
    SET v_contact_id = UUID();
    SET v_user_id = UUID();
    
    -- Insert address
    INSERT INTO address (
        address_id, address_line1, address_line2, city, province, postal_code, country
    ) VALUES (
        v_address_id, 
        TRIM(p_address_line1), 
        TRIM(p_address_line2), 
        TRIM(p_city), 
        TRIM(p_province), 
        TRIM(p_postal_code), 
        COALESCE(TRIM(p_country), 'Sri Lanka')
    );
    
    -- Insert contact
    INSERT INTO contact (contact_id, contact_num1, contact_num2) 
    VALUES (v_contact_id, TRIM(p_contact_num1), TRIM(p_contact_num2));
    
    -- Insert user
    INSERT INTO user (
        user_id, address_id, user_type, full_name, NIC, email, gender, DOB, 
        contact_id, password_hash
    ) VALUES (
        v_user_id, v_address_id, 'employee', TRIM(p_full_name), TRIM(p_NIC), 
        LOWER(TRIM(p_email)), p_gender, p_DOB, v_contact_id, p_password_hash
    );
    
    -- Insert employee
    INSERT INTO employee (employee_id, branch_id, role, salary, joined_date, is_active) 
    VALUES (v_user_id, v_branch_id, p_role, p_salary, p_joined_date, TRUE);
    
    -- If manager, update branch
    IF p_role = 'manager' THEN
        UPDATE branch 
        SET manager_id = v_user_id 
        WHERE branch_id = v_branch_id;
    END IF;
    
    -- Success
    SET p_user_id = v_user_id;
    SET p_success = TRUE;
    SET p_error_message = 'Employee registered successfully';
    
    COMMIT;
END proc_label$$

-- Procedure: RegisterPatient
DROP PROCEDURE IF EXISTS `RegisterPatient`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `RegisterPatient`(
    -- Address inputs
    IN p_address_line1 VARCHAR(50),
    IN p_address_line2 VARCHAR(50),
    IN p_city VARCHAR(50),
    IN p_province VARCHAR(50),
    IN p_postal_code VARCHAR(20),
    IN p_country VARCHAR(50),
   
    -- Contact inputs
    IN p_contact_num1 VARCHAR(20),
    IN p_contact_num2 VARCHAR(20),
   
    -- User inputs
    IN p_full_name VARCHAR(255),
    IN p_NIC VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_gender ENUM('Male', 'Female', 'Other'),
    IN p_DOB DATE,
    IN p_password_hash VARCHAR(255),
    
    -- Patient inputs
    IN p_blood_group ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'),
    IN p_registered_branch_name VARCHAR(50),
   
    -- Outputs
    OUT p_user_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    DECLARE v_address_id CHAR(36);
    DECLARE v_contact_id CHAR(36);
    DECLARE v_user_id CHAR(36);
    DECLARE v_branch_id CHAR(36);
    DECLARE v_email_exists INT DEFAULT 0;
    DECLARE v_nic_exists INT DEFAULT 0;
   
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
   
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_user_id = NULL;
   
    START TRANSACTION;
    
    -- Updated password hash validation for SHA-256 (64 chars)
    IF LENGTH(p_password_hash) != 64 THEN
        SET p_error_message = 'Invalid password hash format';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    SELECT branch_id INTO v_branch_id 
    FROM branch 
    WHERE branch_name = TRIM(p_registered_branch_name) AND is_active = TRUE;
    
    IF v_branch_id IS NULL THEN
        SET p_error_message = 'Invalid or inactive branch';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    SELECT COUNT(*) INTO v_email_exists
    FROM user
    WHERE email = LOWER(TRIM(p_email));
   
    IF v_email_exists > 0 THEN
        SET p_error_message = 'Email already registered';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    SELECT COUNT(*) INTO v_nic_exists
    FROM user
    WHERE NIC = TRIM(p_NIC);
   
    IF v_nic_exists > 0 THEN
        SET p_error_message = 'NIC already registered';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    IF TIMESTAMPDIFF(YEAR, p_DOB, CURDATE()) < 18 THEN
        SET p_error_message = 'Patient must be at least 18 years old';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    SET v_address_id = UUID();
    SET v_contact_id = UUID();
    SET v_user_id = UUID();
   
    INSERT INTO address (
        address_id, address_line1, address_line2, city, province, postal_code, country
    ) VALUES (
        v_address_id,
        TRIM(p_address_line1),
        TRIM(p_address_line2),
        TRIM(p_city),
        TRIM(p_province),
        TRIM(p_postal_code),
        COALESCE(TRIM(p_country), 'Sri Lanka')
    );
   
    INSERT INTO contact (contact_id, contact_num1, contact_num2)
    VALUES (v_contact_id, TRIM(p_contact_num1), TRIM(p_contact_num2));
    
    INSERT INTO user (
        user_id, address_id, user_type, full_name, NIC, email, gender, DOB,
        contact_id, password_hash
    ) VALUES (
        v_user_id, v_address_id, 'patient', TRIM(p_full_name), TRIM(p_NIC),
        LOWER(TRIM(p_email)), p_gender, p_DOB, v_contact_id, p_password_hash
    );
   
    INSERT INTO patient (patient_id, blood_group, registered_branch_id)
    VALUES (v_user_id, p_blood_group, v_branch_id);
   
    SET p_user_id = v_user_id;
    SET p_success = TRUE;
    SET p_error_message = 'Patient registered successfully';
   
    COMMIT;
END proc_label$$

-- Procedure: RegisterStaff
DROP PROCEDURE IF EXISTS `RegisterStaff`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `RegisterStaff`(
    -- Address inputs
    IN p_address_line1 VARCHAR(50),
    IN p_address_line2 VARCHAR(50),
    IN p_city VARCHAR(50),
    IN p_province VARCHAR(50),
    IN p_postal_code VARCHAR(20),
    IN p_country VARCHAR(50),
    
    -- Contact inputs
    IN p_contact_num1 VARCHAR(20),
    IN p_contact_num2 VARCHAR(20),
    
    -- User inputs
    IN p_full_name VARCHAR(255),
    IN p_NIC VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_gender ENUM('Male', 'Female', 'Other'),
    IN p_DOB DATE,
    IN p_password_hash VARCHAR(64),
    
    -- Employee inputs
    IN p_branch_name VARCHAR(50),
    IN p_role ENUM('nurse', 'admin', 'receptionist', 'manager', 'pharmacist', 'lab_technician'),
    IN p_salary DECIMAL(10,2),
    IN p_joined_date DATE,
    
    -- Outputs
    OUT p_user_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    DECLARE v_address_id CHAR(36);
    DECLARE v_contact_id CHAR(36);
    DECLARE v_user_id CHAR(36);
    DECLARE v_branch_id CHAR(36);
    DECLARE v_email_exists INT DEFAULT 0;
    DECLARE v_nic_exists INT DEFAULT 0;
    DECLARE v_manager_exists INT DEFAULT 0;
    
    -- Error handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
    
    -- Initialize outputs
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_user_id = NULL;
    
    START TRANSACTION;
    
    -- Validation: Password hash
    IF LENGTH(p_password_hash) != 64 THEN
        SET p_error_message = 'Invalid password hash format';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validation: Get branch_id
    SELECT branch_id INTO v_branch_id 
    FROM branch 
    WHERE branch_name = TRIM(p_branch_name) AND is_active = TRUE
    LIMIT 1;
    
    IF v_branch_id IS NULL THEN
        SET p_error_message = 'Branch not found or inactive';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validation: Check for duplicate email
    SELECT COUNT(*) INTO v_email_exists 
    FROM user 
    WHERE email = LOWER(TRIM(p_email));
    
    IF v_email_exists > 0 THEN
        SET p_error_message = 'Email already registered';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validation: Check for duplicate NIC
    SELECT COUNT(*) INTO v_nic_exists 
    FROM user 
    WHERE NIC = TRIM(p_NIC);
    
    IF v_nic_exists > 0 THEN
        SET p_error_message = 'NIC already registered';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validation: Check if branch already has a manager (if role is manager)
    IF p_role = 'manager' THEN
        SELECT COUNT(*) INTO v_manager_exists
        FROM employee
        WHERE branch_id = v_branch_id AND role = 'manager' AND is_active = TRUE;
        
        IF v_manager_exists > 0 THEN
            SET p_error_message = 'Branch already has an active manager';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
    END IF;
    
    -- Validation: Salary check
    IF p_salary <= 0 THEN
        SET p_error_message = 'Salary must be greater than zero';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validation: Joined date
    IF p_joined_date > CURDATE() THEN
        SET p_error_message = 'Joined date cannot be in the future';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validation: Age check (must be 18+)
    IF TIMESTAMPDIFF(YEAR, p_DOB, CURDATE()) < 18 THEN
        SET p_error_message = 'Staff member must be at least 18 years old';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Generate UUIDs
    SET v_address_id = UUID();
    SET v_contact_id = UUID();
    SET v_user_id = UUID();
    
    -- Insert address
    INSERT INTO address (
        address_id, address_line1, address_line2, city, province, postal_code, country
    ) VALUES (
        v_address_id, 
        TRIM(p_address_line1), 
        TRIM(p_address_line2), 
        TRIM(p_city), 
        TRIM(p_province), 
        TRIM(p_postal_code), 
        COALESCE(TRIM(p_country), 'Sri Lanka')
    );
    
    -- Insert contact
    INSERT INTO contact (contact_id, contact_num1, contact_num2) 
    VALUES (v_contact_id, TRIM(p_contact_num1), TRIM(p_contact_num2));
    
    -- Insert user
    INSERT INTO user (
        user_id, address_id, user_type, full_name, NIC, email, gender, DOB, 
        contact_id, password_hash
    ) VALUES (
        v_user_id, v_address_id, 'employee', TRIM(p_full_name), TRIM(p_NIC), 
        LOWER(TRIM(p_email)), p_gender, p_DOB, v_contact_id, p_password_hash
    );
    
    -- Insert employee
    INSERT INTO employee (employee_id, branch_id, role, salary, joined_date, is_active) 
    VALUES (v_user_id, v_branch_id, p_role, p_salary, p_joined_date, TRUE);
    
    -- If manager, update branch
    IF p_role = 'manager' THEN
        UPDATE branch 
        SET manager_id = v_user_id 
        WHERE branch_id = v_branch_id;
    END IF;
    
    -- Success
    SET p_user_id = v_user_id;
    SET p_success = TRUE;
    SET p_error_message = 'Staff member registered successfully';
    
    COMMIT;
END proc_label$$

-- Procedure: UpdateStaffSalary
DROP PROCEDURE IF EXISTS `UpdateStaffSalary`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `UpdateStaffSalary`(
    IN p_employee_id CHAR(36),
    IN p_new_salary DECIMAL(10,2),
    
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    DECLARE v_employee_exists INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
    
    SET p_success = FALSE;
    SET p_error_message = NULL;
    
    START TRANSACTION;
    
    -- Check if employee exists
    SELECT COUNT(*) INTO v_employee_exists
    FROM employee
    WHERE employee_id = p_employee_id AND is_active = TRUE;
    
    IF v_employee_exists = 0 THEN
        SET p_error_message = 'Employee not found or inactive';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validate salary
    IF p_new_salary <= 0 THEN
        SET p_error_message = 'Salary must be greater than zero';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Update salary
    UPDATE employee
    SET salary = p_new_salary
    WHERE employee_id = p_employee_id;
    
    SET p_success = TRUE;
    SET p_error_message = 'Salary updated successfully';
    
    COMMIT;
END proc_label$$

-- Procedure: GenerateInvoice
DROP PROCEDURE IF EXISTS GenerateInvoice$$

CREATE DEFINER=`root`@`localhost` PROCEDURE GenerateInvoice(
    IN p_consultation_rec_id CHAR(36),
    OUT p_invoice_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    DECLARE v_appointment_id CHAR(36);
    DECLARE v_doctor_fee DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_treatments_total DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_sub_total DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_patient_id CHAR(36);
    DECLARE v_invoice_id CHAR(36);
    DECLARE v_consultation_exists INT DEFAULT 0;
    DECLARE v_balance_exists INT DEFAULT 0;
   
    -- Error handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
   
    -- Initialize
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_invoice_id = NULL;
   
    START TRANSACTION;
   
    -- Validate consultation exists
    SELECT COUNT(*) INTO v_consultation_exists FROM consultation_record WHERE consultation_rec_id = p_consultation_rec_id;
    IF v_consultation_exists = 0 THEN
        SET p_error_message = 'Consultation record not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Get doctor fee (via appointment → time_slot → doctor)
    SELECT cr.appointment_id INTO v_appointment_id FROM consultation_record cr WHERE cr.consultation_rec_id = p_consultation_rec_id;
    SELECT d.consultation_fee INTO v_doctor_fee 
    FROM appointment a 
    JOIN time_slot ts ON a.time_slot_id = ts.time_slot_id 
    JOIN doctor d ON ts.doctor_id = d.doctor_id 
    WHERE a.appointment_id = v_appointment_id;
   
    -- Sum treatments total (base_price from catalogue)
    SELECT COALESCE(SUM(tc.base_price), 0) INTO v_treatments_total
    FROM treatment t 
    JOIN treatment_catalogue tc ON t.treatment_service_code = tc.treatment_service_code 
    WHERE t.consultation_rec_id = p_consultation_rec_id;
   
    -- Calculate sub_total
    SET v_sub_total = v_doctor_fee + v_treatments_total;
    IF v_sub_total <= 0 THEN
        SET p_error_message = 'Invalid sub_total (must be > 0)';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Get patient_id
    SELECT a.patient_id INTO v_patient_id FROM appointment a JOIN consultation_record cr ON a.appointment_id = cr.appointment_id WHERE cr.consultation_rec_id = p_consultation_rec_id;
   
    -- Insert invoice (tax_amount=0 for simplicity; adjust if needed)
    SET v_invoice_id = UUID();
    INSERT INTO invoice (invoice_id, consultation_rec_id, sub_total, tax_amount) 
    VALUES (v_invoice_id, p_consultation_rec_id, v_sub_total, 0.00);
   
    -- Lock and update/add balance
    INSERT INTO patient_balance (patient_id, total_balance) VALUES (v_patient_id, v_sub_total) 
    ON DUPLICATE KEY UPDATE total_balance = total_balance + v_sub_total;
   
    SET p_invoice_id = v_invoice_id;
    SET p_success = TRUE;
    SET p_error_message = 'Invoice generated successfully';
   
    COMMIT;
END proc_label$$

-- Procedure: AddClaim 
DROP PROCEDURE IF EXISTS AddClaim$$

CREATE DEFINER=`root`@`localhost`PROCEDURE AddClaim(
    IN p_invoice_id CHAR(36),
    IN p_insurance_id CHAR(36),
    IN p_claim_amount DECIMAL(12,2),
    IN p_notes TEXT,
    OUT p_claim_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    DECLARE v_claim_id CHAR(36);
    DECLARE v_patient_id CHAR(36);
    DECLARE v_current_sub_total DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_invoice_exists INT DEFAULT 0;
    DECLARE v_insurance_exists INT DEFAULT 0;
    DECLARE v_balance_exists INT DEFAULT 0;
    DECLARE v_current_balance DECIMAL(12,2) DEFAULT 0.00;
   
    -- Error handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
   
    -- Initialize
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_claim_id = NULL;
   
    START TRANSACTION;
   
    -- Validate invoice
    SELECT COUNT(*) INTO v_invoice_exists FROM invoice WHERE invoice_id = p_invoice_id;
    IF v_invoice_exists = 0 THEN
        SET p_error_message = 'Invoice not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Get patient_id and current sub_total
    SELECT i.consultation_rec_id, i.sub_total INTO @temp_cr, v_current_sub_total 
    FROM invoice i WHERE i.invoice_id = p_invoice_id;  -- Temp for consultation
    SELECT a.patient_id INTO v_patient_id FROM appointment a JOIN consultation_record cr ON a.appointment_id = cr.appointment_id 
    WHERE cr.consultation_rec_id = @temp_cr;
   
    -- Validate insurance (active for patient)
    SELECT COUNT(*) INTO v_insurance_exists FROM insurance WHERE insurance_id = p_insurance_id AND patient_id = v_patient_id AND status = 'Active';
    IF v_insurance_exists = 0 THEN
        SET p_error_message = 'Valid active insurance not found for patient';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Validate amount >0 and <= sub_total
    IF p_claim_amount <= 0 OR p_claim_amount > v_current_sub_total THEN
        SET p_error_message = 'Claim amount must be >0 and <= invoice sub_total';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Lock and get current balance
    SELECT total_balance INTO v_current_balance FROM patient_balance WHERE patient_id = v_patient_id FOR UPDATE;
    SET v_balance_exists = ROW_COUNT();
    IF v_balance_exists = 0 THEN
        SET p_error_message = 'Patient balance not initialized';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Insert claim
    SET v_claim_id = UUID();
    INSERT INTO claim (claim_id, invoice_id, insurance_id, claim_amount, notes) 
    VALUES (v_claim_id, p_invoice_id, p_insurance_id, p_claim_amount, p_notes);
   
    -- Deduct from invoice (update sub_total -= claim_amount; or claimed_amount += if ALTERed)
    UPDATE invoice SET sub_total = sub_total - p_claim_amount WHERE invoice_id = p_invoice_id;
   
    -- Deduct from patient balance
    UPDATE patient_balance SET total_balance = total_balance - p_claim_amount WHERE patient_id = v_patient_id;
   
    SET p_claim_id = v_claim_id;
    SET p_success = TRUE;
    SET p_error_message = 'Claim added successfully';
   
    COMMIT;
END proc_label$$

-- Procedure: AddPayment
DROP PROCEDURE IF EXISTS AddPayment$$

CREATE DEFINER=`root`@`localhost` PROCEDURE AddPayment(
    IN p_patient_id CHAR(36),
    IN p_amount_paid DECIMAL(10,2),
    IN p_payment_method ENUM('Cash','Credit Card','Debit Card','Online','Insurance','Other'),
    IN p_status ENUM('Completed','Pending','Failed','Refunded'),
    IN p_notes TEXT,
    OUT p_payment_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    DECLARE v_payment_id CHAR(36);
    DECLARE v_patient_exists INT DEFAULT 0;
   
    -- Error handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
   
    -- Initialize
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_payment_id = NULL;
   
    START TRANSACTION;
   
    -- Validate patient
    SELECT COUNT(*) INTO v_patient_exists FROM patient WHERE patient_id = p_patient_id;
    IF v_patient_exists = 0 THEN
        SET p_error_message = 'Patient not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Validate amount >0
    IF p_amount_paid <= 0 THEN
        SET p_error_message = 'Amount paid must be greater than zero';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Insert payment (trigger handles balance if completed)
    SET v_payment_id = UUID();
    INSERT INTO payment (payment_id, patient_id, amount_paid, payment_method, status, notes) 
    VALUES (v_payment_id, p_patient_id, p_amount_paid, p_payment_method, p_status, p_notes);
   
    SET p_payment_id = v_payment_id;
    SET p_success = TRUE;
    SET p_error_message = 'Payment added successfully';
   
    COMMIT;
END proc_label$$

DELIMITER ;
