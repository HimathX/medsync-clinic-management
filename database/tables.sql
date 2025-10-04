-- Address Table
CREATE TABLE address(
    address_id CHAR(36) PRIMARY KEY,
    address_line1 VARCHAR(50) NOT NULL,
    address_line2 VARCHAR(50),
    city VARCHAR(50) NOT NULL,
    province VARCHAR(50) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'Sri Lanka',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Contact Table
CREATE TABLE contact(
    contact_id CHAR(36) PRIMARY KEY,
    contact_num1 VARCHAR(20) NOT NULL,
    contact_num2 VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (contact_num1 REGEXP '^[+]?[0-9]{10,15}$')
);

-- User Table
CREATE TABLE user (
    user_id CHAR(36) PRIMARY KEY,
    address_id CHAR(36) NOT NULL,
    user_type ENUM('patient', 'employee') NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    NIC VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE, 
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    DOB DATE NOT NULL,
    contact_id CHAR(36) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (address_id) REFERENCES address(address_id) ON DELETE RESTRICT,
    FOREIGN KEY (contact_id) REFERENCES contact(contact_id) ON DELETE RESTRICT,
    CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Branches Table
CREATE TABLE branch(
    branch_id CHAR(36) PRIMARY KEY,
    branch_name VARCHAR(50) NOT NULL UNIQUE,
    contact_id CHAR(36) NOT NULL,
    address_id CHAR(36) NOT NULL,
    manager_id CHAR(36),  -- FK constraint added later
    is_active BOOL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contact(contact_id) ON DELETE RESTRICT,
    FOREIGN KEY (address_id) REFERENCES address(address_id) ON DELETE RESTRICT
);

-- Patient Table
CREATE TABLE patient(
    patient_id CHAR(36) PRIMARY KEY,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-') NOT NULL,
    registered_branch_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (registered_branch_id) REFERENCES branch(branch_id) ON DELETE RESTRICT
);

-- Patient Allergy Table
CREATE TABLE patient_allergy(
    patient_allergy_id CHAR(36) PRIMARY KEY,
    patient_id CHAR(36) NOT NULL,
    allergy_name VARCHAR(50) NOT NULL,
    severity ENUM('Mild', 'Moderate', 'Severe', 'Life-threatening') DEFAULT 'Mild',
    reaction_description VARCHAR(200),
    diagnosed_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE RESTRICT
);
-- Conditions Category Table
CREATE TABLE conditions_category(
    condition_category_id CHAR(36) PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Conditions Table
CREATE TABLE conditions(
    condition_id CHAR(36) PRIMARY KEY,
    condition_category_id CHAR(36) NOT NULL,
    condition_name VARCHAR(50) NOT NULL,
    description TEXT,
    severity ENUM('Mild', 'Moderate', 'Severe', 'Critical'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (condition_category_id) REFERENCES conditions_category(condition_category_id) ON DELETE RESTRICT,
    UNIQUE KEY unique_condition_name (condition_name, condition_category_id)
);

-- Patient Condition Table
CREATE TABLE patient_condition(
    patient_id CHAR(36) NOT NULL,
    condition_id CHAR(36) NOT NULL,
    diagnosed_date DATE NOT NULL,
    is_chronic BOOL DEFAULT FALSE,
    current_status ENUM('Active', 'In Treatment', 'Managed', 'Resolved') DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (patient_id, condition_id),
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE RESTRICT,
    FOREIGN KEY (condition_id) REFERENCES conditions(condition_id) ON DELETE RESTRICT
);

-- Employee Table
CREATE TABLE employee(
    employee_id CHAR(36) PRIMARY KEY,
    branch_id CHAR(36) NOT NULL,
    role ENUM('doctor', 'nurse', 'admin', 'receptionist', 'manager') NOT NULL,
    salary DECIMAL(10,2) NOT NULL,
    joined_date DATE NOT NULL,
    end_date DATE,
    is_active BOOL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE RESTRICT,
    CHECK (salary > 0),
    CHECK (end_date IS NULL OR end_date >= joined_date)
);

-- Add manager_id FK constraint after employee table exists
ALTER TABLE branch
ADD CONSTRAINT fk_branch_manager 
FOREIGN KEY (manager_id) REFERENCES employee(employee_id) ON DELETE SET NULL;

-- Doctor Table
CREATE TABLE doctor(
    doctor_id CHAR(36) PRIMARY KEY,
    room_no VARCHAR(5),
    medical_licence_no VARCHAR(50) NOT NULL UNIQUE,
    consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_available BOOL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES employee(employee_id) ON DELETE CASCADE,
    CHECK (consultation_fee >= 0)
);

-- Specialization Table
CREATE TABLE specialization(
    specialization_id CHAR(36) PRIMARY KEY,
    specialization_title VARCHAR(50) NOT NULL UNIQUE,
    other_details VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Doctor Specialization Table
CREATE TABLE doctor_specialization(
    doctor_id CHAR(36) NOT NULL,
    specialization_id CHAR(36) NOT NULL,
    certification_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (doctor_id, specialization_id),
    FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (specialization_id) REFERENCES specialization(specialization_id) ON DELETE RESTRICT
);

-- Time Slot Table
CREATE TABLE time_slot(
    time_slot_id CHAR(36) PRIMARY KEY,
    doctor_id CHAR(36) NOT NULL,
    branch_id CHAR(36) NOT NULL,
    available_date DATE NOT NULL,
    is_booked BOOL DEFAULT FALSE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE RESTRICT,
    UNIQUE KEY unique_time_slot (doctor_id, branch_id, available_date, start_time, end_time),
    CHECK (end_time > start_time)
);

-- Appointment Table
CREATE TABLE appointment(
    appointment_id CHAR(36) PRIMARY KEY,
    time_slot_id CHAR(36) NOT NULL UNIQUE,
    patient_id CHAR(36) NOT NULL,
    status ENUM('Scheduled', 'Completed', 'Cancelled', 'No-Show') DEFAULT 'Scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (time_slot_id) REFERENCES time_slot(time_slot_id) ON DELETE RESTRICT,
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE RESTRICT
);

-- Consultation Record Table
CREATE TABLE consultation_record(
    consultation_rec_id CHAR(36) PRIMARY KEY,
    appointment_id CHAR(36) NOT NULL UNIQUE,
    symptoms TEXT NOT NULL,
    diagnoses TEXT NOT NULL,
    follow_up_required BOOL DEFAULT FALSE,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointment(appointment_id) ON DELETE RESTRICT
);

-- Treatment Catalogue Table
CREATE TABLE treatment_catalogue(
    treatment_service_code CHAR(36) PRIMARY KEY,
    treatment_name VARCHAR(100) NOT NULL UNIQUE,
    base_price DECIMAL(10,2) NOT NULL,
    duration TIME NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (base_price > 0)
);

-- Treatment Table
CREATE TABLE treatment(
    treatment_id CHAR(36) PRIMARY KEY,
    consultation_rec_id CHAR(36) NOT NULL,
    treatment_service_code CHAR(36) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (consultation_rec_id) REFERENCES consultation_record(consultation_rec_id) ON DELETE RESTRICT,
    FOREIGN KEY (treatment_service_code) REFERENCES treatment_catalogue(treatment_service_code) ON DELETE RESTRICT
);

-- medication table
CREATE TABLE medication (
  medication_id CHAR(36) PRIMARY KEY,
  generic_name VARCHAR(50) NOT NULL,
  manufacturer VARCHAR(50) NOT NULL,
  form ENUM('Tablet','Capsule','Injection','Syrup','Other') NOT NULL,
  contraindications TEXT,
  side_effects TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE prescription_item(
    prescription_item_id CHAR(36) PRIMARY KEY,
    medication_id CHAR(36),
    consultation_rec_id CHAR(36),
    dosage VARCHAR(50),
    frequency ENUM('Once daily','Twice daily','Three times daily','As needed'),
    duration_days INT,
    instructions VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (medication_id) REFERENCES medication (medication_id) ON DELETE RESTRICT,
    FOREIGN KEY (consultation_rec_id) REFERENCES consultation_record (consultation_rec_id) ON DELETE CASCADE
);



-- Insurance Package Table
CREATE TABLE insurance_package(
    insurance_package_id CHAR(36) PRIMARY KEY,
    package_name VARCHAR(50) NOT NULL UNIQUE,
    annual_limit DECIMAL(12,2) NOT NULL,
    copayment_percentage DECIMAL(5,2) NOT NULL,
    description TEXT,
    is_active BOOL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (annual_limit > 0),
    CHECK (copayment_percentage >= 0 AND copayment_percentage <= 100)
);

-- Insurance Table
CREATE TABLE insurance(
    insurance_id CHAR(36) PRIMARY KEY,
    patient_id CHAR(36) NOT NULL,
    insurance_package_id CHAR(36) NOT NULL,
    status ENUM('Active', 'Inactive', 'Expired', 'Pending') DEFAULT 'Pending',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE RESTRICT,
    FOREIGN KEY (insurance_package_id) REFERENCES insurance_package(insurance_package_id) ON DELETE RESTRICT,
    UNIQUE KEY unique_patient_insurance (patient_id, insurance_package_id),
    CHECK (end_date > start_date)
);

-- Invoice Table (kept as original)
CREATE TABLE invoice (
    invoice_id CHAR(36) PRIMARY KEY,
    consultation_rec_id CHAR(36) NOT NULL UNIQUE, 
    sub_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (consultation_rec_id) REFERENCES consultation_record(consultation_rec_id) ON DELETE CASCADE,
    CHECK (sub_total >= 0),
    CHECK (tax_amount >= 0)
);

-- Payment Table (kept as original)
CREATE TABLE payment(
    payment_id CHAR(36) PRIMARY KEY,
    patient_id CHAR(36) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_method ENUM('Cash', 'Credit Card', 'Debit Card', 'Online', 'Insurance', 'Other') NOT NULL,
    status ENUM('Completed', 'Pending', 'Failed', 'Refunded') DEFAULT 'Pending',
    payment_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE RESTRICT,
    CHECK (amount_paid > 0)
);

-- Claim Table (kept as original)
CREATE TABLE claim(
    claim_id CHAR(36) PRIMARY KEY,
    invoice_id CHAR(36) NOT NULL,
    insurance_id CHAR(36) NOT NULL,
    claim_amount DECIMAL(12,2) NOT NULL,
    claim_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoice(invoice_id) ON DELETE RESTRICT,
    FOREIGN KEY (insurance_id) REFERENCES insurance(insurance_id) ON DELETE RESTRICT,
    CHECK (claim_amount > 0)
);