import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorHeader from '../../components/DoctorHeader';
import '../../styles/staff.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const StaffAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    date: '',
    status: '',
    searchTerm: ''
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    fetchAppointments();
  }, [navigate]);

  const applyFilters = useCallback(() => {
    let filtered = [...appointments];

    if (filters.date) {
      filtered = filtered.filter(apt => {
        const aptDate = apt.appointment_date ? new Date(apt.appointment_date).toISOString().split('T')[0] : '';
        return aptDate === filters.date;
      });
    }

    if (filters.status) {
      filtered = filtered.filter(apt => apt.status?.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.appointment_id?.toString().includes(searchLower) ||
        apt.patient_id?.toString().includes(searchLower)
      );
    }

    setFilteredAppointments(filtered);
  }, [appointments, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/appointments/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        throw new Error('Failed to fetch appointments');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Appointment cancelled successfully');
        fetchAppointments();
      } else {
        throw new Error('Failed to cancel appointment');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to cancel appointment');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="staff-container">
        <DoctorHeader />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-container">
      <DoctorHeader />
      <div className="staff-content">
        <div className="staff-header">
          <h1>Appointment Management</h1>
          <p>View and manage all appointments</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-row">
            <div className="filter-group">
              <label><i className="fas fa-search"></i> Search</label>
              <input
                type="text"
                placeholder="Search by ID..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
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
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <button className="btn-clear-filters" onClick={() => setFilters({date: '', status: '', searchTerm: ''})}>
              <i className="fas fa-times"></i> Clear
            </button>
          </div>
          <div className="results-summary">
            <p>Showing {filteredAppointments.length} of {appointments.length} appointments</p>
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
            <table className="staff-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient ID</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((apt) => (
                  <tr key={apt.appointment_id}>
                    <td>#{apt.appointment_id}</td>
                    <td>#{apt.patient_id}</td>
                    <td>{formatDate(apt.appointment_date)}</td>
                    <td><span className={`status-badge status-${apt.status?.toLowerCase()}`}>{apt.status}</span></td>
                    <td>{apt.notes || '-'}</td>
                    <td>
                      <button 
                        className="btn-icon btn-danger"
                        onClick={() => handleCancelAppointment(apt.appointment_id)}
                        disabled={apt.status === 'Cancelled' || apt.status === 'Completed'}
                        title="Cancel"
                      >
                        <i className="fas fa-times"></i>
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

export default StaffAppointments;
