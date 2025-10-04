/*     PATIENT REGISTRATION     */
DELIMITER $$
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
    
    -- Output: Generated user_id (also patient_id)
    OUT p_user_id CHAR(36)
)
BEGIN
    DECLARE address_id CHAR(36);
    DECLARE contact_id CHAR(36);
    DECLARE user_id CHAR(36);
    
    -- Start transaction
    START TRANSACTION;
    
    -- Error handler: Rollback on any error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    -- Generate UUIDs
    SET address_id = UUID();
    SET contact_id = UUID();
    SET user_id = UUID();
    SET p_user_id = user_id;
    
    -- Insert into address
    INSERT INTO address (
        address_id, address_line1, address_line2, city, province, postal_code, country
    ) VALUES (
        address_id, p_address_line1, p_address_line2, p_city, p_province, p_postal_code, 
        COALESCE(p_country, 'Sri Lanka')  -- Use default if not provided
    );
    
    -- Insert into contact
    INSERT INTO contact (contact_id, contact_num1, contact_num2) 
    VALUES (contact_id, p_contact_num1, p_contact_num2);
    
    -- Insert into user (user_type fixed to 'patient')
    INSERT INTO user (
        user_id, address_id, user_type, full_name, NIC, email, gender, DOB, 
        contact_id, password_hash
    ) VALUES (
        user_id, address_id, 'patient', p_full_name, p_NIC, p_email, p_gender, 
        p_DOB, contact_id, p_password_hash
    );
    
    -- Insert into patient
    INSERT INTO patient (patient_id, blood_group, registered_branch_id) 
    VALUES (user_id, p_blood_group, p_registered_branch_id);
    
    -- Commit if all succeed
    COMMIT;
END$
DELIMITER ;

-- Example Call
CALL RegisterPatient(
    '45 Beach Avenue', 'Apt 2B', 'Galle', 'Southern', '80000', NULL,
    '+94945678901', '+94771234567',
    'Rohan Silva', '198512345678', 'rohan.silva@email.com', 'Male', '1985-08-22', 'hashed_pass_2',
    'A-', (select branch_id from branch where branch_name = "Galle Branch"),  -- Patient
    @generated_user_id
);


/*         EMPLOYEE REGISTRATION       */

DELIMITER $$
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
    IN p_branch_name CHAR(36),
    IN p_role ENUM('doctor', 'nurse', 'admin', 'receptionist', 'manager'),
    IN p_salary DECIMAL(10,2),
    IN p_joined_date DATE,
    IN p_end_date DATE,
    
    -- Output: Generated user_id (also employee_id)
    OUT p_user_id CHAR(36)
)
BEGIN
    DECLARE address_id CHAR(36);
    DECLARE contact_id CHAR(36);
    DECLARE user_id CHAR(36);
    DECLARE branch_id CHAR(36);
    
    -- Error handler: Rollback on any error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    -- Start transaction
    START TRANSACTION;
    
    -- Generate UUIDs
    SET address_id = UUID();
    SET contact_id = UUID();
    SET user_id = UUID();
    SET p_user_id = user_id;
    SET branch_id = (select branch_id from branch where branch_name = p_branch_name);
    
    -- Insert into address
    INSERT INTO address (
        address_id, address_line1, address_line2, city, province, postal_code, country
    ) VALUES (
        address_id, p_address_line1, p_address_line2, p_city, p_province, p_postal_code, 
        COALESCE(p_country, 'Sri Lanka')
    );
    
    -- Insert into contact
    INSERT INTO contact (contact_id, contact_num1, contact_num2) 
    VALUES (contact_id, p_contact_num1, p_contact_num2);
    
    -- Insert into user (user_type fixed to 'employee')
    INSERT INTO user (
        user_id, address_id, user_type, full_name, NIC, email, gender, DOB, 
        contact_id, password_hash
    ) VALUES (
        user_id, address_id, 'employee', p_full_name, p_NIC, p_email, p_gender, 
        p_DOB, contact_id, p_password_hash
    );
    
    -- Insert into employee
    INSERT INTO employee (employee_id, branch_id, role, salary, joined_date, end_date) 
    VALUES (user_id, branch_id, p_role, p_salary, p_joined_date, p_end_date);
    
    -- Commit if all succeed
    COMMIT;
END$$
DELIMITER ;

--  Example Call
CALL RegisterEmployee(
    '456 Clinic Rd', NULL, 'Colombo 08', 'Western', '00800', NULL,  -- Address
    '+94119876543', NULL,  -- Contact
    'Bob Admin', '198001234567', 'bob.admin@clinic.com', 'Male', '1980-03-10',         'hashed_pass_emp1',
    'Colombo Central Branch', 'admin', 50000.00, '2025-10-04', NULL,  -- Employee (end_date      NULL = active)
    @generated_user_id
);


/*  Doctor Registration */
DELIMITER $$
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
    IN p_branch_id CHAR(36),
    IN p_salary DECIMAL(10,2),
    IN p_joined_date DATE,
    IN p_end_date DATE,
    
    -- Doctor inputs
    IN p_room_no VARCHAR(5),
    IN p_medical_licence_no VARCHAR(50),
    IN p_consultation_fee DECIMAL(10,2),
    
    -- Output: Generated user_id (also employee_id/doctor_id)
    OUT p_user_id CHAR(36)
)
BEGIN
    DECLARE address_id CHAR(36);
    DECLARE contact_id CHAR(36);
    DECLARE user_id CHAR(36);
    
    -- Start transaction
    START TRANSACTION;
    
    -- Error handler: Rollback on any error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    -- Generate UUIDs
    SET address_id = UUID();
    SET contact_id = UUID();
    SET user_id = UUID();
    SET p_user_id = user_id;
    
    -- Insert into address
    INSERT INTO address (
        address_id, address_line1, address_line2, city, province, postal_code, country
    ) VALUES (
        address_id, p_address_line1, p_address_line2, p_city, p_province, p_postal_code, 
        COALESCE(p_country, 'Sri Lanka')
    );
    
    -- Insert into contact
    INSERT INTO contact (contact_id, contact_num1, contact_num2) 
    VALUES (contact_id, p_contact_num1, p_contact_num2);
    
    -- Insert into user (user_type fixed to 'employee')
    INSERT INTO user (
        user_id, address_id, user_type, full_name, NIC, email, gender, DOB, 
        contact_id, password_hash
    ) VALUES (
        user_id, address_id, 'employee', p_full_name, p_NIC, p_email, p_gender, 
        p_DOB, contact_id, p_password_hash
    );
    
    -- Insert into employee (role fixed to 'doctor')
    INSERT INTO employee (employee_id, branch_id, role, salary, joined_date, end_date) 
    VALUES (user_id, p_branch_id, 'doctor', p_salary, p_joined_date, p_end_date);
    
    -- Insert into doctor
    INSERT INTO doctor (doctor_id, room_no, medical_licence_no, consultation_fee) 
    VALUES (user_id, p_room_no, p_medical_licence_no, COALESCE(p_consultation_fee, 0));
    
    -- Commit if all succeed
    COMMIT;
END$$
DELIMITER ;

-- Sample Call
CALL RegisterDoctor(
    '789 Doc Residence', NULL, 'Colombo 07', 'Western', '00700', NULL,  -- Address
    '+94115556677', NULL,  -- Contact
    'Dr. Eva Wickramasinghe', '197501234567', 'dr.eva@clinic.com', 'Female', '1975-01-20', 'hashed_pass_doc1',
    'YOUR_COLOMBO_BRANCH_UUID_HERE', 120000.00, '2025-10-01', NULL,  -- Employee
    'R101', 'LK-MED-12345', 2500.00,  -- Doctor
    @generated_user_id
);



