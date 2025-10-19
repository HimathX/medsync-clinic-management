import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const hasCheckedAuth = useRef(false);
  
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      // Fetch appointments after auth check passes
      fetchDoctorAppointments();
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
              <h3>{appointments.length}</h3>
              <p>Total Appointments</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{appointments.filter(a => a.status === 'Completed').length}</h3>
              <p>Completed</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{appointments.filter(a => a.status === 'Scheduled' || a.status === 'Pending').length}</h3>
              <p>Scheduled</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h3>{appointments.filter(a => a.status === 'Cancelled').length}</h3>
              <p>Cancelled</p>
            </div>
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