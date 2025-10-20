// src/pages/patient/PatientDashboard.js - Professional Patient Portal
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import dashboardService from '../../services/dashboardService'
import appointmentService from '../../services/appointmentService'
import patientService from '../../services/patientService'
import billingService from '../../services/billingService'
import authService from '../../services/authService'
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
  const [error, setError] = useState(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  
  // Get patient ID from auth service
  const currentUser = authService.getCurrentUser();
  const patientId = currentUser?.patientId || localStorage.getItem('patientId') || sessionStorage.getItem('patientId');
  
  // If no patient ID, redirect to login
  useEffect(() => {
    if (!patientId) {
      console.warn('⚠️ No patient ID found, redirecting to login');
      navigate('/patient-login');
    }
  }, [patientId, navigate]);
  
  const [data, setData] = useState({
    patient: { 
      name: 'Loading...',
      email: '',
      phone: '',
      patientId: '',
      bloodType: ''
    },
    appointments: [],
    prescriptions: [],
    finance: { balance: 0 },
    healthMetrics: {
      lastCheckup: '',
      bloodPressure: '',
      weight: '',
      height: ''
    }
  })

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('📊 Fetching dashboard data for patient ID:', patientId);
      
      // Fetch patient dashboard data from backend
      const dashboardData = await dashboardService.getPatientDashboardData(patientId)
      
      console.log('✅ Dashboard data received:', dashboardData);
      console.log('📅 Appointments count:', dashboardData.appointments?.length || 0);
      
      // Format patient data
      const patient = dashboardData.patient || {}
      const formattedPatient = {
        name: patient.full_name || patient.name || 'Patient',
        email: patient.email || 'N/A',
        phone: patient.contact_num || patient.phone || 'N/A',
        patientId: `P-${patient.patient_id || patientId}`,
        bloodType: patient.blood_group || patient.bloodType || 'N/A'
      }
      
      // Format appointments
      const appointments = (dashboardData.appointments || []).map(appt => {
        // Backend returns available_date and start_time from time_slot table
        const appointmentDate = appt.available_date || appt.appointment_date;
        const appointmentTime = appt.start_time || '00:00:00';
        
        // Combine date and time into a single Date object
        let fullDate;
        if (appointmentDate) {
          const dateStr = appointmentDate.split('T')[0]; // Get YYYY-MM-DD
          fullDate = new Date(`${dateStr}T${appointmentTime}`);
        } else {
          fullDate = new Date();
        }
        
        return {
          id: appt.appointment_id,
          title: appt.specialty || 'Consultation',
          doctor: appt.doctor_name || 'Doctor',
          specialty: appt.specialty || 'General',
          date: fullDate,
          time: appointmentTime,
          branch: appt.branch_name || 'Main',
          room: appt.room_number || 'TBD',
          status: appt.status || 'Scheduled'
        };
      })
      
      // Format prescriptions - handle new API structure
      let prescriptions = [];
      const prescriptionData = dashboardData.prescriptions || {};
      
      // Check if it's the new format with consultations_with_prescriptions
      if (prescriptionData.consultations_with_prescriptions && Array.isArray(prescriptionData.consultations_with_prescriptions)) {
        // Flatten medications from all consultations
        prescriptions = prescriptionData.consultations_with_prescriptions.flatMap(consultation => {
          const medications = consultation.medications || [];
          return medications.map(med => ({
            id: med.prescription_item_id || med.id,
            name: med.medication_name || 'Medication',
            dosage: med.dosage || 'As prescribed',
            refills: 0, // Not in current schema
            doctor: consultation.doctor_name || 'Doctor'
          }));
        });
      } else if (Array.isArray(prescriptionData)) {
        // Handle old format if it's directly an array
        prescriptions = prescriptionData.map(rx => ({
          id: rx.prescription_id,
          name: rx.medication_name || 'Medication',
          dosage: rx.dosage || 'As prescribed',
          refills: rx.refills_remaining || 0,
          doctor: rx.prescribed_by || 'Doctor'
        }));
      }
      
      // Get health metrics from patient record
      const healthMetrics = {
        lastCheckup: patient.last_checkup_date || 'N/A',
        bloodPressure: patient.blood_pressure || 'N/A',
        weight: patient.weight ? `${patient.weight} kg` : 'N/A',
        height: patient.height ? `${patient.height} cm` : 'N/A'
      }
      
      setData({
        patient: formattedPatient,
        appointments,
        prescriptions,
        finance: dashboardData.finance || { balance: 0 },
        healthMetrics
      })
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Calculate upcoming appointments - MUST be before conditional returns (Hooks rules)
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of today for proper comparison
    
    console.log('🔍 Filtering appointments:', {
      totalAppointments: data.appointments.length,
      currentDate: now,
      appointments: data.appointments.map(appt => ({
        date: appt.date,
        doctor: appt.doctor,
        isFuture: appt.date >= now
      }))
    });
    
    const filtered = data.appointments
      .filter(appt => {
        const apptDate = new Date(appt.date);
        apptDate.setHours(0, 0, 0, 0);
        return apptDate >= now && appt.status !== 'Cancelled' && appt.status !== 'Completed';
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
      
    console.log('✅ Upcoming appointments found:', filtered.length);
    
    return filtered;
  }, [data.appointments])

  if (error) {
    return (
      <div style={{padding: '20px', textAlign: 'center'}}>
        <div style={{fontSize: '48px', marginBottom: '20px'}}>⚠️</div>
        <h2 style={{color: 'var(--accent-red)'}}>Error Loading Dashboard</h2>
        <p style={{color: '#64748b', marginBottom: '20px'}}>{error}</p>
        <button className="btn-primary" onClick={fetchDashboardData}>Retry</button>
      </div>
    )
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      authService.logout(); // ✅ Clean all localStorage and sessionStorage
      navigate('/'); // ✅ Redirect to landing page
    }
  }

  return (
    <div className="patient-portal">
      {/* Top Navigation Bar */}
      <nav className="patient-top-nav">
        <div className="patient-top-nav-content">
          <div className="patient-nav-links">
            <a onClick={() => navigate('/patient/dashboard')} style={{cursor: 'pointer'}}>Home</a>
            <a onClick={() => navigate('/patient/appointments')} style={{cursor: 'pointer'}}>Appointments</a>
            <a onClick={() => navigate('/patient/records')} style={{cursor: 'pointer'}}>Medical Records</a>
            <a onClick={() => navigate('/patient/insurance')} style={{cursor: 'pointer'}}>Insurance</a>
            <a onClick={() => navigate('/patient/billing')} style={{cursor: 'pointer'}}>Billing</a>
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
                  <h4 className="action-title">Bills</h4>
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

              <button className="quick-action-card insurance-action" onClick={() => navigate('/patient/insurance')}>
                <div className="action-icon-wrapper">
                  <span className="action-icon">💼</span>
                </div>
                <div className="action-content">
                  <h4 className="action-title">Insurance</h4>
                  <p className="action-description">View coverage details</p>
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
                  <div className="empty-appointments-card">
                    <div className="empty-appointments-graphic">
                      <div className="calendar-illustration">
                        <div className="calendar-header"></div>
                        <div className="calendar-body">
                          <div className="calendar-date">📅</div>
                        </div>
                      </div>
                    </div>
                    <h3 className="empty-title">Appointments</h3>
                    <p className="empty-description">
                      You don't have any scheduled appointments at the moment. 
                      Book a consultation with our experienced doctors.
                    </p>
                    <div className="empty-actions">
                      <button className="btn-primary-large" onClick={() => navigate('/patient/book')}>
                        📅 Book New Appointment
                      </button>
                      <button className="btn-secondary-outline" onClick={() => navigate('/patient/appointments')}>
                        📋 View All Appointments
                      </button>
                    </div>
                    <div className="quick-info-grid">
                      <div className="quick-info-item">
                        <span className="info-icon">🏥</span>
                        <span className="info-text">Multiple Specialties</span>
                      </div>
                      <div className="quick-info-item">
                        <span className="info-icon">⚡</span>
                        <span className="info-text">Quick Booking</span>
                      </div>
                      <div className="quick-info-item">
                        <span className="info-icon">👨‍⚕️</span>
                        <span className="info-text">Expert Doctors</span>
                      </div>
                    </div>
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
            {/* <div className="dashboard-card health-card">
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
            </div> */}

            {/* Important Notices */}
            {/* <div className="dashboard-card notices-card">
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
            </div> */}
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
