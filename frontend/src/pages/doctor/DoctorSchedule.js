import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import '../../styles/patientDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorSchedule = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const doctorId = currentUser?.userId || currentUser?.doctor_id;
  const branchId = localStorage.getItem('branch_id');

  // State for time slots
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // State for form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    available_date: '',
    start_time: '09:00',
    end_time: '09:30',
    slot_duration: 30 // in minutes
  });
  const [bulkSlots, setBulkSlots] = useState([]);
  const [creatingSlots, setCreatingSlots] = useState(false);

  useEffect(() => {
    // Check authentication
    console.log('🔐 Checking authentication for schedule...');
    
    const userId = localStorage.getItem('user_id');
    const userType = localStorage.getItem('user_type');

    if (!userId || userType !== 'doctor') {
      console.log('❌ Unauthorized access to doctor schedule');
      navigate('/doctor-login', { replace: true });
      return;
    }

    console.log('✅ Auth verified, loading schedule for doctor:', doctorId);
    
    if (doctorId) {
      fetchTimeSlots(doctorId);
    }
  }, [doctorId, navigate]);

  const fetchTimeSlots = async (id) => {
    setLoading(true);
    try {
      console.log('📊 Fetching time slots for doctor:', id);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/timeslots/doctor/${id}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Time slots loaded:', data);
        setTimeSlots(data.time_slots || []);
        setError('');
      } else {
        throw new Error(`Failed to fetch schedule: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Error fetching time slots:', err);
      setError(err.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    authService.logout();
    navigate('/doctor-login');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'slot_duration' ? parseInt(value, 10) : value
    }));
  };

  const generateTimeSlots = () => {
    console.log('🔧 Generating time slots...');
    console.log('Form data:', formData);
    
    if (!formData.available_date || !formData.start_time || !formData.end_time) {
      alert('❌ Please fill all fields');
      return;
    }

    try {
      // Ensure slot_duration is a number
      let slotDuration = parseInt(formData.slot_duration, 10);
      if (isNaN(slotDuration) || slotDuration < 15) {
        alert('❌ Slot duration must be at least 15 minutes');
        return;
      }

      // Clean up time strings - remove any AM/PM and extra spaces
      let startTimeStr = formData.start_time.trim().toUpperCase();
      let endTimeStr = formData.end_time.trim().toUpperCase();
      
      console.log('Raw times:', { startTimeStr, endTimeStr, slotDuration });
      
      // Remove AM/PM if present
      startTimeStr = startTimeStr.replace(/\s*(AM|PM)/g, '');
      endTimeStr = endTimeStr.replace(/\s*(AM|PM)/g, '');
      
      console.log('Cleaned times:', { startTimeStr, endTimeStr });
      
      // Parse times
      let startParts = startTimeStr.split(':');
      let endParts = endTimeStr.split(':');
      
      console.log('Split times:', { startParts, endParts });
      
      let startHour = parseInt(startParts[0], 10);
      let startMin = parseInt(startParts[1], 10);
      let endHour = parseInt(endParts[0], 10);
      let endMin = parseInt(endParts[1], 10);
      
      console.log('Parsed values:', { startHour, startMin, endHour, endMin });
      
      // Validate hour and minute values
      if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
        console.error('NaN detected:', { startHour, startMin, endHour, endMin });
        alert('❌ Invalid time format. Time must be HH:MM (e.g., 09:00 or 14:30)');
        return;
      }
      
      if (startHour < 0 || startHour > 23 || startMin < 0 || startMin > 59) {
        alert(`❌ Invalid start time: ${startHour}:${startMin}\n\nHours must be 0-23, Minutes must be 0-59`);
        return;
      }
      
      if (endHour < 0 || endHour > 23 || endMin < 0 || endMin > 59) {
        alert(`❌ Invalid end time: ${endHour}:${endMin}\n\nHours must be 0-23, Minutes must be 0-59`);
        return;
      }
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      console.log('Minutes calculated:', { startMinutes, endMinutes });
      
      // Handle case where end time is next day (e.g., 08:00 to 02:00 means 08:00 to 26:00)
      let adjustedEndMinutes = endMinutes;
      if (endMinutes <= startMinutes) {
        console.log('End time is less than start time, treating as next day');
        adjustedEndMinutes = endMinutes + 24 * 60; // Add 24 hours
      }
      
      const totalMinutes = adjustedEndMinutes - startMinutes;
      
      console.log('Time range:', { startMinutes, adjustedEndMinutes, totalMinutes, slot_duration: slotDuration });
      
      // Check if time range is sufficient (need at least slot_duration minutes)
      if (totalMinutes < slotDuration) {
        alert(`❌ No slots can be created.\n\nAvailable time: ${totalMinutes} minutes\nSlot duration: ${slotDuration} minutes\n\nNeed at least ${slotDuration} minutes.\n\nTry:\n- Increasing end time, OR\n- Decreasing slot duration`);
        return;
      }

      const slots = [];
      let currentMinutes = startMinutes;
      let slotCount = 0;

      while (currentMinutes + slotDuration <= adjustedEndMinutes) {
        let slotEndMinutes = currentMinutes + slotDuration;
        
        // Convert back to hours and minutes
        const slotStartHour = Math.floor(currentMinutes / 60) % 24;
        const slotStartMin = currentMinutes % 60;
        const slotEndHour = Math.floor(slotEndMinutes / 60) % 24;
        const slotEndMin = slotEndMinutes % 60;

        slots.push({
          available_date: formData.available_date,
          start_time: `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}:00`,
          end_time: `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}:00`
        });

        currentMinutes += slotDuration;
        slotCount++;
        console.log(`Slot ${slotCount}: ${String(slotStartHour).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')} - ${String(slotEndHour).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}`);
      }

      console.log('Slots created:', slotCount, slots);

      if (slots.length === 0) {
        alert(`❌ No slots can be created with the given duration.\n\nAvailable time: ${totalMinutes} minutes\nSlot duration: ${slotDuration} minutes\n\nTry using a larger time range or smaller slot duration.`);
        return;
      }

      console.log(`📅 Generated ${slots.length} time slots`);
      setBulkSlots(slots);
      console.log(`✅ bulkSlots state updated with ${slots.length} slots`);
    } catch (err) {
      console.error('Error generating slots:', err);
      alert('❌ Error generating time slots:\n' + err.message);
    }
  };

  const createTimeSlots = async () => {
    if (bulkSlots.length === 0) {
      alert('Please generate time slots first');
      return;
    }

    setCreatingSlots(true);
    try {
      console.log('📤 Creating time slots...');
      console.log('🔍 Doctor ID:', doctorId);
      console.log('🔍 Branch ID:', branchId);
      console.log('🔍 Slots to create:', bulkSlots);
      
      const token = localStorage.getItem('token');
      const requestPayload = {
        doctor_id: doctorId,
        branch_id: branchId || 'default-branch',
        time_slots: bulkSlots
      };
      
      console.log('📨 Request payload:', JSON.stringify(requestPayload, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/timeslots/create-bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('📡 Response status:', response.status);
      const result = await response.json();
      console.log('📦 Response data:', result);

      if (response.ok) {
        console.log('✅ Time slots created successfully:', result);
        alert(`✅ Successfully created ${result.created_slots?.length || 0} time slots!`);
        
        // Reset form
        setFormData({
          available_date: '',
          start_time: '09:00',
          end_time: '09:30',
          slot_duration: 30
        });
        setBulkSlots([]);
        setShowForm(false);
        
        // Refresh time slots
        fetchTimeSlots(doctorId);
      } else {
        const error = result.detail || 'Failed to create time slots';
        console.error('❌ Error:', error);
        throw new Error(error);
      }
    } catch (err) {
      console.error('❌ Error creating time slots:', err);
      alert('❌ Error: ' + (err.message || 'Failed to create time slots'));
    } finally {
      setCreatingSlots(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) return;
    
    try {
      console.log('🗑️ Deleting time slot:', slotId);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/timeslots/${slotId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        console.log('✅ Time slot deleted');
        alert('✅ Time slot deleted successfully');
        fetchTimeSlots(doctorId);
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      console.error('❌ Error deleting time slot:', err);
      alert('❌ Failed to delete time slot');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    return timeStr.substring(0, 5);
  };

  if (loading) {
    return (
      <div className="patient-portal">
        <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
          <p>Loading your schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-portal">
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
            <div className="patient-info-display" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="patient-info-text">
                <div className="patient-name-display">Dr. {localStorage.getItem('full_name') || 'Doctor'}</div>
                <div className="patient-id-display">Manage Schedule</div>
              </div>
              <div className="patient-avatar-wrapper">
                <div className="patient-avatar">
                  {(localStorage.getItem('full_name') || 'D').charAt(0).toUpperCase()}
                </div>
                <div className="avatar-status-indicator"></div>
              </div>
            </div>

            {showProfileMenu && (
              <div className="patient-profile-dropdown">
                <button className="patient-dropdown-item" onClick={() => navigate('/doctor/dashboard')}>
                  <span className="dropdown-icon">📊</span>
                  <span>Dashboard</span>
                </button>
                <button className="patient-dropdown-item" onClick={() => navigate('/doctor/profile')}>
                  <span className="dropdown-icon">👤</span>
                  <span>My Profile</span>
                </button>
                <div className="patient-dropdown-divider"></div>
                <button className="patient-dropdown-item logout-item" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="patient-container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <section style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1a2332', marginBottom: '8px' }}>
            My Schedule 📅
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
            Manage your available time slots
          </p>
        </section>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '30px' }}>
            <strong>Error:</strong> {error}
            <button onClick={() => fetchTimeSlots(doctorId)} style={{ marginLeft: '20px' }}>Retry</button>
          </div>
        )}

        {/* Add Time Slots Section */}
        <section style={{ background: '#fff', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2332' }}>Add New Time Slots</h2>
            <button 
              onClick={() => setShowForm(!showForm)}
              style={{ 
                padding: '10px 20px', 
                background: showForm ? '#ef4444' : '#3b82f6', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {showForm ? '✕ Cancel' : '+ Add Slots'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={(e) => { e.preventDefault(); generateTimeSlots(); }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a2332' }}>Date</label>
                <input
                  type="date"
                  name="available_date"
                  value={formData.available_date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '16px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a2332' }}>Slot Duration (minutes)</label>
                <select
                  name="slot_duration"
                  value={formData.slot_duration}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '16px' }}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a2332' }}>Start Time</label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '16px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a2332' }}>End Time</label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '16px' }}
                  required
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '15px' }}>
                <button 
                  type="submit"
                  style={{ 
                    padding: '12px 30px', 
                    background: '#10b981', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  📋 Generate Slots
                </button>
                {bulkSlots.length > 0 && (
                  <button 
                    type="button"
                    onClick={createTimeSlots}
                    disabled={creatingSlots}
                    style={{ 
                      padding: '12px 30px', 
                      background: creatingSlots ? '#6b7280' : '#3b82f6', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: '8px', 
                      cursor: creatingSlots ? 'not-allowed' : 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {creatingSlots ? '⏳ Creating...' : `✅ Create ${bulkSlots.length} Slots`}
                  </button>
                )}
              </div>

              {bulkSlots.length > 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '15px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
                  <p style={{ margin: '0 0 10px 0', fontWeight: '600', color: '#166534' }}>✅ {bulkSlots.length} slots will be created:</p>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {bulkSlots.slice(0, 5).map((slot, idx) => (
                      <p key={idx} style={{ margin: '5px 0', fontSize: '14px', color: '#166534' }}>
                        • {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </p>
                    ))}
                    {bulkSlots.length > 5 && <p style={{ margin: '5px 0', fontSize: '14px', color: '#166534' }}>... and {bulkSlots.length - 5} more</p>}
                  </div>
                </div>
              )}
            </form>
          )}
        </section>

        {/* Time Slots List */}
        <section>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>Available Time Slots ({timeSlots.length})</h2>

          {timeSlots.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
              <p style={{ color: '#64748b', fontSize: '16px' }}>No time slots available yet. Add some to get started!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {timeSlots.map((slot, index) => (
                <div key={slot.time_slot_id || index} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: slot.is_booked ? '2px solid #ef4444' : '2px solid #10b981' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', margin: '0 0 5px 0' }}>📅 Date</p>
                      <p style={{ fontSize: '16px', fontWeight: '700', color: '#1a2332', margin: 0 }}>{formatDate(slot.available_date)}</p>
                    </div>
                    <span style={{ padding: '4px 12px', background: slot.is_booked ? '#fecaca' : '#d1fae5', color: slot.is_booked ? '#991b1b' : '#065f46', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                      {slot.is_booked ? '❌ Booked' : '✅ Available'}
                    </span>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', margin: '0 0 5px 0' }}>🕐 Time</p>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: '#1a2332', margin: 0 }}>
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteSlot(slot.time_slot_id)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    🗑️ Delete Slot
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DoctorSchedule;
