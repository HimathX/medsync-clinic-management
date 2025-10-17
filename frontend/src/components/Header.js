// src/components/Header.js
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

const Header = ({ role, branch, setBranch, onLogout }) => {
  const navigate = useNavigate();
  
  const navLinks = {
    "Admin Staff": [
      { to: "/", label: "Dashboard" },
      { to: "/patients", label: "Patients" },
      { to: "/appointments", label: "Appointments" },
      { to: "/billing", label: "Billing" },
      { to: "/reporting", label: "Reporting" },
    ],
    "Doctor": [
      { to: "/", label: "Dashboard" },
      { to: "/appointments", label: "Appointments" },
      { to: "/treatments", label: "Treatments" },
    ],
    "Billing Staff": [
      { to: "/", label: "Dashboard" },
      { to: "/billing", label: "Billing" },
    ],
    "System Admin": [
      { to: "/", label: "Dashboard" },
      { to: "/patients", label: "Patients" },
      { to: "/appointments", label: "Appointments" },
      { to: "/treatments", label: "Treatments" },
      { to: "/billing", label: "Billing" },
      { to: "/reporting", label: "Reporting" },
    ],
  };
  
  const links = navLinks[role] || [];

  return (
    <header className="ms-header" aria-label="Site header">
      <div className="ms-topbar">
        <Link to="/" className="ms-brand" aria-label="MedSync home">
          <span className="ms-brand-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
              <path d="M12 3v18M3 12h18" />
            </svg>
          </span>
          <span className="ms-brand-name">MedSync Clinic</span>
        </Link>

        <div className="ms-actions">
          <span className="ms-chip" title="Role">
            <span className="ms-dot" aria-hidden="true" />
            {role}</span>

          <label className="ms-branch">
            Branch
            <select value={branch} onChange={(e)=>setBranch(e.target.value)} aria-label="Select branch">
              <option>Colombo</option>
              <option>Kandy</option>
              <option>Galle</option>
            </select>
          </label>

          <button className="ms-logout" onClick={() => navigate('/profile')} style={{marginRight: '10px'}}>
            Profile
          </button>
          <button className="ms-logout" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <nav className="ms-nav" aria-label="Primary navigation">
        <ul className="ms-nav-list">
          {links.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
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

export default Header;
