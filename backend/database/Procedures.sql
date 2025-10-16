/*     PATIENT REGISTRATION     */
DELIMITER $$
DROP PROCEDURE IF EXISTS RegisterPatient$$

CREATE PROCEDURE RegisterPatient(
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

-- ============================================
-- IMPROVED EMPLOYEE REGISTRATION
-- ============================================
DROP PROCEDURE IF EXISTS RegisterEmployee$$
CREATE PROCEDURE RegisterEmployee(
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

-- ============================================
-- IMPROVED DOCTOR REGISTRATION WITH SPECIALIZATION VALIDATION
-- ============================================
DROP PROCEDURE IF EXISTS RegisterDoctor$$
CREATE PROCEDURE RegisterDoctor(
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

-- ============================================
-- BOOK APPOINTMENT PROCEDURE
-- ============================================
DROP PROCEDURE IF EXISTS BookAppointment$$
CREATE PROCEDURE BookAppointment(
    IN p_patient_id CHAR(36),
    IN p_time_slot_id CHAR(36),
    IN p_notes TEXT,
    
    OUT p_appointment_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    DECLARE v_appointment_id CHAR(36);
    DECLARE v_slot_available INT DEFAULT 0;
    DECLARE v_patient_exists INT DEFAULT 0;
    
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
    SET p_appointment_id = NULL;
    
    START TRANSACTION;
    
    -- Check if patient exists
    SELECT COUNT(*) INTO v_patient_exists FROM patient WHERE patient_id = p_patient_id;
    
    IF v_patient_exists = 0 THEN
        SET p_error_message = 'Patient not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Check if time slot is available
    SELECT COUNT(*) INTO v_slot_available 
    FROM time_slot 
    WHERE time_slot_id = p_time_slot_id 
    AND is_booked = FALSE 
    AND available_date >= CURDATE();
    
    IF v_slot_available = 0 THEN
        SET p_error_message = 'Time slot not available';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Generate appointment ID
    SET v_appointment_id = UUID();
    
    -- Mark time slot as booked
    UPDATE time_slot 
    SET is_booked = TRUE 
    WHERE time_slot_id = p_time_slot_id;
    
    -- Create appointment
    INSERT INTO appointment (appointment_id, time_slot_id, patient_id, status, notes)
    VALUES (v_appointment_id, p_time_slot_id, p_patient_id, 'Scheduled', p_notes);
    
    SET p_appointment_id = v_appointment_id;
    SET p_success = TRUE;
    SET p_error_message = 'Appointment booked successfully';
    
    COMMIT;
END proc_label$$


-- ============================================
-- ADD PATIENT ALLERGYIES 
-- ============================================
CREATE PROCEDURE AddPatientAllergy(
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

-- ============================================
-- ADD PATIENT CONDITION
-- ============================================
DROP PROCEDURE IF EXISTS AddPatientCondition$$

CREATE PROCEDURE AddPatientCondition(
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

-- ============================================
-- ADD Insurance Package
-- ============================================
DROP PROCEDURE IF EXISTS AddPatientInsurance$$
CREATE PROCEDURE AddPatientInsurance(
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
-- ============================================
-- ADD Doc Specializaiton 
-- ============================================
DROP PROCEDURE IF EXISTS AddDoctorSpecialization$$

CREATE PROCEDURE AddDoctorSpecialization(
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
-- ============================================
-- Assign TimeSlot to a doctor (Admin Only)
-- ============================================

DROP PROCEDURE IF EXISTS AddTimeSlot$$
CREATE PROCEDURE AddTimeSlot(
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

-- ============================================
-- ADD Consultation Rec to an appoinment
-- ============================================
DROP PROCEDURE IF EXISTS AddConsultationRecord$$

CREATE PROCEDURE AddConsultationRecord(
    IN p_appointment_id CHAR(36),
    IN p_symptoms TEXT,
    IN p_diagnoses TEXT,
    IN p_follow_up_required BOOL,
    IN p_follow_up_date DATE,
   
    OUT p_consultation_rec_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    -- ALL DECLARE STATEMENTS MUST COME FIRST
    DECLARE v_consultation_rec_id CHAR(36);
    DECLARE v_appointment_exists INT DEFAULT 0;
   
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
    SET p_consultation_rec_id = NULL;
   
    -- Start transaction
    START TRANSACTION;
   
    -- Validation: Check if appointment exists
    SELECT COUNT(*) INTO v_appointment_exists
    FROM appointment
    WHERE appointment_id = p_appointment_id;
   
    IF v_appointment_exists = 0 THEN
        SET p_error_message = 'Appointment not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Validation: Check required fields
    IF TRIM(p_symptoms) IS NULL OR TRIM(p_symptoms) = '' THEN
        SET p_error_message = 'Symptoms are required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    IF TRIM(p_diagnoses) IS NULL OR TRIM(p_diagnoses) = '' THEN
        SET p_error_message = 'Diagnoses are required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Validation: If follow-up required, ensure date is provided
    IF p_follow_up_required = TRUE AND p_follow_up_date IS NULL THEN
        SET p_error_message = 'Follow-up date is required when follow-up is needed';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Generate UUID
    SET v_consultation_rec_id = UUID();
   
    -- Insert consultation record
    INSERT INTO consultation_record (
        consultation_rec_id, appointment_id, symptoms, diagnoses, 
        follow_up_required, follow_up_date
    ) VALUES (
        v_consultation_rec_id, p_appointment_id, TRIM(p_symptoms), 
        TRIM(p_diagnoses), p_follow_up_required, p_follow_up_date
    );
   
    -- Success
    SET p_consultation_rec_id = v_consultation_rec_id;
    SET p_success = TRUE;
    SET p_error_message = 'Consultation record added successfully';
   
    COMMIT;
END proc_label$$

-- ============================================
-- ADD Prescription item to Consultation Rec
-- ============================================

DROP PROCEDURE IF EXISTS AddPrescriptionItem$$

CREATE PROCEDURE AddPrescriptionItem(
    IN p_consultation_rec_id CHAR(36),
    IN p_medication_id CHAR(36),
    IN p_dosage VARCHAR(50),
    IN p_frequency ENUM('Once daily','Twice daily','Three times daily','As needed'),
    IN p_duration_days INT,
    IN p_instructions VARCHAR(500),
   
    OUT p_prescription_item_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    -- ALL DECLARE STATEMENTS MUST COME FIRST
    DECLARE v_prescription_item_id CHAR(36);
    DECLARE v_consultation_exists INT DEFAULT 0;
    DECLARE v_medication_exists INT DEFAULT 0;
   
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
    SET p_prescription_item_id = NULL;
   
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
   
    -- Validation: Check if medication exists
    SELECT COUNT(*) INTO v_medication_exists
    FROM medication
    WHERE medication_id = p_medication_id;
   
    IF v_medication_exists = 0 THEN
        SET p_error_message = 'Medication not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Validation: Check required fields
    IF TRIM(p_dosage) IS NULL OR TRIM(p_dosage) = '' THEN
        SET p_error_message = 'Dosage is required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    IF p_frequency IS NULL THEN
        SET p_error_message = 'Frequency is required';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    IF p_duration_days IS NULL OR p_duration_days <= 0 THEN
        SET p_error_message = 'Duration must be greater than zero days';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
   
    -- Generate UUID
    SET v_prescription_item_id = UUID();
   
    -- Insert prescription item
    INSERT INTO prescription_item (
        prescription_item_id, medication_id, consultation_rec_id, dosage, 
        frequency, duration_days, instructions
    ) VALUES (
        v_prescription_item_id, p_medication_id, p_consultation_rec_id, 
        TRIM(p_dosage), p_frequency, p_duration_days, TRIM(p_instructions)
    );
   
    -- Success
    SET p_prescription_item_id = v_prescription_item_id;
    SET p_success = TRUE;
    SET p_error_message = 'Prescription item added successfully';
   
    COMMIT;
END proc_label$$
-- ============================================
-- ADD Treatments to Consultation Rec
-- ============================================

DROP PROCEDURE IF EXISTS AddTreatment$$

CREATE PROCEDURE AddTreatment(
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

DELIMITER ;


-- ============================================
-- EXAMPLE USAGE
-- ============================================

-- Register Patient
CALL RegisterPatient(
    '45 Beach Avenue', 'Apt 2B', 'Galle', 'Southern', '80000', NULL,
    '+94945678901', '+94771234567',
    'Rohan Silva', '198512345678', 'rohan.silva@email.com', 'Male', '1985-08-22', '$2b$12$...',
    'A-', (SELECT branch_id FROM branch WHERE branch_name = 'MedSync Galle' LIMIT 1),
    @user_id, @error_msg, @success
);

SELECT @success AS Success, @error_msg AS Message, @user_id AS PatientID;

-- Register Employee
CALL RegisterEmployee(
    '456 Clinic Rd', NULL, 'Colombo 08', 'Western', '00800', NULL,
    '+94119876543', NULL,
    'Bob Admin', '198001234567', 'bob.admin@clinic.com', 'Male', '1980-03-10', '$2b$12$...',
    'MedSync Colombo', 'admin', 50000.00, '2025-01-01',
    @user_id, @error_msg, @success
);

SELECT @success AS Success, @error_msg AS Message, @user_id AS EmployeeID;

-- Register Doctor with Specializations
CALL RegisterDoctor(
    '789 Doc Residence', NULL, 'Colombo 07', 'Western', '00700', NULL,
    '+94115556677', NULL,
    'Dr. Eva Wickramasinghe', '197501234567', 'dr.eva@clinic.com', 'Female', '1975-01-20', '$2b$12$...',
    'MedSync Colombo', 120000.00, '2025-01-01',
    'R101', 'LK-MED-12345', 2500.00,
    JSON_ARRAY(
        (SELECT specialization_id FROM specialization WHERE specialization_title = 'Cardiology' LIMIT 1)
    ),
    @user_id, @error_msg, @success
);

SELECT @success AS Success, @error_msg AS Message, @user_id AS DoctorID;

-- ADD Appointment 
CALL BookAppointment(
    'YOUR_PATIENT_UUID_HERE',     
    'YOUR_AVAILABLE_SLOT_UUID_HERE',  --  time slot ID
    'Patient requests routine checkup; no specific concerns.',  -- Notes
    @appointment_id,              
    @error_msg,                     
    @success                     
);
SELECT @error_msg AS message, @success AS succeeded;

-- ADD PatientAllergy

CALL AddPatientAllergy(
    'YOUR_PATIENT_UUID_HERE',  -- e.g., from patient table
    'Peanuts', 'Life-threatening', 
    'Anaphylaxis: swelling, difficulty breathing', 
    '2025-05-15',
    @allergy_id, @error_msg, @success
);

SELECT @allergy_id AS new_allergy_id, @error_msg AS message, @success AS succeeded;

-- ADD PatientCondition 
CALL AddPatientCondition(
    'YOUR_PATIENT_UUID_HERE',
    'YOUR_CATEGORY_UUID_HERE',  -- Now ID, not name
    'Hypertension',              -- Always creates new condition entry
    '2025-06-10',
    TRUE,
    'Managed',
    'Blood pressure controlled with medication',
    @condition_id, @error_msg, @success
);

CALL AddPatientInsurance(
    'YOUR_ROHAN_PATIENT_UUID_HERE',  -- e.g., from patient table
    'YOUR_BASIC_PACKAGE_UUID_HERE',  -- e.g., from insurance_package
    '2025-10-07',                    -- Start date (today)
    '2026-10-06',                    -- End date (1 year later)
    'Active',                        -- Status
    @insurance_id,                   -- OUT: New insurance ID
    @error_msg,                      -- OUT: Error/success message
    @success                         -- OUT: TRUE/FALSE
);

CALL AddTimeSlot(
    'YOUR_DOCTOR_UUID_HERE',
    'YOUR_BRANCH_UUID_HERE',
    '2025-10-15',      -- Available date (future)
    '10:00:00',        -- Start time
    '10:30:00',        -- End time (after start)
    @slot_id, @error_msg, @success
);
SELECT @slot_id AS new_slot_id, @error_msg AS message, @success AS succeeded;

CALL AddConsultationRecord(
    'YOUR_APPOINTMENT_UUID_HERE',
    'Patient reports chest pain and shortness of breath for 2 days.',
    'Acute myocardial infarction suspected; ECG and blood tests ordered.',
    TRUE,
    '2025-10-16',  -- Follow-up date
    @rec_id, @error_msg, @success
);
SELECT @rec_id AS new_record_id, @error_msg AS message, @success AS succeeded;

CALL AddPrescriptionItem(
    'YOUR_CONSULTATION_REC_UUID_HERE',
    'YOUR_MEDICATION_UUID_HERE',
    '500mg',                           -- Dosage
    'Twice daily',                     -- Frequency
    14,                                -- Duration days
    'Take with food; avoid alcohol.',  -- Instructions
    @item_id, @error_msg, @success
);
SELECT @item_id AS new_item_id, @error_msg AS message, @success AS succeeded;

CALL AddTreatment(
    'YOUR_CONSULTATION_REC_UUID_HERE',
    'YOUR_TREATMENT_SERVICE_UUID_HERE',
    'Patient to fast for 8 hours prior to test.',  -- Notes (optional)
    @treatment_id, @error_msg, @success
);

SELECT @treatment_id AS new_treatment_id, @error_msg AS message, @success AS succeeded;

-- ADD Sample Conditon Catogeries 
INSERT INTO conditions_category (condition_category_id, category_name, description) VALUES 
    (UUID(), 'Cardiovascular', 'Conditions affecting the heart and blood vessels, such as hypertension and heart disease.'),
    (UUID(), 'Respiratory', 'Disorders of the lungs and breathing, including asthma and COPD.'),
    (UUID(), 'Neurological', 'Issues related to the nervous system, like migraines and epilepsy.'),
    (UUID(), 'Gastrointestinal', 'Problems with the digestive system, such as IBS and ulcers.'),
    (UUID(), 'Endocrine', 'Hormonal and metabolic disorders, including diabetes and thyroid issues.'),
    (UUID(), 'Musculoskeletal', 'Conditions involving bones, muscles, and joints, like arthritis and osteoporosis.'),
    (UUID(), 'Dermatological', 'Skin-related conditions, such as eczema and psoriasis.');

-- ADD Sample Insurance Packages
INSERT INTO insurance_package (insurance_package_id, package_name, annual_limit, copayment_percentage, description, is_active) VALUES 
    (UUID(), 'Basic Health Plan', 500000.00, 30.00, 'Entry-level coverage for routine checkups and minor treatments.', TRUE),
    (UUID(), 'Standard Family Plan', 1000000.00, 20.00, 'Comprehensive family coverage including hospitalization and specialist visits.', TRUE),
    (UUID(), 'Premium Wellness Plan', 2000000.00, 10.00, 'High-end plan with wellness programs, preventive care, and full hospital benefits.', TRUE),
    (UUID(), 'Senior Care Plan', 1500000.00, 25.00, 'Tailored for seniors with focus on chronic conditions and geriatric services.', TRUE),
    (UUID(), 'Emergency Only Plan', 750000.00, 40.00, 'Affordable option for emergency treatments and accidents only.', TRUE);

-- ADD Sample Specializaation
INSERT INTO specialization (specialization_id, specialization_title, other_details) VALUES 
    (UUID(), 'Cardiology', 'Specialist in heart and circulatory system disorders.'),
    (UUID(), 'Neurology', 'Expert in brain, spinal cord, and nervous system conditions.'),
    (UUID(), 'Orthopedics', 'Focus on musculoskeletal system, including bones, joints, and muscles.'),
    (UUID(), 'Dermatology', 'Treatment of skin, hair, and nail diseases.'),
    (UUID(), 'Pediatrics', 'Care for infants, children, and adolescents.');

-- ADD Sample treatments 
INSERT INTO treatment_catalogue (treatment_service_code, treatment_name, base_price, duration, description) VALUES 
    (UUID(), 'Blood Test', 1500.00, '00:30:00', 'Basic blood analysis for routine health checkups.'),
    (UUID(), 'X-Ray Scan', 2500.00, '00:45:00', 'Chest X-ray for respiratory or cardiac evaluation.'),
    (UUID(), 'ECG Test', 2000.00, '00:20:00', 'Electrocardiogram to assess heart electrical activity.'),
    (UUID(), 'Ultrasound Scan', 3500.00, '01:00:00', 'Abdominal ultrasound for organ imaging.'),
    (UUID(), 'Physiotherapy Session', 1800.00, '00:45:00', 'Targeted therapy for musculoskeletal rehabilitation.');

-- ADD Sample medications
INSERT INTO medication (medication_id, generic_name, manufacturer, form, contraindications, side_effects) VALUES 
    (UUID(), 'Paracetamol', 'GlaxoSmithKline', 'Tablet', 'Hypersensitivity to paracetamol; severe hepatic impairment.', 'Nausea, rash, allergic reactions.'),
    (UUID(), 'Aspirin', 'Bayer', 'Tablet', 'Active peptic ulcer; bleeding disorders; children under 16 with viral infections.', 'Gastrointestinal bleeding, tinnitus, allergic reactions.'),
    (UUID(), 'Amoxicillin', 'Pfizer', 'Capsule', 'Hypersensitivity to penicillins; infectious mononucleosis.', 'Diarrhea, nausea, skin rash.'),
    (UUID(), 'Metformin', 'Merck', 'Tablet', 'Severe renal impairment; acute heart failure.', 'Gastrointestinal upset, lactic acidosis (rare).'),
    (UUID(), 'Salbutamol', 'AstraZeneca', 'Inhaler', 'Other', 'Hypersensitivity to salbutamol; tachyarrhythmias.', 'Tremor, tachycardia, headache.');