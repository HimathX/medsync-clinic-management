-- Create Database
CREATE DATABASE IF NOT EXISTS ClinicManagement;
USE ClinicManagement;


CREATE TABLE Address (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    INDEX idx_city (city)
);

-- 2. Contact
CREATE TABLE Contact (
    contact_id INT AUTO_INCREMENT PRIMARY KEY,
    User_id INT NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    contact_type ENUM('primary', 'secondary') DEFAULT 'primary',
    is_primary BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (User_id) REFERENCES User(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
);

-- 3. User
CREATE TABLE User (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    address_id INT,
    user_type ENUM('patient', 'employee') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    NIC VARCHAR(20) NOT NULL,
    gender ENUM('M', 'F', 'Other') NOT NULL,
    DOB DATE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (address_id) REFERENCES Address(address_id) ON DELETE SET NULL,
    INDEX idx_email (email)
);

-- 4. Patientaddress
CREATE TABLE Patient (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    blood_group VARCHAR(5),
    allergies TEXT,
    chronic_conditions TEXT,
    registered_branch_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    FOREIGN KEY (registered_branch_id) REFERENCES Branch(branch_id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
);

-- 5. Employee
CREATE TABLE Employee (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    branch_id INT NOT NULL,
    role VARCHAR(50) NOT NULL,
    salary DECIMAL(10, 2),
    joined_date DATE,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE CASCADE,
    INDEX idx_role (role)
);

-- 6. Doctor
CREATE TABLE Doctor (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT UNIQUE NOT NULL,
    room_no VARCHAR(10),
    medical_licence_number VARCHAR(50) NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id) ON DELETE CASCADE,
    INDEX idx_licence (medical_licence_number)
);

-- 7. Branch
CREATE TABLE Branch (
    branch_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    contact_id INT,
    address_id INT,
    FOREIGN KEY (contact_id) REFERENCES Contact(contact_id) ON DELETE SET NULL,
    FOREIGN KEY (address_id) REFERENCES Address(address_id) ON DELETE SET NULL,
    INDEX idx_name (branch_name)
);

-- 8. Specialization
CREATE TABLE Specialization (
    specialization_id INT AUTO_INCREMENT PRIMARY KEY,
    specialization_name VARCHAR(100) NOT NULL,
    description TEXT,
    INDEX idx_name (specialization_name)
);

-- 9. Doctor_Specialization
CREATE TABLE Doctor_Specialization (
    doctor_specialization_id INT AUTO_INCREMENT PRIMARY KEY,
    specialization_id INT NOT NULL,
    doctor_id INT NOT NULL,
    FOREIGN KEY (specialization_id) REFERENCES Specialization(specialization_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id) ON DELETE CASCADE,
    UNIQUE KEY unique_doctor_spec (doctor_id, specialization_id)
);

-- 10. Insurance
CREATE TABLE Insurance (
    insurance_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    insurance_package_id INT NOT NULL,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'expired') DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE,
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (insurance_package_id) REFERENCES Insurance_packages(insurance_package_id) ON DELETE CASCADE,
    INDEX idx_patient (patient_id)
);

-- 11. Insurance_packages
CREATE TABLE Insurance_packages (
    insurance_package_id INT AUTO_INCREMENT PRIMARY KEY,
    package_name VARCHAR(100) NOT NULL,
    annual_limit DECIMAL(10, 2) NOT NULL,
    copayment_percentage DECIMAL(5, 2) NOT NULL,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (package_name)
);

-- 12. Timeslot
CREATE TABLE Timeslot (
    time_slot_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    branch_id INT NOT NULL,
    available_date DATE NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE CASCADE,
    UNIQUE KEY unique_timeslot (doctor_id, branch_id, available_date, start_time),
    INDEX idx_date (available_date)
);

-- 13. Status
CREATE TABLE Status (
    status_id INT AUTO_INCREMENT PRIMARY KEY,
    status_name ENUM('Scheduled', 'Completed', 'Cancelled') NOT NULL
);

-- 14. Appointment
CREATE TABLE Appointment (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    time_slot_id INT NOT NULL,
    status_id INT NOT NULL DEFAULT 1,
    notes TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (time_slot_id) REFERENCES Timeslot(time_slot_id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES Status(status_id) ON DELETE RESTRICT,
    INDEX idx_patient (patient_id),
    INDEX idx_time (time_slot_id)
);

-- 15. MedicalRecord
CREATE TABLE MedicalRecord (
    medical_record_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    chief_complaint TEXT NOT NULL,
    symptoms TEXT,
    diagnoses TEXT,
    FOREIGN KEY (appointment_id) REFERENCES Appointment(appointment_id) ON DELETE CASCADE,
    INDEX idx_appointment (appointment_id)
);

-- 16. Treatment_Category
CREATE TABLE Treatment_Category (
    treatment_category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    INDEX idx_category (category_name)
);

-- 17. Treatment_Catalogue
CREATE TABLE Treatment_Catalogue (
    treatment_service_code INT AUTO_INCREMENT PRIMARY KEY,
    treatment_category_id INT,
    treatment_name VARCHAR(255) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    duration INT NOT NULL,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (treatment_category_id) REFERENCES Treatment_Category(treatment_category_id) ON DELETE SET NULL,
    INDEX idx_name (treatment_name)
);

-- 18. Treatment
CREATE TABLE Treatment (
    treatment_id INT AUTO_INCREMENT PRIMARY KEY,
    medical_record_id INT NOT NULL,
    treatment_service_code INT NOT NULL,
    FOREIGN KEY (medical_record_id) REFERENCES MedicalRecord(medical_record_id) ON DELETE CASCADE,
    FOREIGN KEY (treatment_service_code) REFERENCES Treatment_Catalogue(treatment_service_code) ON DELETE RESTRICT,
    INDEX idx_record (medical_record_id)
);

-- 19. Medication
CREATE TABLE Medication (
    medication_id INT AUTO_INCREMENT PRIMARY KEY,
    generic_name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(100),
    form VARCHAR(50),
    contraindications TEXT,
    side_effects TEXT,
    INDEX idx_name (generic_name)
);

-- 20. Prescription
CREATE TABLE Prescription (
    prescription_id INT AUTO_INCREMENT PRIMARY KEY,
    medical_record_id INT NOT NULL,
    medication_id INT NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    duration_days INT NOT NULL,
    instructions TEXT,
    FOREIGN KEY (medical_record_id) REFERENCES MedicalRecord(medical_record_id) ON DELETE CASCADE,
    FOREIGN KEY (medication_id) REFERENCES Medication(medication_id) ON DELETE RESTRICT,
    INDEX idx_record (medical_record_id)
);

-- 21. ConsultationRecord
CREATE TABLE ConsultationRecord (
    consultation_record_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    medical_record_id INT NOT NULL,
    invoice_id INT,
    FOREIGN KEY (appointment_id) REFERENCES Appointment(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (medical_record_id) REFERENCES MedicalRecord(medical_record_id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES Invoice(invoice_id) ON DELETE SET NULL,
    INDEX idx_appointment (appointment_id)
);

-- 22. Invoice
CREATE TABLE Invoice (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT UNIQUE NOT NULL,
    sub_total DECIMAL(10, 2) NOT NULL,
    insurance_claimed_amount DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (appointment_id) REFERENCES Appointment(appointment_id) ON DELETE CASCADE,
    INDEX idx_appointment (appointment_id)
);

-- 23. Payments
CREATE TABLE Payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    patient_id INT NOT NULL,
    payment_method ENUM('Cash', 'Card', 'Insurance') DEFAULT 'Cash',
    status ENUM('Pending', 'Completed') DEFAULT 'Pending',
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES Invoice(invoice_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id) ON DELETE CASCADE,
    INDEX idx_invoice (invoice_id)
);

-- 24. Claims
CREATE TABLE Claims (
    claim_id INT AUTO_INCREMENT PRIMARY KEY,
    insurance_id INT NOT NULL,
    invoice_id INT NOT NULL,
    date DATE NOT NULL,
    claimed_amount DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (insurance_id) REFERENCES Insurance(insurance_id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES Invoice(invoice_id) ON DELETE CASCADE,
    INDEX idx_insurance (insurance_id)
);

-- 25. ConditionCategory
CREATE TABLE ConditionCategory (
    condition_category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    INDEX idx_category (category_name)
);

-- 26. Conditions
CREATE TABLE Conditions (
    condition_id INT AUTO_INCREMENT PRIMARY KEY,
    condition_category_id INT NOT NULL,
    condition_name VARCHAR(255) NOT NULL,
    description TEXT,
    FOREIGN KEY (condition_category_id) REFERENCES ConditionCategory(condition_category_id) ON DELETE CASCADE,
    INDEX idx_name (condition_name)
);

-- 27. PatientCondition
CREATE TABLE PatientCondition (
    patient_condition_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    condition_id INT NOT NULL,
    diagnosed_date DATE NOT NULL,
    is_chronic BOOLEAN DEFAULT FALSE,
    current_status TEXT,
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (condition_id) REFERENCES Conditions(condition_id) ON DELETE CASCADE,
    INDEX idx_patient (patient_id)
);

-- 28. PatientAllergy
CREATE TABLE PatientAllergy (
    patient_allergy_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    allergy_name VARCHAR(255) NOT NULL,
    severity ENUM('Mild', 'Moderate', 'Severe') NOT NULL,
    reaction_description TEXT,
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id) ON DELETE CASCADE,
    INDEX idx_patient (patient_id)
);

-- 29. PatientBranches
CREATE TABLE PatientBranches (
    patient_branch_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    branch_id INT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE CASCADE,
    UNIQUE KEY unique_patient_branch (patient_id, branch_id)
);

-- 30. Session (New table for session management)
CREATE TABLE Session (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(512) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    INDEX idx_user_token (user_id, token)
);

-- Triggers
DELIMITER //
CREATE TRIGGER after_appointment_completed
AFTER UPDATE ON Appointment
FOR EACH ROW
BEGIN
    IF NEW.status_id = 2 THEN
        DECLARE total_treat DECIMAL(10,2) DEFAULT 0;
        SELECT COALESCE(SUM(tc.base_price), 0) INTO total_treat
        FROM Treatment t 
        JOIN Treatment_Catalogue tc ON t.treatment_service_code = tc.treatment_service_code
        WHERE t.medical_record_id IN (
            SELECT medical_record_id FROM MedicalRecord WHERE appointment_id = NEW.appointment_id
        );
        INSERT INTO Invoice (appointment_id, sub_total)
        VALUES (NEW.appointment_id, total_treat + 50.00);
    END IF;
END//
DELIMITER ;

CREATE TRIGGER after_payment_made
AFTER INSERT ON Payments
FOR EACH ROW
BEGIN
    UPDATE Invoice SET 
        status = CASE 
            WHEN (SELECT COALESCE(SUM(amount), 0) FROM Payments WHERE invoice_id = NEW.invoice_id) >= sub_total
            THEN 'Completed' ELSE 'Pending' 
        END
    WHERE invoice_id = NEW.invoice_id;
END//
DELIMITER ;

-- Stored Procedures and Functions
DELIMITER //
CREATE PROCEDURE GenerateBranchReport(IN report_date DATE)
BEGIN
    SELECT b.branch_name AS branch, s.status_name AS status,
           COUNT(a.appointment_id) AS count
    FROM Appointment a
    JOIN Branch b ON a.time_slot_id IN (
        SELECT time_slot_id FROM Timeslot WHERE branch_id = b.branch_id
    )
    JOIN Status s ON a.status_id = s.status_id
    WHERE DATE(a.created_at) = report_date
    GROUP BY b.branch_name, s.status_name;
END//
DELIMITER ;

DELIMITER //
CREATE FUNCTION CalculateOutstanding(invoice_id INT) RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE total DECIMAL(10,2);
    DECLARE paid DECIMAL(10,2) DEFAULT 0;
    SELECT sub_total INTO total FROM Invoice WHERE invoice_id = invoice_id;
    SELECT COALESCE(SUM(amount), 0) INTO paid FROM Payments WHERE invoice_id = invoice_id;
    RETURN total - paid;
END//
DELIMITER ;

DELIMITER //
CREATE PROCEDURE SubmitClaim(IN inv_id INT, IN ins_id INT)
BEGIN
    DECLARE claimed DECIMAL(10,2);
    DECLARE total DECIMAL(10,2);
    SELECT sub_total INTO total FROM Invoice WHERE invoice_id = inv_id;
    SET claimed = total * 0.8;
    INSERT INTO Claims (insurance_id, invoice_id, date, claimed_amount)
    VALUES (ins_id, inv_id, CURDATE(), claimed);
END//
DELIMITER ;