import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffHeader from '../../components/StaffHeader';
import authService from '../../services/authService';
import '../../styles/staff.css';
import '../../styles/staffHeader.css';
import '../../styles/staffPages.css';

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
      <>
        <StaffHeader 
          staffName={currentUser?.fullName || 'Staff'}
          staffRole={currentUser?.userType?.charAt(0).toUpperCase() + currentUser?.userType?.slice(1) || 'Staff'}
          branch={branch}
          setBranch={setBranch}
          onLogout={handleLogout}
        />
        <div className="staff-page-container">
          <div className="staff-loading">
            <div className="staff-spinner"></div>
            <p>Loading appointments...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <StaffHeader 
        staffName={currentUser?.fullName || 'Staff'}
        staffRole={currentUser?.userType?.charAt(0).toUpperCase() + currentUser?.userType?.slice(1) || 'Staff'}
        branch={branch}
        setBranch={setBranch}
        onLogout={handleLogout}
      />
      <div className="staff-page-container">
        <div className="staff-page-content">
        <div className="staff-page-header">
          <div>
            <h1 className="staff-page-title">📅 Appointment Management</h1>
            <p className="staff-page-subtitle">View and manage all appointments</p>
          </div>
        </div>

        {error && <div className="staff-error">{error}</div>}

        {/* Filters */}
        <div className="staff-filters">
          <div className="staff-filter-row">
            <div className="staff-filter-group">
              <label className="staff-form-label">🔍 Search</label>
              <input
                type="text"
                className="staff-form-input"
                placeholder="Search by ID..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
              />
            </div>
            <div className="staff-filter-group">
              <label className="staff-form-label">📅 Date</label>
              <input
                type="date"
                className="staff-form-input"
                value={filters.date}
                onChange={(e) => setFilters({...filters, date: e.target.value})}
              />
            </div>
            <div className="staff-filter-group">
              <label className="staff-form-label">📊 Status</label>
              <select
                className="staff-form-select"
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
            <button className="staff-btn staff-btn-danger" onClick={() => setFilters({date: '', status: '', searchTerm: ''})}>
              🗑️ Clear
            </button>
          </div>
          <div style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
            Showing {filteredAppointments.length} of {appointments.length} appointments
          </div>
        </div>

        {/* Appointments Table */}
        <div className="staff-table-container">
          {filteredAppointments.length === 0 ? (
            <div className="staff-empty-state">
              <div className="staff-empty-state-icon">📭</div>
              <div className="staff-empty-state-title">No appointments found</div>
              <p className="staff-empty-state-text">Try adjusting your filters or check back later</p>
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
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => viewAppointmentDetails(apt.appointment_id)}
                          className="staff-btn staff-btn-primary"
                          title="View Details"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        >
                          👁️
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedAppointment(apt);
                            setUpdateData({ status: apt.status || '', notes: apt.notes || '' });
                            setShowUpdateModal(true);
                          }}
                          className="staff-btn staff-btn-primary"
                          title="Update Status"
                          disabled={apt.status === 'Cancelled' || apt.status === 'Completed'}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleCancelAppointment(apt.appointment_id)}
                          className="staff-btn staff-btn-danger"
                          disabled={apt.status === 'Cancelled' || apt.status === 'Completed'}
                          title="Cancel"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        >
                          ❌
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
          <div className="staff-modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="staff-modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
              <div className="staff-modal-header">
                <h2 className="staff-modal-title">📅 Appointment Details</h2>
                <button className="staff-modal-close" onClick={() => setShowDetailsModal(false)}>
                  ✕
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

              <div className="staff-modal-footer">
                <button className="staff-btn staff-btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Update Appointment Modal */}
        {showUpdateModal && selectedAppointment && (
          <div className="staff-modal-overlay" onClick={() => setShowUpdateModal(false)}>
            <div className="staff-modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
              <div className="staff-modal-header">
                <h2 className="staff-modal-title">✏️ Update Appointment</h2>
                <button className="staff-modal-close" onClick={() => setShowUpdateModal(false)}>
                  ✕
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Appointment ID</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>#{selectedAppointment.appointment_id}</div>
                </div>

                <div className="staff-form-group">
                  <label className="staff-form-label">Status *</label>
                  <select
                    className="staff-form-select"
                    value={updateData.status}
                    onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                  >
                    <option value="">Select Status</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="No-Show">No-Show</option>
                  </select>
                </div>

                <div className="staff-form-group">
                  <label className="staff-form-label">Notes</label>
                  <textarea
                    className="staff-form-textarea"
                    value={updateData.notes}
                    onChange={(e) => setUpdateData({...updateData, notes: e.target.value})}
                    placeholder="Add any additional notes..."
                  ></textarea>
                </div>
              </div>

              <div className="staff-modal-footer">
                <button className="staff-btn staff-btn-secondary" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                <button className="staff-btn staff-btn-primary" onClick={handleUpdateAppointment}>Update</button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default StaffAppointments;
