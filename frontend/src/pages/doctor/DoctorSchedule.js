import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorHeader from '../../components/DoctorHeader';
import '../../styles/doctor.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorSchedule = () => {
  const navigate = useNavigate();
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
    if (id) {
      fetchTimeSlots(id);
    }
  }, [navigate]);

  const fetchTimeSlots = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/timeslots/doctor/${id}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setTimeSlots(data);
      } else {
        throw new Error('Failed to fetch schedule');
      }
    } catch (err) {
      setError('Failed to load schedule');
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
        fetchTimeSlots(doctorId);
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
          <h1>My Schedule</h1>
          <p>Manage your availability</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Schedule Grid */}
        <div className="schedule-grid">
          {timeSlots.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-times"></i>
              <p>No time slots found</p>
            </div>
          ) : (
            timeSlots.map((slot) => (
              <div key={slot.time_slot_id} className={`schedule-card ${slot.availability ? 'available' : 'booked'}`}>
                <div className="schedule-header">
                  <div className="schedule-date">
                    <i className="fas fa-calendar"></i> {formatDate(slot.date)}
                  </div>
                  <span className={`status-badge ${slot.availability ? 'status-available' : 'status-booked'}`}>
                    {slot.availability ? 'Available' : 'Booked'}
                  </span>
                </div>
                <div className="schedule-body">
                  <div className="schedule-info">
                    <i className="fas fa-clock"></i> {slot.start_time} - {slot.end_time}
                  </div>
                </div>
                <div className="schedule-footer">
                  <button 
                    className="btn-icon btn-danger" 
                    onClick={() => handleDeleteSlot(slot.time_slot_id)}
                    title="Delete"
                  >
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

export default DoctorSchedule;
