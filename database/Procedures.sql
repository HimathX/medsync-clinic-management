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
    IN p_registered_branch_id CHAR(36),
    
    -- Outputs
    OUT p_user_id CHAR(36),
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN  -- Add label here
    -- ALL DECLARE STATEMENTS MUST COME FIRST
    DECLARE v_address_id CHAR(36);
    DECLARE v_contact_id CHAR(36);
    DECLARE v_user_id CHAR(36);
    DECLARE v_branch_exists INT DEFAULT 0;
    DECLARE v_email_exists INT DEFAULT 0;
    DECLARE v_nic_exists INT DEFAULT 0;
    
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
    SET p_user_id = NULL;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Validation: Check if branch exists
    SELECT COUNT(*) INTO v_branch_exists 
    FROM branch 
    WHERE branch_id = p_registered_branch_id AND is_active = TRUE;
    
    IF v_branch_exists = 0 THEN
        SET p_error_message = 'Invalid or inactive branch';
        ROLLBACK;
        LEAVE proc_label;  -- Use label
    END IF;
    
    -- Validation: Check for duplicate email
    SELECT COUNT(*) INTO v_email_exists 
    FROM user 
    WHERE email = p_email;
    
    IF v_email_exists > 0 THEN
        SET p_error_message = 'Email already registered';
        ROLLBACK;
        LEAVE proc_label;  -- Use label
    END IF;
    
    -- Validation: Check for duplicate NIC
    SELECT COUNT(*) INTO v_nic_exists 
    FROM user 
    WHERE NIC = p_NIC;
    
    IF v_nic_exists > 0 THEN
        SET p_error_message = 'NIC already registered';
        ROLLBACK;
        LEAVE proc_label;  -- Use label
    END IF;
    
    -- Validation: Check age (must be 18+)
    IF TIMESTAMPDIFF(YEAR, p_DOB, CURDATE()) < 18 THEN
        SET p_error_message = 'Patient must be at least 18 years old';
        ROLLBACK;
        LEAVE proc_label;  -- Use label
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
        v_user_id, v_address_id, 'patient', TRIM(p_full_name), TRIM(p_NIC), 
        LOWER(TRIM(p_email)), p_gender, p_DOB, v_contact_id, p_password_hash
    );
    
    -- Insert patient
    INSERT INTO patient (patient_id, blood_group, registered_branch_id) 
    VALUES (v_user_id, p_blood_group, p_registered_branch_id);
    
    -- Success
    SET p_user_id = v_user_id;
    SET p_success = TRUE;
    SET p_error_message = 'Patient registered successfully';
    
    COMMIT;
END proc_label$$  -- Close label

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
    IN p_password_hash VARCHAR(255),
    
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
-- IMPROVED DOCTOR REGISTRATION
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
    IN p_password_hash VARCHAR(255),
    
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
    DECLARE v_address_id CHAR(36);
    DECLARE v_contact_id CHAR(36);
    DECLARE v_user_id CHAR(36);
    DECLARE v_branch_id CHAR(36);
    DECLARE v_email_exists INT DEFAULT 0;
    DECLARE v_nic_exists INT DEFAULT 0;
    DECLARE v_licence_exists INT DEFAULT 0;
    DECLARE v_room_taken INT DEFAULT 0;
    DECLARE v_spec_count INT DEFAULT 0;
    DECLARE v_idx INT DEFAULT 0;
    DECLARE v_spec_id CHAR(36);
    
    -- Initialize outputs
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_user_id = NULL;
    
    -- Error handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
    
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
    IF p_specialization_ids IS NOT NULL THEN
        SET v_spec_count = JSON_LENGTH(p_specialization_ids);
        SET v_idx = 0;
        
        WHILE v_idx < v_spec_count DO
            SET v_spec_id = JSON_UNQUOTE(JSON_EXTRACT(p_specialization_ids, CONCAT('$[', v_idx, ']')));
            
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
-- NEW: BOOK APPOINTMENT PROCEDURE
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
BEGIN
    DECLARE v_appointment_id CHAR(36);
    DECLARE v_slot_available INT DEFAULT 0;
    DECLARE v_patient_exists INT DEFAULT 0;
    
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_appointment_id = NULL;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 p_error_message = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
    END;
    
    START TRANSACTION;
    
    -- Check if patient exists
    SELECT COUNT(*) INTO v_patient_exists FROM patient WHERE patient_id = p_patient_id;
    
    IF v_patient_exists = 0 THEN
        SET p_error_message = 'Patient not found';
        ROLLBACK;
        LEAVE;
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
        LEAVE;
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
END$$

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



