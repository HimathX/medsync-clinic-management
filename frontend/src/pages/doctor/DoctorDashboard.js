// src/pages/doctor/DoctorDashboard.js - Professional Doctor Dashboard
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import DoctorNavBar from '../../components/DoctorNavBar';
import '../../styles/patientDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const doctorId = currentUser?.userId || currentUser?.doctor_id;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
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
    upcomingAppointments: [],
    specializations: [],
    timeSlots: [],
    recentActivity: []
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
        const doctor = doctorData.doctor || doctorData;
        doctorInfo = {
          name: doctor.full_name || doctorInfo.name,
          email: doctor.email || doctorInfo.email,
          specializations: doctorData.specializations || [],
          room: doctor.room_no || doctorInfo.room,
          branch: doctor.branch_name || doctorInfo.branch
        };
      }

      // Fetch specializations with certification dates
      let specializationsData = [];
      try {
        const specResponse = await fetch(`${API_BASE_URL}/doctors/${doctorId}/specializations`, {
          headers: { 'Content-Type': 'application/json' }
        });
        if (specResponse.ok) {
          const specData = await specResponse.json();
          specializationsData = specData.specializations || [];
        }
      } catch (err) {
        console.log('Could not fetch specializations');
      }

      // Fetch available time slots
      let timeSlotsData = [];
      try {
        const slotsResponse = await fetch(`${API_BASE_URL}/doctors/${doctorId}/time-slots?available_only=true`, {
          headers: { 'Content-Type': 'application/json' }
        });
        if (slotsResponse.ok) {
          const slotsData = await slotsResponse.json();
          timeSlotsData = (slotsData.time_slots || []).slice(0, 10); // Next 10 slots
        }
      } catch (err) {
        console.log('Could not fetch time slots');
      }

      // Generate recent activity from appointments
      const recentActivity = [
        ...todayData.appointments.slice(0, 5).map(apt => ({
          type: 'appointment',
          icon: '📅',
          title: `Appointment with ${apt.patient_name}`,
          time: new Date().toISOString(),
          status: apt.status
        })),
        { type: 'login', icon: '🔐', title: 'Logged into system', time: new Date().toISOString(), status: 'Success' }
      ];

      setData({
        doctor: doctorInfo,
        stats: stats,
        todayAppointments: todayData.appointments || [],
        upcomingAppointments: upcomingData.appointments || [],
        specializations: specializationsData,
        timeSlots: timeSlotsData,
        recentActivity: recentActivity
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const then = new Date(dateString);
    const seconds = Math.floor((now - then) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hrs ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
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
      <DoctorNavBar />

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
                  {data.doctor.specializations && data.doctor.specializations[0] 
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
        <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', padding: '32px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '900', background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '12px' }}>
            Welcome back, Dr. {data.doctor.name} 👨‍⚕️
          </h1>
          <p style={{ fontSize: '16px', color: '#059669', fontWeight: '600', marginBottom: '8px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          {data.doctor.room && (
            <p style={{ fontSize: '14px', color: '#10b981', fontWeight: '600', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏥 <span>Room {data.doctor.room}</span> • <span>{data.doctor.branch}</span>
            </p>
          )}
        </section>



        {/* Tabbed Sections */}
        <section style={{ marginBottom: '40px' }}>
          {/* Tab Navigation */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '24px',
            borderBottom: '2px solid rgba(16, 185, 129, 0.1)',
            paddingBottom: '16px',
            overflowX: 'auto'
          }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '14px 28px',
                background: activeTab === 'overview' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(16, 185, 129, 0.08)',
                color: activeTab === 'overview' ? 'white' : '#059669',
                border: activeTab === 'overview' ? 'none' : '2px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: activeTab === 'overview' ? '0 6px 20px rgba(16, 185, 129, 0.3)' : 'none',
                fontSize: '15px',
                whiteSpace: 'nowrap'
              }}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('specializations')}
              style={{
                padding: '14px 28px',
                background: activeTab === 'specializations' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(16, 185, 129, 0.08)',
                color: activeTab === 'specializations' ? 'white' : '#059669',
                border: activeTab === 'specializations' ? 'none' : '2px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: activeTab === 'specializations' ? '0 6px 20px rgba(16, 185, 129, 0.3)' : 'none',
                fontSize: '15px',
                whiteSpace: 'nowrap'
              }}
            >
              🎓 Specializations
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              style={{
                padding: '14px 28px',
                background: activeTab === 'availability' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(16, 185, 129, 0.08)',
                color: activeTab === 'availability' ? 'white' : '#059669',
                border: activeTab === 'availability' ? 'none' : '2px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: activeTab === 'availability' ? '0 6px 20px rgba(16, 185, 129, 0.3)' : 'none',
                fontSize: '15px',
                whiteSpace: 'nowrap'
              }}
            >
              🕒 Availability
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              style={{
                padding: '14px 28px',
                background: activeTab === 'activity' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(16, 185, 129, 0.08)',
                color: activeTab === 'activity' ? 'white' : '#059669',
                border: activeTab === 'activity' ? 'none' : '2px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: activeTab === 'activity' ? '0 6px 20px rgba(16, 185, 129, 0.3)' : 'none',
                fontSize: '15px',
                whiteSpace: 'nowrap'
              }}
            >
              🔔 Activity
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '40px', boxShadow: '0 8px 32px rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
            {activeTab === 'overview' && (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>
                  Performance Overview
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div style={{ padding: '20px', background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Completion Rate</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#667eea' }}>
                      {data.stats.today_appointments > 0 
                        ? Math.round((data.stats.completed_today / data.stats.today_appointments) * 100) 
                        : 0}%
                    </div>
                  </div>
                  <div style={{ padding: '20px', background: 'linear-gradient(135deg, #43e97b20 0%, #38f9d720 100%)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Avg. Patients/Day</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#43e97b' }}>
                      {data.stats.patients_seen}
                    </div>
                  </div>
                  <div style={{ padding: '20px', background: 'linear-gradient(135deg, #4facfe20 0%, #00f2fe20 100%)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Total Patients</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#4facfe' }}>
                      {data.stats.total_patients}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'specializations' && (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>
                  My Specializations & Certifications
                </h3>
                {data.specializations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
                    <p>No specializations found</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {data.specializations.map((spec, index) => (
                      <div key={index} style={{
                        padding: '20px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.3s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                      >
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a2332', marginBottom: '4px' }}>
                            🎓 {spec.specialization_title}
                          </div>
                          <div style={{ fontSize: '14px', color: '#64748b' }}>
                            {spec.other_details || 'Professional certification'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Certified</div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#667eea' }}>
                            {formatDate(spec.certification_date)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'availability' && (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>
                  My Available Time Slots
                </h3>
                {data.timeSlots.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                    <p>No available time slots</p>
                    <button
                      onClick={() => navigate('/doctor/schedule')}
                      style={{
                        marginTop: '16px',
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Create Time Slots
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {data.timeSlots.map((slot, index) => (
                      <div key={index} style={{
                        padding: '16px',
                        background: slot.is_booked ? '#fff3e0' : '#e8f5e9',
                        borderLeft: `4px solid ${slot.is_booked ? '#f59e0b' : '#10b981'}`,
                        borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a2332' }}>
                            📅 {formatDate(slot.available_date)}
                          </div>
                          <div style={{
                            padding: '4px 12px',
                            background: slot.is_booked ? '#f59e0b' : '#10b981',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {slot.is_booked ? 'Booked' : 'Available'}
                          </div>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a2332' }}>
                          🕒 {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>
                  Recent Activity
                </h3>
                {data.recentActivity.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
                    <p>No recent activity</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {data.recentActivity.map((activity, index) => (
                      <div key={index} style={{
                        padding: '16px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ fontSize: '32px' }}>{activity.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a2332', marginBottom: '4px' }}>
                            {activity.title}
                          </div>
                          <div style={{ fontSize: '14px', color: '#64748b' }}>
                            {getTimeAgo(activity.time)}
                          </div>
                        </div>
                        <div style={{
                          padding: '6px 12px',
                          background: getStatusColor(activity.status) + '20',
                          color: getStatusColor(activity.status),
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {activity.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="dashboard-section">
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>Quick Actions</h2>
          
          <div className="quick-actions-grid">
            <button 
              type="button"
              className="quick-action-card" 
              onClick={() => {
                console.log('📅 Navigating to appointments');
                navigate('/doctor/appointments');
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>📅</div>
              <div className="quick-action-label">View Schedule</div>
            </button>

            <button 
              type="button"
              className="quick-action-card" 
              onClick={() => {
                console.log('👥 Navigating to patients');
                navigate('/doctor/patients');
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>👥</div>
              <div className="quick-action-label">Patient List</div>
            </button>

            <button 
              type="button"
              className="quick-action-card" 
              onClick={() => {
                console.log('📋 Navigating to consultations');
                navigate('/doctor/consultations');
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>📋</div>
              <div className="quick-action-label">Consultations</div>
            </button>

            <button 
              type="button"
              className="quick-action-card" 
              onClick={() => {
                console.log('� Navigating to financial metrics');
                navigate('/doctor/financial-metrics');
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>�</div>
              <div className="quick-action-label">Financial Metrics</div>
            </button>

            <button 
              type="button"
              className="quick-action-card" 
              onClick={() => {
                console.log('⚙️ Navigating to schedule');
                navigate('/doctor/schedule');
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>⚙️</div>
              <div className="quick-action-label">Manage Schedule</div>
            </button>

            <button 
              type="button"
              className="quick-action-card" 
              onClick={() => {
                console.log('👤 Navigating to profile');
                navigate('/doctor/profile');
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}>👤</div>
              <div className="quick-action-label">My Profile</div>
            </button>
          </div>
        </section>
        {/* Quick Action Cards */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#047857', marginBottom: '20px' }}>
            ⚡ Quick Actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Medication Management Card */}
            <div
              onClick={() => navigate('/doctor/medications')}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '16px',
                padding: '30px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3)';
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💊</div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
                Medication Database
              </h3>
              <p style={{ fontSize: '14px', opacity: '0.9', marginBottom: '16px' }}>
                Add, edit, and manage medications for prescriptions
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                <span>Manage Medications</span>
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>

            {/* Treatment Management Card */}
            <div
              onClick={() => navigate('/doctor/treatment-management')}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '16px',
                padding: '30px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3)';
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏥</div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
                Treatment Catalogue
              </h3>
              <p style={{ fontSize: '14px', opacity: '0.9', marginBottom: '16px' }}>
                Add, edit, and manage treatment services
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                <span>Manage Treatments</span>
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>
          </div>
        </section>
        {/* Stats Grid */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#047857', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>📊</span>
            Dashboard Statistics
          </h2>

          <div className="dashboard-stats-grid" style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            padding: '0 4px'
          }}>
  <div className="stat-card stat-card-hover" style={{ 
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderRadius: '20px',
    padding: '32px 28px',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '200px'
  }}>
    <div style={{ 
      position: 'absolute', 
      top: '-20px', 
      right: '-20px', 
      fontSize: '120px', 
      opacity: '0.1',
      lineHeight: '1',
      pointerEvents: 'none'
    }}>📅</div>
    <div>
      <div style={{ fontSize: '48px', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>📅</div>
      <div style={{ 
        fontSize: '42px', 
        fontWeight: '700', 
        marginBottom: '12px',
        letterSpacing: '-1px'
      }}>{data.stats.today_appointments}</div>
    </div>
    <div style={{ 
      fontSize: '15px', 
      opacity: '0.95',
      fontWeight: '500',
      letterSpacing: '0.3px',
      marginTop: 'auto'
    }}>Today's Appointments</div>
    <div style={{
      fontSize: '12px',
      opacity: '0.75',
      marginTop: '8px',
      paddingTop: '12px',
      borderTop: '1px solid rgba(255, 255, 255, 0.2)'
    }}>Active Schedule</div>
  </div>

  <div className="stat-card stat-card-hover" style={{ 
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderRadius: '20px',
    padding: '32px 28px',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '200px'
  }}>
    <div style={{ 
      position: 'absolute', 
      top: '-20px', 
      right: '-20px', 
      fontSize: '120px', 
      opacity: '0.1',
      lineHeight: '1',
      pointerEvents: 'none'
    }}>⏳</div>
    <div>
      <div style={{ fontSize: '48px', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>⏳</div>
      <div style={{ 
        fontSize: '42px', 
        fontWeight: '700', 
        marginBottom: '12px',
        letterSpacing: '-1px'
      }}>{data.stats.pending_consultations}</div>
    </div>
    <div style={{ 
      fontSize: '15px', 
      opacity: '0.95',
      fontWeight: '500',
      letterSpacing: '0.3px',
      marginTop: 'auto'
    }}>Pending Consultations</div>
    <div style={{
      fontSize: '12px',
      opacity: '0.75',
      marginTop: '8px',
      paddingTop: '12px',
      borderTop: '1px solid rgba(255, 255, 255, 0.2)'
    }}>Awaiting Action</div>
  </div>

  <div className="stat-card stat-card-hover" style={{ 
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderRadius: '20px',
    padding: '32px 28px',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '200px'
  }}>
    <div style={{ 
      position: 'absolute', 
      top: '-20px', 
      right: '-20px', 
      fontSize: '120px', 
      opacity: '0.1',
      lineHeight: '1',
      pointerEvents: 'none'
    }}>✅</div>
    <div>
      <div style={{ fontSize: '48px', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>✅</div>
      <div style={{ 
        fontSize: '42px', 
        fontWeight: '700', 
        marginBottom: '12px',
        letterSpacing: '-1px'
      }}>{data.stats.completed_today}</div>
    </div>
    {/* <div style={{ 
      fontSize: '15px', 
      opacity: '0.95',
      fontWeight: '500',
      letterSpacing: '0.3px',
      marginTop: 'auto'
    }}>Completed Today</div>
    <div style={{
      fontSize: '12px',
      opacity: '0.75',
      marginTop: '8px',
      paddingTop: '12px',
      borderTop: '1px solid rgba(255, 255, 255, 0.2)'
    }}>All Done</div>
  </div>

  <div className="stat-card stat-card-hover" style={{ 
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderRadius: '20px',
    padding: '32px 28px',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '200px'
  }}>
    <div style={{ 
      position: 'absolute', 
      top: '-20px', 
      right: '-20px', 
      fontSize: '120px', 
      opacity: '0.1',
      lineHeight: '1',
      pointerEvents: 'none'
    }}>👥</div> */}
    <div>
      <div style={{ fontSize: '48px', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>👥</div>
      <div style={{ 
        fontSize: '42px', 
        fontWeight: '700', 
        marginBottom: '12px',
        letterSpacing: '-1px'
      }}>{data.stats.patients_seen}</div>
    </div>
    <div style={{ 
      fontSize: '15px', 
      opacity: '0.95',
      fontWeight: '500',
      letterSpacing: '0.3px',
      marginTop: 'auto'
    }}>Patients Seen Today</div>
    <div style={{
      fontSize: '12px',
      opacity: '0.75',
      marginTop: '8px',
      paddingTop: '12px',
      borderTop: '1px solid rgba(255, 255, 255, 0.2)'
    }}>Active Consultations</div>
  </div>

  <div className="stat-card stat-card-hover" style={{ 
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderRadius: '20px',
    padding: '32px 28px',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '200px'
  }}>
    <div style={{ 
      position: 'absolute', 
      top: '-20px', 
      right: '-20px', 
      fontSize: '120px', 
      opacity: '0.1',
      lineHeight: '1',
      pointerEvents: 'none'
    }}>📆</div>
    <div>
      <div style={{ fontSize: '48px', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>📆</div>
      <div style={{ 
        fontSize: '42px', 
        fontWeight: '700', 
        marginBottom: '12px',
        letterSpacing: '-1px'
      }}>{data.stats.upcoming_appointments}</div>
    </div>
    <div style={{ 
      fontSize: '15px', 
      opacity: '0.95',
      fontWeight: '500',
      letterSpacing: '0.3px',
      marginTop: 'auto'
    }}>Upcoming</div>
    <div style={{
      fontSize: '12px',
      opacity: '0.75',
      marginTop: '8px',
      paddingTop: '12px',
      borderTop: '1px solid rgba(255, 255, 255, 0.2)'
    }}>Scheduled</div>
  </div>

  {/* <div className="stat-card stat-card-hover" style={{ 
    background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    borderRadius: '20px',
    padding: '32px 28px',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(48, 207, 208, 0.3)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '200px'
  }}>
    <div style={{ 
      position: 'absolute', 
      top: '-20px', 
      right: '-20px', 
      fontSize: '120px', 
      opacity: '0.1',
      lineHeight: '1',
      pointerEvents: 'none'
    }}>🩺</div>
    <div>
      <div style={{ fontSize: '48px', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>🩺</div>
      <div style={{ 
        fontSize: '42px', 
        fontWeight: '700', 
        marginBottom: '12px',
        letterSpacing: '-1px'
      }}>{data.stats.total_patients}</div>
    </div>
    <div style={{ 
      fontSize: '15px', 
      opacity: '0.95',
      fontWeight: '500',
      letterSpacing: '0.3px',
      marginTop: 'auto'
    }}>Total Patients</div>
    <div style={{
      fontSize: '12px',
      opacity: '0.75',
      marginTop: '8px',
      paddingTop: '12px',
      borderTop: '1px solid rgba(125, 30, 30, 0.2)'
    }}>Under Care</div>
  </div> */}
          </div>
        </section>
      </main>
    </div>
  );
}

