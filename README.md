# 🏥 MedSync - Healthcare Management System

<div align="center">

![MedSync Logo](https://img.shields.io/badge/MedSync-Healthcare%20Management-667eea?style=for-the-badge&logo=hospital&logoColor=white)

**A modern, full-stack healthcare management platform with dedicated portals for patients, doctors, and administrative staff.**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Project Structure](#-project-structure) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [User Portals](#-user-portals)
- [Key Components](#-key-components)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**MedSync** is a comprehensive healthcare management system built with **React 19** and **TypeScript**, designed to streamline clinic operations. It provides three specialized portals for patients, doctors, and administrative staff, enabling seamless appointment scheduling, medical record management, and healthcare operations.

### Key Highlights

- ✅ **Three Role-Based Portals** - Tailored interfaces for patients, doctors, and staff
- ✅ **Modern Tech Stack** - React 19, TypeScript, Vite, Tailwind CSS
- ✅ **Type-Safe** - Full TypeScript implementation with Zod validation
- ✅ **Responsive Design** - Mobile-first approach with Tailwind CSS
- ✅ **Accessible UI** - Radix UI components with WCAG compliance
- ✅ **Production Ready** - 58+ custom components, comprehensive error handling
- ✅ **Real-Time Features** - Live appointment updates, instant notifications

---

## ✨ Features

### 👥 Patient Portal (11 Pages)
- 📅 **Smart Appointment Booking** - 4-step wizard with specialty and doctor selection
- 📊 **Health Dashboard** - Health score tracking, medical summary, alerts
- 📋 **Medical Records** - Access to consultations, prescriptions, health conditions
- 💳 **Billing & Payments** - Invoice tracking and payment history
- 🏥 **Insurance Management** - Insurance information and claim tracking
- 👤 **Profile Management** - Complete health profile with medical history
- 🔔 **Real-Time Updates** - Appointment confirmations and reminders

### 👨‍⚕️ Doctor Portal (10 Pages)
- 📊 **Analytics Dashboard** - Consultation trends, patient satisfaction metrics
- 🩺 **Consultation Management** - View and manage patient consultations
- 📅 **Schedule Management** - Manage availability across multiple branches
- 👥 **Patient Directory** - Complete patient records and medical history
- 📦 **Treatment Catalogue** - Manage service offerings and treatments
- 📈 **Performance Metrics** - Total patients, completed consultations, ratings

### 🏢 Staff/Admin Portal (9 Pages)
- 👤 **Patient Management** - Register, search, and manage patient records
- 📆 **Appointment Scheduling** - Book and manage appointments on behalf of patients
- 👨‍⚕️ **Doctor Management** - Manage doctor profiles and schedules
- 💰 **Billing & Payments** - Invoice generation and payment processing
- 📊 **Reporting & Analytics** - Comprehensive reports on operations and metrics
- 🔧 **System Management** - Complete administrative control

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2 | UI framework |
| **TypeScript** | 5.x | Type safety |
| **Vite** | 5.x | Build tool & dev server |
| **React Router** | 7.x | Client-side routing |
| **Tailwind CSS** | 4.x | Utility-first CSS |
| **Radix UI** | Latest | Accessible component primitives |
| **shadcn/ui** | Latest | 58+ pre-built components |
| **React Hook Form** | Latest | Form state management |
| **Zod** | Latest | Schema validation |
| **Axios** | 1.6+ | HTTP client |
| **Recharts** | Latest | Data visualization |
| **Framer Motion** | Latest | Animations |
| **Lucide React** | Latest | Icon library |

### Backend Integration
- **API Client**: Axios with interceptors for auth & error handling
- **Base URL**: `http://localhost:8000` (configurable)
- **Authentication**: JWT token-based with localStorage persistence
- **Error Handling**: Comprehensive 401, 404, 422, 500 error management

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ and npm/yarn
- **Backend** running on `http://localhost:8000`

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/medsync.git
cd medsync/frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
```

The frontend will be available at **http://localhost:5173**

### Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm run type-check # Check TypeScript types
```

---

## 👥 User Portals

### Authentication Flow

```
Landing Page
    ↓
Portal Selection (Patient / Doctor / Staff)
    ↓
Login / Signup
    ↓
Role-Specific Dashboard
    ↓
Protected Routes (Auto-redirect on logout)
```

### Portal Routes

| Portal | Base Path | Auth Required |
|--------|-----------|--------------|
| Patient | `/patient/*` | Yes |
| Doctor | `/doctor/*` | Yes |
| Staff | `/staff/*` | Yes |
| Landing | `/` | No |

### Session Management

- **Storage**: JWT tokens stored in localStorage
- **Persistence**: Sessions persist across page refreshes
- **Auto-logout**: Automatic cleanup on token expiration
- **Real-time Updates**: Storage event listeners for multi-tab sync

---

## 🎨 Key Components

### Custom Animated Components
- **background-ripple-effect** - Animated background with ripple effect
- **flip-words** - Flipping text animation
- **focus-cards** - Interactive card gallery with focus states
- **infinite-moving-cards** - Auto-scrolling carousel testimonials
- **vortex** - Animated vortex background effect

### UI Component Library (58+)
shadcn/ui collection includes: accordion, alert, avatar, badge, button, calendar, card, carousel, chart, checkbox, dialog, dropdown, form, input, table, tabs, toast, tooltip, and more.

### Maps Integration
- **Google Maps API** integration for branch locations
- Interactive map with location markers
- Branch information cards

---

## 🔐 Security Features

- ✅ **Type-Safe** - Full TypeScript with strict mode
- ✅ **Input Validation** - Zod schema validation
- ✅ **Error Handling** - Comprehensive error boundaries
- ✅ **Protected Routes** - Role-based access control
- ✅ **Token Management** - Secure JWT handling
- ✅ **CORS Support** - Configured for backend communication
- ✅ **Accessible** - WCAG compliance with Radix UI

---

## 📊 Data Flow

```
React Component
    ↓
Service Layer (appointmentService, etc.)
    ↓
API Client (Axios with interceptors)
    ↓
Backend (FastAPI - http://localhost:8000)
    ↓
Database
    ↓
Response with error handling
    ↓
Update component state
    ↓
Render updated UI
```

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

- Write TypeScript for type safety
- Follow existing component patterns
- Use Tailwind CSS for styling
- Add proper error handling
- Update documentation
- Test across different screen sizes

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **React** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Radix UI & shadcn/ui** - Component primitives
- **TypeScript** - Type safety
- All contributors and users

---

## 📞 Support

For questions, issues, or suggestions:

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/medsync/issues)
- **Documentation**: Check inline comments and types

---

<div align="center">

**Built with ❤️ by the MedSync Team**

⭐ Star this repository if you find it helpful!

</div>
