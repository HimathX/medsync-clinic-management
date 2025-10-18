-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop all tables
DROP TABLE IF EXISTS claim;
DROP TABLE IF EXISTS payment;
DROP TABLE IF EXISTS invoice;
DROP TABLE IF EXISTS insurance;
DROP TABLE IF EXISTS insurance_package;
DROP TABLE IF EXISTS patient_condition;
DROP TABLE IF EXISTS conditions;
DROP TABLE IF EXISTS conditions_category;
DROP TABLE IF EXISTS prescription_item;
DROP TABLE IF EXISTS medication;
DROP TABLE IF EXISTS treatment;
DROP TABLE IF EXISTS treatment_catalogue;
DROP TABLE IF EXISTS consultation_record;
DROP TABLE IF EXISTS appointment;
DROP TABLE IF EXISTS time_slot;
DROP TABLE IF EXISTS doctor_specialization;
DROP TABLE IF EXISTS specialization;
DROP TABLE IF EXISTS doctor;
DROP TABLE IF EXISTS employee;
DROP TABLE IF EXISTS patient_allergy;
DROP TABLE IF EXISTS patient;
DROP TABLE IF EXISTS branch;
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS contact;
DROP TABLE IF EXISTS address;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;