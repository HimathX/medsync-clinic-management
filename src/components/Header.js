import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ role, branch, setBranch, onLogout }) => {
  return (
    <header aria-label="Main Navigation">
      <div className="logo">MedSync Clinic</div>
      <div>User: {role} | Branch: 
        <select value={branch} onChange={(e) => setBranch(e.target.value)} aria-label="Select Branch">
          <option>Colombo</option>
          <option>Kandy</option>
          <option>Galle</option>
        </select>
      </div>
      <nav>
        <ul>
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/patients">Patients</Link></li>
          <li><Link to="/appointments">Appointments</Link></li>
          <li><Link to="/treatments">Treatments</Link></li>
          <li><Link to="/billing">Billing</Link></li>
          <li><Link to="/reporting">Reporting</Link></li>
        </ul>
      </nav>
      <div>Quick Actions: 
        <button onClick={() => alert('New Appointment')} title="Create New Appointment">New Appt</button>
        <button onClick={() => alert('Patient Search')} title="Search Patients">Search Patient</button>
        <button onClick={() => alert('Emergency Walk-in')} title="Register Emergency">Emergency</button>
      </div>
      <button onClick={onLogout}>Logout</button>
    </header>
  );
};

export default Header;