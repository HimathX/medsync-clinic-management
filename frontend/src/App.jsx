import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';

// Import all page components
import Dashboard from './pages/dashboard/Dashboard';
import Appointments from './pages/appointments/Appointments';
import Booking from './pages/booking/Booking';
import DoctorDirectory from './pages/doctor-directory/DoctorDirectory';
import MedicalRecords from './pages/medical-records/MedicalRecords';
import TreatmentCatalog from './pages/treatment-catalog/TreatmentCatalog';
import Billing from './pages/billing/Billing';
import InsuranceManagement from './pages/insurance/InsuranceManagement';
import Profile from './pages/profile/Profile';
import AuthContainer from './pages/auth/AuthContainer';

// Import CSS
import './index.css';

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('Admin Staff');
  const [currentBranch, setCurrentBranch] = useState('Main Clinic');

  // Check authentication on mount (this would normally check localStorage/session)
  useEffect(() => {
    const checkAuth = () => {
      const authToken = localStorage.getItem('authToken');
      const savedRole = localStorage.getItem('userRole');
      const savedBranch = localStorage.getItem('currentBranch');
      
      if (authToken) {
        setIsAuthenticated(true);
        if (savedRole) setUserRole(savedRole);
        if (savedBranch) setCurrentBranch(savedBranch);
      }
    };
    
    checkAuth();
  }, []);

  // Handle login
  const handleLogin = (credentials) => {
    // This would normally call an API
    const { role, branch, token } = credentials;
    
    localStorage.setItem('authToken', token || 'dummy-token');
    localStorage.setItem('userRole', role || 'Admin Staff');
    localStorage.setItem('currentBranch', branch || 'Main Clinic');
    
    setIsAuthenticated(true);
    setUserRole(role || 'Admin Staff');
    setCurrentBranch(branch || 'Main Clinic');
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentBranch');
    
    setIsAuthenticated(false);
    setUserRole('');
    setCurrentBranch('');
  };

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/auth" replace />;
    }
    return children;
  };

  // Public Route Component (redirect to dashboard if already authenticated)
  const PublicRoute = ({ children }) => {
    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  return (
      <div className="app">
        {/* Show Header only when authenticated */}
        {isAuthenticated && (
          <Header
            role={userRole}
            branch={currentBranch}
            setBranch={setCurrentBranch}
            onLogout={handleLogout}
          />
        )}

        <main className={isAuthenticated ? 'app-content' : 'app-content-full'}>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/auth"
              element={
                <PublicRoute>
                  <AuthContainer onLogin={handleLogin} />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <Appointments />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/booking"
              element={
                <ProtectedRoute>
                  <Booking />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/doctors"
              element={
                <ProtectedRoute>
                  <DoctorDirectory />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/medical-records"
              element={
                <ProtectedRoute>
                  <MedicalRecords />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/treatments"
              element={
                <ProtectedRoute>
                  <TreatmentCatalog />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/insurance"
              element={
                <ProtectedRoute>
                  <InsuranceManagement />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Default Routes */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />

            {/* 404 Not Found */}
            <Route
              path="*"
              element={
                <div className="not-found-page">
                  <div className="not-found-content">
                    <h1>404</h1>
                    <h2>Page Not Found</h2>
                    <p>The page you're looking for doesn't exist.</p>
                    <a href={isAuthenticated ? "/dashboard" : "/auth"} className="btn-primary">
                      {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
  );
}

export default App;
