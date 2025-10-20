import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffHeader from '../../components/StaffHeader';
import authService from '../../services/authService';
import '../../styles/staff.css';

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
    const userId = localStorage.getItem('user_id');
    const userType = localStorage.getItem('user_type');
    
    if (!userId || !userType) {
      navigate('/staff-login');
      return;
    }
    fetchTimeSlots();
  }, [navigate]);

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
      <div className="staff-container">
        <StaffHeader 
          staffName={currentUser?.fullName || 'Staff'}
          staffRole={currentUser?.userType?.charAt(0).toUpperCase() + currentUser?.userType?.slice(1) || 'Staff'}
          branch={branch}
          setBranch={setBranch}
          onLogout={handleLogout}
        />
        <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>
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
          <h1>Schedule Management</h1>
          <p>Manage doctor time slots</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-row">
            <div className="filter-group">
              <label><i className="fas fa-calendar"></i> Date</label>
              <input type="date" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} />
            </div>
            <div className="filter-group">
              <label><i className="fas fa-filter"></i> Availability</label>
              <select value={filters.availability} onChange={(e) => setFilters({...filters, availability: e.target.value})}>
                <option value="">All</option>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
              </select>
            </div>
            <button className="btn-clear-filters" onClick={() => setFilters({date: '', availability: ''})}>
              <i className="fas fa-times"></i> Clear
            </button>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="schedule-grid">
          {filteredSlots.length === 0 ? (
            <div className="empty-state"><i className="fas fa-calendar-times"></i><p>No time slots found</p></div>
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
  );
};

export default StaffSchedule;
