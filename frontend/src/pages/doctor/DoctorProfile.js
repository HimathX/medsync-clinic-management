import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import specializationService from '../../services/specializationService';
import '../../styles/patientDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorProfile = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const doctorId = currentUser?.userId || currentUser?.doctor_id;
  
  const [doctorData, setDoctorData] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loadingSpecializations, setLoadingSpecializations] = useState(false);

  useEffect(() => {
    // Check authentication
    console.log('🔐 Checking authentication for profile...');
    
    const userId = localStorage.getItem('user_id');
    const userType = localStorage.getItem('user_type');

    if (!userId || userType !== 'doctor') {
      console.log('❌ Unauthorized access to doctor profile');
      navigate('/doctor-login', { replace: true });
      return;
    }

    console.log('✅ Auth verified, loading profile for doctor:', doctorId);
    
    if (doctorId) {
      fetchDoctorProfile(doctorId);
      fetchDoctorSpecializations(doctorId);
    }
  }, [doctorId, navigate]);

  const fetchDoctorProfile = async (id) => {
    setLoading(true);
    try {
      console.log('📊 Fetching doctor profile for:', id);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile loaded successfully:', data);
        setDoctorData(data);
        setError('');
      } else {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorSpecializations = async (id) => {
    setLoadingSpecializations(true);
    try {
      console.log('📊 Fetching specializations for doctor:', id);
      
      const data = await specializationService.getDoctorSpecializations(id);
      console.log('✅ Specializations loaded successfully:', data);
      setSpecializations(data.specializations || []);
    } catch (err) {
      console.error('❌ Error fetching specializations:', err);
      // Don't set error for specializations as it's not critical
    } finally {
      setLoadingSpecializations(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/doctor-login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="patient-portal">
        <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !doctorData) {
    return (
      <div className="patient-portal">
        <header className="patient-main-header">
          <div className="patient-header-content">
            <div className="patient-logo-wrapper">
              <div className="patient-logo-cross">+</div>
              <div>
                <h1 className="patient-brand-name">MedSync</h1>
                <p className="patient-brand-subtitle">Doctor Portal</p>
              </div>
            </div>
            <div className="patient-user-section">
              <button onClick={() => navigate('/doctor/dashboard')} className="btn-back">← Back to Dashboard</button>
            </div>
          </div>
        </header>
        <main className="patient-container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
          <div className="alert alert-error" style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Error Loading Profile</h2>
            <p>{error || 'Profile not available'}</p>
            <button onClick={() => fetchDoctorProfile(doctorId)} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>Retry</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="patient-portal">
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      {/* Header */}
      <header className="patient-main-header">
        <div className="patient-header-content">
          <div className="patient-logo-wrapper">
            <div className="patient-logo-cross">+</div>
            <div>
              <h1 className="patient-brand-name">MedSync</h1>
              <p className="patient-brand-subtitle">Doctor Portal</p>
            </div>
          </div>

          <div className="patient-user-section">
            <div className="patient-info-display" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="patient-info-text">
                <div className="patient-name-display">Dr. {doctorData.full_name || doctorData.first_name || 'Doctor'}</div>
                <div className="patient-id-display">{doctorData.specialization || 'Physician'}</div>
              </div>
              <div className="patient-avatar-wrapper">
                <div className="patient-avatar">
                  {(doctorData.full_name || doctorData.first_name || 'D').charAt(0).toUpperCase()}
                </div>
                <div className="avatar-status-indicator"></div>
              </div>
            </div>

            {showProfileMenu && (
              <div className="patient-profile-dropdown">
                <button className="patient-dropdown-item" onClick={() => navigate('/doctor/dashboard')}>
                  <span className="dropdown-icon">📊</span>
                  <span>Dashboard</span>
                </button>
                <div className="patient-dropdown-divider"></div>
                <button className="patient-dropdown-item logout-item" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="patient-container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <section style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1a2332', marginBottom: '8px' }}>
            My Profile 👨‍⚕️
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
            View and manage your professional information
          </p>
        </section>

        {/* Profile Card */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '40px', marginRight: '20px' }}>
              {(doctorData.full_name || doctorData.first_name || 'D').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1a2332' }}>
                Dr. {doctorData.full_name || `${doctorData.first_name || ''} ${doctorData.last_name || ''}`}
              </h2>
              <p style={{ fontSize: '16px', color: '#7c3aed', fontWeight: '600' }}>
                {doctorData.specialization || 'General Practitioner'}
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a2332', marginBottom: '15px' }}>👤 Personal Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '5px' }}>Doctor ID</p>
                <p style={{ fontSize: '16px', color: '#1a2332', fontWeight: '500' }}>{doctorData.doctor_id || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '5px' }}>Full Name</p>
                <p style={{ fontSize: '16px', color: '#1a2332', fontWeight: '500' }}>{doctorData.full_name || `${doctorData.first_name || ''} ${doctorData.last_name || ''}` || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '5px' }}>Email</p>
                <p style={{ fontSize: '16px', color: '#1a2332', fontWeight: '500' }}>{doctorData.email || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '5px' }}>Phone</p>
                <p style={{ fontSize: '16px', color: '#1a2332', fontWeight: '500' }}>{doctorData.phone_no || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div style={{ marginBottom: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a2332', marginBottom: '15px' }}>🎓 Professional Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '5px' }}>License Number</p>
                <p style={{ fontSize: '16px', color: '#1a2332', fontWeight: '500' }}>{doctorData.license_number || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '5px' }}>Years of Experience</p>
                <p style={{ fontSize: '16px', color: '#1a2332', fontWeight: '500' }}>{doctorData.years_experience ? `${doctorData.years_experience} years` : 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '5px' }}>Qualifications</p>
                <p style={{ fontSize: '16px', color: '#1a2332', fontWeight: '500' }}>{doctorData.qualifications || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '5px' }}>Consultation Fee</p>
                <p style={{ fontSize: '16px', color: '#1a2332', fontWeight: '500' }}>{doctorData.consultation_fee ? `Rs. ${doctorData.consultation_fee}` : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Specializations Section */}
          <div style={{ marginBottom: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a2332' }}>🏥 Specializations</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => navigate('/doctor/specializations')}
                  style={{ 
                    padding: '8px 16px', 
                    background: '#3b82f6', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Manage Specializations
                </button>
                <button 
                  onClick={() => navigate('/doctor/specializations/browse')}
                  style={{ 
                    padding: '8px 16px', 
                    background: '#10b981', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Browse All Specializations
                </button>
              </div>
            </div>
            
            {loadingSpecializations ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #e5e7eb', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ marginTop: '10px', color: '#64748b' }}>Loading specializations...</p>
              </div>
            ) : specializations.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {specializations.map((spec, index) => (
                  <div 
                    key={spec.specialization_id || index}
                    style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>🏥</span>
                    <span>{spec.specialization_title}</span>
                    {spec.certification_date && (
                      <span style={{ fontSize: '12px', opacity: '0.8' }}>
                        ({new Date(spec.certification_date).getFullYear()})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                <p>No specializations added yet</p>
                <button 
                  onClick={() => navigate('/doctor/specializations')}
                  style={{ 
                    marginTop: '10px',
                    padding: '8px 16px', 
                    background: '#10b981', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Add Specializations
                </button>
              </div>
            )}
          </div>

          {/* Employment Details */}
          <div style={{ paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a2332', marginBottom: '15px' }}>🏥 Employment</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '5px' }}>Room Number</p>
                <p style={{ fontSize: '16px', color: '#1a2332', fontWeight: '500' }}>{localStorage.getItem('room_no') || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '5px' }}>Branch</p>
                <p style={{ fontSize: '16px', color: '#1a2332', fontWeight: '500' }}>{localStorage.getItem('branch_name') || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/doctor/dashboard')}
            style={{ padding: '12px 30px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
};

export default DoctorProfile;
