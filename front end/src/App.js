import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";

// Staff Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MyAppointments from "./pages/MyAppointments";
import Billing from "./pages/Billing";
import Treatments from "./pages/Treatments";
import ReportsHistory from "./pages/reportshistory";
import Patients from "./pages/Patients";
import PatientPortal from "./pages/PatientPortal";
import PatientDetail from "./pages/PatientDetail";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userType, setUserType] = useState(null); // 'staff' or 'patient'
  const [branch, setBranch] = useState("Colombo");

  const handleLogin = (role, type = 'staff') => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserType(type);
  };

  const handleLogout = () => {
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
          <Route path="/patient-login" element={<Login onLogin={handleLogin} loginType="patient" />} />
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
          <Route path="/patient/appointments" element={<PatientDashboard />} />
          <Route path="/patient/billing" element={<PatientBilling />} />
          <Route path="/patient/records" element={<PatientMedicalRecords />} />
          <Route path="/patient/prescriptions" element={<PatientPrescriptions />} />
          <Route path="/patient/lab-results" element={<PatientLabResults />} />
          <Route path="*" element={<Navigate to="/patient/dashboard" replace />} />
        </Routes>
      ) : (
        // Staff Portal Layout (with header)
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
              
              {(userRole === "Admin Staff" || userRole === "System Admin") && (
                <Route path="/patients" element={<Patients />} />
              )}
              
              {(userRole === "Admin Staff" || userRole === "System Admin") && (
                <Route path="/patient-portal" element={<PatientPortal />} />
              )}
              
              {(userRole === "Admin Staff" || userRole === "System Admin") && (
                <Route path="/patient/:patientId" element={<PatientDetail />} />
              )}
              
              {(userRole === "Admin Staff" || userRole === "Doctor" || userRole === "System Admin") && (
                <Route path="/appointments" element={<MyAppointments />} />
              )}
              
              {(userRole === "Doctor" || userRole === "System Admin") && (
                <Route path="/treatments" element={<Treatments />} />
              )}
              
              {(userRole === "Admin Staff" || userRole === "Billing Staff" || userRole === "System Admin") && (
                <Route path="/billing" element={<Billing />} />
              )}
              
              {(userRole === "Admin Staff" || userRole === "System Admin") && (
                <Route path="/reporting" element={<ReportsHistory />} />
              )}
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
