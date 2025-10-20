# 🏥 MedSync - Clinic Management System

<div align="center">

![MedSync Logo](https://img.shields.io/badge/MedSync-Clinic%20Management-667eea?style=for-the-badge&logo=hospital&logoColor=white)

**A comprehensive FastAPI + React + MySQL clinic management system with role-based portals for patients, doctors, and staff.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100.0-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [API Docs](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [User Roles](#-user-roles)
- [Database Schema](#-database-schema)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**MedSync** is a modern, scalable clinic management system built with **FastAPI** and **React**, designed to streamline healthcare operations. It provides dedicated portals for patients, doctors, and administrative staff, enabling efficient appointment scheduling, medical record management, billing, and comprehensive reporting.

### Why MedSync?

- ✅ **Role-Based Access Control** - Separate portals with tailored interfaces for different user types
- ✅ **Real-Time Operations** - Live data synchronization across all modules
- ✅ **Comprehensive Medical Records** - Complete patient history, prescriptions, and treatment tracking
- ✅ **Integrated Billing** - Service-based billing with insurance claim management
- ✅ **Multi-Branch Support** - Manage multiple clinic locations from a single system
- ✅ **RESTful API** - Well-documented API with OpenAPI/Swagger integration

---

## ✨ Features

### 👥 Patient Portal
- 📅 **Appointment Booking** - Search doctors by specialization, view available time slots, book appointments
- 📋 **Medical Records** - Access consultation history, prescriptions, lab results, and treatment records
- 💳 **Billing & Payments** - View invoices, make payments, track payment history
- 🏥 **Health Dashboard** - Overview of upcoming appointments, recent prescriptions, and health metrics
- 🔔 **Notifications** - Real-time updates on appointment confirmations and reminders

### 👨‍⚕️ Doctor Portal
- 📊 **Doctor Dashboard** - Daily schedule, patient queue, consultation statistics
- 🩺 **Consultation Management** - Create detailed consultation records with diagnoses and treatment plans
- 💊 **Prescription Writing** - Digital prescription management with medication tracking
- 📅 **Schedule Management** - Set availability, manage time slots across multiple branches
- 📈 **Patient History** - Complete medical history access for informed decision-making

### 🏢 Staff/Admin Portal
- 👤 **Patient Management** - Register new patients, search by NIC, manage patient records
- 📆 **Appointment Scheduling** - Book appointments on behalf of patients, manage cancellations
- 👨‍⚕️ **Doctor & Staff Management** - Manage doctor profiles, specializations, and schedules
- 💰 **Billing & Invoicing** - Generate invoices, process payments, handle insurance claims
- 📊 **Reporting & Analytics** - Comprehensive reports on appointments, revenue, and operations
- 🏥 **Branch Management** - Multi-location support with branch-specific operations
- 📦 **Treatment Catalogue** - Manage service offerings and pricing

### 🔒 Security & Authentication
- 🔐 **Secure Authentication** - SHA-256 password hashing, JWT token-based sessions
- 🛡️ **Role-Based Authorization** - Granular access control preventing unauthorized portal access
- 🔑 **Session Management** - Persistent login with localStorage and automatic session cleanup

---

## 🛠️ Tech Stack

### Backend (FastAPI)
| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.100.0 | High-performance REST API framework |
| **Python** | 3.11+ | Programming language |
| **MySQL** | 8.0+ | Relational database |
| **mysql-connector-python** | 8.1.0 | Database connection pooling |
| **Pydantic** | 2.0+ | Data validation and serialization |
| **Uvicorn** | 0.23+ | ASGI server |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI library |
| **React Router** | 6.x | Client-side routing |
| **Axios** | 1.6.0 | HTTP client |
| **CSS3** | - | Modern styling with gradients and animations |

### Database
- **MySQL 8.0+** with stored procedures for complex operations
- **20+ Tables** including user, patient, doctor, appointment, consultation, billing, insurance
- **Optimized Indexing** for fast query performance

---

## 📁 Project Structure

```
medsync-clinic-management/
├── backend/
│   ├── core/
│   │   └── database.py          # Database connection pool
│   ├── routers/
│   │   ├── appointment.py       # Appointment management
│   │   ├── patient.py           # Patient CRUD operations
│   │   ├── doctor.py            # Doctor management
│   │   ├── timeslot.py          # Time slot scheduling
│   │   ├── consultation.py      # Consultation records
│   │   ├── prescription.py      # Prescription management
│   │   ├── treatment.py         # Treatment records
│   │   ├── invoice.py           # Invoice generation
│   │   ├── payment.py           # Payment processing
│   │   ├── insurance.py         # Insurance & claims
│   │   ├── branch.py            # Branch management
│   │   ├── staff.py             # Staff operations
│   │   └── reports.py           # Analytics & reporting
│   ├── schemas/                 # Pydantic models
│   ├── main.py                  # FastAPI application entry
│   └── requirements.txt         # Python dependencies
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StaffHeader.js
│   │   │   ├── PatientLayout.js
│   │   │   ├── DoctorLayout.js
│   │   │   ├── LoadingSpinner.js
│   │   │   └── ErrorMessage.js
│   │   ├── pages/
│   │   │   ├── patient/         # Patient portal pages
│   │   │   ├── doctor/          # Doctor portal pages
│   │   │   ├── staff/           # Staff portal pages
│   │   │   ├── Login.js
│   │   │   ├── PatientSignup.js
│   │   │   └── LandingPage.js
│   │   ├── services/
│   │   │   ├── api.js           # Axios client
│   │   │   ├── authService.js
│   │   │   ├── patientService.js
│   │   │   ├── doctorService.js
│   │   │   ├── appointmentService.js
│   │   │   └── ... (13 services)
│   │   ├── styles/
│   │   │   ├── staff.css
│   │   │   ├── patient.css
│   │   │   └── login.css
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env                     # Environment variables
│
└── README.md
```

---

## 🚀 Installation

### Prerequisites

- **Python 3.11+** (for FastAPI backend)
- **Node.js 16+** and npm (for React frontend)
- **MySQL 8.0+**
- **Git**

### 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/medsync-clinic-management.git
cd medsync-clinic-management
```

### 2️⃣ Database Setup

```bash
# Create MySQL database
mysql -u root -p

CREATE DATABASE medsync_db;
USE medsync_db;

# Import schema (if you have a SQL dump file)
SOURCE database/schema.sql;
```

**Note:** Ensure your database includes:
- All tables (user, patient, doctor, appointment, etc.)
- Stored procedures: `BookAppointment`, `CreateTimeSlot`, `DeleteTimeSlot`, `AuthenticateUser`
- Proper foreign key relationships

### 3️⃣ FastAPI Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies (includes FastAPI, Uvicorn, etc.)
pip install -r requirements.txt

# Configure environment variables (optional)
# Create .env file with:
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=medsync_db

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: **http://localhost:8000**

### 4️⃣ React Frontend Setup

```bash
cd ../frontend

# Install dependencies (includes React, React Router, Axios)
npm install

# Configure environment variables
# Create .env file with:
REACT_APP_API_URL=http://localhost:8000

# Start development server
npm start
```

Frontend will be available at: **http://localhost:3000**

---

## ⚙️ Configuration

### Backend Configuration (`backend/core/database.py`)

```python
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'medsync_db'),
    'pool_size': 5
}
```

### Frontend Configuration (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:8000
```

---

## 📖 Usage

### Access the Application

1. **Landing Page**: Navigate to `http://localhost:3000`
2. **Choose Portal**:
   - **Patient Portal** - For patients to book appointments and view records
   - **Doctor Portal** - For doctors to manage consultations and schedules
   - **Staff Portal** - For administrative staff to manage operations

### Default Login Credentials

Create test users in your database or register new patients via the patient signup page.

### Patient Portal Features
```
1. Register/Login → Patient Signup or Login Page
2. Book Appointment → Select doctor → Choose time slot → Confirm
3. View Appointments → My Appointments Page
4. Medical Records → Prescriptions, Lab Results, Treatment History
5. Billing → View Invoices, Make Payments
```

### Staff Portal Features
```
1. Login → Staff Login Page
2. Book Appointment → Select patient → Choose doctor → Pick time slot
3. Patient Management → Register patients, Search by NIC
4. Billing → Generate invoices, Process payments
5. Reports → View analytics and statistics
```

---

## 📚 API Documentation

### Interactive API Docs

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key API Endpoints

#### Authentication
```http
POST /auth/login          # User login (all roles)
```

#### Patients
```http
GET    /patients/                           # Get all patients
GET    /patients/{patient_id}               # Get patient by ID
POST   /patients/register                   # Register new patient
GET    /patients/search/by-nic/{nic}        # Search by NIC
```

#### Doctors
```http
GET    /doctors/                            # Get all doctors
GET    /doctors/{doctor_id}                 # Get doctor details
GET    /doctors/{doctor_id}/time-slots      # Get available slots
GET    /doctors/branch/{branch_id}          # Get doctors by branch
```

#### Appointments
```http
POST   /appointments/book                   # Book appointment
GET    /appointments/                       # Get all appointments
GET    /appointments/{appointment_id}       # Get appointment details
GET    /appointments/patient/{patient_id}   # Get patient appointments
PATCH  /appointments/{appointment_id}       # Update appointment
DELETE /appointments/{appointment_id}       # Cancel appointment
```

#### Time Slots
```http
GET    /timeslots/                          # Get all time slots
POST   /timeslots/create-bulk               # Create multiple slots
GET    /timeslots/doctor/{doctor_id}        # Get doctor's slots
DELETE /timeslots/{time_slot_id}            # Delete time slot
```

#### Consultations
```http
POST   /consultations/                      # Create consultation
GET    /consultations/{consultation_id}     # Get consultation details
GET    /consultations/patient/{patient_id}  # Get patient consultations
```

#### Billing & Payments
```http
POST   /invoices/                           # Create invoice
GET    /invoices/{invoice_id}               # Get invoice
POST   /payments/process                    # Process payment
GET    /payments/patient/{patient_id}       # Get payment history
```

For complete API documentation, visit the Swagger UI after starting the backend server.

---

## 👥 User Roles

| Role | Access Level | Key Features |
|------|-------------|--------------|
| **Patient** | `/patient/*` | Book appointments, view records, make payments |
| **Doctor** | `/doctor/*` | Manage consultations, write prescriptions, set schedule |
| **Staff/Admin** | `/staff/*` | Full access to patient management, billing, reporting |
| **Employee** | `/staff/*` | Administrative operations, appointment scheduling |

### Role-Based Route Protection

The application enforces strict route protection:
- Patients cannot access staff/doctor portals
- Staff cannot access patient portal
- Doctors have dedicated portal with clinical focus
- Automatic redirects for unauthorized access attempts

---

## 🗄️ Database Schema

### Core Tables

- **`user`** - Base user table with authentication (email, password_hash, user_type)
- **`patient`** - Patient demographics and medical information
- **`doctor`** - Doctor profiles, licenses, consultation fees
- **`staff`** - Administrative staff records
- **`appointment`** - Appointment bookings with status tracking
- **`time_slot`** - Doctor availability slots
- **`consultation_record`** - Detailed consultation documentation
- **`prescription`** - Medication prescriptions
- **`treatment`** - Treatment records
- **`invoice`** - Billing invoices
- **`payments`** - Payment transactions
- **`insurance_package`** - Insurance plans
- **`insurance_claim`** - Insurance claim processing
- **`branch`** - Clinic branch locations
- **`medical_conditions`** - Patient medical conditions

### Key Stored Procedures

- **`BookAppointment(patient_id, time_slot_id, notes)`** - Atomic appointment booking
- **`CreateTimeSlot(doctor_id, branch_id, date, start_time, end_time)`** - Create availability
- **`DeleteTimeSlot(time_slot_id)`** - Remove time slot if not booked
- **`AuthenticateUser(email, password_hash)`** - User login validation

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and patterns
- Add comments for complex logic
- Update documentation for new features
- Test thoroughly before submitting
- Ensure all services use the centralized API client (`services/api.js`)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- React team for the powerful UI library
- MySQL for reliable data storage
- All contributors who help improve MedSync

---

## 📞 Support

For questions, issues, or suggestions:

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/medsync-clinic-management/issues)
- **Email**: support@medsync.com
- **Documentation**: Check the `/docs` folder for additional guides

---

<div align="center">

**Built with ❤️ by the MedSync Team**

⭐ Star this repository if you find it helpful!

</div>
