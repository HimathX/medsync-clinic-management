// src/components/layouts/DoctorLayout.js
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DoctorHeader from '../DoctorHeader';
import authService from '../../services/authService';

/**
 * DoctorLayout Component
 * Layout wrapper for doctor portal pages
 * Includes doctor-specific header with navigation
 */
const DoctorLayout = () => {
  const currentUser = authService.getCurrentUser();
  const [branch, setBranch] = useState('Colombo');

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/';
  };

  return (
    <div className="authenticated-layout doctor-layout">
      <DoctorHeader
        doctorName={currentUser?.fullName || 'Doctor'}
        branch={branch}
        setBranch={setBranch}
        onLogout={handleLogout}
      />
      <main id="main" className="container page-enter">
        <Outlet />
      </main>
    </div>
  );
};

export default DoctorLayout;
