import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorNavBar from '../../components/DoctorNavBar';
import DoctorPageHeader from '../../components/DoctorPageHeader';
import authService from '../../services/authService';
import appointmentService from '../../services/appointmentService';
import '../../styles/doctor.css';
import '../../styles/patientDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorAppointments = () => {
  const navigate = useNavigate();
  
  // Get doctor ID from localStorage (correct authentication method)
  const doctorId = localStorage.getItem('doctor_id');
  const userType = localStorage.getItem('user_type');
  
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ date: '', status: 'all', search: '' });
  const [stats, setStats] = useState({ total: 0, scheduled: 0, completed: 0, cancelled: 0 });
  const [doctorData, setDoctorData] = useState({
    name: 'Doctor',
    specialization: 'Physician'
  });

  useEffect(() => {
    // Check authentication
    if (!userType || userType !== 'doctor' || !doctorId) {
      console.log('❌ Not authenticated as doctor');
      navigate('/doctor-login');
      return;
    }
    
    // Load doctor data
    const fullName = localStorage.getItem('full_name') || 'Doctor';
    setDoctorData({
      name: fullName,
      specialization: localStorage.getItem('specialization') || 'Physician'
    });
    
    console.log('✅ Doctor authenticated, fetching appointments for ID:', doctorId);
    fetchAppointments();
  }, [doctorId, navigate, userType]);

  const applyFilters = useCallback(() => {
    let filtered = [...appointments];
    
    if (filters.date) {
      filtered = filtered.filter(appt => {
        const apptDate = appt.available_date;
        return apptDate === filters.date;
      });
    }
    
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(appt => appt.status?.toLowerCase() === filters.status.toLowerCase());
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(appt => 
        appt.patient_name?.toLowerCase().includes(searchLower) ||
        appt.patient_id?.toString().includes(searchLower)
      );
    }
    
    // Calculate stats
    setStats({
      total: appointments.length,
      scheduled: appointments.filter(a => a.status?.toLowerCase() === 'scheduled').length,
      completed: appointments.filter(a => a.status?.toLowerCase() === 'completed').length,
      cancelled: appointments.filter(a => a.status?.toLowerCase() === 'cancelled').length
    });
    
    setFilteredAppointments(filtered);
  }, [appointments, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Fetching appointments for doctor:', doctorId);
      
      // Use appointment service to get doctor's appointments
      const doctorAppts = await appointmentService.getDoctorAppointments(doctorId, false);
      setAppointments(doctorAppts || []);
      
      console.log('✅ Loaded', doctorAppts?.length || 0, 'appointments');
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      await appointmentService.updateAppointment(appointmentId, { status: newStatus });
      alert(`✅ Appointment status updated to ${newStatus}`);
      fetchAppointments();
    } catch (err) {
      console.error('Error updating appointment:', err);
      alert('❌ Failed to update appointment status');
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await appointmentService.cancelAppointment(appointmentId);
      alert('✅ Appointment cancelled successfully');
      fetchAppointments();
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('❌ Failed to cancel appointment');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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

  const handleLogout = () => {
    authService.logout();
    navigate('/doctor-login');
  };

  if (loading) {
    return (
      <div className="patient-portal">
        <DoctorNavBar />
        <DoctorPageHeader doctorName={doctorData.name} specialization={doctorData.specialization} />
        <div className="patient-container" style={{ 
          minHeight: '60vh', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '16px',
          paddingTop: '40px'
        }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '500' }}>Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-portal">
      <DoctorNavBar />
      <DoctorPageHeader doctorName={doctorData.name} specialization={doctorData.specialization} />
      <main className="patient-container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        {/* Page Title with Action */}
        <div className="doctor-header" style={{ marginBottom: '32px', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', padding: '32px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: '800', background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>My Appointments</h1>
            <p style={{ fontSize: '16px', color: '#059669', fontWeight: '500' }}>Manage and track all your patient appointments</p>
          </div>
          <button
            onClick={fetchAppointments}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)', transition: 'all 0.3s ease' }}
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '24px' }}>
            <i className="fas fa-exclamation-circle"></i>
            {error}
            <button onClick={fetchAppointments} className="btn-secondary">Retry</button>
          </div>
        )}

        {/* Stats Grid - Modern Cards */}
        <div className="stats-row" style={{ marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div className="stat-box" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)', border: '1px solid rgba(16, 185, 129, 0.2)', transition: 'all 0.3s ease' }}>
            <div className="stat-icon" style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
            <div className="stat-value" style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', color: '#ffffff' }}>{stats.total}</div>
            <div className="stat-label" style={{ fontSize: '14px', fontWeight: '500', color: '#f0fdf4' }}>Total Appointments</div>
          </div>

          <div className="stat-box" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)', border: '1px solid rgba(16, 185, 129, 0.2)', transition: 'all 0.3s ease' }}>
            <div className="stat-icon" style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
            <div className="stat-value" style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', color: '#ffffff' }}>{stats.scheduled}</div>
            <div className="stat-label" style={{ fontSize: '14px', fontWeight: '500', color: '#f0fdf4' }}>Scheduled</div>
          </div>

          <div className="stat-box" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)', border: '1px solid rgba(16, 185, 129, 0.2)', transition: 'all 0.3s ease' }}>
            <div className="stat-icon" style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <div className="stat-value" style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', color: '#ffffff' }}>{stats.completed}</div>
            <div className="stat-label" style={{ fontSize: '14px', fontWeight: '500', color: '#f0fdf4' }}>Completed</div>
          </div>

          <div className="stat-box" style={{ background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)', color: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)', border: '1px solid rgba(239, 68, 68, 0.2)', transition: 'all 0.3s ease' }}>
            <div className="stat-icon" style={{ fontSize: '48px', marginBottom: '12px' }}>❌</div>
            <div className="stat-value" style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', color: '#ffffff' }}>{stats.cancelled}</div>
            <div className="stat-label" style={{ fontSize: '14px', fontWeight: '500', color: '#fef2f2' }}>Cancelled</div>
          </div>
        </div>

        {/* Modern Filters */}
        <div className="filters-card" style={{ marginBottom: '24px', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '28px', border: '1px solid rgba(16, 185, 129, 0.15)', boxShadow: '0 8px 32px rgba(16, 185, 129, 0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#047857', marginBottom: '8px', display: 'block' }}><i className="fas fa-search"></i> Search Patient</label>
              <input
                type="text"
                placeholder="Name or ID..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="form-control"
                style={{ fontSize: '14px', color: '#1a2332', borderColor: 'rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#047857', marginBottom: '8px', display: 'block' }}><i className="fas fa-calendar"></i> Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({...filters, date: e.target.value})}
                className="form-control"
                style={{ fontSize: '14px', color: '#1a2332', borderColor: 'rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#047857', marginBottom: '8px', display: 'block' }}><i className="fas fa-tag"></i> Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="form-control"
                style={{ fontSize: '14px', color: '#1a2332', borderColor: 'rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e2e8f0' }}
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="checked-in">Checked-in</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ visibility: 'hidden' }}>Action</label>
              <button
                onClick={() => setFilters({date: '', status: 'all', search: ''})}
                className="btn-secondary"
                style={{ width: '100%', padding: '10px 16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', transition: 'all 0.3s ease' }}
              >
                <i className="fas fa-redo"></i> Clear
              </button>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
              <i className="fas fa-list"></i> Appointments ({filteredAppointments.length})
            </h2>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-times" style={{ fontSize: '64px', color: '#cbd5e1', marginBottom: '16px' }}></i>
              <h3>No appointments found</h3>
              <p>Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {filteredAppointments.map((appt, index) => (
                <div key={appt.appointment_id || index} className="appointment-card" style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr auto',
                  gap: '20px',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                  border: '1px solid #e2e8f0'
                }}>
                  {/* Time Badge */}
                  <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '16px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
                      {formatTime(appt.start_time)}
                    </div>
                    <div style={{ fontSize: '12px', opacity: '0.9' }}>to</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>
                      {formatTime(appt.end_time)}
                    </div>
                  </div>

                  {/* Patient Details */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                      }}>
                        {appt.patient_name ? appt.patient_name.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '2px' }}>
                          {appt.patient_name || 'Patient'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                          <i className="fas fa-id-card"></i> ID: {appt.patient_id}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                      <i className="fas fa-calendar"></i> {formatDate(appt.available_date)}
                    </div>
                    {appt.notes && (
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#6b7280', 
                        fontStyle: 'italic',
                        padding: '8px 12px',
                        background: '#f8fafc',
                        borderRadius: '6px',
                        borderLeft: '3px solid #cbd5e1'
                      }}>
                        <i className="fas fa-comment"></i> {appt.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '180px' }}>
                    <div style={{
                      padding: '6px 16px',
                      borderRadius: '20px',
                      background: getStatusColor(appt.status),
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: '600',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}>
                      {appt.status || 'Scheduled'}
                    </div>
                    
                    {appt.status === 'Scheduled' && (
                      <>
                        <button
                          onClick={() => navigate(`/doctor/consultation?appointment=${appt.appointment_id}`)}
                          className="btn-primary"
                          style={{ fontSize: '13px', padding: '10px 16px' }}
                        >
                          <i className="fas fa-stethoscope"></i> Start Consultation
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(appt.appointment_id, 'Completed')}
                          className="btn-success"
                          style={{ fontSize: '13px', padding: '10px 16px' }}
                        >
                          <i className="fas fa-check"></i> Complete
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(appt.appointment_id)}
                          className="btn-danger"
                          style={{ fontSize: '13px', padding: '10px 16px' }}
                        >
                          <i className="fas fa-times"></i> Cancel
                        </button>
                      </>
                    )}
                    
                    {appt.status === 'Completed' && (
                      <button
                        onClick={() => navigate(`/doctor/patients/${appt.patient_id}`)}
                        className="btn-primary"
                        style={{ fontSize: '13px', padding: '10px 16px' }}
                      >
                        <i className="fas fa-user"></i> View Patient
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DoctorAppointments;
