import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorHeader from '../../components/DoctorHeader';
import timeslotService from '../../services/timeslotService';
import authService from '../../services/authService';
import branchService from '../../services/branchService';
import '../../styles/doctor.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorSchedule = () => {
  const navigate = useNavigate();
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    available_date: '',
    start_time: '',
    end_time: ''
  });
  const [bulkSlots, setBulkSlots] = useState({
    start_date: '',
    end_date: '',
    days: [], // ['monday', 'tuesday', ...]
    start_time: '',
    end_time: '',
    slot_duration: 30 // minutes
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    const doctorId = currentUser?.userId || currentUser?.doctor_id || localStorage.getItem('doctor_id');
    
    if (!currentUser) {
      navigate('/doctor-login', { replace: true });
      return;
    }
    
    if (doctorId) {
      fetchTimeSlots(doctorId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  /**
   * Helper function to get branch_id by fetching all branches and matching branch_name
   * @returns {Promise<string|null>} branch_id or null if not found
   */
  const getBranchId = async () => {
    try {
      // First check if branch_id is already in localStorage
      const storedBranchId = localStorage.getItem('branch_id');
      if (storedBranchId) {
        console.log('✅ Using stored branch_id:', storedBranchId);
        return storedBranchId;
      }

      // If not, fetch by branch_name
      const branchName = localStorage.getItem('branch_name');
      if (!branchName) {
        console.error('❌ No branch_name found in localStorage');
        return null;
      }

      console.log('🔍 Fetching branch_id for branch_name:', branchName);
      
      // Fetch all branches
      const branches = await branchService.getAllBranches();
      console.log('📦 Fetched branches:', branches);

      // Find matching branch by name
      const matchingBranch = branches.find(
        branch => branch.branch_name === branchName
      );

      if (matchingBranch) {
        console.log('✅ Found matching branch:', matchingBranch);
        // Store for future use
        localStorage.setItem('branch_id', matchingBranch.branch_id);
        return matchingBranch.branch_id;
      } else {
        console.error('❌ No branch found with name:', branchName);
        return null;
      }
    } catch (err) {
      console.error('❌ Error fetching branch_id:', err);
      return null;
    }
  };

  const fetchTimeSlots = async (doctorIdParam) => {
    const doctorId = doctorIdParam || localStorage.getItem('doctor_id');
    console.log('📡 fetchTimeSlots start - doctorId:', doctorId);
    setLoading(true);
    setError('');
    try {
      const data = await timeslotService.getTimeSlotsByDoctor(doctorId, false, false);
      console.log('📥 fetchTimeSlots response:', data);
      // Backend returns { doctor_id, total, time_slots: [...] }
      const slots = (data && (data.time_slots || data.timeSlots || data.slots)) || [];
      if (!Array.isArray(slots)) {
        console.warn('Unexpected time slots shape, converting to empty array:', slots);
        setTimeSlots([]);
      } else {
        setTimeSlots(slots);
      }
    } catch (err) {
      console.error('Error fetching time slots:', err);
      // Show a more informative error if available
      const message = err?.message || (err?.response && err.response.data && err.response.data.detail) || 'Failed to load schedule. Please try again.';
      setError(message);
    } finally {
      console.log('📌 fetchTimeSlots finished (setting loading false)');
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Delete this time slot? This cannot be undone.')) return;
    try {
      await timeslotService.deleteTimeSlot(slotId);
      alert('Time slot deleted successfully');
      const doctorId = localStorage.getItem('doctor_id');
      fetchTimeSlots(doctorId);
    } catch (err) {
      console.error('Error deleting slot:', err);
      alert('Failed to delete time slot. It may be booked.');
    }
  };

  const handleCreateSlot = async () => {
    if (!newSlot.available_date || !newSlot.start_time || !newSlot.end_time) {
      alert('Please fill in all fields');
      return;
    }

    const doctorId = localStorage.getItem('doctor_id');
    
    // Fetch branch_id dynamically
    const branchId = await getBranchId();
    
    if (!branchId) {
      alert('❌ Branch information not found. Please ensure your account is associated with a branch.');
      return;
    }

    try {
      const bulkData = {
        doctor_id: doctorId,
        branch_id: branchId,
        time_slots: [{
          available_date: newSlot.available_date,
          start_time: newSlot.start_time + ':00',
          end_time: newSlot.end_time + ':00'
        }]
      };

      await timeslotService.createBulkTimeSlots(bulkData);
      alert('✅ Time slot created successfully!');
      setShowCreateModal(false);
      setNewSlot({ available_date: '', start_time: '', end_time: '' });
      fetchTimeSlots(doctorId);
    } catch (err) {
      console.error('Error creating slot:', err);
      alert('❌ Failed to create time slot: ' + err.message);
    }
  };

  const handleBulkCreate = async () => {
    if (!bulkSlots.start_date || !bulkSlots.end_date || !bulkSlots.start_time || !bulkSlots.end_time || bulkSlots.days.length === 0) {
      alert('⚠️ Please fill in all fields and select at least one day');
      return;
    }

    const doctorId = localStorage.getItem('doctor_id');
    
    // Fetch branch_id dynamically
    const branchId = await getBranchId();
    
    if (!branchId) {
      alert('❌ Branch information not found. Please ensure your account is associated with a branch.');
      return;
    }

    try {
      const start = new Date(bulkSlots.start_date);
      const end = new Date(bulkSlots.end_date);
      const timeSlots = [];
      const dayMap = { 'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6 };
      
      // Generate time slots for selected days within date range
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (bulkSlots.days.includes(dayName)) {
          timeSlots.push({
            available_date: date.toISOString().split('T')[0],
            start_time: bulkSlots.start_time + ':00',
            end_time: bulkSlots.end_time + ':00'
          });
        }
      }

      if (timeSlots.length === 0) {
        alert('⚠️ No time slots generated. Check your date range and selected days.');
        return;
      }

      const bulkData = {
        doctor_id: doctorId,
        branch_id: branchId,
        time_slots: timeSlots
      };

      await timeslotService.createBulkTimeSlots(bulkData);
      alert(`✅ ${timeSlots.length} time slots created successfully!`);
      setShowBulkModal(false);
      setBulkSlots({ start_date: '', end_date: '', days: [], start_time: '', end_time: '', slot_duration: 30 });
      fetchTimeSlots(doctorId);
    } catch (err) {
      console.error('Error creating bulk slots:', err);
      alert('❌ Failed to create time slots: ' + err.message);
    }
  };

  const toggleDay = (day) => {
    setBulkSlots(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
    }));
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
          <div>
            <h1>My Schedule</h1>
            <p>Manage your availability</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <i className="fas fa-plus"></i> Add Single Slot
            </button>
            <button className="btn-success" onClick={() => setShowBulkModal(true)}>
              <i className="fas fa-calendar-week"></i> Bulk Create
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}<button onClick={() => fetchTimeSlots()}>Retry</button></div>}

        {/* Statistics */}
        <div className="stats-row" style={{ marginBottom: '24px' }}>
          <div className="stat-box">
            <div className="stat-value">{timeSlots.length}</div>
            <div className="stat-label">Total Slots</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{timeSlots.filter(s => !s.is_booked).length}</div>
            <div className="stat-label">Available</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{timeSlots.filter(s => s.is_booked).length}</div>
            <div className="stat-label">Booked</div>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="schedule-grid">
          {timeSlots.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-times"></i>
              <p>No time slots found</p>
            </div>
          ) : (
            timeSlots.map((slot) => (
              <div key={slot.time_slot_id} className={`schedule-card ${!slot.is_booked ? 'available' : 'booked'}`}>
                <div className="schedule-header">
                  <div className="schedule-date">
                    <i className="fas fa-calendar"></i> {formatDate(slot.available_date)}
                  </div>
                  <span className={`status-badge ${!slot.is_booked ? 'status-available' : 'status-booked'}`}>
                    {!slot.is_booked ? 'Available' : 'Booked'}
                  </span>
                </div>
                <div className="schedule-body">
                  <div className="schedule-info">
                    <i className="fas fa-clock"></i> {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                  </div>
                </div>
                <div className="schedule-footer">
                  <button 
                    className="btn-icon btn-danger" 
                    onClick={() => handleDeleteSlot(slot.time_slot_id)}
                    title="Delete"
                    disabled={slot.is_booked}
                    style={{ opacity: slot.is_booked ? 0.5 : 1, cursor: slot.is_booked ? 'not-allowed' : 'pointer' }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bulk Create Modal */}
        {showBulkModal && (
          <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h2>📅 Bulk Create Time Slots</h2>
                <button className="modal-close" onClick={() => setShowBulkModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>📆 Date Range</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <input
                        type="date"
                        placeholder="Start Date"
                        value={bulkSlots.start_date}
                        onChange={(e) => setBulkSlots({...bulkSlots, start_date: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <input
                        type="date"
                        placeholder="End Date"
                        value={bulkSlots.end_date}
                        onChange={(e) => setBulkSlots({...bulkSlots, end_date: e.target.value})}
                        min={bulkSlots.start_date || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>📅 Select Days of Week</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', marginTop: '8px' }}>
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        style={{
                          padding: '10px',
                          border: bulkSlots.days.includes(day) ? '2px solid #10b981' : '2px solid #e5e7eb',
                          background: bulkSlots.days.includes(day) ? '#d1fae5' : 'white',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: bulkSlots.days.includes(day) ? 'bold' : 'normal',
                          textTransform: 'capitalize'
                        }}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>🕐 Time Range</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <input
                        type="time"
                        value={bulkSlots.start_time}
                        onChange={(e) => setBulkSlots({...bulkSlots, start_time: e.target.value})}
                        placeholder="Start Time"
                      />
                    </div>
                    <div>
                      <input
                        type="time"
                        value={bulkSlots.end_time}
                        onChange={(e) => setBulkSlots({...bulkSlots, end_time: e.target.value})}
                        placeholder="End Time"
                      />
                    </div>
                  </div>
                </div>

                {bulkSlots.days.length > 0 && bulkSlots.start_date && bulkSlots.end_date && (
                  <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', marginTop: '12px' }}>
                    <strong>📊 Preview:</strong> Will create slots for <strong>{bulkSlots.days.length} day(s)</strong> per week between {bulkSlots.start_date} and {bulkSlots.end_date}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button>
                <button className="btn-success" onClick={handleBulkCreate}>
                  <i className="fas fa-calendar-plus"></i> Create All Slots
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Time Slot Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Time Slot</h2>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={newSlot.available_date}
                    onChange={(e) => setNewSlot({...newSlot, available_date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({...newSlot, start_time: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({...newSlot, end_time: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleCreateSlot}>
                  <i className="fas fa-plus"></i> Create Slot
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
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

export default DoctorSchedule;
