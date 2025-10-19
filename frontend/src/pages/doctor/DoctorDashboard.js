// src/pages/doctor/DoctorDashboard.js - Professional Doctor Dashboard
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import '../../styles/patientDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const doctorId = currentUser?.userId || currentUser?.doctor_id;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [data, setData] = useState({
    doctor: {
      name: 'Doctor',
      email: '',
      specializations: [],
      room: '',
      branch: ''
    },
    stats: {
      today_appointments: 0,
      pending_consultations: 0,
      completed_today: 0,
      patients_seen: 0,
      upcoming_appointments: 0,
      total_patients: 0
    },
    todayAppointments: [],
    upcomingAppointments: []
  });

  useEffect(() => {
    const checkAuth = () => {
      console.log('🔐 Checking authentication...');
      
      const userId = localStorage.getItem('user_id');
      const userType = localStorage.getItem('user_type');
      const fullName = localStorage.getItem('full_name');
      const email = localStorage.getItem('email');
      const doctorIdLocal = localStorage.getItem('doctor_id');
      const roomNo = localStorage.getItem('room_no');
      const branchName = localStorage.getItem('branch_name');

      console.log('Auth data:', { userId, userType, fullName, email, doctorId: doctorIdLocal });

      // Check if user is authenticated as a doctor
      if (!userId) {
        console.log('❌ No user_id found, redirecting to login');
        navigate('/doctor-login', { replace: true });
        return;
      }

      if (userType !== 'doctor') {
        console.log('❌ User type is not doctor:', userType);
        navigate('/doctor-login', { replace: true });
        return;
      }

      console.log('✅ Auth verified successfully');
      
      // Fetch dashboard data
      if (doctorId) {
        fetchDashboardData();
      }
    };

    checkAuth();
  }, [doctorId, navigate]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Fetching dashboard data for doctor:', doctorId);

      // Fetch doctor dashboard stats
      const statsResponse = await fetch(`${API_BASE_URL}/doctors/${doctorId}/dashboard/stats`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!statsResponse.ok) throw new Error('Failed to fetch stats');
      const stats = await statsResponse.json();

      // Fetch today's appointments
      const todayResponse = await fetch(`${API_BASE_URL}/doctors/${doctorId}/dashboard/today-appointments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!todayResponse.ok) throw new Error('Failed to fetch today appointments');
      const todayData = await todayResponse.json();

      // Fetch upcoming appointments
      const upcomingResponse = await fetch(`${API_BASE_URL}/doctors/${doctorId}/dashboard/upcoming?days=7`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!upcomingResponse.ok) throw new Error('Failed to fetch upcoming appointments');
      const upcomingData = await upcomingResponse.json();

      // Fetch doctor details
      const doctorResponse = await fetch(`${API_BASE_URL}/doctors/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      let doctorInfo = {
        name: currentUser?.fullName || currentUser?.full_name || localStorage.getItem('full_name') || 'Doctor',
        email: currentUser?.email || localStorage.getItem('email') || '',
        specializations: [],
        room: localStorage.getItem('room_no') || '',
        branch: localStorage.getItem('branch_name') || ''
      };

      if (doctorResponse.ok) {
        const doctorData = await doctorResponse.json();
        doctorInfo = {
          name: doctorData.full_name || doctorInfo.name,
          email: doctorData.email || doctorInfo.email,
          specializations: doctorData.specializations || [],
          room: doctorData.room_no || doctorInfo.room,
          branch: doctorData.branch_name || doctorInfo.branch
        };
      }

      setData({
        doctor: doctorInfo,
        stats: stats,
        todayAppointments: todayData.appointments || [],
        upcomingAppointments: upcomingData.appointments || []
      });

      console.log('✅ Dashboard data loaded successfully');
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [doctorId, currentUser]);

  const handleLogout = () => {
    authService.logout();
    navigate('/doctor-login');
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    if (typeof timeStr === 'number') {
      const hours = Math.floor(timeStr / 3600);
      const minutes = Math.floor((timeStr % 3600) / 60);
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    return timeStr.substring(0, 5);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Scheduled': '#3b82f6',
      'Checked-in': '#f59e0b',
      'Completed': '#10b981',
      'Cancelled': '#ef4444',
      'No-Show': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="patient-portal">
        <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-portal">
      {/* Top Navigation */}
      <nav className="patient-top-nav">
        <div className="patient-top-nav-content">
          <div className="patient-nav-links">
            <a href="#overview">Overview</a>
            <a href="#appointments">Appointments</a>
            <a href="#patients">Patients</a>
          </div>
          <div className="patient-nav-actions">
            <a href="tel:+94112345678" className="patient-contact-link">📞 +94 11 234 5678</a>
            <a href="/support" className="patient-emergency-link">🆘 Support</a>
          </div>
        </div>
      </nav>

      {/* Main Header */}
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
                <div className="patient-name-display">Dr. {data.doctor.name}</div>
                <div className="patient-id-display">
                  {data.doctor.specializations && data.doctor.specializations.length > 0 
                    ? (typeof data.doctor.specializations[0] === 'object' 
                        ? data.doctor.specializations[0].specialization_title 
                        : data.doctor.specializations[0])
                    : 'Physician'}
                </div>
              </div>
              <div className="patient-avatar-wrapper">
                <div className="patient-avatar">
                  {data.doctor.name.charAt(0).toUpperCase()}
                </div>
                <div className="avatar-status-indicator"></div>
              </div>
            </div>

            {showProfileMenu && (
              <div className="patient-profile-dropdown">
                <button className="patient-dropdown-item" onClick={() => navigate('/doctor/profile')}>
                  <span className="dropdown-icon">👤</span>
                  <span>My Profile</span>
                </button>
                <button className="patient-dropdown-item" onClick={() => navigate('/doctor/schedule')}>
                  <span className="dropdown-icon">📅</span>
                  <span>My Schedule</span>
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
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '30px' }}>
            <strong>Error:</strong> {error}
            <button onClick={fetchDashboardData} style={{ marginLeft: '20px' }}>Retry</button>
          </div>
        )}

        {/* Welcome Section */}
        <section style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1a2332', marginBottom: '8px' }}>
            Welcome back, Dr. {data.doctor.name} 👨‍⚕️
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          {data.doctor.room && (
            <p style={{ fontSize: '14px', color: '#7c3aed', fontWeight: '600', marginTop: '4px' }}>
              🏥 Room {data.doctor.room} • {data.doctor.branch}
            </p>
          )}
        </section>

        {/* Stats Grid */}
        <section className="dashboard-stats-grid" style={{ marginBottom: '40px' }}>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="stat-icon">📅</div>
            <div className="stat-value">{data.stats.today_appointments}</div>
            <div className="stat-label">Today's Appointments</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <div className="stat-icon">⏳</div>
            <div className="stat-value">{data.stats.pending_consultations}</div>
            <div className="stat-label">Pending Consultations</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <div className="stat-icon">✅</div>
            <div className="stat-value">{data.stats.completed_today}</div>
            <div className="stat-label">Completed Today</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <div className="stat-icon">👥</div>
            <div className="stat-value">{data.stats.patients_seen}</div>
            <div className="stat-label">Patients Seen Today</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <div className="stat-icon">📆</div>
            <div className="stat-value">{data.stats.upcoming_appointments}</div>
            <div className="stat-label">Upcoming</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}>
            <div className="stat-icon">🩺</div>
            <div className="stat-value">{data.stats.total_patients}</div>
            <div className="stat-label">Total Patients</div>
          </div>
        </section>

        {/* Today's Appointments */}
        <section className="dashboard-section" style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332' }}>Today's Schedule</h2>
            <button className="btn-view-all" onClick={() => navigate('/doctor/appointments')}>
              View All →
            </button>
          </div>

          {data.todayAppointments.length === 0 ? (
            <div className="empty-state-card">
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#1a2332' }}>No appointments today</h3>
              <p style={{ color: '#64748b' }}>You have no scheduled appointments for today</p>
            </div>
          ) : (
            <div className="appointments-list">
              {data.todayAppointments.map((appt, index) => (
                <div key={appt.appointment_id || index} className="appointment-card-modern">
                  <div className="appointment-time-badge">
                    <div className="time-large">{formatTime(appt.start_time)}</div>
                    <div className="time-small">to {formatTime(appt.end_time)}</div>
                  </div>

                  <div className="appointment-details-section">
                    <div className="patient-info-row">
                      <div className="patient-avatar-small">
                        {appt.patient_name ? appt.patient_name.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div>
                        <div className="patient-name-large">{appt.patient_name || 'Patient'}</div>
                        <div className="patient-id-small">ID: {appt.patient_id}</div>
                      </div>
                    </div>

                    {(appt.chronic_conditions || appt.allergies) && (
                      <div className="medical-alerts">
                        {appt.chronic_conditions && (
                          <span className="alert-badge-warning">🩺 {appt.chronic_conditions}</span>
                        )}
                        {appt.allergies && (
                          <span className="alert-badge-danger">⚠️ Allergies: {appt.allergies}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="appointment-actions-section">
                    <div className="status-badge" style={{ backgroundColor: getStatusColor(appt.status), color: 'white' }}>
                      {appt.status}
                    </div>
                    <button 
                      className="btn-action-primary"
                      onClick={() => navigate(`/doctor/consultations/${appt.appointment_id}`)}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Appointments */}
        <section className="dashboard-section" style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332' }}>Upcoming Appointments</h2>
          </div>

          {data.upcomingAppointments.length === 0 ? (
            <div className="empty-state-card">
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
              <p style={{ color: '#64748b' }}>No upcoming appointments in the next 7 days</p>
            </div>
          ) : (
            <div className="upcoming-appointments-grid">
              {data.upcomingAppointments.slice(0, 6).map((appt, index) => (
                <div key={appt.appointment_id || index} className="upcoming-appointment-card">
                  <div className="upcoming-date-section">
                    <div className="date-day">
                      {new Date(appt.available_date).getDate()}
                    </div>
                    <div className="date-month">
                      {new Date(appt.available_date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                  <div className="upcoming-info-section">
                    <div className="upcoming-time">{formatTime(appt.start_time)}</div>
                    <div className="upcoming-patient">{appt.patient_name || 'Patient'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="dashboard-section">
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>Quick Actions</h2>
          
          <div className="quick-actions-grid">
            <button className="quick-action-card" onClick={() => navigate('/doctor/appointments')}>
              <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>📅</div>
              <div className="quick-action-label">View Schedule</div>
            </button>

            <button className="quick-action-card" onClick={() => navigate('/doctor/patients')}>
              <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>👥</div>
              <div className="quick-action-label">Patient List</div>
            </button>

            <button className="quick-action-card" onClick={() => navigate('/doctor/consultations')}>
              <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>📋</div>
              <div className="quick-action-label">Consultations</div>
            </button>

            <button className="quick-action-card" onClick={() => navigate('/doctor/prescriptions')}>
              <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>💊</div>
              <div className="quick-action-label">Prescriptions</div>
            </button>

            <button className="quick-action-card" onClick={() => navigate('/doctor/schedule')}>
              <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>⚙️</div>
              <div className="quick-action-label">Manage Schedule</div>
            </button>

            <button className="quick-action-card" onClick={() => navigate('/doctor/profile')}>
              <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}>👤</div>
              <div className="quick-action-label">My Profile</div>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}