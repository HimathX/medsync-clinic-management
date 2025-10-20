import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const DoctorNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/doctor/dashboard', label: 'Dashboard' },
    { path: '/doctor/appointments', label: 'Appointments' },
    { path: '/doctor/patients', label: 'Patients' },
    { path: '/doctor/consultations', label: 'Consultations' },
    { path: '/doctor/schedule', label: 'Schedule' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="patient-top-nav" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div className="patient-top-nav-content" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        minHeight: '56px'
      }}>
        <div className="patient-nav-links" style={{
          display: 'flex',
          gap: '32px',
          alignItems: 'center'
        }}>
          {navItems.map((item) => (
            <a
              key={item.path}
              href={`#${item.path}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
              style={{
                fontWeight: isActive(item.path) ? '600' : '500',
                color: '#ffffff',
                opacity: isActive(item.path) ? '1' : '0.8',
                borderBottom: isActive(item.path) ? '3px solid #ffffff' : 'none',
                paddingBottom: '8px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="patient-nav-actions" style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          <a href="tel:+94112345678" className="patient-contact-link" style={{
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: '14px',
            whiteSpace: 'nowrap'
          }}>📞 +94 11 234 5678</a>
          <a href="/support" className="patient-emergency-link" style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: '14px',
            whiteSpace: 'nowrap',
            padding: '8px 20px',
            borderRadius: '8px',
            fontWeight: '600',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.3s ease'
          }}>🆘 Support</a>
        </div>
      </div>
    </nav>
  );
};

export default DoctorNavBar;
