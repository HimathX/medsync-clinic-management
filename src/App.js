import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Treatments from './pages/Treatments';
import Billing from './pages/Billing';
import Reporting from './pages/Reporting';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('Colombo');

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <Router>
      {isAuthenticated && <Header role={userRole} branch={selectedBranch} setBranch={setSelectedBranch} onLogout={handleLogout} />}
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/" element={isAuthenticated ? <Dashboard role={userRole} /> : <Navigate to="/login" />} />
        <Route path="/patients" element={isAuthenticated ? <Patients role={userRole} /> : <Navigate to="/login" />} />
        <Route path="/appointments" element={isAuthenticated ? <Appointments role={userRole} branch={selectedBranch} /> : <Navigate to="/login" />} />
        <Route path="/treatments" element={isAuthenticated ? <Treatments role={userRole} /> : <Navigate to="/login" />} />
        <Route path="/billing" element={isAuthenticated ? <Billing role={userRole} /> : <Navigate to="/login" />} />
        <Route path="/reporting" element={isAuthenticated ? <Reporting role={userRole} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;