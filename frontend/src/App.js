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
import DoctorConsultation from "./pages/doctor/DoctorConsultation";
import DoctorSchedule from "./pages/doctor/DoctorSchedule";
import DoctorPrescriptions from "./pages/doctor/DoctorPrescriptions";
import DoctorTreatments from "./pages/doctor/DoctorTreatments";
import DoctorProfile from "./pages/doctor/DoctorProfile";
import DoctorTreatmentCatalogue from "./pages/doctor/DoctorTreatmentCatalogue";
import DoctorMedications from "./pages/doctor/DoctorMedications";
import DoctorTreatmentManagement from "./pages/doctor/DoctorTreatmentManagement"
import DoctorFinancialMetrics from "./pages/doctor/DoctorFinancialMetrics";

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
  const [loading, setLoading] = useState(true);

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

  // Load authentication state from localStorage on component mount
  useEffect(() => {
    const checkAuth = () => {
      const currentUser = authService.getCurrentUser();
      console.log('🔍 Checking auth on app load. currentUser:', currentUser);
      
      if (currentUser && currentUser.isAuthenticated) {
        console.log('✅ Auth found in authService:', currentUser);
        console.log('   userType:', currentUser.userType);
        console.log('   userId:', currentUser.userId);
        setIsAuthenticated(true);
        setUserType(currentUser.userType);
        setRoleFromUserType(currentUser.userType);
      } else {
        console.log('❌ No valid auth found. Will show LandingPage.');
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };

    checkAuth();

    // Listen for storage changes (e.g., when DoctorLogin sets localStorage and redirects)
    const handleStorageChange = () => {
      console.log('📝 Storage changed, re-checking authentication...');
      checkAuth();
    };

    // Listen for custom auth change event
    const handleAuthChange = () => {
      console.log('🔐 Auth change event received, re-checking authentication...');
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChanged', handleAuthChange);
    };
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

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading MedSync...</h2>
          <p style={{ fontSize: '14px', opacity: 0.9 }}>Please wait</p>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid white',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Clear Session (if stuck)
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/staff-login" element={<Login onLogin={handleLogin} loginType="staff" />} />
          <Route path="/staff-signup" element={<StaffSignup />} />
          <Route path="/doctor-login" element={<DoctorLogin />} />
          <Route path="/doctor/login" element={<DoctorLogin />} />
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
      <Routes>
        {/* Patient Portal Routes */}
        {userType === 'patient' && (
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
            <Route path="*" element={<Navigate to="/patient/dashboard" replace />} />
          </>
        )}

        {/* Doctor Portal Routes */}
        {userType === 'doctor' && (
          <>
            <Route path="/" element={<DoctorDashboard />} />
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
            <Route path="/doctor/consultation" element={<DoctorConsultation />} />
            <Route path="/doctor/patients" element={<DoctorPatients />} />
            <Route path="/doctor/consultations" element={<DoctorConsultations />} />
            <Route path="/doctor/schedule" element={<DoctorSchedule />} />
            <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
            <Route path="/doctor/treatments" element={<DoctorTreatments />} />
            <Route path="/doctor/medications" element={<DoctorMedications />} />
            <Route path="/doctor/treatment-management" element={<DoctorTreatmentManagement />} />
            <Route path="/doctor/financial-metrics" element={<DoctorFinancialMetrics />} />
            <Route path="/doctor/profile" element={<DoctorProfile />} />
            <Route path="/profile" element={<DoctorProfile />} />
            <Route path="*" element={<Navigate to="/doctor/dashboard" replace />} />
          </>
        )}

        {/* Staff Portal Routes */}
        {(userType === 'receptionist' || userType === 'nurse' || userType === 'manager' || 
          userType === 'admin' || userType === 'employee' || userType === 'staff') && (
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
            
            {/* Legacy routes with Header for backwards compatibility */}
            <Route path="/dashboard" element={
              <div className="authenticated-layout">
                <Header role={userRole} branch={branch} setBranch={setBranch} onLogout={handleLogout} userType={userType} />
                <main id="main" className="container page-enter">
                  <Dashboard user={{ role: userRole, branch }} />
                </main>
              </div>
            } />
            
            {(userRole === "Staff" || userRole === "System Admin" || userRole === "Manager" || userRole === "Receptionist") && (
              <>
                <Route path="/patients" element={
                  <div className="authenticated-layout">
                    <Header role={userRole} branch={branch} setBranch={setBranch} onLogout={handleLogout} userType={userType} />
                    <main id="main" className="container page-enter">
                      <Patients />
                    </main>
                  </div>
                } />
                
                <Route path="/patient-portal" element={
                  <div className="authenticated-layout">
                    <Header role={userRole} branch={branch} setBranch={setBranch} onLogout={handleLogout} userType={userType} />
                    <main id="main" className="container page-enter">
                      <PatientPortal />
                    </main>
                  </div>
                } />
                
                <Route path="/patient/:patientId" element={
                  <div className="authenticated-layout">
                    <Header role={userRole} branch={branch} setBranch={setBranch} onLogout={handleLogout} userType={userType} />
                    <main id="main" className="container page-enter">
                      <PatientDetail />
                    </main>
                  </div>
                } />
              </>
            )}
            
            {(userRole === "Staff" || userRole === "Doctor" || userRole === "System Admin" || userRole === "Nurse" || userRole === "Manager") && (
              <Route path="/appointments" element={
                <div className="authenticated-layout">
                  <Header role={userRole} branch={branch} setBranch={setBranch} onLogout={handleLogout} userType={userType} />
                  <main id="main" className="container page-enter">
                    <MyAppointments />
                  </main>
                </div>
              } />
            )}
            
            {(userRole === "Doctor" || userRole === "System Admin" || userRole === "Nurse") && (
              <Route path="/treatments" element={
                <div className="authenticated-layout">
                  <Header role={userRole} branch={branch} setBranch={setBranch} onLogout={handleLogout} userType={userType} />
                  <main id="main" className="container page-enter">
                    <Treatments />
                  </main>
                </div>
              } />
            )}
            
            {(userRole === "Staff" || userRole === "Billing Staff" || userRole === "System Admin" || userRole === "Manager" || userRole === "Receptionist") && (
              <Route path="/billing" element={
                <div className="authenticated-layout">
                  <Header role={userRole} branch={branch} setBranch={setBranch} onLogout={handleLogout} userType={userType} />
                  <main id="main" className="container page-enter">
                    <Billing />
                  </main>
                </div>
              } />
            )}
            
            {(userRole === "Staff" || userRole === "System Admin" || userRole === "Manager") && (
              <Route path="/reporting" element={
                <div className="authenticated-layout">
                  <Header role={userRole} branch={branch} setBranch={setBranch} onLogout={handleLogout} userType={userType} />
                  <main id="main" className="container page-enter">
                    <ReportsHistory />
                  </main>
                </div>
              } />
            )}
            
            <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
          </>
        )}

        {/* Fallback for unknown user types */}
        {!['patient', 'doctor', 'receptionist', 'nurse', 'manager', 'admin', 'employee', 'staff'].includes(userType) && (
          <Route path="*" element={
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>Unknown user type</h2>
              <button onClick={handleLogout}>Logout</button>
            </div>
          } />
        )}
      </Routes>
    </div>
  );
}

export default App;