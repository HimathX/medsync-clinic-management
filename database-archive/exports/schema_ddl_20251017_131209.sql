-- ============================================
-- MedSync Schema (DDL) Export
-- Generated: 2025-10-17 13:12:09
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

