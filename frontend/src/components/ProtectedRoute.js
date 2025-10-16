// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

/**
 * ProtectedRoute Component
 * Protects routes based on authentication and user roles
 * 
 * @param {React.Component} children - Component to render if authorized
 * @param {Array} allowedRoles - Array of allowed user types (e.g., ['patient', 'doctor', 'staff'])
 * @param {string} redirectTo - Path to redirect if not authorized
 */
const ProtectedRoute = ({ children, allowedRoles = [], redirectTo = '/' }) => {
  const isAuthenticated = authService.isAuthenticated();
  const userType = authService.getUserType();

  // Not authenticated - redirect to home/login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Authenticated but wrong role - redirect to appropriate dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(userType)) {
    // Redirect to role-specific dashboard
    const dashboardMap = {
      patient: '/patient/dashboard',
      doctor: '/doctor/dashboard',
      staff: '/dashboard',
      admin: '/dashboard'
    };
    return <Navigate to={dashboardMap[userType] || '/'} replace />;
  }

  // Authorized - render the component
  return children;
};

export default ProtectedRoute;
