import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import specializationService from '../services/specializationService';
import appointmentService from '../services/appointmentService';
import timeSlotService from '../services/timeSlotService';
import '../styles/dashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const hasCheckedAuth = useRef(false);
  
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingSpecializations, setLoadingSpecializations] = useState(false);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [appointmentStats, setAppointmentStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0
  });

  useEffect(() => {
    // Check authentication only once
    if (hasCheckedAuth.current) {
      console.log('Auth already checked, skipping');
      return;
    }
    hasCheckedAuth.current = true;

    const checkAuth = () => {
      const userId = localStorage.getItem('user_id');
      const userType = localStorage.getItem('user_type');
      const fullName = localStorage.getItem('full_name');
      const email = localStorage.getItem('email');
      const doctorId = localStorage.getItem('doctor_id');
      const roomNo = localStorage.getItem('room_no');
      const branchName = localStorage.getItem('branch_name');

      console.log('🔐 Auth check:', { userId, userType, fullName, email });

      // Check if user is authenticated as a doctor
      if (!userId) {
        console.log('❌ No user_id found, redirecting to login');
        navigate('/doctor/login', { replace: true });
        return false;
      }

      if (userType !== 'doctor') {
        console.log('❌ User type is not doctor:', userType);
        navigate('/doctor/login', { replace: true });
        return false;
      }

      console.log('✅ Auth verified successfully');
      
      // Set doctor info
      setDoctorInfo({
        userId,
        doctorId,
        fullName,
        email,
        roomNo,
        branchName,
      });

      // Fetch appointments, specializations, and time slots after auth check passes
      fetchDoctorAppointments();
      fetchDoctorSpecializations();
      fetchDoctorTimeSlots();
      fetchAppointmentStats();
      return true;
    };

    checkAuth();
  }, [navigate]);

  const fetchDoctorAppointments = async () => {
    setError('');
    try {
      const doctorId = localStorage.getItem('doctor_id');
      const token = localStorage.getItem('user_id');

      console.log('📡 Fetching appointments for doctor:', doctorId);

      const response = await fetch(
        `${API_BASE_URL}/appointments/?doctor_id=${doctorId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Appointments fetched:', data);
        
        // Handle different response formats
        const appointmentsData = Array.isArray(data) ? data : (data.appointments || data.data || []);
        setAppointments(appointmentsData);
      } else {
        console.warn('⚠️ Could not fetch appointments, status:', response.status);
        setAppointments([]);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorSpecializations = async () => {
    setLoadingSpecializations(true);
    try {
      const doctorId = localStorage.getItem('doctor_id');
      console.log('📡 Fetching specializations for doctor:', doctorId);
      
      const data = await specializationService.getDoctorSpecializations(doctorId);
      console.log('✅ Specializations fetched:', data);
      setSpecializations(data.specializations || []);
    } catch (err) {
      console.error('Error fetching specializations:', err);
      // Don't set error for specializations as it's not critical
    } finally {
      setLoadingSpecializations(false);
    }
  };

  const fetchDoctorTimeSlots = async () => {
    setLoadingTimeSlots(true);
    try {
      const doctorId = localStorage.getItem('doctor_id');
      console.log('📡 Fetching time slots for doctor:', doctorId);
      
      const data = await timeSlotService.getDoctorTimeSlots(doctorId, false);
      console.log('✅ Time slots fetched:', data);
      setTimeSlots(data.time_slots || []);
    } catch (err) {
      console.error('Error fetching time slots:', err);
      // Don't set error for time slots as it's not critical
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  const fetchAppointmentStats = async () => {
    try {
      const doctorId = localStorage.getItem('doctor_id');
      console.log('📡 Fetching appointment stats for doctor:', doctorId);
      
      const stats = await appointmentService.getDoctorAppointmentStats(doctorId);
      console.log('✅ Appointment stats fetched:', stats);
      setAppointmentStats(stats);
    } catch (err) {
      console.error('Error fetching appointment stats:', err);
      // Don't set error for stats as it's not critical
    }
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.clear();
    console.log('🚪 Logged out, redirecting to login');
    navigate('/doctor/login', { replace: true });
  };

  // Show loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        <div>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
          Loading Dashboard...
        </div>
      </div>
    );
  }

  // If no doctor info after auth check, render nothing (redirect happened)
  if (!doctorInfo) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        <div>Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard">
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>👨‍⚕️ Doctor Dashboard</h1>
          <p>Welcome back, <strong>{doctorInfo.fullName}</strong></p>
        </div>
        <div className="header-right">
          <div className="doctor-info">
            <div className="info-item">
              <span className="label">Room:</span>
              <span className="value">{doctorInfo.roomNo}</span>
            </div>
            <div className="info-item">
              <span className="label">Branch:</span>
              <span className="value">{doctorInfo.branchName}</span>
            </div>
            <div className="info-item">
              <span className="label">Email:</span>
              <span className="value">{doctorInfo.email}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Stats Cards */}
        <section className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{appointmentStats.total}</h3>
              <p>Total Appointments</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{appointmentStats.completed}</h3>
              <p>Completed</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{appointmentStats.scheduled}</h3>
              <p>Scheduled</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h3>{appointmentStats.cancelled}</h3>
              <p>Cancelled</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>{timeSlots.length}</h3>
              <p>Time Slots</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏥</div>
            <div className="stat-content">
              <h3>{specializations.length}</h3>
              <p>Specializations</p>
            </div>
          </div>
        </section>

        {/* Specializations Section */}
        <section className="specializations-section" style={{ marginBottom: '40px' }}>
          <div className="section-header">
            <h2>My Specializations</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn-refresh" 
                onClick={fetchDoctorSpecializations}
                disabled={loadingSpecializations}
              >
                <i className="fas fa-sync-alt"></i> Refresh
              </button>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/doctor/specializations')}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}
              >
                <i className="fas fa-plus"></i> Manage
              </button>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {loadingSpecializations ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
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
                      padding: '10px 20px',
                      borderRadius: '25px',
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
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <i className="fas fa-stethoscope" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
                <p>No specializations added yet</p>
                <button 
                  onClick={() => navigate('/doctor/specializations')}
                  style={{ 
                    marginTop: '10px',
                    padding: '10px 20px', 
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
        </section>

        {/* Time Slots Section */}
        <section className="time-slots-section" style={{ marginBottom: '40px' }}>
          <div className="section-header">
            <h2>My Time Slots</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn-refresh" 
                onClick={fetchDoctorTimeSlots}
                disabled={loadingTimeSlots}
              >
                <i className="fas fa-sync-alt"></i> Refresh
              </button>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/doctor/time-slots')}
                style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}
              >
                <i className="fas fa-plus"></i> Manage Time Slots
              </button>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {loadingTimeSlots ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #e5e7eb', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ marginTop: '10px', color: '#64748b' }}>Loading time slots...</p>
              </div>
            ) : timeSlots.length > 0 ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                  {timeSlots.slice(0, 6).map((slot, index) => {
                    const today = new Date();
                    const slotDate = new Date(slot.available_date);
                    const isPast = slotDate < today;
                    const isBooked = slot.is_booked;
                    
                    return (
                      <div 
                        key={slot.time_slot_id || index}
                        style={{ 
                          padding: '15px', 
                          background: isBooked ? '#fef3c7' : isPast ? '#f3f4f6' : '#d1fae5',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1a2332', margin: '0' }}>
                            {new Date(slot.available_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </h4>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '12px', 
                            fontSize: '12px', 
                            fontWeight: '600',
                            background: isBooked ? '#fbbf24' : isPast ? '#9ca3af' : '#10b981',
                            color: isBooked ? '#92400e' : isPast ? '#6b7280' : '#065f46'
                          }}>
                            {isBooked ? 'Booked' : isPast ? 'Past' : 'Available'}
                          </span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: '0' }}>
                          {new Date(`2000-01-01T${slot.start_time}`).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })} - {new Date(`2000-01-01T${slot.end_time}`).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {timeSlots.length > 6 && (
                  <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <button 
                      onClick={() => navigate('/doctor/time-slots')}
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
                      View All Time Slots ({timeSlots.length})
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <i className="fas fa-clock" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
                <p>No time slots created yet</p>
                <button 
                  onClick={() => navigate('/doctor/time-slots')}
                  style={{ 
                    marginTop: '10px',
                    padding: '10px 20px', 
                    background: '#10b981', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Create Time Slots
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Appointments Table */}
        <section className="appointments-section">
          <div className="section-header">
            <h2>My Appointments</h2>
            <button className="btn-refresh" onClick={fetchDoctorAppointments}>
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-alt"></i>
              <p>No appointments scheduled</p>
            </div>
          ) : (
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.appointment_id || apt.id}>
                    <td>#{apt.appointment_id || apt.id}</td>
                    <td>Patient #{apt.patient_id}</td>
                    <td>{apt.appointment_date ? new Date(apt.appointment_date).toLocaleString() : 'N/A'}</td>
                    <td>{apt.duration_minutes || 30} mins</td>
                    <td>
                      <span className={`status-badge status-${apt.status?.toLowerCase() || 'pending'}`}>
                        {apt.status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-small">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
};

export default DoctorDashboard;