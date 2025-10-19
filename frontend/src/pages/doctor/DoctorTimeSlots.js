import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import timeSlotService from '../../services/timeSlotService';
import '../../styles/patientDashboard.css';

const DoctorTimeSlots = () => {
  const navigate = useNavigate();
  const doctorId = localStorage.getItem('doctor_id') || localStorage.getItem('user_id');
  const branchId = localStorage.getItem('branch_id');
  
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createMode, setCreateMode] = useState('single'); // 'single', 'bulk', 'multiple'
  
  // Single time slot form
  const [singleForm, setSingleForm] = useState({
    available_date: '',
    start_time: '',
    end_time: ''
  });
  
  // Bulk time slots form
  const [bulkForm, setBulkForm] = useState({
    time_slots: [
      { available_date: '', start_time: '', end_time: '' }
    ]
  });
  
  // Multiple time slots form (date range)
  const [multipleForm, setMultipleForm] = useState({
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    interval_minutes: 30,
    days_of_week: [1, 2, 3, 4, 5] // Monday to Friday
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
      fetchTimeSlots();
    }
  }, [doctorId, navigate]);

  const fetchTimeSlots = async () => {
    setLoading(true);
    try {
      console.log('📊 Fetching time slots for doctor:', doctorId);
      const data = await timeSlotService.getDoctorTimeSlots(doctorId, false);
      setTimeSlots(data.time_slots || []);
      setError('');
    } catch (err) {
      console.error('❌ Error fetching time slots:', err);
      setError('Failed to load time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!branchId) {
      setError('Branch ID not found. Please contact administrator.');
      return;
    }

    try {
      setLoading(true);
      const timeSlotData = {
        doctor_id: doctorId,
        branch_id: branchId,
        ...singleForm
      };

      await timeSlotService.createTimeSlot(timeSlotData);
      setSuccess('Time slot created successfully!');
      setSingleForm({ available_date: '', start_time: '', end_time: '' });
      setShowCreateForm(false);
      fetchTimeSlots();
    } catch (err) {
      console.error('❌ Error creating time slot:', err);
      setError(err.message || 'Failed to create time slot');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!branchId) {
      setError('Branch ID not found. Please contact administrator.');
      return;
    }

    try {
      setLoading(true);
      const bulkData = {
        doctor_id: doctorId,
        branch_id: branchId,
        time_slots: bulkForm.time_slots.filter(slot => 
          slot.available_date && slot.start_time && slot.end_time
        )
      };

      const result = await timeSlotService.createBulkTimeSlots(bulkData);
      setSuccess(`Bulk creation completed! Created: ${result.created_count}, Failed: ${result.failed_count}`);
      setBulkForm({ time_slots: [{ available_date: '', start_time: '', end_time: '' }] });
      setShowCreateForm(false);
      fetchTimeSlots();
    } catch (err) {
      console.error('❌ Error creating bulk time slots:', err);
      setError(err.message || 'Failed to create bulk time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleSubmit = async (e) => {
    e.preventDefault();
    if (!branchId) {
      setError('Branch ID not found. Please contact administrator.');
      return;
    }

    try {
      setLoading(true);
      const multipleData = {
        doctor_id: doctorId,
        branch_id: branchId,
        ...multipleForm
      };

      const result = await timeSlotService.createMultipleTimeSlots(multipleData);
      setSuccess(`Multiple time slots created successfully! Created: ${result.created_count}`);
      setMultipleForm({
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        interval_minutes: 30,
        days_of_week: [1, 2, 3, 4, 5]
      });
      setShowCreateForm(false);
      fetchTimeSlots();
    } catch (err) {
      console.error('❌ Error creating multiple time slots:', err);
      setError(err.message || 'Failed to create multiple time slots');
    } finally {
      setLoading(false);
    }
  };

  const addBulkTimeSlot = () => {
    setBulkForm({
      ...bulkForm,
      time_slots: [...bulkForm.time_slots, { available_date: '', start_time: '', end_time: '' }]
    });
  };

  const removeBulkTimeSlot = (index) => {
    if (bulkForm.time_slots.length > 1) {
      const newTimeSlots = bulkForm.time_slots.filter((_, i) => i !== index);
      setBulkForm({ ...bulkForm, time_slots: newTimeSlots });
    }
  };

  const updateBulkTimeSlot = (index, field, value) => {
    const newTimeSlots = [...bulkForm.time_slots];
    newTimeSlots[index][field] = value;
    setBulkForm({ ...bulkForm, time_slots: newTimeSlots });
  };

  const handleDeleteTimeSlot = async (timeSlotId) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) {
      return;
    }

    try {
      setLoading(true);
      await timeSlotService.deleteTimeSlot(timeSlotId);
      setSuccess('Time slot deleted successfully!');
      fetchTimeSlots();
    } catch (err) {
      console.error('❌ Error deleting time slot:', err);
      setError(err.message || 'Failed to delete time slot');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (isBooked, availableDate) => {
    const today = new Date();
    const slotDate = new Date(availableDate);
    
    if (isBooked) {
      return { text: 'Booked', class: 'status-booked' };
    } else if (slotDate < today) {
      return { text: 'Past', class: 'status-past' };
    } else {
      return { text: 'Available', class: 'status-available' };
    }
  };

  if (loading && timeSlots.length === 0) {
    return (
      <div className="patient-portal">
        <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
          <p>Loading time slots...</p>
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
          .time-slot-card {
            background: #fff;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            border: 1px solid #e5e7eb;
          }
          .time-slot-item {
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
          .status-available {
            background: #d1fae5;
            color: #065f46;
          }
          .status-booked {
            background: #fef3c7;
            color: #92400e;
          }
          .status-past {
            background: #f3f4f6;
            color: #6b7280;
          }
          .form-container {
            background: #fff;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
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
          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .btn-primary {
            background: #3b82f6;
            color: #fff;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            margin-right: 10px;
          }
          .btn-secondary {
            background: #6b7280;
            color: #fff;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            margin-right: 10px;
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
          .btn-success {
            background: #10b981;
            color: #fff;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
          }
          .mode-selector {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
          }
          .mode-btn {
            padding: 10px 20px;
            border: 2px solid #e5e7eb;
            background: #fff;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
          }
          .mode-btn.active {
            border-color: #3b82f6;
            background: #eff6ff;
            color: #3b82f6;
          }
          .bulk-slot-item {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-bottom: 15px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .bulk-slot-input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
          }
          .checkbox-group {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 10px;
          }
          .checkbox-item {
            display: flex;
            align-items: center;
            gap: 8px;
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
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => navigate('/doctor/dashboard')} className="btn-back">← Back to Dashboard</button>
              <button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="btn-success"
              >
                {showCreateForm ? 'Cancel' : 'Create Time Slots'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="patient-container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <section style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1a2332', marginBottom: '8px' }}>
            Manage Time Slots ⏰
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
            Create and manage your available time slots for appointments
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

        {/* Create Time Slots Form */}
        {showCreateForm && (
          <div className="form-container">
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>
              Create Time Slots
            </h2>
            
            <div className="mode-selector">
              <button
                className={`mode-btn ${createMode === 'single' ? 'active' : ''}`}
                onClick={() => setCreateMode('single')}
              >
                Single Time Slot
              </button>
              <button
                className={`mode-btn ${createMode === 'bulk' ? 'active' : ''}`}
                onClick={() => setCreateMode('bulk')}
              >
                Bulk Time Slots
              </button>
              <button
                className={`mode-btn ${createMode === 'multiple' ? 'active' : ''}`}
                onClick={() => setCreateMode('multiple')}
              >
                Multiple (Date Range)
              </button>
            </div>

            {/* Single Time Slot Form */}
            {createMode === 'single' && (
              <form onSubmit={handleSingleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={singleForm.available_date}
                      onChange={(e) => setSingleForm({ ...singleForm, available_date: e.target.value })}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Time *</label>
                    <input
                      type="time"
                      className="form-input"
                      value={singleForm.start_time}
                      onChange={(e) => setSingleForm({ ...singleForm, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time *</label>
                    <input
                      type="time"
                      className="form-input"
                      value={singleForm.end_time}
                      onChange={(e) => setSingleForm({ ...singleForm, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Time Slot'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Bulk Time Slots Form */}
            {createMode === 'bulk' && (
              <form onSubmit={handleBulkSubmit}>
                <div className="form-group">
                  <label className="form-label">Time Slots *</label>
                  {bulkForm.time_slots.map((slot, index) => (
                    <div key={index} className="bulk-slot-item">
                      <input
                        type="date"
                        className="bulk-slot-input"
                        placeholder="Date"
                        value={slot.available_date}
                        onChange={(e) => updateBulkTimeSlot(index, 'available_date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <input
                        type="time"
                        className="bulk-slot-input"
                        placeholder="Start Time"
                        value={slot.start_time}
                        onChange={(e) => updateBulkTimeSlot(index, 'start_time', e.target.value)}
                      />
                      <input
                        type="time"
                        className="bulk-slot-input"
                        placeholder="End Time"
                        value={slot.end_time}
                        onChange={(e) => updateBulkTimeSlot(index, 'end_time', e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => removeBulkTimeSlot(index)}
                        disabled={bulkForm.time_slots.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn-success" onClick={addBulkTimeSlot}>
                    Add Another Time Slot
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Bulk Time Slots'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Multiple Time Slots Form */}
            {createMode === 'multiple' && (
              <form onSubmit={handleMultipleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={multipleForm.start_date}
                      onChange={(e) => setMultipleForm({ ...multipleForm, start_date: e.target.value })}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={multipleForm.end_date}
                      onChange={(e) => setMultipleForm({ ...multipleForm, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Time *</label>
                    <input
                      type="time"
                      className="form-input"
                      value={multipleForm.start_time}
                      onChange={(e) => setMultipleForm({ ...multipleForm, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time *</label>
                    <input
                      type="time"
                      className="form-input"
                      value={multipleForm.end_time}
                      onChange={(e) => setMultipleForm({ ...multipleForm, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Interval (minutes) *</label>
                  <select
                    className="form-input"
                    value={multipleForm.interval_minutes}
                    onChange={(e) => setMultipleForm({ ...multipleForm, interval_minutes: parseInt(e.target.value) })}
                    required
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Days of Week *</label>
                  <div className="checkbox-group">
                    {[
                      { value: 1, label: 'Monday' },
                      { value: 2, label: 'Tuesday' },
                      { value: 3, label: 'Wednesday' },
                      { value: 4, label: 'Thursday' },
                      { value: 5, label: 'Friday' },
                      { value: 6, label: 'Saturday' },
                      { value: 0, label: 'Sunday' }
                    ].map(day => (
                      <div key={day.value} className="checkbox-item">
                        <input
                          type="checkbox"
                          id={`day-${day.value}`}
                          checked={multipleForm.days_of_week.includes(day.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setMultipleForm({
                                ...multipleForm,
                                days_of_week: [...multipleForm.days_of_week, day.value]
                              });
                            } else {
                              setMultipleForm({
                                ...multipleForm,
                                days_of_week: multipleForm.days_of_week.filter(d => d !== day.value)
                              });
                            }
                          }}
                        />
                        <label htmlFor={`day-${day.value}`}>{day.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Multiple Time Slots'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Time Slots List */}
        <div className="time-slot-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332' }}>
              Your Time Slots ({timeSlots.length})
            </h2>
            <button className="btn-primary" onClick={fetchTimeSlots} disabled={loading}>
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #e5e7eb', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ marginTop: '10px', color: '#64748b' }}>Loading time slots...</p>
            </div>
          ) : timeSlots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <i className="fas fa-clock" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
              <p>No time slots created yet</p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn-success"
                style={{ marginTop: '10px' }}
              >
                Create Your First Time Slot
              </button>
            </div>
          ) : (
            <div>
              {timeSlots.map((slot, index) => {
                const status = getStatusBadge(slot.is_booked, slot.available_date);
                return (
                  <div key={slot.time_slot_id || index} className="time-slot-item">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a2332', margin: '0' }}>
                          {formatDate(slot.available_date)}
                        </h3>
                        <span className={`status-badge ${status.class}`}>
                          {status.text}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: '#64748b', margin: '0' }}>
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {!slot.is_booked && new Date(slot.available_date) >= new Date() && (
                        <button 
                          className="btn-danger"
                          onClick={() => handleDeleteTimeSlot(slot.time_slot_id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DoctorTimeSlots;
