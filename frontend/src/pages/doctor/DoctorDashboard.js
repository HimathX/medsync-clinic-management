// src/pages/doctor/DoctorDashboard.js - Doctor Dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import appointmentService from '../../services/appointmentService';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorMessage from '../../components/shared/ErrorMessage';
import StatCard from '../../components/shared/StatCard';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const doctorId = currentUser?.userId;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    completed: 0,
    totalPatients: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch doctor's appointments
      const appointmentsData = await appointmentService.getAppointments({
        doctor_id: doctorId,
        date: new Date().toISOString().split('T')[0]
      });

      const appointments = appointmentsData.appointments || [];
      setTodayAppointments(appointments);

      // Calculate stats
      setStats({
        today: appointments.length,
        pending: appointments.filter(a => a.status === 'Scheduled' || a.status === 'Checked-in').length,
        completed: appointments.filter(a => a.status === 'Completed').length,
        totalPatients: new Set(appointments.map(a => a.patient_id)).size
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  if (error) {
    return <ErrorMessage title="Error Loading Dashboard" message={error} onRetry={fetchDashboardData} />;
  }

  return (
    <div>
      {/* Welcome Section */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, marginBottom: '8px' }}>
          Welcome back, Dr. {currentUser?.fullName} 👨‍⚕️
        </h1>
        <p className="label" style={{ fontSize: '15px' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4 section" style={{ marginBottom: '30px' }}>
        <StatCard
          icon="📅"
          title="Today's Appointments"
          value={stats.today}
          color="var(--primary-black)"
          onClick={() => navigate('/doctor/appointments')}
        />
        <StatCard
          icon="⏳"
          title="Pending"
          value={stats.pending}
          color="#f59e0b"
        />
        <StatCard
          icon="✅"
          title="Completed"
          value={stats.completed}
          color="#10b981"
        />
        <StatCard
          icon="👥"
          title="Patients Today"
          value={stats.totalPatients}
          color="var(--accent-red)"
        />
      </div>

      {/* Today's Appointments */}
      <section className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Today's Appointments</h2>
          <button className="btn primary" onClick={() => navigate('/doctor/appointments')}>
            View All
          </button>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p className="label" style={{ fontSize: '16px' }}>No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="grid grid-1" style={{ gap: '12px' }}>
            {todayAppointments.slice(0, 5).map((appt) => (
              <div key={appt.appointment_id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '18px' }}>
                        {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                      <span style={{ fontSize: '18px', color: '#ccc' }}>•</span>
                      <strong style={{ fontSize: '16px' }}>{appt.patient_name || `Patient ${appt.patient_id}`}</strong>
                      <span className={`badge ${
                        appt.status === 'Completed' ? 'badge-success' :
                        appt.status === 'Checked-in' ? 'badge-warn' : ''
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                    <p className="label" style={{ marginBottom: '4px' }}>
                      Patient ID: P-{appt.patient_id}
                    </p>
                    {appt.notes && (
                      <p className="label" style={{ fontSize: '13px', color: '#64748b' }}>
                        Note: {appt.notes}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {appt.status === 'Checked-in' && (
                      <button 
                        className="btn primary"
                        onClick={() => navigate(`/doctor/consultations/${appt.appointment_id}`)}
                      >
                        Start Consultation
                      </button>
                    )}
                    <button 
                      className="btn"
                      onClick={() => navigate(`/doctor/patients/${appt.patient_id}`)}
                    >
                      View Patient
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="section">
        <h3>Quick Actions</h3>
        <div className="grid grid-4" style={{ gap: '16px' }}>
          <button 
            className="card" 
            style={{ padding: '24px', textAlign: 'center', cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.3s' }}
            onClick={() => navigate('/doctor/appointments')}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📅</div>
            <strong>View Schedule</strong>
          </button>
          <button 
            className="card" 
            style={{ padding: '24px', textAlign: 'center', cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.3s' }}
            onClick={() => navigate('/doctor/patients')}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>👥</div>
            <strong>Patient List</strong>
          </button>
          <button 
            className="card" 
            style={{ padding: '24px', textAlign: 'center', cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.3s' }}
            onClick={() => navigate('/doctor/consultations')}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
            <strong>Consultations</strong>
          </button>
          <button 
            className="card" 
            style={{ padding: '24px', textAlign: 'center', cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.3s' }}
            onClick={() => navigate('/doctor/schedule')}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚙️</div>
            <strong>Manage Schedule</strong>
          </button>
        </div>
      </section>
    </div>
  );
}
