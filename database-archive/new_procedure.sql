DELIMITER $$

DROP PROCEDURE IF EXISTS RegisterDoctor$$

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

DELIMITER ;


-- Add 'doctor' to the user_type ENUM
ALTER TABLE `user` 
MODIFY COLUMN `user_type` ENUM('patient', 'employee', 'doctor') NOT NULL;

-- ============================================
-- STAFF/EMPLOYEE MANAGEMENT PROCEDURES
-- ============================================

DELIMITER $$

-- Register Staff/Employee (Non-Doctor)
DROP PROCEDURE IF EXISTS RegisterStaff$$
CREATE PROCEDURE RegisterStaff(
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

-- Update Staff Salary
DROP PROCEDURE IF EXISTS UpdateStaffSalary$$
CREATE PROCEDURE UpdateStaffSalary(
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

-- Deactivate Staff
DROP PROCEDURE IF EXISTS DeactivateStaff$$
CREATE PROCEDURE DeactivateStaff(
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

DELIMITER ;

-- ============================================
-- GET STAFF BY BRANCH NAME
-- ============================================

DELIMITER $$

DROP PROCEDURE IF EXISTS GetStaffByBranch$$

CREATE PROCEDURE GetStaffByBranch(
    IN p_branch_name VARCHAR(50),
    IN p_role VARCHAR(50),              -- Optional: filter by role (NULL for all)
    IN p_active_only BOOLEAN,           -- TRUE to get only active staff
    IN p_limit INT,                     -- Pagination limit
    IN p_offset INT,                    -- Pagination offset
    
    OUT p_total_count INT,              -- Total number of staff matching criteria
    OUT p_error_message VARCHAR(255),
    OUT p_success BOOLEAN
)
proc_label: BEGIN
    DECLARE v_branch_id CHAR(36);
    
    -- Error handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_total_count = 0;
    END;
    
    -- Initialize outputs
    SET p_success = FALSE;
    SET p_error_message = NULL;
    SET p_total_count = 0;
    
    -- Get branch_id from branch_name
    SELECT branch_id INTO v_branch_id
    FROM branch
    WHERE branch_name = TRIM(p_branch_name)
    LIMIT 1;
    
    IF v_branch_id IS NULL THEN
        SET p_error_message = 'Branch not found';
        SET p_success = FALSE;
        LEAVE proc_label;
    END IF;
    
    -- Get total count (for pagination)
    IF p_role IS NOT NULL AND p_role != '' THEN
        IF p_active_only THEN
            SELECT COUNT(*) INTO p_total_count
            FROM employee e
            JOIN user u ON e.employee_id = u.user_id
            WHERE e.branch_id = v_branch_id 
              AND e.role = p_role
              AND e.is_active = TRUE
              AND u.user_type = 'employee';
        ELSE
            SELECT COUNT(*) INTO p_total_count
            FROM employee e
            JOIN user u ON e.employee_id = u.user_id
            WHERE e.branch_id = v_branch_id 
              AND e.role = p_role
              AND u.user_type = 'employee';
        END IF;
    ELSE
        IF p_active_only THEN
            SELECT COUNT(*) INTO p_total_count
            FROM employee e
            JOIN user u ON e.employee_id = u.user_id
            WHERE e.branch_id = v_branch_id 
              AND e.is_active = TRUE
              AND u.user_type = 'employee';
        ELSE
            SELECT COUNT(*) INTO p_total_count
            FROM employee e
            JOIN user u ON e.employee_id = u.user_id
            WHERE e.branch_id = v_branch_id 
              AND u.user_type = 'employee';
        END IF;
    END IF;
    
    -- Return staff data with pagination
    IF p_role IS NOT NULL AND p_role != '' THEN
        IF p_active_only THEN
            SELECT 
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
              AND u.user_type = 'employee'
            ORDER BY u.full_name
            LIMIT p_limit OFFSET p_offset;
        ELSE
            SELECT 
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
              AND u.user_type = 'employee'
            ORDER BY u.full_name
            LIMIT p_limit OFFSET p_offset;
        END IF;
    ELSE
        IF p_active_only THEN
            SELECT 
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
              AND u.user_type = 'employee'
            ORDER BY u.full_name
            LIMIT p_limit OFFSET p_offset;
        ELSE
            SELECT 
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
              AND u.user_type = 'employee'
            ORDER BY u.full_name
            LIMIT p_limit OFFSET p_offset;
        END IF;
    END IF;
    
    SET p_success = TRUE;
    SET p_error_message = 'Staff retrieved successfully';
    
END proc_label$$

DELIMITER ;