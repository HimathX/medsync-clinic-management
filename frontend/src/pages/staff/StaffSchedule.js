import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffHeader from '../../components/StaffHeader';
import authService from '../../services/authService';
import '../../styles/staff.css';
import '../../styles/staffHeader.css';
import '../../styles/staffPages.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const StaffSchedule = () => {
  const navigate = useNavigate();
  const [timeSlots, setTimeSlots] = useState([]);
  const [filteredSlots, setFilteredSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ date: '', availability: '' });
  const [branch, setBranch] = useState('Colombo');
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
    fetchTimeSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = useCallback(() => {
    // Safety check: ensure timeSlots is an array
    if (!Array.isArray(timeSlots)) {
      console.warn('⚠️ timeSlots is not an array:', timeSlots);
      setFilteredSlots([]);
      return;
    }
    
    let filtered = [...timeSlots];
    if (filters.date) {
      filtered = filtered.filter(slot => {
        const slotDate = new Date(slot.date).toISOString().split('T')[0];
        return slotDate === filters.date;
      });
    }
    if (filters.availability) {
      const isAvailable = filters.availability === 'available';
      filtered = filtered.filter(slot => slot.availability === isAvailable);
    }
    setFilteredSlots(filtered);
  }, [timeSlots, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchTimeSlots = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      console.log('📅 Fetching time slots from API...');
      
      const response = await fetch(`${API_BASE_URL}/timeslots/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Time slots response:', data);
        
        // Handle different response formats
        let slotsArray = [];
        if (Array.isArray(data)) {
          slotsArray = data;
        } else if (data.timeslots && Array.isArray(data.timeslots)) {
          slotsArray = data.timeslots;
        } else if (data.data && Array.isArray(data.data)) {
          slotsArray = data.data;
        }
        
        console.log(`✅ Loaded ${slotsArray.length} time slots`);
        setTimeSlots(slotsArray);
      } else {
        throw new Error('Failed to fetch time slots');
      }
    } catch (err) {
      console.error('❌ Error fetching time slots:', err);
      setError('Failed to load schedule');
      setTimeSlots([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Delete this time slot?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/timeslots/${slotId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        alert('Time slot deleted');
        fetchTimeSlots();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      alert('Failed to delete time slot');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
          <div className="staff-loading"><div className="staff-spinner"></div><p>Loading...</p></div>
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
            <h1 className="staff-page-title">📅 Schedule Management</h1>
            <p className="staff-page-subtitle">Manage doctor time slots</p>
          </div>
        </div>

        {error && <div className="staff-error">{error}</div>}

        {/* Filters */}
        <div className="staff-filters">
          <div className="staff-filter-row">
            <div className="staff-filter-group">
              <label className="staff-form-label">📅 Date</label>
              <input className="staff-form-input" type="date" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} />
            </div>
            <div className="staff-filter-group">
              <label className="staff-form-label">📊 Availability</label>
              <select className="staff-form-select" value={filters.availability} onChange={(e) => setFilters({...filters, availability: e.target.value})}>
                <option value="">All</option>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
              </select>
            </div>
            <button className="staff-btn staff-btn-danger" onClick={() => setFilters({date: '', availability: ''})}>
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* Schedule Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredSlots.length === 0 ? (
            <div className="staff-empty-state"><div className="staff-empty-state-icon">📅</div><div className="staff-empty-state-title">No time slots found</div></div>
          ) : (
            filteredSlots.map((slot) => (
              <div key={slot.time_slot_id} className={`schedule-card ${slot.availability ? 'available' : 'booked'}`}>
                <div className="schedule-header">
                  <div className="schedule-date"><i className="fas fa-calendar"></i> {formatDate(slot.date)}</div>
                  <span className={`status-badge ${slot.availability ? 'status-available' : 'status-booked'}`}>
                    {slot.availability ? 'Available' : 'Booked'}
                  </span>
                </div>
                <div className="schedule-body">
                  <div className="schedule-info"><i className="fas fa-user-md"></i> Doctor #{slot.doctor_id}</div>
                  <div className="schedule-info"><i className="fas fa-clock"></i> {slot.start_time} - {slot.end_time}</div>
                </div>
                <div className="schedule-footer">
                  <button className="btn-icon btn-danger" onClick={() => handleDeleteSlot(slot.time_slot_id)} title="Delete">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </div>
    </>
  );
};

export default StaffSchedule;
