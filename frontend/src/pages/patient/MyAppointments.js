// src/pages/patient/MyAppointments.js - Patient Appointments Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import appointmentService from '../../services/appointmentService';
import authService from '../../services/authService';
import '../../styles/patientDashboard.css';

export default function MyAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', 'all'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get patient ID from auth
  const currentUser = authService.getCurrentUser();
  const patientId = currentUser?.patientId || localStorage.getItem('patientId');

  useEffect(() => {
    if (!patientId) {
      navigate('/patient-login');
      return;
    }
    fetchAppointments();
  }, [patientId, filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📅 Fetching appointments for patient:', patientId);

      // Fetch appointments from backend
      const includePast = filter === 'past' || filter === 'all';
      const data = await appointmentService.getPatientAppointments(patientId, includePast);

      console.log('✅ Appointments fetched:', data);

      // Filter based on selected filter
      let filteredAppointments = data;
      if (filter === 'upcoming') {
        filteredAppointments = data.filter(appt => {
          const apptDate = new Date(appt.available_date);
          return apptDate >= new Date() && appt.status !== 'Cancelled' && appt.status !== 'Completed';
        });
      } else if (filter === 'past') {
        filteredAppointments = data.filter(appt => {
          const apptDate = new Date(appt.available_date);
          return apptDate < new Date() || appt.status === 'Completed';
        });
      }

      setAppointments(filteredAppointments);
    } catch (err) {
      console.error('❌ Error fetching appointments:', err);
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setLoading(true);
      await appointmentService.cancelAppointment(appointmentId);
      alert('Appointment cancelled successfully');
      fetchAppointments(); // Refresh list
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('Failed to cancel appointment: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    // Handle both string "HH:MM:SS" and integer seconds
    if (typeof timeStr === 'number') {
      const hours = Math.floor(timeStr / 3600);
      const minutes = Math.floor((timeStr % 3600) / 60);
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    return timeStr.substring(0, 5); // "HH:MM" from "HH:MM:SS"
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Scheduled': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'No-Show': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(appt => {
      const apptDate = new Date(appt.available_date);
      return apptDate.toDateString() === date.toDateString();
    });
  };

  const changeMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  return (
    <div className="patient-portal">
      {/* Header */}
      <nav className="patient-top-nav">
        <div className="patient-top-nav-content">
          <button className="btn-secondary" onClick={() => navigate('/patient/dashboard')}>
            ← Back to Dashboard
          </button>
          <h2 style={{ color: 'white', margin: 0 }}>My Appointments</h2>
          <button className="btn-primary" onClick={() => navigate('/patient/book')}>
            + Book New Appointment
          </button>
        </div>
      </nav>

      <div className="patient-container" style={{ paddingTop: '40px' }}>
        {/* Filter and View Toggle */}
        <div className="controls-wrapper">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
              onClick={() => setFilter('upcoming')}
            >
              📅 Upcoming
            </button>
            <button
              className={`filter-tab ${filter === 'past' ? 'active' : ''}`}
              onClick={() => setFilter('past')}
            >
              📋 Past
            </button>
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              📑 All
            </button>
          </div>

          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              📋 List
            </button>
            <button
              className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              📅 Calendar
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="spinner">⏳</div>
            <p>Loading appointments...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Appointments</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={fetchAppointments}>
              🔄 Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && appointments.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No {filter} appointments</h3>
            <p>
              {filter === 'upcoming'
                ? "You don't have any upcoming appointments."
                : filter === 'past'
                ? "You don't have any past appointments."
                : "You don't have any appointments yet."}
            </p>
            <button className="btn-primary" onClick={() => navigate('/patient/book')}>
              Book Your First Appointment
            </button>
          </div>
        )}

        {/* Calendar View */}
        {!loading && !error && viewMode === 'calendar' && (
          <div className="calendar-container">
            <div className="calendar-header">
              <button className="month-nav-btn" onClick={() => changeMonth(-1)}>
                ←
              </button>
              <h2 className="calendar-month">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button className="month-nav-btn" onClick={() => changeMonth(1)}>
                →
              </button>
            </div>

            <div className="calendar-grid">
              <div className="calendar-day-header">Sun</div>
              <div className="calendar-day-header">Mon</div>
              <div className="calendar-day-header">Tue</div>
              <div className="calendar-day-header">Wed</div>
              <div className="calendar-day-header">Thu</div>
              <div className="calendar-day-header">Fri</div>
              <div className="calendar-day-header">Sat</div>

              {(() => {
                const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
                const days = [];
                
                // Empty cells for days before month starts
                for (let i = 0; i < startingDayOfWeek; i++) {
                  days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
                }
                
                // Days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(year, month, day);
                  const dayAppointments = getAppointmentsForDate(date);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const hasAppointments = dayAppointments.length > 0;
                  
                  days.push(
                    <div
                      key={day}
                      className={`calendar-day ${isToday ? 'today' : ''} ${hasAppointments ? 'has-appointments' : ''}`}
                      onClick={() => {
                        if (hasAppointments) {
                          setSelectedAppointment(dayAppointments[0]);
                        }
                      }}
                    >
                      <div className="day-number">{day}</div>
                      {hasAppointments && (
                        <div className="appointment-indicators">
                          {dayAppointments.map((appt, idx) => (
                            <div key={idx} className="appointment-dot" title={appt.doctor_name}></div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return days;
              })()}
            </div>

            {/* Calendar Legend */}
            <div className="calendar-legend">
              <div className="legend-item">
                <div className="legend-dot today-dot"></div>
                <span>Today</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot appointment-dot"></div>
                <span>Has Appointment</span>
              </div>
            </div>
          </div>
        )}

        {/* Appointments List */}
        {!loading && !error && appointments.length > 0 && viewMode === 'list' && (
          <div className="appointments-grid">
            {appointments.map((appointment) => (
              <div key={appointment.appointment_id} className="appointment-card">
                <div className="appointment-header">
                  <div>
                    <h3>{appointment.doctor_name}</h3>
                    <p className="appointment-specialty">
                      {appointment.specialty || 'General Consultation'}
                    </p>
                  </div>
                  <span className={`status-badge ${getStatusBadge(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>

                <div className="appointment-details">
                  <div className="detail-row">
                    <span className="detail-icon">📅</span>
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">
                      {new Date(appointment.available_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">⏰</span>
                    <span className="detail-label">Time:</span>
                    <span className="detail-value">
                      {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">🏥</span>
                    <span className="detail-label">Branch:</span>
                    <span className="detail-value">{appointment.branch_name}</span>
                  </div>

                  {appointment.notes && (
                    <div className="detail-row">
                      <span className="detail-icon">📝</span>
                      <span className="detail-label">Notes:</span>
                      <span className="detail-value">{appointment.notes}</span>
                    </div>
                  )}
                </div>

                <div className="appointment-actions">
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    View Details
                  </button>
                  {appointment.status === 'Scheduled' && (
                    <button
                      className="btn-danger btn-sm"
                      onClick={() => handleCancelAppointment(appointment.appointment_id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Appointment Details Modal */}
        {selectedAppointment && (
          <div className="modal-overlay" onClick={() => setSelectedAppointment(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Appointment Details</h2>
                <button className="modal-close" onClick={() => setSelectedAppointment(null)}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="detail-section">
                  <h3>Doctor Information</h3>
                  <p><strong>Doctor:</strong> {selectedAppointment.doctor_name}</p>
                  <p><strong>Specialty:</strong> {selectedAppointment.specialty || 'N/A'}</p>
                </div>

                <div className="detail-section">
                  <h3>Appointment Details</h3>
                  <p>
                    <strong>Date:</strong>{' '}
                    {new Date(selectedAppointment.available_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p>
                    <strong>Time:</strong> {formatTime(selectedAppointment.start_time)} -{' '}
                    {formatTime(selectedAppointment.end_time)}
                  </p>
                  <p><strong>Branch:</strong> {selectedAppointment.branch_name}</p>
                  <p><strong>Status:</strong> {selectedAppointment.status}</p>
                  <p><strong>Appointment ID:</strong> {selectedAppointment.appointment_id}</p>
                </div>

                {selectedAppointment.notes && (
                  <div className="detail-section">
                    <h3>Notes</h3>
                    <p>{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .controls-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
          background: white;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .filter-tabs {
          display: flex;
          gap: 10px;
          flex: 1;
        }

        .view-toggle {
          display: flex;
          gap: 8px;
          background: #f1f5f9;
          padding: 6px;
          border-radius: 12px;
        }

        .view-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          background: transparent;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          color: #64748b;
        }

        .view-btn:hover {
          background: white;
        }

        .view-btn.active {
          background: white;
          color: #7c3aed;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15);
        }

        .filter-tab {
          flex: 1;
          padding: 12px 20px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .filter-tab:hover {
          border-color: #7c3aed;
          background: #faf5ff;
        }

        .filter-tab.active {
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          color: white;
          border-color: #7c3aed;
        }

        .loading-container,
        .error-container,
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .spinner,
        .error-icon,
        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .appointments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 20px;
        }

        .appointment-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          border: 2px solid #f1f5f9;
          transition: all 0.3s;
        }

        .appointment-card:hover {
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.15);
          border-color: #7c3aed;
          transform: translateY(-2px);
        }

        .appointment-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f5f9;
        }

        .appointment-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #1a2332;
          margin: 0 0 5px 0;
        }

        .appointment-specialty {
          color: #64748b;
          font-size: 14px;
          margin: 0;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .bg-blue-100 {
          background: #dbeafe;
        }
        .text-blue-800 {
          color: #1e40af;
        }
        .bg-green-100 {
          background: #d1fae5;
        }
        .text-green-800 {
          color: #065f46;
        }
        .bg-red-100 {
          background: #fee2e2;
        }
        .text-red-800 {
          color: #991b1b;
        }
        .bg-gray-100 {
          background: #f3f4f6;
        }
        .text-gray-800 {
          color: #1f2937;
        }

        .appointment-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .detail-row {
          display: grid;
          grid-template-columns: 30px 80px 1fr;
          align-items: center;
          gap: 8px;
        }

        .detail-icon {
          font-size: 20px;
        }

        .detail-label {
          font-weight: 600;
          color: #64748b;
          font-size: 14px;
        }

        .detail-value {
          color: #1a2332;
          font-size: 14px;
        }

        .appointment-actions {
          display: flex;
          gap: 10px;
          padding-top: 16px;
          border-top: 2px solid #f1f5f9;
        }

        .btn-sm {
          padding: 8px 16px;
          font-size: 14px;
        }

        .btn-danger {
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-danger:hover {
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
          transform: translateY(-2px);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 2px solid #f1f5f9;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #1a2332;
        }

        .modal-close {
          background: #f1f5f9;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .modal-close:hover {
          background: #e2e8f0;
          transform: rotate(90deg);
        }

        .modal-body {
          padding: 24px;
        }

        .detail-section {
          margin-bottom: 24px;
        }

        .detail-section h3 {
          font-size: 18px;
          font-weight: 700;
          color: #1a2332;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #f1f5f9;
        }

        .detail-section p {
          margin: 8px 0;
          color: #475569;
          line-height: 1.6;
        }

        .detail-section strong {
          color: #1a2332;
          font-weight: 600;
        }

        /* Calendar Styles */
        .calendar-container {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .calendar-month {
          font-size: 24px;
          font-weight: 700;
          color: #1a2332;
          margin: 0;
        }

        .month-nav-btn {
          background: #f1f5f9;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .month-nav-btn:hover {
          background: #7c3aed;
          color: white;
          transform: scale(1.1);
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 10px;
        }

        .calendar-day-header {
          text-align: center;
          font-weight: 700;
          color: #64748b;
          padding: 15px;
          font-size: 14px;
          text-transform: uppercase;
        }

        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 2px solid #f1f5f9;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          padding: 8px;
          background: white;
        }

        .calendar-day.empty {
          background: transparent;
          border-color: transparent;
          cursor: default;
        }

        .calendar-day:not(.empty):hover {
          border-color: #7c3aed;
          background: #faf5ff;
          transform: scale(1.05);
        }

        .calendar-day.today {
          border-color: #7c3aed;
          background: linear-gradient(135deg, #ede9fe 0%, #faf5ff 100%);
        }

        .calendar-day.has-appointments {
          border-color: #7c3aed;
          background: linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%);
        }

        .calendar-day.today.has-appointments {
          border-color: #7c3aed;
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
        }

        .calendar-day.today.has-appointments .day-number {
          color: white;
          font-weight: 800;
        }

        .day-number {
          font-size: 16px;
          font-weight: 600;
          color: #1a2332;
          margin-bottom: 4px;
        }

        .appointment-indicators {
          display: flex;
          gap: 3px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: auto;
        }

        .appointment-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #7c3aed;
        }

        .calendar-day.today.has-appointments .appointment-dot {
          background: white;
        }

        .calendar-legend {
          display: flex;
          gap: 30px;
          justify-content: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #f1f5f9;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #64748b;
        }

        .legend-dot {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 2px solid #7c3aed;
        }

        .legend-dot.today-dot {
          background: linear-gradient(135deg, #ede9fe 0%, #faf5ff 100%);
        }

        .legend-dot.appointment-dot {
          background: linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%);
        }

        @media (max-width: 768px) {
          .appointments-grid {
            grid-template-columns: 1fr;
          }

          .controls-wrapper {
            flex-direction: column;
          }

          .filter-tabs {
            width: 100%;
          }

          .view-toggle {
            width: 100%;
          }

          .calendar-day-header {
            font-size: 12px;
            padding: 8px;
          }

          .day-number {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
