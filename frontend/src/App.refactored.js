// src/App.js - Refactored with Role-Based Architecture
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import authService from "./services/authService";

// Layouts
import PatientLayout from "./components/layouts/PatientLayout";
import StaffLayout from "./components/layouts/StaffLayout";
import DoctorLayout from "./components/layouts/DoctorLayout";

// Route Protection
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import PatientSignup from "./pages/PatientSignup";

// Staff Pages
import Dashboard from "./pages/Dashboard";
import MyAppointments from "./pages/MyAppointments";
import Billing from "./pages/Billing";
import Treatments from "./pages/Treatments";
import ReportsHistory from "./pages/reportshistory";
import Patients from "./pages/Patients";
import PatientPortal from "./pages/PatientPortal";
import PatientDetail from "./pages/PatientDetail";

// Doctor Pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";

// Patient Portal Pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import BookAppointment from "./pages/patient/BookAppointment";
import PatientBilling from "./pages/patient/Billing";
import PatientMedicalRecords from "./pages/patient/MedicalRecords";
import PatientPrescriptions from "./pages/patient/Prescriptions";
import PatientLabResults from "./pages/patient/LabResults";

// Styles
import "./styles/auth.css";

function App() {
  const isAuthenticated = authService.isAuthenticated();
  const userType = authService.getUserType();

  return (
    <div className="app">
      <Routes>
        {/* ========== PUBLIC ROUTES ========== */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/staff-login" element={<Login loginType="staff" />} />
        <Route path="/patient-login" element={<Login loginType="patient" />} />
        <Route path="/patient-signup" element={<PatientSignup />} />

        {/* ========== PATIENT ROUTES ========== */}
        <Route path="/patient" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="book" element={<BookAppointment />} />
          <Route path="appointments" element={<PatientDashboard />} />
          <Route path="billing" element={<PatientBilling />} />
          <Route path="records" element={<PatientMedicalRecords />} />
          <Route path="prescriptions" element={<PatientPrescriptions />} />
          <Route path="lab-results" element={<PatientLabResults />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* ========== DOCTOR ROUTES ========== */}
        <Route path="/doctor" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="appointments" element={<MyAppointments />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:patientId" element={<PatientDetail />} />
          <Route path="consultations" element={<Treatments />} />
          <Route path="consultations/:appointmentId" element={<Treatments />} />
          <Route path="schedule" element={<MyAppointments />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* ========== STAFF ROUTES (Admin Staff, Billing Staff, System Admin) ========== */}
        <Route path="/staff" element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'billing']}>
            <StaffLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:patientId" element={<PatientDetail />} />
          <Route path="patient-portal" element={<PatientPortal />} />
          <Route path="appointments" element={<MyAppointments />} />
          <Route path="treatments" element={<Treatments />} />
          <Route path="billing" element={<Billing />} />
          <Route path="billing/:patientId" element={<Billing />} />
          <Route path="reporting" element={<ReportsHistory />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* ========== LEGACY ROUTES (Backward Compatibility) ========== */}
        {/* Redirect old routes to new structure */}
        <Route path="/dashboard" element={
          isAuthenticated ? (
            userType === 'patient' ? <Navigate to="/patient/dashboard" replace /> :
            userType === 'doctor' ? <Navigate to="/doctor/dashboard" replace /> :
            <Navigate to="/staff/dashboard" replace />
          ) : <Navigate to="/" replace />
        } />
        
        <Route path="/appointments" element={
          isAuthenticated ? (
            userType === 'doctor' ? <Navigate to="/doctor/appointments" replace /> :
            <Navigate to="/staff/appointments" replace />
          ) : <Navigate to="/" replace />
        } />
        
        <Route path="/billing" element={
          isAuthenticated ? (
            userType === 'patient' ? <Navigate to="/patient/billing" replace /> :
            <Navigate to="/staff/billing" replace />
          ) : <Navigate to="/" replace />
        } />

        {/* ========== CATCH-ALL / 404 ========== */}
        <Route path="*" element={
          isAuthenticated ? (
            userType === 'patient' ? <Navigate to="/patient/dashboard" replace /> :
            userType === 'doctor' ? <Navigate to="/doctor/dashboard" replace /> :
            <Navigate to="/staff/dashboard" replace />
          ) : <Navigate to="/" replace />
        } />
      </Routes>
    </div>
  );
}

export default App;
