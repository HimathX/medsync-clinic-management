# 🏥 MedSync - Clinic Management System

<div align="center">

![MedSync Logo](https://img.shields.io/badge/MedSync-Healthcare%20Platform-667eea?style=for-the-badge&logo=hospital&logoColor=white)

**A comprehensive, production-ready clinic management platform** with **FastAPI backend** and **React 19 frontend**, featuring role-based portals for patients, doctors, and administrative staff.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Architecture](#-architecture)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Architecture](#-architecture)
- [User Roles](#-user-roles)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**MedSync** is a modern, scalable healthcare management platform built with cutting-edge technologies. It streamlines clinic operations through dedicated, role-specific portals that enable seamless appointment scheduling, comprehensive medical record management, integrated billing, and advanced analytics.

### Why MedSync?

✅ **Full-Stack Healthcare Solution** - Complete ecosystem from patient booking to billing  
✅ **Role-Based Portals** - Tailored interfaces for patients, doctors, and staff  
✅ **Real-Time Data Sync** - Live updates across all modules and user types  
✅ **Production-Ready** - Secure authentication, error handling, and comprehensive validation  
✅ **Scalable Architecture** - Connection pooling, stored procedures, and optimized queries  
✅ **Type-Safe Frontend** - React 19 with TypeScript and Zod validation  
✅ **Multi-Branch Support** - Manage multiple clinic locations seamlessly  

---

## ✨ Features

### 👥 **Patient Portal**
- 📅 **Smart Appointment Booking** - Search doctors by specialty, view real-time availability
- 📋 **Medical Records** - Complete consultation history, prescriptions, lab results
- 💳 **Billing & Payments** - Invoice management, payment history, insurance tracking
- 📊 **Health Dashboard** - Personalized health score, metrics, and alerts
- 🔔 **Smart Notifications** - Real-time appointment reminders and status updates

### 👨‍⚕️ **Doctor Portal**
- 📊 **Analytics Dashboard** - Daily schedules, patient statistics, satisfaction metrics
- 🩺 **Consultation Management** - Detailed patient consultations with diagnoses
- 💊 **Digital Prescriptions** - Write and manage medication prescriptions
- 📅 **Schedule Management** - Set availability and manage time slots
- 📈 **Patient Intelligence** - Complete medical history and clinical insights

### 🏢 **Staff/Admin Portal**
- 👤 **Patient Management** - Register patients, search by NIC, manage records
- 📆 **Appointment Operations** - Book, reschedule, and manage appointments
- 💰 **Billing & Invoicing** - Generate invoices, process payments, insurance claims
- 📊 **Comprehensive Reporting** - Revenue analytics, appointment trends, operational reports
- 👨‍⚕️ **Resource Management** - Doctor profiles, specializations, and scheduling

### 🔒 **Security & Authentication**
- 🔐 **JWT + OAuth2** - Secure token-based authentication
- 🛡️ **Role-Based Access Control** - Granular authorization per user type
- 🔑 **Bcrypt Password Hashing** - Industry-standard password security
- 🎯 **Session Management** - Persistent login with automatic cleanup

---

## 🛠️ Tech Stack

### **Backend (FastAPI + Python)**

| Component | Version | Purpose |
|-----------|---------|---------|
| **FastAPI** | 0.115+ | Modern async REST API framework |
| **Python** | 3.10+ | Backend runtime |
| **MySQL** | 8.0+ | Relational database |
| **Pydantic** | 2.0+ | Data validation & serialization |
| **JWT + OAuth2** | - | Authentication & authorization |
| **bcrypt** | - | Password hashing |
| **ReportLab** | - | PDF generation |

### **Frontend (React + TypeScript)**

| Component | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2+ | UI library with server components |
| **TypeScript** | 5.0+ | Type-safe development |
| **React Router** | 7.x | Client-side routing |
| **Tailwind CSS** | 4.0+ | Utility-first styling |
| **React Hook Form** | - | Efficient form management |
| **Zod** | - | Schema validation |
| **Radix UI** | - | Accessible component primitives |
| **shadcn/ui** | - | High-quality pre-built components |
| **Axios** | - | HTTP client with interceptors |
| **Recharts** | - | Data visualization |
| **Framer Motion** | - | Smooth animations |

### **Database Architecture**
- **Connection Pooling** - 10 concurrent connections for optimal performance
- **Stored Procedures** - Complex operations for consistency and security
- **Optimized Indexing** - Fast query performance on 20+ tables
- **Backup System** - Automated timestamped backups with DDL/DML separation

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** (Backend)
- **Node.js 18+** (Frontend)
- **MySQL 8.0+**
- **Git**

### 1️⃣ Clone & Setup Database

```bash
git clone https://github.com/yourusername/medsync.git
cd medsync

# Create MySQL database
mysql -u root -p
CREATE DATABASE medsync_db;
USE medsync_db;
SOURCE database/schema.sql;  # If available
```

### 2️⃣ Backend Setup

```bash
cd backend

# Virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Dependencies
pip install -r requirements.txt

# Environment configuration
cp .env.example .env
# Edit .env with your database credentials

# Run server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Backend Available:** `http://localhost:8000`

### 3️⃣ Frontend Setup

```bash
cd ../frontend

# Dependencies
npm install

# Environment configuration
cp .env.example .env
# Ensure VITE_API_URL=http://localhost:8000

# Development server
npm run dev
```

**Frontend Available:** `http://localhost:5173`

### 4️⃣ Access the System

1. Navigate to `http://localhost:5173`
2. Choose your portal: **Patient** → **Doctor** → **Staff**
3. Login or register based on your role

---

## ⚙️ Configuration

### Backend Environment (`.env`)

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=medsync_db

# Security
SECRET_KEY=your-secret-key-here-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (Production: restrict this)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend Environment (`.env`)

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=MedSync
```

---

## 🏗️ Architecture

### **Backend Architecture**

```
FastAPI Server
    ↓
CORS Middleware → Auth Middleware
    ↓
22 API Routers → Pydantic Schemas
    ↓
Business Logic → Database Utils
    ↓
MySQL Database (Connection Pool)
    ↓
Stored Procedures
```

**Key Design Patterns:**
- **RESTful API** - Standard HTTP methods and status codes
- **Dependency Injection** - FastAPI's built-in DI for services
- **Connection Pooling** - Efficient database resource management
- **Stored Procedures** - Database-level transaction integrity

### **Frontend Architecture**

```
React 19 + TypeScript
    ↓
React Router (Client-side routing)
    ↓
Portal Layouts (Patient/Doctor/Staff)
    ↓
Page Components → Service Layer
    ↓
Axios API Client (with interceptors)
    ↓
FastAPI Backend
```

**Key Patterns:**
- **Layered Architecture** - Separation of concerns (UI → Services → API)
- **Hook-Based State** - React hooks for component state
- **Form Validation** - Zod schemas with React Hook Form
- **HTTP Interceptors** - Automatic token refresh, error handling
- **Component Reusability** - 58+ modular UI components

---

## 📚 API Documentation

Complete API documentation is auto-generated at:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## 👥 User Roles

| Role | Portal URL | Key Permissions | Features |
|------|-----------|-----------------|----------|
| **Patient** | `/patient/*` | Read own records, book appointments | Appointments, Records, Billing |
| **Doctor** | `/doctor/*` | Manage consultations, write prescriptions | Consultations, Prescriptions, Schedule |
| **Staff** | `/staff/*` | Full operational access | Patient Mgmt, Appointments, Billing, Reports |

### Access Control

- **Enforced Route Protection** - Automatic redirects for unauthorized access
- **Token Validation** - JWT tokens verified on every request
- **Session Management** - Automatic logout after inactivity
- **Audit Trail** - Operations logged for compliance

---

## 🔒 Security Features

✅ **Password Security** - bcrypt hashing with salt  
✅ **JWT Authentication** - 30-minute token expiration  
✅ **CORS Protection** - Configurable origin restrictions  
✅ **SQL Injection Prevention** - Parameterized queries via ORM  
✅ **HTTPS Ready** - Configure for production SSL/TLS  
✅ **Input Validation** - Pydantic schemas validate all inputs  
✅ **Role-Based Authorization** - Fine-grained access control  

**⚠️ Production Checklist:**
- [ ] Update `SECRET_KEY` to a strong random value
- [ ] Restrict `ALLOWED_ORIGINS` to your domain
- [ ] Enable HTTPS in environment
- [ ] Configure database backups
- [ ] Set up monitoring and logging
- [ ] Review and update CORS policy

---

## 🤝 Contributing

We welcome contributions! Follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following existing patterns
4. **Commit clearly**: `git commit -m 'Add amazing feature'`
5. **Push your branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

✅ Follow existing code style and patterns  
✅ Write clear commit messages  
✅ Update documentation for new features  
✅ Test thoroughly before submitting  
✅ Use TypeScript for frontend, type hints for backend  

---

## 📄 License

Licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **FastAPI** - Modern Python web framework
- **React** - Powerful UI library
- **Radix UI & shadcn/ui** - Accessible components
- **Tailwind CSS** - Utility-first styling
- **MySQL** - Reliable database system

---

## 📞 Support & Documentation

- **Issues**: [GitHub Issues](https://github.com/yourusername/medsync/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/medsync/discussions)
- **API Docs**: Available at `/docs` endpoint when running backend

---

<div align="center">

**Built with ❤️ for the healthcare community**

[⭐ Star on GitHub](https://github.com/yourusername/medsync) • [📧 Contact Us](#-support--documentation)

</div>
