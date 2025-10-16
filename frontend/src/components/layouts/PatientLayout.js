// src/components/layouts/PatientLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import '../../styles/patientDashboard.css';

/**
 * PatientLayout Component
 * Layout wrapper for patient portal pages
 * No header - full-screen dashboard style
 */
const PatientLayout = () => {
  return (
    <div className="patient-layout">
      <Outlet />
    </div>
  );
};

export default PatientLayout;
