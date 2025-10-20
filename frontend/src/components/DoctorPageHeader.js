import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/doctor.css';

const DoctorPageHeader = ({ doctorName, specialization }) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    authService.logout();
    navigate('/doctor-login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  return (
    <header className="patient-main-header">
      <div className="patient-header-content">
        <div className="patient-logo-wrapper">
          <div className="patient-logo-cross">+</div>
          <div>
            <h1 className="patient-brand-name">MedSync</h1>
            <p className="patient-brand-subtitle">Doctor Portal</p>
          </div>
        </div>

        <div className="patient-user-section" ref={dropdownRef}>
          <div className="doctor-info-display" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <div className="patient-info-text">
              <div className="patient-name-display">Dr. {doctorName}</div>
              <div className="patient-id-display">
                {specialization || 'Physician'}
              </div>
            </div>
            <div className="patient-avatar-wrapper">
              <div className="patient-avatar">
                {doctorName?.charAt(0).toUpperCase() || 'D'}
              </div>
              <div className="avatar-status-indicator"></div>
            </div>
          </div>

          {showProfileMenu && (
            <div className="doctor-profile-dropdown">
              <button className="doctor-dropdown-item" onClick={() => { navigate('/doctor/profile'); setShowProfileMenu(false); }}>
                <span className="dropdown-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <span>My Profile</span>
              </button>
              <button className="doctor-dropdown-item" onClick={() => { navigate('/doctor/schedule'); setShowProfileMenu(false); }}>
                <span className="dropdown-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </span>
                <span>My Schedule</span>
              </button>
              <div className="doctor-dropdown-divider"></div>
              <button className="doctor-dropdown-item logout-item" onClick={handleLogout}>
                <span className="dropdown-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DoctorPageHeader;
