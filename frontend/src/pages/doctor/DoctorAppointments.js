import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import appointmentService from '../../services/appointmentService';
import '../../styles/patientDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const doctorId = localStorage.getItem('doctor_id') || localStorage.getItem('user_id');
  
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ date: '', status: '', search: '' });
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0
  });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    notes: ''
  });

  useEffect(() => {
    // Check authentication
    const userId = localStorage.getItem('user_id');
    const userType = localStorage.getItem('user_type');

    if (!userId || userType !== 'doctor') {
      navigate('/doctor/login', { replace: true });
      return;
    }

    if (doctorId) {
    fetchAppointments();
      fetchStats();
    }
  }, [doctorId, navigate]);

  const applyFilters = useCallback(() => {
    let filtered = [...appointments];
    
    if (filters.date) {
      filtered = filtered.filter(appt => {
        const apptDate = new Date(appt.appointment_date || appt.date).toISOString().split('T')[0];
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
    
    setFilteredAppointments(filtered);
  }, [appointments, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      console.log('📊 Fetching appointments for doctor:', doctorId);
      const data = await appointmentService.getAppointmentsByDoctor(doctorId, true);
      setAppointments(data.appointments || []);
      setError('');
    } catch (err) {
      console.error('❌ Error fetching appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await appointmentService.getDoctorAppointmentStats(doctorId);
      setStats(statsData);
    } catch (err) {
      console.error('❌ Error fetching stats:', err);
    }
  };

  const handleUpdateAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setUpdateForm({
      status: appointment.status || '',
      notes: appointment.notes || ''
    });
    setShowUpdateModal(true);
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    try {
      setLoading(true);
      await appointmentService.updateAppointment(selectedAppointment.appointment_id, updateForm);
      setSuccess('Appointment updated successfully!');
      setShowUpdateModal(false);
      setSelectedAppointment(null);
      fetchAppointments();
      fetchStats();
    } catch (err) {
      console.error('❌ Error updating appointment:', err);
      setError(err.message || 'Failed to update appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setLoading(true);
      await appointmentService.cancelAppointment(appointmentId);
      setSuccess('Appointment cancelled successfully!');
      fetchAppointments();
      fetchStats();
    } catch (err) {
      console.error('❌ Error cancelling appointment:', err);
      setError(err.message || 'Failed to cancel appointment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timeString;
    }
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="patient-portal">
        <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
          <p>Loading appointments...</p>
        </div>
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
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: #fff;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
            border: 1px solid #e5e7eb;
          }
          .stat-number {
            font-size: 32px;
            font-weight: 700;
            color: #1a2332;
            margin-bottom: 8px;
          }
          .stat-label {
            font-size: 14px;
            color: #64748b;
            font-weight: 600;
          }
          .appointment-card {
            background: #fff;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            border: 1px solid #e5e7eb;
          }
          .appointment-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            margin-bottom: 10px;
            border: 1px solid #e2e8f0;
          }
          .status-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
          .status-scheduled {
            background: #dbeafe;
            color: #1e40af;
          }
          .status-completed {
            background: #d1fae5;
            color: #065f46;
          }
          .status-cancelled {
            background: #fee2e2;
            color: #991b1b;
          }
          .status-no-show {
            background: #f3f4f6;
            color: #6b7280;
          }
          .btn-primary {
            background: #3b82f6;
            color: #fff;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            margin-right: 8px;
          }
          .btn-secondary {
            background: #6b7280;
            color: #fff;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            margin-right: 8px;
          }
          .btn-danger {
            background: #ef4444;
            color: #fff;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
          }
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          .modal-content {
            background: #fff;
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
          }
          .form-group {
            margin-bottom: 20px;
          }
          .form-label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
          }
          .form-input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 16px;
          }
          .form-textarea {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 16px;
            min-height: 100px;
            resize: vertical;
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
            <button onClick={() => navigate('/doctor/dashboard')} className="btn-back">← Back to Dashboard</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="patient-container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <section style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1a2332', marginBottom: '8px' }}>
            My Appointments 📅
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
            Manage your patient appointments and consultations
          </p>
        </section>

        {/* Error/Success Messages */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '20px', background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>
            <i className="fas fa-check-circle"></i> {success}
          </div>
        )}

        {/* Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Appointments</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.scheduled}</div>
            <div className="stat-label">Scheduled</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.cancelled}</div>
            <div className="stat-label">Cancelled</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.noShow}</div>
            <div className="stat-label">No Show</div>
          </div>
        </div>

        {/* Filters */}
        <div className="appointment-card">
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>
            Filters
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label className="form-label">Search</label>
              <input 
                type="text" 
                className="form-input"
                placeholder="Search by patient name..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input 
                type="date" 
                className="form-input"
                value={filters.date}
                onChange={(e) => setFilters({...filters, date: e.target.value})}
              />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select 
                className="form-input"
                value={filters.status} 
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button 
                className="btn-secondary"
                onClick={() => setFilters({date: '', status: '', search: ''})}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="appointment-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332' }}>
              Appointments ({filteredAppointments.length})
            </h2>
            <button className="btn-primary" onClick={fetchAppointments} disabled={loading}>
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #e5e7eb', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ marginTop: '10px', color: '#64748b' }}>Loading appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <i className="fas fa-calendar-times" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
              <p>No appointments found</p>
            </div>
          ) : (
            <div>
              {filteredAppointments.map((appt, index) => (
                <div key={appt.appointment_id || index} className="appointment-item">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a2332', margin: '0' }}>
                        {appt.patient_name || 'Patient'}
                      </h3>
                      <span className={`status-badge status-${appt.status?.toLowerCase() || 'scheduled'}`}>
                        {appt.status || 'Scheduled'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#64748b' }}>
                      <span><strong>Date:</strong> {formatDate(appt.available_date || appt.appointment_date)}</span>
                      <span><strong>Time:</strong> {formatTime(appt.start_time)} - {formatTime(appt.end_time)}</span>
                      <span><strong>Patient ID:</strong> #{appt.patient_id}</span>
                    </div>
                    {appt.notes && (
                      <p style={{ fontSize: '14px', color: '#64748b', margin: '8px 0 0 0', fontStyle: 'italic' }}>
                        Notes: {appt.notes}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn-primary"
                      onClick={() => navigate(`/doctor/consultations?patient=${appt.patient_id}&appointment=${appt.appointment_id}`)}
                      title="Start Consultation"
                    >
                      <i className="fas fa-stethoscope"></i> Consult
                    </button>
                    <button 
                      className="btn-secondary"
                      onClick={() => handleUpdateAppointment(appt)}
                      title="Update Appointment"
                    >
                      <i className="fas fa-edit"></i> Update
                    </button>
                    {appt.status === 'Scheduled' && (
                      <button 
                        className="btn-danger"
                        onClick={() => handleCancelAppointment(appt.appointment_id)}
                        title="Cancel Appointment"
                      >
                        <i className="fas fa-times"></i> Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Update Appointment Modal */}
      {showUpdateModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>
              Update Appointment
            </h2>
            
            <form onSubmit={handleSubmitUpdate}>
              <div className="form-group">
                <label className="form-label">Status *</label>
                <select
                  className="form-input"
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No-Show">No Show</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  placeholder="Add any notes about this appointment..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Updating...' : 'Update Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
