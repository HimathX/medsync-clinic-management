import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorHeader from '../../components/DoctorHeader';
import '../../styles/doctor.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ date: '', status: '', search: '' });
  const [doctorId, setDoctorId] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(storedUser);
    const id = user.doctor_id || user.id;
    setDoctorId(id);
    fetchAppointments();
  }, [navigate]);

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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/appointments/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        throw new Error('Failed to fetch appointments');
      }
    } catch (err) {
      setError('Failed to load appointments');
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

  if (loading) {
    return (
      <div className="doctor-container">
        <DoctorHeader />
        <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>
      </div>
    );
  }

  return (
    <div className="doctor-container">
      <DoctorHeader />
      <div className="doctor-content">
        <div className="doctor-header">
          <h1>My Appointments</h1>
          <p>Manage your patient appointments</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-row">
            <div className="filter-group">
              <label><i className="fas fa-search"></i> Search</label>
              <input 
                type="text" 
                placeholder="Search by patient name or ID..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            <div className="filter-group">
              <label><i className="fas fa-calendar"></i> Date</label>
              <input 
                type="date" 
                value={filters.date}
                onChange={(e) => setFilters({...filters, date: e.target.value})}
              />
            </div>
            <div className="filter-group">
              <label><i className="fas fa-filter"></i> Status</label>
              <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                <option value="">All</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button className="btn-clear-filters" onClick={() => setFilters({date: '', status: '', search: ''})}>
              <i className="fas fa-times"></i> Clear
            </button>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="table-container">
          {filteredAppointments.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-times"></i>
              <p>No appointments found</p>
            </div>
          ) : (
            <table className="doctor-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Patient ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt) => (
                  <tr key={appt.appointment_id}>
                    <td>{formatDate(appt.appointment_date || appt.date)}</td>
                    <td>{formatTime(appt.start_time || appt.time)}</td>
                    <td>{appt.patient_name || 'Patient'}</td>
                    <td>#{appt.patient_id}</td>
                    <td>
                      <span className={`status-badge status-${appt.status?.toLowerCase()}`}>
                        {appt.status || 'Scheduled'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-icon btn-primary"
                        onClick={() => navigate(`/doctor/consultations?patient=${appt.patient_id}`)}
                        title="Start Consultation"
                      >
                        <i className="fas fa-stethoscope"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointments;
