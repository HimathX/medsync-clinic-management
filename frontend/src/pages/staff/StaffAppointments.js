import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffHeader from '../../components/StaffHeader';
import authService from '../../services/authService';
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
    dateFrom: '',
    dateTo: '',
    status: '',
    searchTerm: ''
  });
  const [branch, setBranch] = useState('Colombo');
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [updateData, setUpdateData] = useState({ status: '', notes: '' });
  
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/staff-login');
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || !user.userId) {
      navigate('/staff-login');
      return;
    }
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = useCallback(() => {
    // Safety check: ensure appointments is an array
    if (!Array.isArray(appointments)) {
      console.warn('⚠️ appointments is not an array:', appointments);
      setFilteredAppointments([]);
      return;
    }
    
    let filtered = [...appointments];

    if (filters.date) {
      filtered = filtered.filter(apt => {
        const aptDate = apt.appointment_date ? new Date(apt.appointment_date).toISOString().split('T')[0] : '';
        return aptDate === filters.date;
      });
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(apt => {
        const aptDate = apt.appointment_date ? new Date(apt.appointment_date).toISOString().split('T')[0] : '';
        return aptDate >= filters.dateFrom;
      });
    }

    if (filters.dateTo) {
      filtered = filtered.filter(apt => {
        const aptDate = apt.appointment_date ? new Date(apt.appointment_date).toISOString().split('T')[0] : '';
        return aptDate <= filters.dateTo;
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
      console.log('📅 Fetching appointments from API...');
      
      const response = await fetch(`${API_BASE_URL}/appointments/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Appointments response:', data);
        
        // Handle different response formats
        let appointmentsArray = [];
        if (Array.isArray(data)) {
          appointmentsArray = data;
        } else if (data.appointments && Array.isArray(data.appointments)) {
          appointmentsArray = data.appointments;
        } else if (data.data && Array.isArray(data.data)) {
          appointmentsArray = data.data;
        }
        
        console.log(`✅ Loaded ${appointmentsArray.length} appointments`);
        setAppointments(appointmentsArray);
      } else {
        throw new Error('Failed to fetch appointments');
      }
    } catch (err) {
      console.error('❌ Error fetching appointments:', err);
      setError('Failed to load appointments');
      setAppointments([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  // View appointment details
  const viewAppointmentDetails = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Appointment details:', data);
        setSelectedAppointment(data);
        setShowDetailsModal(true);
      } else {
        throw new Error('Failed to fetch appointment details');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to load appointment details');
    }
  };

  // Update appointment status
  const handleUpdateAppointment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/appointments/${selectedAppointment.appointment_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        alert('Appointment updated successfully');
        setShowUpdateModal(false);
        setUpdateData({ status: '', notes: '' });
        fetchAppointments();
      } else {
        throw new Error('Failed to update appointment');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to update appointment');
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
        <StaffHeader 
          staffName={currentUser?.fullName || 'Staff'}
          staffRole={currentUser?.userType?.charAt(0).toUpperCase() + currentUser?.userType?.slice(1) || 'Staff'}
          branch={branch}
          setBranch={setBranch}
          onLogout={handleLogout}
        />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-container">
      <StaffHeader 
        staffName={currentUser?.fullName || 'Staff'}
        staffRole={currentUser?.userType?.charAt(0).toUpperCase() + currentUser?.userType?.slice(1) || 'Staff'}
        branch={branch}
        setBranch={setBranch}
        onLogout={handleLogout}
      />
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
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => viewAppointmentDetails(apt.appointment_id)}
                          title="View Details"
                          style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white', 
                            padding: '6px 12px', 
                            border: 'none', 
                            borderRadius: '6px', 
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedAppointment(apt);
                            setUpdateData({ status: apt.status || '', notes: apt.notes || '' });
                            setShowUpdateModal(true);
                          }}
                          title="Update Status"
                          disabled={apt.status === 'Cancelled' || apt.status === 'Completed'}
                          style={{ 
                            background: apt.status === 'Cancelled' || apt.status === 'Completed' ? '#9ca3af' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            color: 'white', 
                            padding: '6px 12px', 
                            border: 'none', 
                            borderRadius: '6px', 
                            cursor: apt.status === 'Cancelled' || apt.status === 'Completed' ? 'not-allowed' : 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          onClick={() => handleCancelAppointment(apt.appointment_id)}
                          disabled={apt.status === 'Cancelled' || apt.status === 'Completed'}
                          title="Cancel"
                          style={{ 
                            background: apt.status === 'Cancelled' || apt.status === 'Completed' ? '#9ca3af' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white', 
                            padding: '6px 12px', 
                            border: 'none', 
                            borderRadius: '6px', 
                            cursor: apt.status === 'Cancelled' || apt.status === 'Completed' ? 'not-allowed' : 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Appointment Details Modal */}
        {showDetailsModal && selectedAppointment && (
          <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <h2><i className="fas fa-calendar-alt"></i> Appointment Details</h2>
                <button className="btn-close" onClick={() => setShowDetailsModal(false)} style={{ color: 'white' }}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Appointment ID</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>#{selectedAppointment.appointment_id}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Status</div>
                    <span style={{ 
                      padding: '6px 16px', 
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      background: selectedAppointment.status === 'Completed' ? '#d1fae5' : 
                                 selectedAppointment.status === 'Cancelled' ? '#fee2e2' :
                                 selectedAppointment.status === 'Scheduled' ? '#dbeafe' : '#fef3c7',
                      color: selectedAppointment.status === 'Completed' ? '#065f46' :
                             selectedAppointment.status === 'Cancelled' ? '#991b1b' :
                             selectedAppointment.status === 'Scheduled' ? '#1e40af' : '#92400e'
                    }}>
                      {selectedAppointment.status}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Patient ID</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>#{selectedAppointment.patient_id}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Time Slot ID</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>#{selectedAppointment.time_slot_id}</div>
                  </div>
                </div>

                {selectedAppointment.notes && (
                  <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', borderLeft: '4px solid #667eea' }}>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>Notes</div>
                    <div style={{ fontSize: '14px', color: '#374151' }}>{selectedAppointment.notes}</div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Update Appointment Modal */}
        {showUpdateModal && selectedAppointment && (
          <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
            <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <h2><i className="fas fa-edit"></i> Update Appointment</h2>
                <button className="btn-close" onClick={() => setShowUpdateModal(false)} style={{ color: 'white' }}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Appointment ID</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>#{selectedAppointment.appointment_id}</div>
                </div>

                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={updateData.status}
                    onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  >
                    <option value="">Select Status</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="No-Show">No-Show</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={updateData.notes}
                    onChange={(e) => setUpdateData({...updateData, notes: e.target.value})}
                    rows="4"
                    style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', resize: 'vertical' }}
                    placeholder="Add any additional notes..."
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleUpdateAppointment}>Update</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffAppointments;
