import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MyAppointments from "./pages/MyAppointments";
import Billing from "./pages/Billing";
import Treatments from "./pages/Treatments";
import ReportsHistory from "./pages/reportshistory";
import Patients from "./pages/Patients";
import PatientPortal from "./pages/PatientPortal";
import PatientDetail from "./pages/PatientDetail";

// Styles
import "./styles/auth.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [branch, setBranch] = useState("Colombo");

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="app">
        <Routes>
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="authenticated-layout">
        <Header
          role={userRole}
          branch={branch}
          setBranch={setBranch}
          onLogout={handleLogout}
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
    </div>
  );
}

export default App;
