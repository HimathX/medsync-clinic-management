-- ============================================
-- MedSync Complete Database Backup
-- Generated: 2025-10-16 13:12:00
-- ============================================

-- ============================================
-- MedSync Schema (DDL) Export
-- Generated: 2025-10-16 13:12:00
-- ============================================

CREATE DATABASE IF NOT EXISTS `medsync_db`;
USE `medsync_db`;

-- ============================================
-- Table: address
-- ============================================
DROP TABLE IF EXISTS `address`;

CREATE TABLE `address` (
  `address_id` char(36) NOT NULL,
  `address_line1` varchar(50) NOT NULL,
  `address_line2` varchar(50) DEFAULT NULL,
  `city` varchar(50) NOT NULL,
  `province` varchar(50) NOT NULL,
  `postal_code` varchar(20) NOT NULL,
  `country` varchar(50) NOT NULL DEFAULT 'Sri Lanka',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: appointment
-- ============================================
DROP TABLE IF EXISTS `appointment`;

CREATE TABLE `appointment` (
  `appointment_id` char(36) NOT NULL,
  `time_slot_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `status` enum('Scheduled','Completed','Cancelled','No-Show') DEFAULT 'Scheduled',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`appointment_id`),
  UNIQUE KEY `time_slot_id` (`time_slot_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `appointment_ibfk_1` FOREIGN KEY (`time_slot_id`) REFERENCES `time_slot` (`time_slot_id`) ON DELETE RESTRICT,
  CONSTRAINT `appointment_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: branch
-- ============================================
DROP TABLE IF EXISTS `branch`;

CREATE TABLE `branch` (
  `branch_id` char(36) NOT NULL,
  `branch_name` varchar(50) NOT NULL,
  `contact_id` char(36) NOT NULL,
  `address_id` char(36) NOT NULL,
  `manager_id` char(36) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`branch_id`),
  UNIQUE KEY `branch_name` (`branch_name`),
  KEY `contact_id` (`contact_id`),
  KEY `address_id` (`address_id`),
  KEY `fk_branch_manager` (`manager_id`),
  CONSTRAINT `branch_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contact` (`contact_id`) ON DELETE RESTRICT,
  CONSTRAINT `branch_ibfk_2` FOREIGN KEY (`address_id`) REFERENCES `address` (`address_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_branch_manager` FOREIGN KEY (`manager_id`) REFERENCES `employee` (`employee_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: claim
-- ============================================
DROP TABLE IF EXISTS `claim`;

CREATE TABLE `claim` (
  `claim_id` char(36) NOT NULL,
  `invoice_id` char(36) NOT NULL,
  `insurance_id` char(36) NOT NULL,
  `claim_amount` decimal(12,2) NOT NULL,
  `claim_date` date NOT NULL DEFAULT (curdate()),
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`claim_id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `insurance_id` (`insurance_id`),
  CONSTRAINT `claim_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoice` (`invoice_id`) ON DELETE RESTRICT,
  CONSTRAINT `claim_ibfk_2` FOREIGN KEY (`insurance_id`) REFERENCES `insurance` (`insurance_id`) ON DELETE RESTRICT,
  CONSTRAINT `claim_chk_1` CHECK ((`claim_amount` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: conditions
-- ============================================
DROP TABLE IF EXISTS `conditions`;

CREATE TABLE `conditions` (
  `condition_id` char(36) NOT NULL,
  `condition_category_id` char(36) NOT NULL,
  `condition_name` varchar(50) NOT NULL,
  `description` text,
  `severity` enum('Mild','Moderate','Severe','Critical') DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`condition_id`),
  UNIQUE KEY `unique_condition_name` (`condition_name`,`condition_category_id`),
  KEY `condition_category_id` (`condition_category_id`),
  CONSTRAINT `conditions_ibfk_1` FOREIGN KEY (`condition_category_id`) REFERENCES `conditions_category` (`condition_category_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: conditions_category
-- ============================================
DROP TABLE IF EXISTS `conditions_category`;

CREATE TABLE `conditions_category` (
  `condition_category_id` char(36) NOT NULL,
  `category_name` varchar(50) NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`condition_category_id`),
  UNIQUE KEY `category_name` (`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: consultation_record
-- ============================================
DROP TABLE IF EXISTS `consultation_record`;

CREATE TABLE `consultation_record` (
  `consultation_rec_id` char(36) NOT NULL,
  `appointment_id` char(36) NOT NULL,
  `symptoms` text NOT NULL,
  `diagnoses` text NOT NULL,
  `follow_up_required` tinyint(1) DEFAULT '0',
  `follow_up_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`consultation_rec_id`),
  UNIQUE KEY `appointment_id` (`appointment_id`),
  CONSTRAINT `consultation_record_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`appointment_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: contact
-- ============================================
DROP TABLE IF EXISTS `contact`;

CREATE TABLE `contact` (
  `contact_id` char(36) NOT NULL,
  `contact_num1` varchar(20) NOT NULL,
  `contact_num2` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`contact_id`),
  CONSTRAINT `contact_chk_1` CHECK (regexp_like(`contact_num1`,_utf8mb4'^[+]?[0-9]{10,15}$'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: doctor
-- ============================================
DROP TABLE IF EXISTS `doctor`;

CREATE TABLE `doctor` (
  `doctor_id` char(36) NOT NULL,
  `room_no` varchar(5) DEFAULT NULL,
  `medical_licence_no` varchar(50) NOT NULL,
  `consultation_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `is_available` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`doctor_id`),
  UNIQUE KEY `medical_licence_no` (`medical_licence_no`),
  CONSTRAINT `doctor_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `employee` (`employee_id`) ON DELETE CASCADE,
  CONSTRAINT `doctor_chk_1` CHECK ((`consultation_fee` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: doctor_specialization
-- ============================================
DROP TABLE IF EXISTS `doctor_specialization`;

CREATE TABLE `doctor_specialization` (
  `doctor_id` char(36) NOT NULL,
  `specialization_id` char(36) NOT NULL,
  `certification_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`doctor_id`,`specialization_id`),
  KEY `specialization_id` (`specialization_id`),
  CONSTRAINT `doctor_specialization_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`) ON DELETE CASCADE,
  CONSTRAINT `doctor_specialization_ibfk_2` FOREIGN KEY (`specialization_id`) REFERENCES `specialization` (`specialization_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: employee
-- ============================================
DROP TABLE IF EXISTS `employee`;

CREATE TABLE `employee` (
  `employee_id` char(36) NOT NULL,
  `branch_id` char(36) NOT NULL,
  `role` enum('doctor','nurse','admin','receptionist','manager') NOT NULL,
  `salary` decimal(10,2) NOT NULL,
  `joined_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`employee_id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `employee_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE RESTRICT,
  CONSTRAINT `employee_chk_1` CHECK ((`salary` > 0)),
  CONSTRAINT `employee_chk_2` CHECK (((`end_date` is null) or (`end_date` >= `joined_date`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: insurance
-- ============================================
DROP TABLE IF EXISTS `insurance`;

CREATE TABLE `insurance` (
  `insurance_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `insurance_package_id` char(36) NOT NULL,
  `status` enum('Active','Inactive','Expired','Pending') DEFAULT 'Pending',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`insurance_id`),
  UNIQUE KEY `unique_patient_insurance` (`patient_id`,`insurance_package_id`),
  KEY `insurance_package_id` (`insurance_package_id`),
  CONSTRAINT `insurance_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE RESTRICT,
  CONSTRAINT `insurance_ibfk_2` FOREIGN KEY (`insurance_package_id`) REFERENCES `insurance_package` (`insurance_package_id`) ON DELETE RESTRICT,
  CONSTRAINT `insurance_chk_1` CHECK ((`end_date` > `start_date`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: insurance_package
-- ============================================
DROP TABLE IF EXISTS `insurance_package`;

CREATE TABLE `insurance_package` (
  `insurance_package_id` char(36) NOT NULL,
  `package_name` varchar(50) NOT NULL,
  `annual_limit` decimal(12,2) NOT NULL,
  `copayment_percentage` decimal(5,2) NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`insurance_package_id`),
  UNIQUE KEY `package_name` (`package_name`),
  CONSTRAINT `insurance_package_chk_1` CHECK ((`annual_limit` > 0)),
  CONSTRAINT `insurance_package_chk_2` CHECK (((`copayment_percentage` >= 0) and (`copayment_percentage` <= 100)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: invoice
-- ============================================
DROP TABLE IF EXISTS `invoice`;

CREATE TABLE `invoice` (
  `invoice_id` char(36) NOT NULL,
  `consultation_rec_id` char(36) NOT NULL,
  `sub_total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `due_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`invoice_id`),
  UNIQUE KEY `consultation_rec_id` (`consultation_rec_id`),
  CONSTRAINT `invoice_ibfk_1` FOREIGN KEY (`consultation_rec_id`) REFERENCES `consultation_record` (`consultation_rec_id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_chk_1` CHECK ((`sub_total` >= 0)),
  CONSTRAINT `invoice_chk_2` CHECK ((`tax_amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: medication
-- ============================================
DROP TABLE IF EXISTS `medication`;

CREATE TABLE `medication` (
  `medication_id` char(36) NOT NULL,
  `generic_name` varchar(50) NOT NULL,
  `manufacturer` varchar(50) NOT NULL,
  `form` enum('Tablet','Capsule','Injection','Syrup','Other') NOT NULL,
  `contraindications` text,
  `side_effects` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`medication_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: patient
-- ============================================
DROP TABLE IF EXISTS `patient`;

CREATE TABLE `patient` (
  `patient_id` char(36) NOT NULL,
  `blood_group` enum('A+','A-','B+','B-','O+','O-','AB+','AB-') NOT NULL,
  `allergies` text,
  `chronic_conditions` text,
  `registered_branch_id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`patient_id`),
  KEY `registered_branch_id` (`registered_branch_id`),
  CONSTRAINT `patient_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `patient_ibfk_2` FOREIGN KEY (`registered_branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: patient_allergy
-- ============================================
DROP TABLE IF EXISTS `patient_allergy`;

CREATE TABLE `patient_allergy` (
  `patient_allergy_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `allergy_name` varchar(50) NOT NULL,
  `severity` enum('Mild','Moderate','Severe','Life-threatening') DEFAULT 'Mild',
  `reaction_description` varchar(200) DEFAULT NULL,
  `diagnosed_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`patient_allergy_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `patient_allergy_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: patient_condition
-- ============================================
DROP TABLE IF EXISTS `patient_condition`;

CREATE TABLE `patient_condition` (
  `patient_id` char(36) NOT NULL,
  `condition_id` char(36) NOT NULL,
  `diagnosed_date` date NOT NULL,
  `is_chronic` tinyint(1) DEFAULT '0',
  `current_status` enum('Active','In Treatment','Managed','Resolved') DEFAULT 'Active',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`patient_id`,`condition_id`),
  KEY `condition_id` (`condition_id`),
  CONSTRAINT `patient_condition_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE RESTRICT,
  CONSTRAINT `patient_condition_ibfk_2` FOREIGN KEY (`condition_id`) REFERENCES `conditions` (`condition_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: payment
-- ============================================
DROP TABLE IF EXISTS `payment`;

CREATE TABLE `payment` (
  `payment_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `payment_method` enum('Cash','Credit Card','Debit Card','Online','Insurance','Other') NOT NULL,
  `status` enum('Completed','Pending','Failed','Refunded') DEFAULT 'Pending',
  `payment_date` date NOT NULL DEFAULT (curdate()),
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE RESTRICT,
  CONSTRAINT `payment_chk_1` CHECK ((`amount_paid` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: prescription_item
-- ============================================
DROP TABLE IF EXISTS `prescription_item`;

CREATE TABLE `prescription_item` (
  `prescription_item_id` char(36) NOT NULL,
  `medication_id` char(36) DEFAULT NULL,
  `consultation_rec_id` char(36) DEFAULT NULL,
  `dosage` varchar(50) DEFAULT NULL,
  `frequency` enum('Once daily','Twice daily','Three times daily','As needed') DEFAULT NULL,
  `duration_days` int DEFAULT NULL,
  `instructions` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`prescription_item_id`),
  KEY `medication_id` (`medication_id`),
  KEY `consultation_rec_id` (`consultation_rec_id`),
  CONSTRAINT `prescription_item_ibfk_1` FOREIGN KEY (`medication_id`) REFERENCES `medication` (`medication_id`) ON DELETE RESTRICT,
  CONSTRAINT `prescription_item_ibfk_2` FOREIGN KEY (`consultation_rec_id`) REFERENCES `consultation_record` (`consultation_rec_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: specialization
-- ============================================
DROP TABLE IF EXISTS `specialization`;

CREATE TABLE `specialization` (
  `specialization_id` char(36) NOT NULL,
  `specialization_title` varchar(50) NOT NULL,
  `other_details` varchar(200) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`specialization_id`),
  UNIQUE KEY `specialization_title` (`specialization_title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: time_slot
-- ============================================
DROP TABLE IF EXISTS `time_slot`;

CREATE TABLE `time_slot` (
  `time_slot_id` char(36) NOT NULL,
  `doctor_id` char(36) NOT NULL,
  `branch_id` char(36) NOT NULL,
  `available_date` date NOT NULL,
  `is_booked` tinyint(1) DEFAULT '0',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`time_slot_id`),
  UNIQUE KEY `unique_time_slot` (`doctor_id`,`branch_id`,`available_date`,`start_time`,`end_time`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `time_slot_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`doctor_id`) ON DELETE CASCADE,
  CONSTRAINT `time_slot_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE RESTRICT,
  CONSTRAINT `time_slot_chk_1` CHECK ((`end_time` > `start_time`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: treatment
-- ============================================
DROP TABLE IF EXISTS `treatment`;

CREATE TABLE `treatment` (
  `treatment_id` char(36) NOT NULL,
  `consultation_rec_id` char(36) NOT NULL,
  `treatment_service_code` char(36) NOT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`treatment_id`),
  KEY `consultation_rec_id` (`consultation_rec_id`),
  KEY `treatment_service_code` (`treatment_service_code`),
  CONSTRAINT `treatment_ibfk_1` FOREIGN KEY (`consultation_rec_id`) REFERENCES `consultation_record` (`consultation_rec_id`) ON DELETE RESTRICT,
  CONSTRAINT `treatment_ibfk_2` FOREIGN KEY (`treatment_service_code`) REFERENCES `treatment_catalogue` (`treatment_service_code`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: treatment_catalogue
-- ============================================
DROP TABLE IF EXISTS `treatment_catalogue`;

CREATE TABLE `treatment_catalogue` (
  `treatment_service_code` char(36) NOT NULL,
  `treatment_name` varchar(100) NOT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `duration` time NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`treatment_service_code`),
  UNIQUE KEY `treatment_name` (`treatment_name`),
  CONSTRAINT `treatment_catalogue_chk_1` CHECK ((`base_price` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- Table: user
-- ============================================
DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `user_id` char(36) NOT NULL,
  `address_id` char(36) NOT NULL,
  `user_type` enum('patient','employee','doctor') NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `NIC` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `DOB` date NOT NULL,
  `contact_id` char(36) NOT NULL,
  `password_hash` varchar(64) NOT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `NIC` (`NIC`),
  UNIQUE KEY `email` (`email`),
  KEY `address_id` (`address_id`),
  KEY `contact_id` (`contact_id`),
  CONSTRAINT `user_ibfk_1` FOREIGN KEY (`address_id`) REFERENCES `address` (`address_id`) ON DELETE RESTRICT,
  CONSTRAINT `user_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contact` (`contact_id`) ON DELETE RESTRICT,
  CONSTRAINT `user_chk_1` CHECK (regexp_like(`email`,_utf8mb4'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Z|a-z]{2,}$'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- ============================================
-- MedSync Stored Procedures Export
-- Generated: 2025-10-16 13:12:00
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

DELIMITER ;


-- ============================================
-- MedSync Functions Export
-- Generated: 2025-10-16 13:12:00
-- ============================================

USE `medsync_db`;

DELIMITER $$

-- Function: CalculateAge
DROP FUNCTION IF EXISTS `CalculateAge`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `CalculateAge`(p_dob DATE) RETURNS int
    DETERMINISTIC
BEGIN
    RETURN TIMESTAMPDIFF(YEAR, p_dob, CURDATE());
END$$

-- Function: CalculateDiscount
DROP FUNCTION IF EXISTS `CalculateDiscount`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `CalculateDiscount`(
    p_base_amount DECIMAL(10,2),
    p_discount_percentage DECIMAL(5,2)
) RETURNS decimal(10,2)
    DETERMINISTIC
BEGIN
    RETURN p_base_amount * (p_discount_percentage / 100);
END$$

-- Function: CalculateInsuranceCoverage
DROP FUNCTION IF EXISTS `CalculateInsuranceCoverage`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `CalculateInsuranceCoverage`(
    p_bill_amount DECIMAL(10,2),
    p_copayment_percentage DECIMAL(5,2)
) RETURNS decimal(10,2)
    DETERMINISTIC
BEGIN
    DECLARE coverage_amount DECIMAL(10,2);
    SET coverage_amount = p_bill_amount * ((100 - p_copayment_percentage) / 100);
    RETURN coverage_amount;
END$$

-- Function: CountPatientAppointments
DROP FUNCTION IF EXISTS `CountPatientAppointments`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `CountPatientAppointments`(
    p_patient_id CHAR(36),
    p_status VARCHAR(20)
) RETURNS int
    READS SQL DATA
BEGIN
    DECLARE appointment_count INT;
    
    SELECT COUNT(*) INTO appointment_count
    FROM appointment
    WHERE patient_id = p_patient_id
    AND (p_status IS NULL OR status = p_status);
    
    RETURN appointment_count;
END$$

-- Function: GenerateInvoiceNumber
DROP FUNCTION IF EXISTS `GenerateInvoiceNumber`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `GenerateInvoiceNumber`(p_branch_id CHAR(36)) RETURNS varchar(20) CHARSET utf8mb4
    READS SQL DATA
BEGIN
    DECLARE branch_code VARCHAR(5);
    DECLARE invoice_count INT;
    DECLARE invoice_number VARCHAR(20);
    
    SELECT UPPER(LEFT(branch_name, 3)) INTO branch_code
    FROM branch WHERE branch_id = p_branch_id;
    
    SELECT COUNT(*) + 1 INTO invoice_count
    FROM bill WHERE created_at >= CURDATE();
    
    SET invoice_number = CONCAT(
        branch_code, '-',
        DATE_FORMAT(NOW(), '%Y%m%d'), '-',
        LPAD(invoice_count, 4, '0')
    );
    
    RETURN invoice_number;
END$$

-- Function: GetBranchName
DROP FUNCTION IF EXISTS `GetBranchName`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `GetBranchName`(p_branch_id CHAR(36)) RETURNS varchar(50) CHARSET utf8mb4
    READS SQL DATA
BEGIN
    DECLARE branch_name VARCHAR(50);
    
    SELECT branch_name INTO branch_name
    FROM branch
    WHERE branch_id = p_branch_id;
    
    RETURN COALESCE(branch_name, 'Unknown');
END$$

-- Function: GetConsultationDuration
DROP FUNCTION IF EXISTS `GetConsultationDuration`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `GetConsultationDuration`(p_consultation_id CHAR(36)) RETURNS int
    READS SQL DATA
BEGIN
    DECLARE duration_minutes INT;
    
    SELECT TIMESTAMPDIFF(MINUTE, created_at, updated_at) INTO duration_minutes
    FROM consultation
    WHERE consultation_id = p_consultation_id;
    
    RETURN COALESCE(duration_minutes, 0);
END$$

-- Function: GetPatientName
DROP FUNCTION IF EXISTS `GetPatientName`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `GetPatientName`(p_patient_id CHAR(36)) RETURNS varchar(255) CHARSET utf8mb4
    READS SQL DATA
BEGIN
    DECLARE patient_name VARCHAR(255);
    
    SELECT u.full_name INTO patient_name
    FROM user u
    WHERE u.user_id = p_patient_id;
    
    RETURN COALESCE(patient_name, 'Unknown');
END$$

-- Function: IsDoctorAvailable
DROP FUNCTION IF EXISTS `IsDoctorAvailable`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `IsDoctorAvailable`(
    p_doctor_id CHAR(36),
    p_date DATE,
    p_time TIME
) RETURNS tinyint(1)
    READS SQL DATA
BEGIN
    DECLARE slot_available INT;
    
    SELECT COUNT(*) INTO slot_available
    FROM time_slot
    WHERE doctor_id = p_doctor_id
    AND available_date = p_date
    AND start_time <= p_time
    AND end_time > p_time
    AND is_booked = FALSE;
    
    RETURN slot_available > 0;
END$$

-- Function: IsInsuranceActive
DROP FUNCTION IF EXISTS `IsInsuranceActive`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `IsInsuranceActive`(p_patient_id CHAR(36)) RETURNS tinyint(1)
    READS SQL DATA
BEGIN
    DECLARE active_count INT;
    
    SELECT COUNT(*) INTO active_count
    FROM insurance
    WHERE patient_id = p_patient_id
    AND status = 'Active'
    AND end_date >= CURDATE();
    
    RETURN active_count > 0;
END$$

-- Function: IsValidEmail
DROP FUNCTION IF EXISTS `IsValidEmail`$$

CREATE DEFINER=`root`@`localhost` FUNCTION `IsValidEmail`(p_email VARCHAR(255)) RETURNS tinyint(1)
    DETERMINISTIC
BEGIN
    RETURN p_email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$';
END$$

DELIMITER ;


-- ============================================
-- MedSync Triggers Export
-- Generated: 2025-10-16 13:12:00
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

-- Trigger: log_user_login
DROP TRIGGER IF EXISTS `log_user_login`$$

CREATE DEFINER=`root`@`localhost` TRIGGER `log_user_login` AFTER UPDATE ON `user` FOR EACH ROW BEGIN
    IF NEW.last_login != OLD.last_login THEN
        INSERT INTO audit_log (user_id, action, timestamp)
        VALUES (NEW.user_id, 'LOGIN', NOW());
    END IF;
END$$

DELIMITER ;


-- ============================================
-- MedSync Views Export
-- Generated: 2025-10-16 13:12:00
-- ============================================

USE `medsync_db`;

-- No views found



-- ============================================
-- MedSync Data (DML) Export
-- Generated: 2025-10-16 13:12:00
-- ============================================

USE `medsync_db`;

SET FOREIGN_KEY_CHECKS=0;

-- ============================================
-- Data for table: address (28 rows)
-- ============================================

INSERT INTO `address` (`address_id`, `address_line1`, `address_line2`, `city`, `province`, `postal_code`, `country`, `created_at`, `updated_at`) VALUES
  ('16055f2e-a340-11f0-a762-005056c00001', '456 Clinic Rd', NULL, 'Colombo 08', 'Western', '00800', 'Sri Lanka', '2025-10-07 11:10:09', '2025-10-07 11:10:09'),
  ('16208987-a340-11f0-a762-005056c00001', '789 Doc Residence', NULL, 'Colombo 07', 'Western', '00700', 'Sri Lanka', '2025-10-07 11:10:09', '2025-10-07 11:10:09'),
  ('164311a3-a9a9-11f0-afdd-005056c00001', '78 Beach View Avenue', 'Negombo', 'Negombo', 'Western', '11500', 'Sri Lanka', '2025-10-15 14:56:53', '2025-10-15 14:56:53'),
  ('1aaf38d7-a165-11f0-ba84-005056c00001', '123 Test Street', 'Unit 5A', 'Colombo', 'Western', '00100', 'Sri Lanka', '2025-10-05 02:30:05', '2025-10-05 02:30:05'),
  ('1b1de237-a34d-11f0-a762-005056c00001', '12 Flower Avenue', 'Nawala', 'Kotte', 'Western', '10100', 'Sri Lanka', '2025-10-07 12:43:21', '2025-10-07 12:43:21'),
  ('22c1226d-a9a6-11f0-afdd-005056c00001', '12 Kandy Road', 'Peradeniya', 'Kandy', 'Central', '20000', 'Sri Lanka', '2025-10-15 14:35:46', '2025-10-15 14:35:46'),
  ('3abeb001-a167-11f0-ba84-005056c00001', '321 Youth Ave', NULL, 'Matara', 'Southern', '81000', 'Sri Lanka', '2025-10-05 02:45:18', '2025-10-05 02:45:18'),
  ('4e120a51-a9c0-11f0-afdd-005056c00001', '123 Hospital Road', 'Near City Center', 'Colombo', 'Western', '00100', 'Sri Lanka', '2025-10-15 17:43:05', '2025-10-15 17:43:05'),
  ('5f5c6103-a167-11f0-ba84-005056c00001', '111 Staff St', 'Apt 10', 'Colombo', 'Western', '00300', 'Sri Lanka', '2025-10-05 02:46:20', '2025-10-05 02:46:20'),
  ('81921012-a022-11f0-b3b5-005056c00001', '123 Galle Road', 'Colombo 03', 'Colombo', 'Western', '00300', 'Sri Lanka', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('8194e2d9-a022-11f0-b3b5-005056c00001', '456 Kandy Road', 'Peradeniya', 'Kandy', 'Central', '20400', 'Sri Lanka', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('8194f1d0-a022-11f0-b3b5-005056c00001', '789 Matara Road', 'Galle Fort', 'Galle', 'Southern', '80000', 'Sri Lanka', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('8194f460-a022-11f0-b3b5-005056c00001', '12 Temple Street', 'Wellawatta', 'Colombo', 'Western', '00600', 'Sri Lanka', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('8194f578-a022-11f0-b3b5-005056c00001', '34 Lake View Road', 'Rajagiriya', 'Colombo', 'Western', '10100', 'Sri Lanka', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('8194f65d-a022-11f0-b3b5-005056c00001', '56 Hill Street', 'Kandy', 'Kandy', 'Central', '20000', 'Sri Lanka', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('8194f745-a022-11f0-b3b5-005056c00001', '78 Beach Road', 'Mount Lavinia', 'Colombo', 'Western', '10370', 'Sri Lanka', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('8194f81e-a022-11f0-b3b5-005056c00001', '90 Station Road', 'Gampaha', 'Gampaha', 'Western', '11000', 'Sri Lanka', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('8194f91a-a022-11f0-b3b5-005056c00001', '11 Park Avenue', 'Nugegoda', 'Colombo', 'Western', '10250', 'Sri Lanka', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('8194fa04-a022-11f0-b3b5-005056c00001', '22 Green Lane', 'Moratuwa', 'Colombo', 'Western', '10400', 'Sri Lanka', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('8194faf9-a022-11f0-b3b5-005056c00001', '33 Doctor Lane', 'Colombo 07', 'Colombo', 'Western', '00700', 'Sri Lanka', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('8194fbd4-a022-11f0-b3b5-005056c00001', '44 Hospital Road', 'Kandy', 'Kandy', 'Central', '20000', 'Sri Lanka', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('8194fca8-a022-11f0-b3b5-005056c00001', '55 Medical Street', 'Galle', 'Galle', 'Southern', '80000', 'Sri Lanka', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('8194ff2b-a022-11f0-b3b5-005056c00001', '66 Clinic Avenue', 'Colombo 05', 'Colombo', 'Western', '00500', 'Sri Lanka', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81950038-a022-11f0-b3b5-005056c00001', '77 Health Road', 'Peradeniya', 'Kandy', 'Central', '20400', 'Sri Lanka', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('89934232-a9b7-11f0-afdd-005056c00001', '56 Hospital Lane', 'Kurunegala', 'Kurunegala', 'North Western', '60000', 'Sri Lanka', '2025-10-15 16:40:20', '2025-10-15 16:40:20'),
  ('9d26ef9d-a9b0-11f0-afdd-005056c00001', '210 Temple Road', 'Matara', 'Matara', 'Southern', '81000', 'Sri Lanka', '2025-10-15 15:50:46', '2025-10-15 15:50:46'),
  ('e8090cc9-a9b8-11f0-afdd-005056c00001', '142 Temple Garden Road', 'Anuradhapura', 'Anuradhapura', 'North Central', '50000', 'Sri Lanka', '2025-10-15 16:50:08', '2025-10-15 16:50:08'),
  ('eb066fd4-a9be-11f0-afdd-005056c00001', '123 Hospital Road', 'Near City Center', 'Colombo', 'Western', '00100', 'Sri Lanka', '2025-10-15 17:33:10', '2025-10-15 17:33:10');

-- ============================================
-- Data for table: appointment (1 rows)
-- ============================================

INSERT INTO `appointment` (`appointment_id`, `time_slot_id`, `patient_id`, `status`, `notes`, `created_at`, `updated_at`) VALUES
  ('60d61664-aa37-11f0-afdd-005056c00001', 'd557782e-a9d5-11f0-afdd-005056c00001', '16431244-a9a9-11f0-afdd-005056c00001', 'Completed', 'Patient completed consultation', '2025-10-16 07:55:27', '2025-10-16 08:50:21');

-- ============================================
-- Data for table: branch (3 rows)
-- ============================================

INSERT INTO `branch` (`branch_id`, `branch_name`, `contact_id`, `address_id`, `manager_id`, `is_active`, `created_at`, `updated_at`) VALUES
  ('81a3303f-a022-11f0-b3b5-005056c00001', 'MedSync Colombo', '81968904-a022-11f0-b3b5-005056c00001', '81921012-a022-11f0-b3b5-005056c00001', '81a5cb27-a022-11f0-b3b5-005056c00001', 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a3347c-a022-11f0-b3b5-005056c00001', 'MedSync Kandy', '81a0446f-a022-11f0-b3b5-005056c00001', '8194e2d9-a022-11f0-b3b5-005056c00001', '81a5d173-a022-11f0-b3b5-005056c00001', 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a335ef-a022-11f0-b3b5-005056c00001', 'MedSync Galle', '81a04800-a022-11f0-b3b5-005056c00001', '8194f1d0-a022-11f0-b3b5-005056c00001', '81a5d543-a022-11f0-b3b5-005056c00001', 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51');

-- ============================================
-- Data for table: claim (1 rows)
-- ============================================

INSERT INTO `claim` (`claim_id`, `invoice_id`, `insurance_id`, `claim_amount`, `claim_date`, `notes`, `created_at`, `updated_at`) VALUES
  ('2b39103a-e6d4-456b-a0fa-c81f1233375d', '5a70244b-4640-4423-ba08-05269ac034d3', '62bad6a6-a9e3-11f0-afdd-005056c00001', '1.00', '2025-10-16', 'Initial Claim', '2025-10-16 11:59:24', '2025-10-16 11:59:24');

-- ============================================
-- Data for table: conditions (4 rows)
-- ============================================

INSERT INTO `conditions` (`condition_id`, `condition_category_id`, `condition_name`, `description`, `severity`, `is_active`, `created_at`, `updated_at`) VALUES
  ('81bd79ba-a022-11f0-b3b5-005056c00001', '81bc194e-a022-11f0-b3b5-005056c00001', 'Hypertension', 'High blood pressure', 'Moderate', 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81bd7a68-a022-11f0-b3b5-005056c00001', '81bc26e3-a022-11f0-b3b5-005056c00001', 'Diabetes Type 2', 'Insulin resistance', 'Moderate', 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81bd7a93-a022-11f0-b3b5-005056c00001', '81bc29ce-a022-11f0-b3b5-005056c00001', 'Asthma', 'Chronic inflammatory airway disease', 'Mild', 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('91e65cc6-a9b4-11f0-afdd-005056c00001', '81bc194e-a022-11f0-b3b5-005056c00001', 'Hypertensions', NULL, NULL, 1, '2025-10-15 16:19:05', '2025-10-15 16:19:05');

-- ============================================
-- Data for table: conditions_category (5 rows)
-- ============================================

INSERT INTO `conditions_category` (`condition_category_id`, `category_name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
  ('81bc194e-a022-11f0-b3b5-005056c00001', 'Cardiovascular', 'Heart and blood vessel related conditions', 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81bc26e3-a022-11f0-b3b5-005056c00001', 'Metabolic', 'Metabolism related disorders', 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81bc29ce-a022-11f0-b3b5-005056c00001', 'Respiratory', 'Breathing and lung conditions', 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81bc2b3f-a022-11f0-b3b5-005056c00001', 'Musculoskeletal', 'Bones, muscles, and joints', 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81bc2dfe-a022-11f0-b3b5-005056c00001', 'Skin', 'Dermatological conditions', 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51');

-- ============================================
-- Data for table: consultation_record (1 rows)
-- ============================================

INSERT INTO `consultation_record` (`consultation_rec_id`, `appointment_id`, `symptoms`, `diagnoses`, `follow_up_required`, `follow_up_date`, `created_at`, `updated_at`) VALUES
  ('beae1ccb-aa50-11f0-afdd-005056c00001', '60d61664-aa37-11f0-afdd-005056c00001', 'Fever, headache, and sore throat for 3 days', 'Upper respiratory tract infection (URTI)', 1, '2025-10-25', '2025-10-16 10:57:02', '2025-10-16 10:57:02');

-- ============================================
-- Data for table: contact (46 rows)
-- ============================================

INSERT INTO `contact` (`contact_id`, `contact_num1`, `contact_num2`, `created_at`, `updated_at`) VALUES
  ('160561b8-a340-11f0-a762-005056c00001', '+94119876543', NULL, '2025-10-07 11:10:09', '2025-10-07 11:10:09'),
  ('162089ee-a340-11f0-a762-005056c00001', '+94115556677', NULL, '2025-10-07 11:10:09', '2025-10-07 11:10:09'),
  ('164311fd-a9a9-11f0-afdd-005056c00001', '+94784561234', '+94312233445', '2025-10-15 14:56:53', '2025-10-15 14:56:53'),
  ('1aaf3ab5-a165-11f0-ba84-005056c00001', '+94771234567', '+94112345678', '2025-10-05 02:30:06', '2025-10-05 02:30:06'),
  ('1b1de2c4-a34d-11f0-a762-005056c00001', '+94779876543', '+94112876543', '2025-10-07 12:43:21', '2025-10-07 12:43:21'),
  ('22c124f5-a9a6-11f0-afdd-005056c00001', '+94763456789', '+94812345670', '2025-10-15 14:35:46', '2025-10-15 14:35:46'),
  ('3abeb077-a167-11f0-ba84-005056c00001', '+94773333333', NULL, '2025-10-05 02:45:18', '2025-10-05 02:45:18'),
  ('4e120ae0-a9c0-11f0-afdd-005056c00001', '+94112345678', '+94771234567', '2025-10-15 17:43:05', '2025-10-15 17:43:05'),
  ('5f5c6184-a167-11f0-ba84-005056c00001', '+94775555555', NULL, '2025-10-05 02:46:20', '2025-10-05 02:46:20'),
  ('81968904-a022-11f0-b3b5-005056c00001', '+94112345001', '+94777123001', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a0446f-a022-11f0-b3b5-005056c00001', '+94812345002', '+94777123002', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a04800-a022-11f0-b3b5-005056c00001', '+94912345003', '+94777123003', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a04940-a022-11f0-b3b5-005056c00001', '+94112345101', '+94777123101', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a04a54-a022-11f0-b3b5-005056c00001', '+94112345102', '+94777123102', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a04b5b-a022-11f0-b3b5-005056c00001', '+94112345103', '+94777123103', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a04c5b-a022-11f0-b3b5-005056c00001', '+94112345104', '+94777123104', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a04d45-a022-11f0-b3b5-005056c00001', '+94112345105', '+94777123105', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a04f56-a022-11f0-b3b5-005056c00001', '+94112345106', '+94777123106', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a05070-a022-11f0-b3b5-005056c00001', '+94112345107', '+94777123107', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a05166-a022-11f0-b3b5-005056c00001', '+94112345108', '+94777123108', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a05262-a022-11f0-b3b5-005056c00001', '+94112345109', '+94777123109', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a0535a-a022-11f0-b3b5-005056c00001', '+94112345110', '+94777123110', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a05445-a022-11f0-b3b5-005056c00001', '+94112345111', '+94777123111', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a05536-a022-11f0-b3b5-005056c00001', '+94112345112', '+94777123112', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a05695-a022-11f0-b3b5-005056c00001', '+94112345113', '+94777123113', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a05790-a022-11f0-b3b5-005056c00001', '+94112345114', '+94777123114', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a05892-a022-11f0-b3b5-005056c00001', '+94112345115', '+94777123115', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a0597f-a022-11f0-b3b5-005056c00001', '+94112345116', '+94777123116', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a05aa3-a022-11f0-b3b5-005056c00001', '+94112345117', '+94777123117', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a05b97-a022-11f0-b3b5-005056c00001', '+94112345118', '+94777123118', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a05c84-a022-11f0-b3b5-005056c00001', '+94112345119', '+94777123119', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a05d7e-a022-11f0-b3b5-005056c00001', '+94112345120', '+94777123120', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a05e70-a022-11f0-b3b5-005056c00001', '+94112345201', '+94777123201', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a05f65-a022-11f0-b3b5-005056c00001', '+94112345202', '+94777123202', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a06052-a022-11f0-b3b5-005056c00001', '+94112345203', '+94777123203', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a06138-a022-11f0-b3b5-005056c00001', '+94112345204', '+94777123204', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a06220-a022-11f0-b3b5-005056c00001', '+94112345205', '+94777123205', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a06329-a022-11f0-b3b5-005056c00001', '+94112345206', '+94777123206', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a06432-a022-11f0-b3b5-005056c00001', '+94112345207', '+94777123207', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a06525-a022-11f0-b3b5-005056c00001', '+94112345208', '+94777123208', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a06613-a022-11f0-b3b5-005056c00001', '+94112345209', '+94777123209', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a06700-a022-11f0-b3b5-005056c00001', '+94112345210', '+94777123210', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('899342b5-a9b7-11f0-afdd-005056c00001', '+94372233456', '+94770123456', '2025-10-15 16:40:20', '2025-10-15 16:40:20'),
  ('9d275db0-a9b0-11f0-afdd-005056c00001', '+94791239876', '+94412223344', '2025-10-15 15:50:46', '2025-10-15 15:50:46'),
  ('e8090d29-a9b8-11f0-afdd-005056c00001', '+94252233444', '+94775678901', '2025-10-15 16:50:08', '2025-10-15 16:50:08'),
  ('eb067079-a9be-11f0-afdd-005056c00001', '+94112345678', '+94771234567', '2025-10-15 17:33:10', '2025-10-15 17:33:10');

-- ============================================
-- Data for table: doctor (7 rows)
-- ============================================

INSERT INTO `doctor` (`doctor_id`, `room_no`, `medical_licence_no`, `consultation_fee`, `is_available`, `created_at`, `updated_at`) VALUES
  ('16208a35-a340-11f0-a762-005056c00001', 'R101', 'LK-MED-12345', '2500.00', 1, '2025-10-07 11:10:09', '2025-10-07 11:10:09'),
  ('81a7fd1b-a022-11f0-b3b5-005056c00001', 'C101', 'SLMC001234', '5000.00', 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a80869-a022-11f0-b3b5-005056c00001', 'C102', 'SLMC001235', '5500.00', 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a80cfc-a022-11f0-b3b5-005056c00001', 'K101', 'SLMC001236', '4800.00', 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a81119-a022-11f0-b3b5-005056c00001', 'G101', 'SLMC001237', '4500.00', 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('8993430c-a9b7-11f0-afdd-005056c00001', 'R204', 'LK-MED-67890', '3000.00', 1, '2025-10-15 16:40:20', '2025-10-15 16:40:20'),
  ('e8090d6f-a9b8-11f0-afdd-005056c00001', 'R118', 'LK-MED-55231', '3200.00', 1, '2025-10-15 16:50:08', '2025-10-15 16:50:08');

-- ============================================
-- Data for table: doctor_specialization (5 rows)
-- ============================================

INSERT INTO `doctor_specialization` (`doctor_id`, `specialization_id`, `certification_date`, `created_at`, `updated_at`) VALUES
  ('16208a35-a340-11f0-a762-005056c00001', '81b759cf-a022-11f0-b3b5-005056c00001', '2025-01-01', '2025-10-07 11:10:09', '2025-10-07 11:10:09'),
  ('81a7fd1b-a022-11f0-b3b5-005056c00001', '81b75050-a022-11f0-b3b5-005056c00001', '2020-05-01', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a80869-a022-11f0-b3b5-005056c00001', '81b759cf-a022-11f0-b3b5-005056c00001', '2020-06-15', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a80cfc-a022-11f0-b3b5-005056c00001', '81b75cfa-a022-11f0-b3b5-005056c00001', '2020-07-20', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a81119-a022-11f0-b3b5-005056c00001', '81b767e7-a022-11f0-b3b5-005056c00001', '2020-08-10', '2025-10-03 12:00:51', '2025-10-03 12:00:51');

-- ============================================
-- Data for table: employee (17 rows)
-- ============================================

INSERT INTO `employee` (`employee_id`, `branch_id`, `role`, `salary`, `joined_date`, `end_date`, `is_active`, `created_at`, `updated_at`) VALUES
  ('16056201-a340-11f0-a762-005056c00001', '81a3303f-a022-11f0-b3b5-005056c00001', 'admin', '50000.00', '2025-01-01', NULL, 1, '2025-10-07 11:10:09', '2025-10-07 11:10:09'),
  ('16208a35-a340-11f0-a762-005056c00001', '81a3303f-a022-11f0-b3b5-005056c00001', 'doctor', '120000.00', '2025-01-01', NULL, 1, '2025-10-07 11:10:09', '2025-10-07 11:10:09'),
  ('4e120b30-a9c0-11f0-afdd-005056c00001', '81a3303f-a022-11f0-b3b5-005056c00001', 'nurse', '65000.00', '2025-01-15', NULL, 1, '2025-10-15 17:43:05', '2025-10-15 17:43:05'),
  ('5f5c61d3-a167-11f0-ba84-005056c00001', '81a3303f-a022-11f0-b3b5-005056c00001', 'nurse', '60000.00', '2024-01-15', NULL, 1, '2025-10-05 02:46:20', '2025-10-05 02:46:20'),
  ('81a5cb27-a022-11f0-b3b5-005056c00001', '81a3303f-a022-11f0-b3b5-005056c00001', 'manager', '250000.00', '2020-01-15', NULL, 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a5d173-a022-11f0-b3b5-005056c00001', '81a3347c-a022-11f0-b3b5-005056c00001', 'manager', '240000.00', '2020-02-01', NULL, 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a5d543-a022-11f0-b3b5-005056c00001', '81a335ef-a022-11f0-b3b5-005056c00001', 'manager', '245000.00', '2020-03-10', NULL, 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a7fd1b-a022-11f0-b3b5-005056c00001', '81a3303f-a022-11f0-b3b5-005056c00001', 'doctor', '180000.00', '2021-05-01', NULL, 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a80869-a022-11f0-b3b5-005056c00001', '81a3303f-a022-11f0-b3b5-005056c00001', 'doctor', '175000.00', '2021-06-15', NULL, 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a80cfc-a022-11f0-b3b5-005056c00001', '81a3347c-a022-11f0-b3b5-005056c00001', 'doctor', '170000.00', '2021-07-20', NULL, 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a81119-a022-11f0-b3b5-005056c00001', '81a335ef-a022-11f0-b3b5-005056c00001', 'doctor', '172000.00', '2021-08-10', NULL, 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a9a2ca-a022-11f0-b3b5-005056c00001', '81a3303f-a022-11f0-b3b5-005056c00001', 'nurse', '80000.00', '2022-01-10', NULL, 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a9c95c-a022-11f0-b3b5-005056c00001', '81a3347c-a022-11f0-b3b5-005056c00001', 'nurse', '78000.00', '2022-02-15', NULL, 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a9cdf5-a022-11f0-b3b5-005056c00001', '81a335ef-a022-11f0-b3b5-005056c00001', 'receptionist', '60000.00', '2022-03-01', NULL, 1, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('8993430c-a9b7-11f0-afdd-005056c00001', '81a3303f-a022-11f0-b3b5-005056c00001', 'doctor', '135000.00', '2024-09-10', NULL, 1, '2025-10-15 16:40:20', '2025-10-15 16:40:20'),
  ('e8090d6f-a9b8-11f0-afdd-005056c00001', '81a3303f-a022-11f0-b3b5-005056c00001', 'doctor', '148000.00', '2022-11-03', NULL, 1, '2025-10-15 16:50:08', '2025-10-15 16:50:08'),
  ('eb0670f9-a9be-11f0-afdd-005056c00001', '81a3303f-a022-11f0-b3b5-005056c00001', 'nurse', '65000.00', '2025-01-15', NULL, 1, '2025-10-15 17:33:10', '2025-10-15 17:33:10');

-- ============================================
-- Data for table: insurance (1 rows)
-- ============================================

INSERT INTO `insurance` (`insurance_id`, `patient_id`, `insurance_package_id`, `status`, `start_date`, `end_date`, `created_at`, `updated_at`) VALUES
  ('62bad6a6-a9e3-11f0-afdd-005056c00001', '16431244-a9a9-11f0-afdd-005056c00001', '0e4589c3-30a3-4f5d-8ab1-e55a5426dffc', 'Active', '2025-10-15', '2026-10-14', '2025-10-15 21:54:12', '2025-10-15 21:54:12');

-- ============================================
-- Data for table: insurance_package (1 rows)
-- ============================================

INSERT INTO `insurance_package` (`insurance_package_id`, `package_name`, `annual_limit`, `copayment_percentage`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
  ('0e4589c3-30a3-4f5d-8ab1-e55a5426dffc', 'Premium Health Plan', '1500000.00', '15.00', 'Comprehensive coverage for all medical needs', 1, '2025-10-15 21:08:26', '2025-10-15 21:08:26');

-- ============================================
-- Data for table: invoice (1 rows)
-- ============================================

INSERT INTO `invoice` (`invoice_id`, `consultation_rec_id`, `sub_total`, `tax_amount`, `due_date`, `created_at`, `updated_at`) VALUES
  ('5a70244b-4640-4423-ba08-05269ac034d3', 'beae1ccb-aa50-11f0-afdd-005056c00001', '3500.00', '175.00', '2025-11-15', '2025-10-16 11:35:14', '2025-10-16 11:35:14');

-- ============================================
-- Data for table: medication (9 rows)
-- ============================================

INSERT INTO `medication` (`medication_id`, `generic_name`, `manufacturer`, `form`, `contraindications`, `side_effects`, `created_at`, `updated_at`) VALUES
  ('b0769d69-aa41-11f0-afdd-005056c00001', 'Ibuprofen', 'MediLabs', 'Capsule', 'Peptic ulcer, asthma', 'Stomach upset, dizziness', '2025-10-16 09:09:15', '2025-10-16 09:09:15'),
  ('b0798174-aa41-11f0-afdd-005056c00001', 'Losartan', 'HealthFirst', 'Tablet', 'Heart failure, kidney disease', 'Fatigue, dizziness', '2025-10-16 09:09:15', '2025-10-16 09:09:15'),
  ('b07be8de-aa41-11f0-afdd-005056c00001', 'Amoxicillin', 'BioPharma', 'Capsule', 'Hypersensitivity to penicillin', 'Diarrhea, allergic rash', '2025-10-16 09:09:15', '2025-10-16 09:09:15'),
  ('b07d7307-aa41-11f0-afdd-005056c00001', 'Metformin', 'GlucoCare', 'Tablet', 'Severe renal impairment', 'Bloating, metallic taste', '2025-10-16 09:09:15', '2025-10-16 09:09:15'),
  ('b07fa57c-aa41-11f0-afdd-005056c00001', 'Aspirin', 'Wellness Labs', 'Tablet', 'Pregnancy, active peptic ulcer', 'Heartburn, bleeding risk', '2025-10-16 09:09:15', '2025-10-16 09:09:15'),
  ('b0817130-aa41-11f0-afdd-005056c00001', 'Salbutamol', 'AeroPharm', 'Other', 'Glaucoma, severe heart disease', 'Tremor, headache', '2025-10-16 09:09:15', '2025-10-16 09:09:15'),
  ('b0832432-aa41-11f0-afdd-005056c00001', 'Atorvastatin', 'CardioMed', 'Tablet', 'Severe hepatic impairment', 'Muscle pain, fatigue', '2025-10-16 09:09:15', '2025-10-16 09:09:15'),
  ('b084d4fa-aa41-11f0-afdd-005056c00001', 'Propranolol', 'BetaCare', 'Tablet', 'Diabetes, heart block', 'Bradycardia, dizziness', '2025-10-16 09:09:15', '2025-10-16 09:09:15'),
  ('b086f4e9-aa41-11f0-afdd-005056c00001', 'Ceftriaxone', 'InjecTech', 'Injection', 'Severe kidney impairment', 'Pain at injection site, diarrhea', '2025-10-16 09:09:15', '2025-10-16 09:09:15');

-- ============================================
-- Data for table: patient (10 rows)
-- ============================================

INSERT INTO `patient` (`patient_id`, `blood_group`, `allergies`, `chronic_conditions`, `registered_branch_id`, `created_at`, `updated_at`) VALUES
  ('16431244-a9a9-11f0-afdd-005056c00001', 'B+', NULL, NULL, '81a3303f-a022-11f0-b3b5-005056c00001', '2025-10-15 14:56:53', '2025-10-15 14:56:53'),
  ('1aaf3ae2-a165-11f0-ba84-005056c00001', 'O+', NULL, NULL, '81a3303f-a022-11f0-b3b5-005056c00001', '2025-10-05 02:30:06', '2025-10-05 02:30:06'),
  ('1b1de314-a34d-11f0-a762-005056c00001', 'A-', NULL, NULL, '81a3303f-a022-11f0-b3b5-005056c00001', '2025-10-07 12:43:21', '2025-10-07 12:43:21'),
  ('22c12527-a9a6-11f0-afdd-005056c00001', 'A-', NULL, NULL, '81a3303f-a022-11f0-b3b5-005056c00001', '2025-10-15 14:35:46', '2025-10-15 14:35:46'),
  ('3abeb0cd-a167-11f0-ba84-005056c00001', 'AB+', NULL, NULL, '81a3303f-a022-11f0-b3b5-005056c00001', '2025-10-05 02:45:18', '2025-10-05 02:45:18'),
  ('81ac4b2a-a022-11f0-b3b5-005056c00001', 'O+', NULL, NULL, '81a3303f-a022-11f0-b3b5-005056c00001', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81ac6531-a022-11f0-b3b5-005056c00001', 'A+', 'Penicillin', 'Hypertension', '81a3303f-a022-11f0-b3b5-005056c00001', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81ac6ed7-a022-11f0-b3b5-005056c00001', 'B+', NULL, 'Diabetes Type 2', '81a3347c-a022-11f0-b3b5-005056c00001', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81ac7636-a022-11f0-b3b5-005056c00001', 'AB+', 'Aspirin', NULL, '81a335ef-a022-11f0-b3b5-005056c00001', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('9d275ddc-a9b0-11f0-afdd-005056c00001', 'AB+', NULL, NULL, '81a3303f-a022-11f0-b3b5-005056c00001', '2025-10-15 15:50:46', '2025-10-15 15:50:46');

-- ============================================
-- Data for table: patient_allergy (1 rows)
-- ============================================

INSERT INTO `patient_allergy` (`patient_allergy_id`, `patient_id`, `allergy_name`, `severity`, `reaction_description`, `diagnosed_date`, `is_active`, `created_at`, `updated_at`) VALUES
  ('78480f75-a9b3-11f0-afdd-005056c00001', '16431244-a9a9-11f0-afdd-005056c00001', 'Peanuts', 'Life-threatening', 'Anaphylaxis: swelling, difficulty breathing', '2025-05-15', 1, '2025-10-15 16:11:13', '2025-10-15 16:11:13');

-- ============================================
-- Data for table: patient_condition (1 rows)
-- ============================================

INSERT INTO `patient_condition` (`patient_id`, `condition_id`, `diagnosed_date`, `is_chronic`, `current_status`, `notes`, `created_at`, `updated_at`) VALUES
  ('16431244-a9a9-11f0-afdd-005056c00001', '91e65cc6-a9b4-11f0-afdd-005056c00001', '2025-06-10', 1, 'Managed', 'Blood pressure controlled with medication', '2025-10-15 16:19:05', '2025-10-15 16:19:05');

-- ============================================
-- Data for table: payment (3 rows)
-- ============================================

INSERT INTO `payment` (`payment_id`, `patient_id`, `amount_paid`, `payment_method`, `status`, `payment_date`, `notes`, `created_at`, `updated_at`) VALUES
  ('1910f5f5-6c5b-46ba-b09b-f504caac3dc7', '16431244-a9a9-11f0-afdd-005056c00001', '10000.00', 'Credit Card', 'Pending', '2024-10-17', 'Full payment for consultation and treatment', '2025-10-16 11:14:22', '2025-10-16 11:14:22'),
  ('3157751d-a7c3-4a8c-9228-d94bc5eab9d0', '16431244-a9a9-11f0-afdd-005056c00001', '5000.00', 'Credit Card', 'Pending', '2024-10-16', 'Full payment for consultation and treatment', '2025-10-16 11:13:12', '2025-10-16 11:13:12'),
  ('393fbb18-e9f0-4a15-9fab-28ad25bb034c', '16431244-a9a9-11f0-afdd-005056c00001', '5000.00', 'Credit Card', 'Pending', '2024-10-16', 'Full payment for consultation and treatment', '2025-10-16 11:13:14', '2025-10-16 11:13:14');

-- ============================================
-- Data for table: prescription_item (1 rows)
-- ============================================

INSERT INTO `prescription_item` (`prescription_item_id`, `medication_id`, `consultation_rec_id`, `dosage`, `frequency`, `duration_days`, `instructions`, `created_at`, `updated_at`) VALUES
  ('beb36319-aa50-11f0-afdd-005056c00001', 'b0769d69-aa41-11f0-afdd-005056c00001', 'beae1ccb-aa50-11f0-afdd-005056c00001', '500mg', 'Twice daily', 7, 'Take with food', '2025-10-16 10:57:02', '2025-10-16 10:57:02');

-- ============================================
-- Data for table: specialization (5 rows)
-- ============================================

INSERT INTO `specialization` (`specialization_id`, `specialization_title`, `other_details`, `created_at`, `updated_at`) VALUES
  ('81b75050-a022-11f0-b3b5-005056c00001', 'General Medicine', 'General practice and primary care', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81b759cf-a022-11f0-b3b5-005056c00001', 'Cardiology', 'Heart and cardiovascular diseases', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81b75cfa-a022-11f0-b3b5-005056c00001', 'Pediatrics', 'Medical care for infants, children, and adolescents', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81b767e7-a022-11f0-b3b5-005056c00001', 'Dermatology', 'Skin, hair, and nail conditions', '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81b769b8-a022-11f0-b3b5-005056c00001', 'Orthopedics', 'Musculoskeletal system disorders', '2025-10-03 12:00:51', '2025-10-03 12:00:51');

-- ============================================
-- Data for table: time_slot (4 rows)
-- ============================================

INSERT INTO `time_slot` (`time_slot_id`, `doctor_id`, `branch_id`, `available_date`, `is_booked`, `start_time`, `end_time`, `created_at`, `updated_at`) VALUES
  ('d557782e-a9d5-11f0-afdd-005056c00001', '16208a35-a340-11f0-a762-005056c00001', '81a3303f-a022-11f0-b3b5-005056c00001', '2025-10-20', 1, '9:00:00', '9:30:00', '2025-10-15 20:17:12', '2025-10-16 07:55:27'),
  ('d55ef757-a9d5-11f0-afdd-005056c00001', '16208a35-a340-11f0-a762-005056c00001', '81a3303f-a022-11f0-b3b5-005056c00001', '2025-10-20', 0, '9:30:00', '10:00:00', '2025-10-15 20:17:12', '2025-10-15 20:17:12'),
  ('d56071d5-a9d5-11f0-afdd-005056c00001', '16208a35-a340-11f0-a762-005056c00001', '81a3303f-a022-11f0-b3b5-005056c00001', '2025-10-20', 0, '10:00:00', '10:30:00', '2025-10-15 20:17:12', '2025-10-15 20:17:12'),
  ('d5626f68-a9d5-11f0-afdd-005056c00001', '16208a35-a340-11f0-a762-005056c00001', '81a3303f-a022-11f0-b3b5-005056c00001', '2025-10-21', 0, '9:00:00', '9:30:00', '2025-10-15 20:17:12', '2025-10-15 20:17:12');

-- ============================================
-- Data for table: treatment (1 rows)
-- ============================================

INSERT INTO `treatment` (`treatment_id`, `consultation_rec_id`, `treatment_service_code`, `notes`, `created_at`, `updated_at`) VALUES
  ('beb46c4b-aa50-11f0-afdd-005056c00001', 'beae1ccb-aa50-11f0-afdd-005056c00001', '63631803-d204-4395-8bbd-d2c44c2d3101', 'Blood test ordered', '2025-10-16 10:57:02', '2025-10-16 10:57:02');

-- ============================================
-- Data for table: treatment_catalogue (2 rows)
-- ============================================

INSERT INTO `treatment_catalogue` (`treatment_service_code`, `treatment_name`, `base_price`, `duration`, `description`, `created_at`, `updated_at`) VALUES
  ('63631803-d204-4395-8bbd-d2c44c2d3101', 'ECG Test', '1000.00', '0:15:00', 'Electrocardiogram test', '2025-10-16 10:43:10', '2025-10-16 10:43:10'),
  ('a49846a2-f027-481b-a5cd-6f433fa06338', 'X-Ray Chest', '1500.00', '0:20:00', 'Chest X-ray examination', '2025-10-16 10:43:10', '2025-10-16 10:43:10');

-- ============================================
-- Data for table: user (43 rows)
-- ============================================

INSERT INTO `user` (`user_id`, `address_id`, `user_type`, `full_name`, `NIC`, `email`, `gender`, `DOB`, `contact_id`, `password_hash`, `last_login`, `created_at`, `updated_at`) VALUES
  ('16056201-a340-11f0-a762-005056c00001', '16055f2e-a340-11f0-a762-005056c00001', 'employee', 'Bob Admin', '198001234567', 'bob.admin@clinic.com', 'Male', '1980-03-10', '160561b8-a340-11f0-a762-005056c00001', '$2b$12$...', NULL, '2025-10-07 11:10:09', '2025-10-07 11:10:09'),
  ('16208a35-a340-11f0-a762-005056c00001', '16208987-a340-11f0-a762-005056c00001', 'employee', 'Dr. Eva Wickramasinghe', '197501234567', 'dr.eva@clinic.com', 'Female', '1975-01-20', '162089ee-a340-11f0-a762-005056c00001', '$2b$12$...', NULL, '2025-10-07 11:10:09', '2025-10-07 11:10:09'),
  ('16431244-a9a9-11f0-afdd-005056c00001', '164311a3-a9a9-11f0-afdd-005056c00001', 'patient', 'Sachini Jayasinghe', '199523456789', 'sachini.jayasinghe@example.com', 'Female', '1995-03-08', '164311fd-a9a9-11f0-afdd-005056c00001', '1c31caf0e842905aca9a922b834f81f542212da6d5f256be6da1e9e9b875160e', NULL, '2025-10-15 14:56:53', '2025-10-15 14:56:53'),
  ('1aaf3ae2-a165-11f0-ba84-005056c00001', '1aaf38d7-a165-11f0-ba84-005056c00001', 'patient', 'Test Patient One', '199012345678', 'testpatient1@test.com', 'Male', '1990-05-15', '1aaf3ab5-a165-11f0-ba84-005056c00001', '$2b$12$testhash1', NULL, '2025-10-05 02:30:06', '2025-10-05 02:30:06'),
  ('1b1de314-a34d-11f0-a762-005056c00001', '1b1de237-a34d-11f0-a762-005056c00001', 'patient', 'Alice Perera', '850123456789', 'alice.perera@healthmail.com', 'Female', '1985-11-22', '1b1de2c4-a34d-11f0-a762-005056c00001', '98a0a04c5d11b4e5d1e0627f87d94fa80aecd65aebf922443b6c1c588065f07a', NULL, '2025-10-07 12:43:21', '2025-10-07 12:43:21'),
  ('22c12527-a9a6-11f0-afdd-005056c00001', '22c1226d-a9a6-11f0-afdd-005056c00001', 'patient', 'Nuwan Perera', '198745678912', 'nuwan.perera@example.com', 'Male', '1987-11-22', '22c124f5-a9a6-11f0-afdd-005056c00001', '0b0d3ac254a5434fc80977a6e29b5f17f774dd2d488e168661d313d31ad476db', NULL, '2025-10-15 14:35:46', '2025-10-15 14:35:46'),
  ('3abeb0cd-a167-11f0-ba84-005056c00001', '3abeb001-a167-11f0-ba84-005056c00001', 'patient', 'Test Minor', '201012345678', 'testminor@test.com', 'Male', '2010-01-01', '3abeb077-a167-11f0-ba84-005056c00001', '$2b$12$testhash4', NULL, '2025-10-05 02:45:18', '2025-10-05 02:45:18'),
  ('4e120b30-a9c0-11f0-afdd-005056c00001', '4e120a51-a9c0-11f0-afdd-005056c00001', 'employee', 'Sarah Johnson', '1990123456782', 'sarah.johnson@clinicd.com', 'Female', '1990-05-15', '4e120ae0-a9c0-11f0-afdd-005056c00001', '82b6314e99311ded1792a20c3dbfd040d644382846394d3b7cc77e6d1d0ec12a', NULL, '2025-10-15 17:43:05', '2025-10-15 17:43:05'),
  ('5f5c61d3-a167-11f0-ba84-005056c00001', '5f5c6103-a167-11f0-ba84-005056c00001', 'employee', 'Test Nurse One', '198512345678', 'testnurse1@test.com', 'Female', '1985-06-15', '5f5c6184-a167-11f0-ba84-005056c00001', '$2b$12$testhash6', NULL, '2025-10-05 02:46:20', '2025-10-05 02:46:20'),
  ('81a5cb27-a022-11f0-b3b5-005056c00001', '8194faf9-a022-11f0-b3b5-005056c00001', 'employee', 'Dr. Samantha Perera', '198501234567', 'samantha.perera@medsync.lk', 'Female', '1985-05-15', '81a05e70-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a5d173-a022-11f0-b3b5-005056c00001', '8194fbd4-a022-11f0-b3b5-005056c00001', 'employee', 'Dr. Nimal Silva', '198201234568', 'nimal.silva@medsync.lk', 'Male', '1982-08-22', '81a05f65-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a5d543-a022-11f0-b3b5-005056c00001', '8194fca8-a022-11f0-b3b5-005056c00001', 'employee', 'Dr. Chamari Fernando', '198701234569', 'chamari.fernando@medsync.lk', 'Female', '1987-12-10', '81a06052-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a7fd1b-a022-11f0-b3b5-005056c00001', '8194ff2b-a022-11f0-b3b5-005056c00001', 'employee', 'Dr. Kasun Rajapaksha', '199001234570', 'kasun.rajapaksha@medsync.lk', 'Male', '1990-03-15', '81a06138-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a80869-a022-11f0-b3b5-005056c00001', '81950038-a022-11f0-b3b5-005056c00001', 'employee', 'Dr. Priya Jayawardena', '199201234571', 'priya.jayawardena@medsync.lk', 'Female', '1992-07-20', '81a06220-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a80cfc-a022-11f0-b3b5-005056c00001', '8194faf9-a022-11f0-b3b5-005056c00001', 'employee', 'Dr. Rohan Wickramasinghe', '198801234572', 'rohan.wickramasinghe@medsync.lk', 'Male', '1988-11-05', '81a06329-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a81119-a022-11f0-b3b5-005056c00001', '8194fbd4-a022-11f0-b3b5-005056c00001', 'employee', 'Dr. Dilini Gunasekara', '199301234573', 'dilini.gunasekara@medsync.lk', 'Female', '1993-04-18', '81a06432-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a9a2ca-a022-11f0-b3b5-005056c00001', '8194fca8-a022-11f0-b3b5-005056c00001', 'employee', 'Nimali Wijesinghe', '199501234574', 'nimali.wijesinghe@medsync.lk', 'Female', '1995-06-25', '81a06525-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a9c95c-a022-11f0-b3b5-005056c00001', '8194ff2b-a022-11f0-b3b5-005056c00001', 'employee', 'Sanduni Amarasinghe', '199601234575', 'sanduni.amarasinghe@medsync.lk', 'Female', '1996-09-12', '81a06613-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81a9cdf5-a022-11f0-b3b5-005056c00001', '81950038-a022-11f0-b3b5-005056c00001', 'employee', 'Kavinda Dissanayake', '199401234576', 'kavinda.dissanayake@medsync.lk', 'Male', '1994-02-28', '81a06700-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81ac4b2a-a022-11f0-b3b5-005056c00001', '8194f460-a022-11f0-b3b5-005056c00001', 'patient', 'Amara Bandara', '198801234501', 'amara.bandara@email.com', 'Male', '1988-03-14', '81a04940-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81ac6531-a022-11f0-b3b5-005056c00001', '8194f578-a022-11f0-b3b5-005056c00001', 'patient', 'Tharushi De Silva', '199201234502', 'tharushi.desilva@email.com', 'Female', '1992-07-22', '81a04a54-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81ac6ed7-a022-11f0-b3b5-005056c00001', '8194f65d-a022-11f0-b3b5-005056c00001', 'patient', 'Kavindu Jayasinghe', '199501234503', 'kavindu.jayasinghe@email.com', 'Male', '1995-11-08', '81a04b5b-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81ac7636-a022-11f0-b3b5-005056c00001', '8194f745-a022-11f0-b3b5-005056c00001', 'patient', 'Nethmi Samaraweera', '199801234504', 'nethmi.samaraweera@email.com', 'Female', '1998-05-17', '81a04c5b-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81ac7e37-a022-11f0-b3b5-005056c00001', '8194f81e-a022-11f0-b3b5-005056c00001', 'patient', 'Dinesh Fernando', '198501234505', 'dinesh.fernando@email.com', 'Male', '1985-09-30', '81a04d45-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81ac8465-a022-11f0-b3b5-005056c00001', '8194f91a-a022-11f0-b3b5-005056c00001', 'patient', 'Sandali Perera', '199001234506', 'sandali.perera@email.com', 'Female', '1990-12-25', '81a04f56-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81ac8a0c-a022-11f0-b3b5-005056c00001', '8194fa04-a022-11f0-b3b5-005056c00001', 'patient', 'Ravindu Silva', '199301234507', 'ravindu.silva@email.com', 'Male', '1993-04-12', '81a05070-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81ac8e87-a022-11f0-b3b5-005056c00001', '8194f460-a022-11f0-b3b5-005056c00001', 'patient', 'Ishara Gamage', '199601234508', 'ishara.gamage@email.com', 'Female', '1996-08-19', '81a05166-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81ac9bc8-a022-11f0-b3b5-005056c00001', '8194f578-a022-11f0-b3b5-005056c00001', 'patient', 'Lakshan Wijewardena', '198201234509', 'lakshan.wijewardena@email.com', 'Male', '1982-01-07', '81a05262-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81aca69b-a022-11f0-b3b5-005056c00001', '8194f65d-a022-11f0-b3b5-005056c00001', 'patient', 'Malsha Rathnayake', '199901234510', 'malsha.rathnayake@email.com', 'Female', '1999-10-03', '81a0535a-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81acad6c-a022-11f0-b3b5-005056c00001', '8194f745-a022-11f0-b3b5-005056c00001', 'patient', 'Prasad Mendis', '198701234511', 'prasad.mendis@email.com', 'Male', '1987-06-15', '81a05445-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81acb6d3-a022-11f0-b3b5-005056c00001', '8194f81e-a022-11f0-b3b5-005056c00001', 'patient', 'Dulani Hewage', '199401234512', 'dulani.hewage@email.com', 'Female', '1994-02-28', '81a05536-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81acbe3e-a022-11f0-b3b5-005056c00001', '8194f91a-a022-11f0-b3b5-005056c00001', 'patient', 'Nuwan Kumara', '199101234513', 'nuwan.kumara@email.com', 'Male', '1991-11-20', '81a05695-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81acc5c7-a022-11f0-b3b5-005056c00001', '8194fa04-a022-11f0-b3b5-005056c00001', 'patient', 'Sachini Wickramasinghe', '199701234514', 'sachini.wickramasinghe@email.com', 'Female', '1997-05-09', '81a05790-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81accca6-a022-11f0-b3b5-005056c00001', '8194f460-a022-11f0-b3b5-005056c00001', 'patient', 'Chaminda Rajapaksha', '198601234515', 'chaminda.rajapaksha@email.com', 'Male', '1986-09-04', '81a05892-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81acd380-a022-11f0-b3b5-005056c00001', '8194f578-a022-11f0-b3b5-005056c00001', 'patient', 'Anusha Jayawardena', '199101234516', 'anusha.jayawardena@email.com', 'Female', '1991-03-21', '81a0597f-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81acdc90-a022-11f0-b3b5-005056c00001', '8194f65d-a022-11f0-b3b5-005056c00001', 'patient', 'Thilina Gunasekara', '199501234517', 'thilina.gunasekara@email.com', 'Male', '1995-07-16', '81a05aa3-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81ace3ca-a022-11f0-b3b5-005056c00001', '8194f745-a022-11f0-b3b5-005056c00001', 'patient', 'Harini Dissanayake', '199801234518', 'harini.dissanayake@email.com', 'Female', '1998-12-08', '81a05b97-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81aceb0e-a022-11f0-b3b5-005056c00001', '8194f81e-a022-11f0-b3b5-005056c00001', 'patient', 'Janaka Senanayake', '198401234519', 'janaka.senanayake@email.com', 'Male', '1984-08-11', '81a05c84-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('81acf2a1-a022-11f0-b3b5-005056c00001', '8194f91a-a022-11f0-b3b5-005056c00001', 'patient', 'Chathurika Bandara', '199201234520', 'chathurika.bandara@email.com', 'Female', '1992-04-27', '81a05d7e-a022-11f0-b3b5-005056c00001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7K8IVKMGe6', NULL, '2025-10-03 12:00:51', '2025-10-03 12:00:51'),
  ('8993430c-a9b7-11f0-afdd-005056c00001', '89934232-a9b7-11f0-afdd-005056c00001', 'employee', 'Dr. Kasun Jayawardena', '198045678912', 'dr.kasun@medmail.com', 'Male', '1980-10-20', '899342b5-a9b7-11f0-afdd-005056c00001', '3ccb53f9a5095e53260da5f21800c243d09c3e99209375be671164ea67185883', NULL, '2025-10-15 16:40:20', '2025-10-15 16:40:20'),
  ('9d275ddc-a9b0-11f0-afdd-005056c00001', '9d26ef9d-a9b0-11f0-afdd-005056c00001', 'patient', 'Ranil Weerasinghe', '198212345678', 'ranil.weerasinghe@example.com', 'Male', '1982-09-14', '9d275db0-a9b0-11f0-afdd-005056c00001', '7d34fdac76109daad867f8fad6fdc4a34b626f340ec9800ef15b6613a02cf23c', NULL, '2025-10-15 15:50:46', '2025-10-15 15:50:46'),
  ('e8090d6f-a9b8-11f0-afdd-005056c00001', 'e8090cc9-a9b8-11f0-afdd-005056c00001', 'doctor', 'Dr. Nalaka Ranasinghe', '197945678901', 'dr.nalaka@medmail.com', 'Male', '1979-07-05', 'e8090d29-a9b8-11f0-afdd-005056c00001', '1a89323abed194903bb51fd9a06000e73ed3e394bb3cbebb55a1ea975a1ed450', NULL, '2025-10-15 16:50:08', '2025-10-15 16:50:08'),
  ('eb0670f9-a9be-11f0-afdd-005056c00001', 'eb066fd4-a9be-11f0-afdd-005056c00001', 'employee', 'Sarah Johnson', '1990123456781', 'sarah.johnson@clinic.com', 'Female', '1990-05-15', 'eb067079-a9be-11f0-afdd-005056c00001', '82b6314e99311ded1792a20c3dbfd040d644382846394d3b7cc77e6d1d0ec12a', NULL, '2025-10-15 17:33:10', '2025-10-15 17:33:10');

SET FOREIGN_KEY_CHECKS=1;


