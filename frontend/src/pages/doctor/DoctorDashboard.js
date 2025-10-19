// src/pages/doctor/DoctorDashboard.js - Doctor Dashboard
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const hasCheckedAuth = useRef(false);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [stats, setStats] = useState({
    today_appointments: 0,
    pending_consultations: 0,
    completed_today: 0,
    patients_seen: 0,
    upcoming_appointments: 0,
    total_patients: 0
  });

  useEffect(() => {
    // Check authentication only once
    if (hasCheckedAuth.current) {
      console.log('Auth already checked, skipping');
      return;
    }
    hasCheckedAuth.current = true;

    const checkAuth = () => {
      console.log('🔐 Checking authentication...');
      
      const userId = localStorage.getItem('user_id');
      const userType = localStorage.getItem('user_type');
      const fullName = localStorage.getItem('full_name');
      const email = localStorage.getItem('email');
      const doctorId = localStorage.getItem('doctor_id');
      const roomNo = localStorage.getItem('room_no');
      const branchName = localStorage.getItem('branch_name');

      console.log('Auth data:', { userId, userType, fullName, email, doctorId });

      // Check if user is authenticated as a doctor
      if (!userId) {
        console.log('❌ No user_id found, redirecting to login');
        navigate('/doctor/login', { replace: true });
        return;
      }

      if (userType !== 'doctor') {
        console.log('❌ User type is not doctor:', userType);
        navigate('/doctor/login', { replace: true });
        return;
      }

      console.log('✅ Auth verified successfully');
      
      // Set current user
      const user = {
        userId,
        doctorId,
        fullName,
        email,
        roomNo,
        branchName
      };
      
      setCurrentUser(user);
      console.log('User set:', user);
      
      // Fetch dashboard data
      fetchDashboardData(doctorId);
    };

    checkAuth();
  }, [navigate]);

  const fetchDashboardData = async (doctorId) => {
    try {
      console.log('📡 Fetching dashboard data for doctor:', doctorId);
      setError(null);

      // Fetch stats
      await fetchStats(doctorId);
      
      // Fetch today's appointments
      await fetchTodayAppointments(doctorId);
      
      // Fetch upcoming appointments
      await fetchUpcomingAppointments(doctorId);

      setLoading(false);

    } catch (err) {
      console.error('💥 Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
    }
  };

  const fetchStats = async (doctorId) => {
    try {
      console.log('📊 Fetching dashboard stats...');
      
      const response = await fetch(
        `${API_BASE_URL}/doctors/${doctorId}/dashboard/stats`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Stats fetched:', data);
        setStats(data);
      } else {
        console.warn('⚠️ Could not fetch stats, status:', response.status);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchTodayAppointments = async (doctorId) => {
    try {
      console.log('📅 Fetching today\'s appointments...');
      
      const response = await fetch(
        `${API_BASE_URL}/doctors/${doctorId}/dashboard/today-appointments`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Today\'s appointments fetched:', data);
        setTodayAppointments(data.appointments || []);
      } else {
        console.warn('⚠️ Could not fetch today\'s appointments, status:', response.status);
      }
    } catch (err) {
      console.error('Error fetching today\'s appointments:', err);
    }
  };

  const fetchUpcomingAppointments = async (doctorId) => {
    try {
      console.log('📆 Fetching upcoming appointments...');
      
      const response = await fetch(
        `${API_BASE_URL}/doctors/${doctorId}/dashboard/upcoming?days=7`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Upcoming appointments fetched:', data);
        setUpcomingAppointments(data.appointments || []);
      } else {
        console.warn('⚠️ Could not fetch upcoming appointments, status:', response.status);
      }
    } catch (err) {
      console.error('Error fetching upcoming appointments:', err);
    }
  };

  const handleLogout = () => {
    console.log('🚪 Logging out...');
    localStorage.clear();
    navigate('/doctor/login', { replace: true });
  };

  const refreshDashboard = () => {
    console.log('🔄 Refreshing dashboard...');
    if (currentUser?.doctorId) {
      fetchDashboardData(currentUser.doctorId);
    }
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

  // If no current user, don't render (redirect happened)
  if (!currentUser) {
    return null;
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto', background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: '8px' }}>
            Welcome back, Dr. {currentUser.fullName} 👨‍⚕️
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#999' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={refreshDashboard}
            style={{
              background: '#fff',
              color: '#667eea',
              border: '2px solid #667eea',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
          <button 
            onClick={handleLogout}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>📅</div>
          <h3 style={{ margin: '0 0 5px 0', color: '#667eea', fontSize: '24px', fontWeight: '700' }}>{stats.today_appointments}</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>Today's Appointments</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
          <h3 style={{ margin: '0 0 5px 0', color: '#f59e0b', fontSize: '24px', fontWeight: '700' }}>{stats.pending_consultations}</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>Pending Consultations</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
          <h3 style={{ margin: '0 0 5px 0', color: '#10b981', fontSize: '24px', fontWeight: '700' }}>{stats.completed_today}</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>Completed Today</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>👥</div>
          <h3 style={{ margin: '0 0 5px 0', color: '#ec4899', fontSize: '24px', fontWeight: '700' }}>{stats.patients_seen}</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>Patients Seen Today</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🗓️</div>
          <h3 style={{ margin: '0 0 5px 0', color: '#8b5cf6', fontSize: '24px', fontWeight: '700' }}>{stats.upcoming_appointments}</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>Upcoming (7 days)</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>📊</div>
          <h3 style={{ margin: '0 0 5px 0', color: '#06b6d4', fontSize: '24px', fontWeight: '700' }}>{stats.total_patients}</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>Total Patients</p>
        </div>
      </div>

      {/* Today's Appointments */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <section style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Today's Appointments</h2>

          {todayAppointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <p style={{ fontSize: '16px', color: '#999' }}>No appointments scheduled for today</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
              {todayAppointments.slice(0, 10).map((appt) => (
                <div key={appt.appointment_id} style={{ padding: '15px', border: '1px solid #e9ecef', borderRadius: '8px', background: '#fafbfc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '16px' }}>
                        {appt.start_time ? appt.start_time.substring(0, 5) : 'TBD'}
                      </strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        {appt.patient_name}
                      </p>
                    </div>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: appt.status === 'Completed' ? '#e8f5e9' : appt.status === 'Checked-in' ? '#e3f2fd' : '#fff3cd',
                      color: appt.status === 'Completed' ? '#388e3c' : appt.status === 'Checked-in' ? '#1976d2' : '#856404'
                    }}>
                      {appt.status}
                    </span>
                  </div>
                  <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
                    ID: {appt.patient_id}
                  </p>
                  {appt.chronic_conditions && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                      <i className="fas fa-info-circle"></i> {appt.chronic_conditions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Appointments */}
        <section style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Upcoming Appointments (7 Days)</h2>

          {upcomingAppointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📆</div>
              <p style={{ fontSize: '16px', color: '#999' }}>No upcoming appointments</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
              {upcomingAppointments.slice(0, 10).map((appt) => (
                <div key={appt.appointment_id} style={{ padding: '15px', border: '1px solid #e9ecef', borderRadius: '8px', background: '#fafbfc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '16px' }}>
                        {appt.start_time ? appt.start_time.substring(0, 5) : 'TBD'}
                      </strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        {appt.patient_name}
                      </p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#999' }}>
                        {new Date(appt.available_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: '#e3f2fd',
                      color: '#1976d2'
                    }}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
