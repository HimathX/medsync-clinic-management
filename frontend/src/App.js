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
  const [userType, setUserType] = useState(null);
  const [branch, setBranch] = useState("Colombo");
  const [loading, setLoading] = useState(true);

  // Load authentication state from localStorage on component mount
  useEffect(() => {
    const checkAuth = () => {
      // Check localStorage first (for direct login routes like doctor)
      const localUserId = localStorage.getItem('user_id');
      const localUserType = localStorage.getItem('user_type');
      
      if (localUserId && localUserType) {
        console.log('✅ Auth found in localStorage:', { localUserId, localUserType });
        setIsAuthenticated(true);
        setUserType(localUserType);
        
        // Set role based on userType
        setRoleFromUserType(localUserType);
        setLoading(false);
        return;
      }

      // Otherwise check authService
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.isAuthenticated) {
        console.log('✅ Auth found in authService:', currentUser);
        setIsAuthenticated(true);
        setUserType(currentUser.userType);
        setRoleFromUserType(currentUser.userType);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const setRoleFromUserType = (type) => {
    if (type === 'patient') {
      setUserRole('Patient');
    } else if (type === 'doctor') {
      setUserRole('Doctor');
    } else if (type === 'admin') {
      setUserRole('System Admin');
    } else if (type === 'manager') {
      setUserRole('Manager');
    } else if (type === 'nurse') {
      setUserRole('Nurse');
    } else if (type === 'receptionist') {
      setUserRole('Receptionist');
    } else if (type === 'employee' || type === 'staff') {
      setUserRole('Staff');
    }
  };

  const handleLogin = (role, type) => {
    console.log('Login handler called:', { role, type });
    setIsAuthenticated(true);
    setUserRole(role);
    setUserType(type);
  };

  const handleLogout = () => {
    console.log('Logout handler called');
    authService.logout();
    localStorage.clear();
    setIsAuthenticated(false);
    setUserRole(null);
    setUserType(null);
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        <div>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Routes>
        {/* Public Routes - Unauthenticated */}
        {!isAuthenticated && (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/staff-login" element={<Login onLogin={handleLogin} loginType="staff" />} />
            <Route path="/staff-signup" element={<StaffSignup />} />
            <Route path="/doctor/login" element={<DoctorLogin />} />
            <Route path="/doctor-login" element={<DoctorLogin />} />
            <Route path="/doctor-signup" element={<DoctorSignup />} />
            <Route path="/patient-login" element={<Login onLogin={handleLogin} loginType="patient" />} />
            <Route path="/patient-signup" element={<PatientSignup />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* Patient Portal Routes */}
        {isAuthenticated && userType === 'patient' && (
          <>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* Doctor Portal Routes */}
        {isAuthenticated && userType === 'doctor' && (
          <>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* Staff Portal Routes */}
        {isAuthenticated && (userType === 'receptionist' || userType === 'nurse' || userType === 'manager' || userType === 'admin' || userType === 'employee' || userType === 'staff') && (
          <>
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
            
            {/* Legacy Staff Routes */}
            <Route path="/patients" element={<Patients />} />
            <Route path="/patient-portal" element={<PatientPortal />} />
            <Route path="/patient/:patientId" element={<PatientDetail />} />
            <Route path="/appointments" element={<MyAppointments />} />
            <Route path="/treatments" element={<Treatments />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/reporting" element={<ReportsHistory />} />
            <Route path="/dashboard" element={<Dashboard user={{ role: userRole, branch }} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* Catch-all for authenticated users */}
        {isAuthenticated && <Route path="*" element={<Navigate to="/" replace />} />}
      </Routes>
    </div>
  );
}

export default App;
