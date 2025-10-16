// src/pages/patient/PatientDashboard.js - Professional Patient Portal
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../styles/patientDashboard.css'

function formatDate(date) {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

function formatTime(date) {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function PatientDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  
  const [data, setData] = useState({
    patient: { 
      name: 'John Silva',
      email: 'john.silva@email.com',
      phone: '+94 77 123 4567',
      patientId: 'P-2401',
      bloodType: 'A+'
    },
    appointments: [],
    prescriptions: [],
    finance: { balance: 15000 },
    healthMetrics: {
      lastCheckup: '2025-09-15',
      bloodPressure: '120/80',
      weight: '75 kg',
      height: '175 cm'
    }
  })

  const fetchDashboardData = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      const appointments = [
        {
          id: 'a1',
          title: 'Cardiology Consultation',
          doctor: 'Dr. Perera',
          specialty: 'Cardiologist',
          date: new Date(2025, 9, 12, 10, 30),
          branch: 'Colombo',
          room: 'Cardio-301',
          status: 'Confirmed'
        },
        {
          id: 'a2',
          title: 'General Checkup',
          doctor: 'Dr. Fernando',
          specialty: 'General Physician',
          date: new Date(2025, 9, 18, 14, 0),
          branch: 'Colombo',
          room: 'GP-105',
          status: 'Confirmed'
        }
      ]
      
      const prescriptions = [
        { id: 'rx1', name: 'Aspirin 100mg', dosage: '1 tablet daily', refills: 2, doctor: 'Dr. Perera' },
        { id: 'rx2', name: 'Vitamin D3', dosage: '1 capsule weekly', refills: 5, doctor: 'Dr. Fernando' }
      ]
      
      setData(d => ({ ...d, appointments, prescriptions }))
      setLoading(false)
    }, 800)
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const upcomingAppointments = useMemo(() => {
    const now = new Date()
    return data.appointments
      .filter(appt => appt.date > now)
      .sort((a, b) => a.date - b.date)
      .slice(0, 3)
  }, [data.appointments])

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      navigate('/')
    }
  }

  return (
    <div className="patient-portal">
      {/* Top Navigation Bar */}
      <nav className="patient-top-nav">
        <div className="patient-top-nav-content">
          <div className="patient-nav-links">
            <a href="#home">Home</a>
            <a href="#appointments">Appointments</a>
            <a href="#records">Medical Records</a>
            <a href="#billing">Billing</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="patient-nav-actions">
            <a href="tel:+94115430000" className="patient-contact-link">📞 +94 11 543 0000</a>
            <a href="tel:1566" className="patient-emergency-link">🚨 Emergency: 1566</a>
          </div>
        </div>
      </nav>

      {/* Main Header */}
      <header className="patient-main-header">
        <div className="patient-header-content">
          <div className="patient-logo-section">
            <div className="patient-logo-wrapper">
              <div className="patient-logo-cross">✚</div>
              <div className="patient-brand-text">
                <h1 className="patient-brand-name">MedSync</h1>
                <p className="patient-brand-subtitle">Patient Portal</p>
              </div>
            </div>
          </div>
          
          <div className="patient-user-section">
            <div className="patient-info-display">
              <div className="patient-info-text">
                <div className="patient-name-display">{data.patient.name}</div>
                <div className="patient-id-display">ID: {data.patient.patientId}</div>
              </div>
              <div className="patient-avatar-wrapper" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="patient-avatar">
                  {data.patient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="avatar-status-indicator"></div>
              </div>
            </div>
            
            {showProfileMenu && (
              <div className="patient-profile-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">{data.patient.name.split(' ').map(n => n[0]).join('')}</div>
                  <div>
                    <div className="dropdown-name">{data.patient.name}</div>
                    <div className="dropdown-email">{data.patient.email}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={() => navigate('/patient/profile')}>
                  <span>👤</span>
                  My Profile
                </button>
                <button className="dropdown-item" onClick={() => navigate('/patient/settings')}>
                  <span>⚙️</span>
                  Settings
                </button>
                <button className="dropdown-item" onClick={() => navigate('/patient/help')}>
                  <span>❓</span>
                  Help & Support
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <span>🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="patient-hero-section">
        <div className="patient-hero-content">
          <div className="patient-hero-text">
            <h2 className="patient-hero-title">Welcome back, {data.patient.name.split(' ')[0]}!</h2>
            <p className="patient-hero-subtitle">
              Manage your health journey from one convenient place
            </p>
            <div className="patient-hero-stats">
              <div className="hero-stat-item">
                <span className="hero-stat-icon">📅</span>
                <div>
                  <div className="hero-stat-value">{upcomingAppointments.length}</div>
                  <div className="hero-stat-label">Upcoming Appointments</div>
                </div>
              </div>
              <div className="hero-stat-item">
                <span className="hero-stat-icon">💊</span>
                <div>
                  <div className="hero-stat-value">{data.prescriptions.length}</div>
                  <div className="hero-stat-label">Active Prescriptions</div>
                </div>
              </div>
              <div className="hero-stat-item">
                <span className="hero-stat-icon">📋</span>
                <div>
                  <div className="hero-stat-value">All Good</div>
                  <div className="hero-stat-label">Health Status</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outstanding Balance Alert */}
      {data.finance.balance > 0 && (
        <div className="patient-alert-banner">
          <div className="patient-container">
            <div className="alert-content">
              <div className="alert-icon">💳</div>
              <div className="alert-text">
                <strong>Outstanding Balance:</strong> You have LKR {data.finance.balance.toLocaleString()} pending payment.
              </div>
              <button className="alert-action-btn" onClick={() => navigate('/patient/billing')}>
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="patient-main-content">
        <div className="patient-container">
          {/* Quick Actions Grid */}
          <section className="quick-actions-section">
            <h3 className="section-heading">Quick Actions</h3>
            <div className="quick-actions-grid">
              <button className="quick-action-card book-action" onClick={() => navigate('/patient/book')}>
                <div className="action-icon-wrapper">
                  <span className="action-icon">📅</span>
                </div>
                <div className="action-content">
                  <h4 className="action-title">Book Appointment</h4>
                  <p className="action-description">Schedule with our specialists</p>
                </div>
                <div className="action-arrow">→</div>
              </button>

              <button className="quick-action-card records-action" onClick={() => navigate('/patient/records')}>
                <div className="action-icon-wrapper">
                  <span className="action-icon">📋</span>
                </div>
                <div className="action-content">
                  <h4 className="action-title">Medical Records</h4>
                  <p className="action-description">View your health history</p>
                </div>
                <div className="action-arrow">→</div>
              </button>

              <button className="quick-action-card billing-action" onClick={() => navigate('/patient/billing')}>
                <div className="action-icon-wrapper">
                  <span className="action-icon">💳</span>
                </div>
                <div className="action-content">
                  <h4 className="action-title">Pay Bills</h4>
                  <p className="action-description">Manage payments online</p>
                </div>
                <div className="action-arrow">→</div>
              </button>

              <button className="quick-action-card prescriptions-action" onClick={() => navigate('/patient/prescriptions')}>
                <div className="action-icon-wrapper">
                  <span className="action-icon">💊</span>
                </div>
                <div className="action-content">
                  <h4 className="action-title">Prescriptions</h4>
                  <p className="action-description">Refill medications</p>
                </div>
                <div className="action-arrow">→</div>
              </button>

              <button className="quick-action-card lab-action" onClick={() => navigate('/patient/lab-results')}>
                <div className="action-icon-wrapper">
                  <span className="action-icon">🧪</span>
                </div>
                <div className="action-content">
                  <h4 className="action-title">Lab Results</h4>
                  <p className="action-description">View test results</p>
                </div>
                <div className="action-arrow">→</div>
              </button>

              <button className="quick-action-card message-action" onClick={() => alert('Contact doctor')}>
                <div className="action-icon-wrapper">
                  <span className="action-icon">💬</span>
                </div>
                <div className="action-content">
                  <h4 className="action-title">Contact Doctor</h4>
                  <p className="action-description">Send a message</p>
                </div>
                <div className="action-arrow">→</div>
              </button>
            </div>
          </section>

          {/* Main Grid Layout */}
          <div className="patient-dashboard-grid">
            {/* Upcoming Appointments */}
            <div className="dashboard-card appointments-card">
              <div className="card-header">
                <h3 className="card-title">Upcoming Appointments</h3>
                <button className="view-all-link" onClick={() => navigate('/patient/appointments')}>
                  View All →
                </button>
              </div>
              <div className="card-content">
                {loading ? (
                  <div className="loading-skeleton">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                  </div>
                ) : upcomingAppointments.length === 0 ? (
                  <div className="empty-state-card">
                    <span className="empty-icon">📅</span>
                    <p>No upcoming appointments</p>
                    <button className="btn-primary" onClick={() => navigate('/patient/book')}>
                      Book Appointment
                    </button>
                  </div>
                ) : (
                  <div className="appointments-list">
                    {upcomingAppointments.map(appt => (
                      <div 
                        key={appt.id} 
                        className="appointment-item"
                        onClick={() => setSelectedAppointment(appt)}
                      >
                        <div className="appointment-icon-badge">
                          <span>👨‍⚕️</span>
                        </div>
                        <div className="appointment-info">
                          <h4 className="appointment-title">{appt.title}</h4>
                          <div className="appointment-doctor">{appt.doctor} • {appt.specialty}</div>
                          <div className="appointment-meta">
                            <span>📅 {formatDate(appt.date)}</span>
                            <span>🕐 {formatTime(appt.date)}</span>
                            <span>📍 {appt.branch}</span>
                          </div>
                        </div>
                        <div className="appointment-status-badge confirmed">
                          {appt.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active Prescriptions */}
            <div className="dashboard-card prescriptions-card">
              <div className="card-header">
                <h3 className="card-title">Active Prescriptions</h3>
                <button className="view-all-link" onClick={() => navigate('/patient/prescriptions')}>
                  View All →
                </button>
              </div>
              <div className="card-content">
                {data.prescriptions.length === 0 ? (
                  <div className="empty-state-card">
                    <span className="empty-icon">💊</span>
                    <p>No active prescriptions</p>
                  </div>
                ) : (
                  <div className="prescriptions-list">
                    {data.prescriptions.map(rx => (
                      <div key={rx.id} className="prescription-item">
                        <div className="prescription-icon">💊</div>
                        <div className="prescription-info">
                          <h4 className="prescription-name">{rx.name}</h4>
                          <div className="prescription-dosage">{rx.dosage}</div>
                          <div className="prescription-meta">
                            Prescribed by {rx.doctor} • {rx.refills} refills left
                          </div>
                        </div>
                        <button className="prescription-refill-btn">Refill</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Health Summary */}
            <div className="dashboard-card health-card">
              <div className="card-header">
                <h3 className="card-title">Health Summary</h3>
                <button className="view-all-link" onClick={() => navigate('/patient/records')}>
                  View Details →
                </button>
              </div>
              <div className="card-content">
                <div className="health-metrics-grid">
                  <div className="health-metric-item">
                    <div className="metric-icon blood-pressure-icon">❤️</div>
                    <div className="metric-info">
                      <div className="metric-label">Blood Pressure</div>
                      <div className="metric-value">{data.healthMetrics.bloodPressure}</div>
                    </div>
                  </div>
                  <div className="health-metric-item">
                    <div className="metric-icon weight-icon">⚖️</div>
                    <div className="metric-info">
                      <div className="metric-label">Weight</div>
                      <div className="metric-value">{data.healthMetrics.weight}</div>
                    </div>
                  </div>
                  <div className="health-metric-item">
                    <div className="metric-icon blood-type-icon">🩸</div>
                    <div className="metric-info">
                      <div className="metric-label">Blood Type</div>
                      <div className="metric-value">{data.patient.bloodType}</div>
                    </div>
                  </div>
                  <div className="health-metric-item">
                    <div className="metric-icon checkup-icon">📋</div>
                    <div className="metric-info">
                      <div className="metric-label">Last Checkup</div>
                      <div className="metric-value-small">{data.healthMetrics.lastCheckup}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notices */}
            <div className="dashboard-card notices-card">
              <div className="card-header">
                <h3 className="card-title">Important Notices</h3>
              </div>
              <div className="card-content">
                <div className="notice-item info-notice">
                  <span className="notice-icon">ℹ️</span>
                  <div className="notice-content">
                    <strong>Health Tip:</strong> Stay hydrated and maintain a balanced diet for optimal health.
                  </div>
                </div>
                <div className="notice-item warning-notice">
                  <span className="notice-icon">⚠️</span>
                  <div className="notice-content">
                    <strong>Reminder:</strong> Annual health checkup is recommended for age 30+.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="patient-footer">
        <div className="patient-container">
          <div className="patient-footer-content">
            <div className="footer-column">
              <div className="footer-logo-section">
                <div className="footer-logo-cross">✚</div>
                <h3>MedSync</h3>
              </div>
              <p className="footer-description">
                Your trusted partner in healthcare management. Quality care, always.
              </p>
              <div className="footer-contact">
                <p><strong>Contact:</strong> +94 11 543 0000</p>
                <p><strong>Emergency:</strong> 1566</p>
                <p><strong>Email:</strong> info@medsync.com</p>
              </div>
            </div>
            
            <div className="footer-column">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li><a href="#appointments">Appointments</a></li>
                <li><a href="#billing">Billing</a></li>
                <li><a href="#records">Medical Records</a></li>
                <li><a href="#prescriptions">Prescriptions</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Support</h4>
              <ul className="footer-links">
                <li><a href="#help">Help Center</a></li>
                <li><a href="#faq">FAQs</a></li>
                <li><a href="#contact">Contact Us</a></li>
                <li><a href="#feedback">Feedback</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Legal</h4>
              <ul className="footer-links">
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#security">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2025 MedSync Medical Center. All rights reserved.</p>
            <div className="footer-social">
              <a href="#facebook">f</a>
              <a href="#instagram">📷</a>
              <a href="#twitter">𝕏</a>
              <a href="#linkedin">in</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="modal-overlay" onClick={() => setSelectedAppointment(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Appointment Details</h3>
              <button className="modal-close" onClick={() => setSelectedAppointment(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-detail-row">
                <strong>Appointment:</strong>
                <span>{selectedAppointment.title}</span>
              </div>
              <div className="modal-detail-row">
                <strong>Doctor:</strong>
                <span>{selectedAppointment.doctor}</span>
              </div>
              <div className="modal-detail-row">
                <strong>Specialty:</strong>
                <span>{selectedAppointment.specialty}</span>
              </div>
              <div className="modal-detail-row">
                <strong>Date & Time:</strong>
                <span>{formatDate(selectedAppointment.date)} at {formatTime(selectedAppointment.date)}</span>
              </div>
              <div className="modal-detail-row">
                <strong>Location:</strong>
                <span>{selectedAppointment.branch} - Room {selectedAppointment.room}</span>
              </div>
              <div className="modal-detail-row">
                <strong>Status:</strong>
                <span className="status-badge-confirmed">{selectedAppointment.status}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => alert('Reschedule')}>
                Reschedule
              </button>
              <button className="btn-danger" onClick={() => alert('Cancel')}>
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Help Button */}
      <button className="fixed-help-btn" onClick={() => navigate('/patient/help')}>
        <span className="help-icon">❓</span>
        <span className="help-text">Help</span>
      </button>
    </div>
  )
}
