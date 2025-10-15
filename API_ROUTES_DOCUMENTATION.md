# CATMS API Routes Documentation

## Overview
This document outlines the comprehensive API routes available in the Clinic Appointment and Treatment Management System (CATMS).

## API Endpoints Summary

### Authentication & User Management
- **POST /auth/login** - User login with email/password
- **POST /auth/logout** - User logout
- **GET /users/** - Get all users (with filtering)
- **GET /users/{user_id}** - Get user by ID
- **POST /users/** - Create new user
- **PUT /users/{user_id}** - Update user information

### Patient Management
- **GET /patients/** - Get all patients (with filtering)
- **GET /patients/{patient_id}** - Get patient by ID
- **POST /patients/** - Register new patient
- **PUT /patients/{patient_id}** - Update patient information
- **GET /patients/{patient_id}/appointments** - Get patient's appointments
- **GET /patients/{patient_id}/medical-history** - Get patient's medical history

### Doctor Management
- **GET /doctors/** - Get all doctors (filterable by branch, specialization, availability)
- **GET /doctors/{doctor_id}** - Get doctor details
- **POST /doctors/** - Create new doctor (Admin/Manager only)
- **PUT /doctors/{doctor_id}** - Update doctor information
- **GET /doctors/{doctor_id}/timeslots** - Get doctor's available time slots
- **POST /doctors/{doctor_id}/timeslots** - Create time slot for doctor
- **GET /doctors/{doctor_id}/appointments** - Get doctor's appointments

### Employee Management
- **GET /employees/** - Get all employees (Admin/Manager only)
- **GET /employees/{employee_id}** - Get employee details
- **POST /employees/** - Create new employee (Admin/Manager only)
- **PUT /employees/{employee_id}** - Update employee information
- **DELETE /employees/{employee_id}** - Deactivate employee (Admin only)
- **GET /employees/{employee_id}/schedule** - Get employee schedule (for doctors)

### Branch Management
- **GET /branches/** - Get all branches (filterable by district, active status)
- **GET /branches/{branch_id}** - Get branch details
- **POST /branches/** - Create new branch (Admin only)
- **PUT /branches/{branch_id}** - Update branch information
- **GET /branches/{branch_id}/doctors** - Get all doctors in branch
- **GET /branches/{branch_id}/employees** - Get all employees in branch
- **GET /branches/{branch_id}/patients** - Get all patients registered to branch
- **GET /branches/{branch_id}/timeslots** - Get available time slots in branch

### Appointment Management
- **GET /appointments/** - Get appointments (filterable by patient, doctor, branch, status, date)
- **GET /appointments/{appointment_id}** - Get appointment details
- **POST /appointments/** - Book new appointment
- **PUT /appointments/{appointment_id}** - Update appointment (Employee only)
- **DELETE /appointments/{appointment_id}** - Cancel appointment
- **GET /appointments/{appointment_id}/consultation** - Get consultation record
- **POST /appointments/{appointment_id}/consultation** - Create consultation record (Doctor only)

### Consultation & Medical Records
- **GET /consultations/** - Get consultation records (Employee only)
- **GET /consultations/{consultation_id}** - Get consultation details
- **POST /consultations/** - Create consultation record (Doctor only)
- **PUT /consultations/{consultation_id}** - Update consultation record (Doctor only)
- **GET /consultations/{consultation_id}/treatments** - Get treatments for consultation
- **POST /consultations/{consultation_id}/treatments** - Add treatment (Doctor only)
- **GET /consultations/{consultation_id}/prescriptions** - Get prescriptions
- **POST /consultations/{consultation_id}/prescriptions** - Add prescription (Doctor only)

### Medication Management
- **GET /medications/** - Get all medications (filterable by form, manufacturer, search)
- **GET /medications/{medication_id}** - Get medication details
- **POST /medications/** - Add new medication (Doctor/Admin only)
- **PUT /medications/{medication_id}** - Update medication information

### Specialization Management
- **GET /specializations/** - Get all specializations
- **GET /specializations/{specialization_id}** - Get specialization details
- **POST /specializations/** - Create new specialization (Admin only)
- **GET /specializations/{specialization_id}/doctors** - Get doctors with specialization
- **POST /specializations/{specialization_id}/doctors/{doctor_id}** - Add specialization to doctor

### Billing & Payments
- **GET /invoices/** - Get all invoices (Employee only)
- **GET /invoices/{invoice_id}** - Get invoice details
- **POST /invoices/** - Create new invoice
- **GET /invoices/{invoice_id}/payments** - Get payments for invoice
- **GET /payments/** - Get all payments (filterable by patient, status, method, date)
- **GET /payments/{payment_id}** - Get payment details
- **POST /payments/** - Process new payment (Employee only)
- **PUT /payments/{payment_id}** - Update payment status

### Address Management
- **GET /addresses/** - Get all addresses
- **GET /addresses/{address_id}** - Get address details
- **POST /addresses/** - Create new address
- **PUT /addresses/{address_id}** - Update address information

## Authentication & Authorization

### User Types
- **Patient**: Can view own appointments, medical records, and make bookings
- **Employee**: Different roles with varying permissions:
  - **Doctor**: Can create consultations, prescriptions, and manage own schedule
  - **Nurse**: Can view patient information and assist with appointments
  - **Admin**: Full system access, can manage all entities
  - **Receptionist**: Can manage appointments and payments
  - **Manager**: Can manage branch operations and view reports

### Permissions Summary
- **Public Access**: Login, basic branch/doctor information
- **Patient Access**: Own appointments, medical records, booking new appointments
- **Doctor Access**: Create/update consultations, prescriptions, manage own timeslots
- **Receptionist Access**: Manage appointments, process payments, view patient info
- **Manager Access**: Branch management, employee oversight, reports
- **Admin Access**: Full system administration

## Query Parameters
Most GET endpoints support common query parameters:
- `skip`: Number of records to skip (pagination)
- `limit`: Maximum records to return (default 100)
- Various filtering options specific to each endpoint

## Response Formats
All responses follow consistent JSON format with appropriate HTTP status codes:
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error

## Database Schema Compatibility
The API is fully compatible with the MySQL database schema using:
- UUID primary keys (CHAR(36))
- Snake_case table and column names
- Proper foreign key relationships
- Timestamp tracking for audit trails