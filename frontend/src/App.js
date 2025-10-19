import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import authService from "./services/authService";

// Staff Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import PatientSignup from "./pages/PatientSignup";
import StaffSignup from "./pages/StaffSignup";
import DoctorLogin from "./pages/DoctorLogin";
import DoctorSignup from "./pages/DoctorSignup";
import Dashboard from "./pages/Dashboard";
import MyAppointments from "./pages/MyAppointments";
import Billing from "./pages/Billing";
import Treatments from "./pages/Treatments";
import ReportsHistory from "./pages/reportshistory";
import Patients from "./pages/Patients";
import PatientPortal from "./pages/PatientPortal";
import PatientDetail from "./pages/PatientDetail";
import Profile from "./pages/profile";

// Staff Portal Pages
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffAppointments from "./pages/staff/StaffAppointments";
import StaffPatients from "./pages/staff/StaffPatients";
import StaffBilling from "./pages/staff/StaffBilling";
import StaffDoctors from "./pages/staff/StaffDoctors";
import StaffSchedule from "./pages/staff/StaffSchedule";
import StaffReports from "./pages/staff/StaffReports";
import StaffProfile from "./pages/staff/StaffProfile";

// Doctor Portal Pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorConsultations from "./pages/doctor/DoctorConsultations";
import DoctorSchedule from "./pages/doctor/DoctorSchedule";
import DoctorPrescriptions from "./pages/doctor/DoctorPrescriptions";
import DoctorTreatments from "./pages/doctor/DoctorTreatments";
import DoctorProfile from "./pages/doctor/DoctorProfile";

// Patient Portal Pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import BookAppointment from "./pages/patient/BookAppointment";
import PatientMyAppointments from "./pages/patient/MyAppointments";
import PatientBilling from "./pages/patient/Billing";
import PatientMedicalRecords from "./pages/patient/MedicalRecords";
import PatientPrescriptions from "./pages/patient/Prescriptions";
import PatientLabResults from "./pages/patient/LabResults";
import HealthConditions from "./pages/patient/HealthConditions";
import Insurance from "./pages/patient/Insurance";

// Styles
import "./styles/auth.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userType, setUserType] = useState(null); // 'patient', 'doctor', 'employee', etc.
  const [branch, setBranch] = useState("Colombo");

  // Load authentication state from localStorage on component mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.isAuthenticated) {
      setIsAuthenticated(true);
      setUserType(currentUser.userType);
      
      // Set role based on userType
      if (currentUser.userType === 'patient') {
        setUserRole('Patient');
      } else if (currentUser.userType === 'doctor') {
        setUserRole('Doctor');
      } else if (currentUser.userType === 'admin') {
        setUserRole('System Admin');
      } else if (currentUser.userType === 'manager') {
        setUserRole('Manager');
      } else if (currentUser.userType === 'nurse') {
        setUserRole('Nurse');
      } else if (currentUser.userType === 'receptionist') {
        setUserRole('Receptionist');
      } else if (currentUser.userType === 'employee' || currentUser.userType === 'staff') {
        setUserRole('Staff');
      }
    }
  }, []);

  const handleLogin = (role, type) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserType(type);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserRole(null);
    setUserType(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/staff-login" element={<Login onLogin={handleLogin} loginType="staff" />} />
          <Route path="/staff-signup" element={<StaffSignup />} />
          <Route path="/doctor-login" element={<DoctorLogin />} />
          <Route path="/doctor-signup" element={<DoctorSignup />} />
          <Route path="/patient-login" element={<Login onLogin={handleLogin} loginType="patient" />} />
          <Route path="/patient-signup" element={<PatientSignup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="app">
      {userType === 'patient' ? (
        // Patient Portal Layout (no header, full dashboard)
        <Routes>
          <Route path="/" element={<PatientDashboard />} />
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/book" element={<BookAppointment />} />
          <Route path="/patient/appointments" element={<PatientMyAppointments />} />
          <Route path="/patient/health-conditions" element={<HealthConditions />} />
          <Route path="/patient/insurance" element={<Insurance />} />
          <Route path="/patient/billing" element={<PatientBilling />} />
          <Route path="/patient/records" element={<PatientMedicalRecords />} />
          <Route path="/patient/prescriptions" element={<PatientPrescriptions />} />
          <Route path="/patient/lab-results" element={<PatientLabResults />} />
          <Route path="/patient/profile" element={<Profile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/patient/dashboard" replace />} />
        </Routes>
      ) : (userType === 'doctor' || userType === 'employee' || userType === 'admin' || 
             userType === 'staff' || userType === 'manager' || userType === 'nurse' || 
             userType === 'receptionist') ? (
        // Check user type for appropriate portal
        (userType === 'receptionist' || userType === 'nurse' || userType === 'manager') ? (
          // Staff Portal - No Header
          <Routes>
            <Route path="/" element={<StaffDashboard />} />
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/appointments" element={<StaffAppointments />} />
            <Route path="/staff/patients" element={<StaffPatients />} />
            <Route path="/staff/billing" element={<StaffBilling />} />
            <Route path="/staff/doctors" element={<StaffDoctors />} />
            <Route path="/staff/schedule" element={<StaffSchedule />} />
            <Route path="/staff/reports" element={<StaffReports />} />
            <Route path="/staff/profile" element={<StaffProfile />} />
            <Route path="/profile" element={<StaffProfile />} />
            <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
          </Routes>
        ) : userType === 'doctor' ? (
          // Doctor Portal - No Header
          <Routes>
            <Route path="/" element={<DoctorDashboard />} />
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
            <Route path="/doctor/patients" element={<DoctorPatients />} />
            <Route path="/doctor/consultations" element={<DoctorConsultations />} />
            <Route path="/doctor/schedule" element={<DoctorSchedule />} />
            <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
            <Route path="/doctor/treatments" element={<DoctorTreatments />} />
            <Route path="/doctor/profile" element={<DoctorProfile />} />
            <Route path="/profile" element={<DoctorProfile />} />
            <Route path="*" element={<Navigate to="/doctor/dashboard" replace />} />
          </Routes>
        ) : (
        // Staff/Doctor/Employee Portal Layout (with header) - for doctors and admin
        <div className="authenticated-layout">
          <Header
            role={userRole}
            branch={branch}
            setBranch={setBranch}
            onLogout={handleLogout}
            userType={userType}
          />
          <main id="main" className="container page-enter">
            <Routes>
              <Route path="/" element={<Dashboard user={{ role: userRole, branch }} />} />
              
              {(userRole === "Staff" || userRole === "System Admin" || userRole === "Manager" || userRole === "Receptionist") && (
                <Route path="/patients" element={<Patients />} />
              )}
              
              {(userRole === "Staff" || userRole === "System Admin" || userRole === "Manager" || userRole === "Receptionist") && (
                <Route path="/patient-portal" element={<PatientPortal />} />
              )}
              
              {(userRole === "Staff" || userRole === "System Admin" || userRole === "Manager" || userRole === "Receptionist") && (
                <Route path="/patient/:patientId" element={<PatientDetail />} />
              )}
              
              {(userRole === "Staff" || userRole === "Doctor" || userRole === "System Admin" || userRole === "Nurse" || userRole === "Manager") && (
                <Route path="/appointments" element={<MyAppointments />} />
              )}
              
              {(userRole === "Doctor" || userRole === "System Admin" || userRole === "Nurse") && (
                <Route path="/treatments" element={<Treatments />} />
              )}
              
              {(userRole === "Staff" || userRole === "Billing Staff" || userRole === "System Admin" || userRole === "Manager" || userRole === "Receptionist") && (
                <Route path="/billing" element={<Billing />} />
              )}
              
              {(userRole === "Staff" || userRole === "System Admin" || userRole === "Manager") && (
                <Route path="/reporting" element={<ReportsHistory />} />
              )}
              
              {/* Profile page available to all staff users */}
              <Route path="/profile" element={<Profile />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        )
      ) : (
        // Fallback for unknown user types
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Unknown user type</h2>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default App;
