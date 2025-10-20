// src/components/StaffHeader.js
import React from "react";
import { Link, NavLink } from "react-router-dom";

/**
 * StaffHeader Component
 * Navigation header specifically for staff/admin users
 * Shows staff-relevant menu items only
 */
const StaffHeader = ({ staffName, staffRole, branch, setBranch, onLogout }) => {
  const navLinks = [
    { to: "/staff/dashboard", label: "Dashboard" },
    { to: "/staff/appointments", label: "Appointments" },
    { to: "/staff/patients", label: "Patients" },
    { to: "/staff/doctors", label: "Doctors" },
    { to: "/staff/schedule", label: "Schedule" },
    { to: "/staff/billing", label: "Billing" },
    { to: "/staff/reports", label: "Reports" },
  ];

  // Color scheme for staff (blue theme)
  const staffColor = '#3b82f6'; // Blue color for staff

  return (
    <header className="ms-header" aria-label="Site header">
      <div className="ms-topbar">
        <Link to="/staff/dashboard" className="ms-brand" aria-label="MedSync home">
          <span className="ms-brand-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
              <path d="M12 3v18M3 12h18" />
            </svg>
          </span>
          <span className="ms-brand-name">MedSync Clinic</span>
        </Link>

        <div className="ms-actions">
          <span className="ms-chip" title="Role" style={{background: staffColor, color: 'white'}}>
            <span className="ms-dot" aria-hidden="true" />
            {staffRole || 'Staff'} - {staffName}
          </span>

          {setBranch && (
            <label className="ms-branch">
              Branch
              <select value={branch} onChange={(e) => setBranch(e.target.value)} aria-label="Select branch">
                <option>Colombo</option>
                <option>Kandy</option>
                <option>Galle</option>
              </select>
            </label>
          )}

          <button className="ms-logout" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <nav className="ms-nav" aria-label="Primary navigation">
        <ul className="ms-nav-list">
          {navLinks.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/staff/dashboard"}
                className={({ isActive }) => "ms-link" + (isActive ? " is-active" : "")}
              >
                <span>{item.label}</span>
                <i className="u" aria-hidden="true" />
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default StaffHeader;
