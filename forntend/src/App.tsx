import React, { useState, useEffect} from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import authService from "./services/authService";

// Landing Page
import LandingPage from "./Landing.tsx";

// 404 Error Page and Loading Screen
import ErrorPage from "./components/error-page.tsx";
import { LoadingScreen } from "./components/loading.tsx";

// Patient Pages
import PatientLogin from "./portals/patient/Login.tsx";
import PatientSignup from "./portals/patient/SignUp.tsx";
import PatientDashboard from "./portals/patient/Dashboard.tsx";
import BookAppointment from "./portals/patient/BookAppointment.tsx";
import PatientMedicalRecords from "./portals/patient/Records.tsx";
import PatientBilling from "./portals/patient/Billing.tsx"; 
import PatientInsurance from "./portals/patient/Insurance.tsx";
import PatientProfile from "./portals/patient/Profile.tsx";
import PatientNavbar from "./portals/patient/Navbar.tsx";
import PatientFooter from "./portals/patient/Footer.tsx";

// Employee Pages 
import EmployeeLogin from "./portals/employee/Login.tsx";
import EmployeePatients from "./portals/employee/Patients.tsx";
import EmployeeReports from "./portals/employee/Reports.tsx";
import EmployeeSchedule from "./portals/employee/Schedule.tsx";
import EmployeePayments from "./portals/employee/Payments.tsx";
import EmployeeDoctors from "./portals/employee/Doctors.tsx";
import EmployeeAppointments from "./portals/employee/Appointments.tsx";
import EmployeeFooter from "./portals/employee/Footer.tsx";

// Doctor Pages
import DoctorLogin from "./portals/doctor/Login.tsx";
import DoctorSignUp from "./portals/doctor/SignUp.tsx";
import DoctorDashboard from "./portals/doctor/Dashboard.tsx";
import DoctorSchedule from "./portals/doctor/Schedule.tsx";
import DoctorAppointments from "./portals/doctor/Appointments.tsx";
import DoctorConsultations from "./portals/doctor/Consultations.tsx";
import DoctorPatients from "./portals/doctor/Patients.tsx";
import DoctorCatalogue from "./portals/doctor/Catalogue.tsx";
import DoctorFooter from "./portals/doctor/Footer.tsx";
import DoctorNavbar from "./portals/doctor/Navbar.tsx";

// Types
type UserType = 'patient' | 'employee' | 'doctor' | null;

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userType, setUserType] = useState<UserType>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load authentication state from authService on component mount
  useEffect(() => {
    const checkAuth = (): void => {
      console.log('🔍 Checking auth on app load...');
      
      // Use authService to get current user
      const isAuth = authService.isAuthenticated();
      const currentUserType = authService.getUserType();
      const userId = authService.getUserId();
      const fullName = authService.getFullName();
      const email = authService.getEmail();

      console.log('   Current user data:', {
        isAuthenticated: isAuth,
        userType: currentUserType,
        userId,
        fullName,
        email
      });

      if (isAuth && currentUserType) {
        console.log('✅ Auth found in authService');
        setIsAuthenticated(true);
        
        // Map 'staff' to 'employee' for internal use
        const mappedUserType: UserType = currentUserType === 'staff' ? 'employee' : (currentUserType as UserType);
        setUserType(mappedUserType);
        
        console.log('✅ State updated - isAuthenticated: true, userType:', mappedUserType);
      } else {
        console.log('❌ No valid auth found. Will show LandingPage.');
        setIsAuthenticated(false);
        setUserType(null);
      }

      setLoading(false);
    };

    checkAuth();

    // Listen for storage changes (e.g., when login sets localStorage and redirects)
    const handleStorageChange = (): void => {
      console.log('📝 Storage changed, re-checking authentication...');
      checkAuth();
    };

    // Listen for custom auth change event
    const handleAuthChange = (): void => {
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

  const handleLogin = (role: string, userType: string): void => {
    console.log('✅ Login handler called - userType:', userType, 'role:', role);
    setIsAuthenticated(true);
  };

  const handleLogout = (): void => {
    authService.logout();
    setIsAuthenticated(false);
    console.log('✅ Logout complete');
  };

  if (loading) {
    return <LoadingScreen message="Loading MedSync..." />;
  }

  // Not authenticated - show login/signup pages
  if (!isAuthenticated) {
    return (
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/patient-login" element={<PatientLogin onLogin={handleLogin} />} />
          <Route path="/employee-login" element={<EmployeeLogin onLogin={handleLogin} />} />
          <Route path="/doctor-login" element={<DoctorLogin onLogin={handleLogin} />} />
          <Route path="/patient-signup" element={<PatientSignup />} />
          <Route path="/doctor-signup" element={<DoctorSignUp />} />
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </div>
    );
  }

  // Authenticated - show portal based on userType
  if (userType === 'patient') {
    return (
      <div className="app">
        <PatientNavbar />
        <Routes>
          <Route path="/" element={<Navigate to="/patient/dashboard" replace />} />
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/book-appointment" element={<BookAppointment />} />
          <Route path="/patient/records" element={<PatientMedicalRecords />} />
          <Route path="/patient/billing" element={<PatientBilling />} />
          <Route path="/patient/insurance" element={<PatientInsurance />} />
          <Route path="/patient/profile" element={<PatientProfile />} />
          <Route path="*" element={<Navigate to="/patient/dashboard" replace />} />
        </Routes>
        <PatientFooter />
      </div>
    );
  }

  if (userType === 'doctor') {
    return (
      <div className="app">
        <DoctorNavbar />
        <Routes>
          <Route path="/" element={<Navigate to="/doctor/dashboard" replace />} />
          {/* Add doctor routes here as they're created */}
          <Route path="*" element={<Navigate to="/doctor/dashboard" replace />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/schedule" element={<DoctorSchedule />} />
          {/* <Route path="/doctor/appointments" element={<DoctorAppointments />} /> */}
          <Route path="/doctor/consultations" element={<DoctorConsultations />} />
          <Route path="/doctor/patients" element={<DoctorPatients />} />
          <Route path="/doctor/catalogue" element={<DoctorCatalogue />} />
        </Routes>
        <DoctorFooter />
      </div>
    );
  }

  if (userType === 'employee') {
    return (
      <div className="app">
        <Routes>
          <Route path="/" element={<Navigate to="/employee/appointments" replace />} />
          {/* Add employee routes here as they're created */}
          <Route path="*" element={<Navigate to="/employee/appointments" replace />} />
          <Route path="/employee/patients" element={<EmployeePatients />} />
          <Route path="/employee/reports" element={<EmployeeReports />} />
          <Route path="/employee/schedule" element={<EmployeeSchedule />} />
          <Route path="/employee/payments" element={<EmployeePayments />} />
          <Route path="/employee/doctors" element={<EmployeeDoctors />} />
          <Route path="/employee/appointments" element={<EmployeeAppointments />} />
        </Routes>
        <EmployeeFooter />
      </div>
    );
  }

  // Fallback for unknown user types
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>Unknown user type</h2>
      <p>Please contact support</p>
      <button onClick={handleLogout} style={{
        padding: '10px 20px',
        background: '#667eea',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px'
      }}>
        Logout
      </button>
    </div>
  );
};

export default App;