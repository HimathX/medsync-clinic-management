// src/components/layouts/StaffLayout.js
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header';
import authService from '../../services/authService';

/**
 * StaffLayout Component
 * Layout wrapper for staff portal pages (Admin Staff, Billing Staff, System Admin)
 * Includes header with navigation
 */
const StaffLayout = () => {
  const currentUser = authService.getCurrentUser();
  const userType = currentUser?.userType || 'staff';
  const [branch, setBranch] = useState('Colombo');

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/';
  };

  // Map userType to role for Header component
  const roleMap = {
    'admin': 'System Admin',
    'staff': 'Admin Staff',
    'billing': 'Billing Staff'
  };

  const role = roleMap[userType] || 'Admin Staff';

  return (
    <div className="authenticated-layout">
      <Header
        role={role}
        branch={branch}
        setBranch={setBranch}
        onLogout={handleLogout}
        userType="staff"
      />
      <main id="main" className="container page-enter">
        <Outlet />
      </main>
    </div>
  );
};

export default StaffLayout;
