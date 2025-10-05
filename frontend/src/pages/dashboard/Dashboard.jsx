import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import './dashboard.css'
import DashboardWidget from './DashboardWidget.jsx'
import AppointmentCard from './AppointmentCard.jsx'
import ActivityTimeline from './ActivityTimeline.jsx'
import FinancialSummary from './FinancialSummary.jsx'
import QuickActions from './QuickActions.jsx'
import HealthMetrics from './HealthMetrics.jsx'
import NotificationBell from './NotificationBell.jsx'

function formatDate(date) {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

function formatTime(date) {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [branch, setBranch] = useState('Main Branch')
  const [unread, setUnread] = useState(3)
  const [refreshing, setRefreshing] = useState(false)
  const [showBalanceBanner, setShowBalanceBanner] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const refreshTimerRef = useRef(null)
  
  const [data, setData] = useState({
    patient: { 
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '(555) 123-4567',
      age: 35,
      bloodType: 'A+',
      allergies: ['Penicillin', 'Peanuts']
    },
    appointments: [],
    activities: [],
    finance: { 
      balance: 245, 
      recentPayments: [
        { id: 'p1', date: '2024-12-01', amount: 120, method: 'Credit Card' },
        { id: 'p2', date: '2024-11-15', amount: 85, method: 'Insurance' }
      ],
      upcomingBills: [
        { id: 'b1', dueDate: '2024-12-15', amount: 150, description: 'Lab Tests' }
      ]
    },
    metrics: { 
      steps: 8400, 
      stepsGoal: 10000, 
      sleepHours: 6.8, 
      heartRate: 72,
      weight: 165,
      bmi: 23.5
    },
    announcements: [
      { id: 'a1', branch: 'All', title: 'New Telehealth Services', body: 'Virtual consultations now available at all branches', level: 'info', date: new Date() },
      { id: 'a2', branch: 'Main Branch', title: 'Holiday Hours Update', body: 'Modified hours during holiday season', level: 'warning', date: new Date() },
    ],
    prescriptions: [
      { id: 'rx1', name: 'Lisinopril 10mg', refillsLeft: 2, lastFilled: '2024-11-20', nextRefill: '2024-12-20' },
      { id: 'rx2', name: 'Metformin 500mg', refillsLeft: 0, lastFilled: '2024-10-15', nextRefill: 'Expired' }
    ]
  })

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const now = new Date()
      const sampleAppointments = [
        { 
          id: 'appt1', 
          title: 'Annual Checkup', 
          doctor: 'Dr. Sarah Johnson', 
          specialty: 'Family Medicine',
          branch: 'Main Branch', 
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 10, 30), 
          status: 'scheduled',
          duration: 30,
          room: 'Room 205'
        },
        { 
          id: 'appt2', 
          title: 'Follow-up Consultation', 
          doctor: 'Dr. Michael Chen', 
          specialty: 'Cardiology',
          branch: 'Downtown Branch', 
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 14, 15), 
          status: 'scheduled',
          duration: 45,
          room: 'Room 301'
        },
        { 
          id: 'appt3', 
          title: 'Dental Cleaning', 
          doctor: 'Dr. Patel', 
          specialty: 'Dentistry',
          branch: 'Main Branch', 
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 9, 9, 0), 
          status: 'scheduled',
          duration: 60,
          room: 'Room 102'
        },
      ]
      
      const sampleActivities = [
        { 
          id: 'act1', 
          title: 'Lab Results Available', 
          detail: 'Blood work completed - All values within normal range', 
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3),
          type: 'lab',
          priority: 'high'
        },
        { 
          id: 'act2', 
          title: 'Prescription Refilled', 
          detail: 'Medication pickup ready at Main Branch pharmacy', 
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
          type: 'prescription',
          priority: 'normal'
        },
        { 
          id: 'act3', 
          title: 'Appointment Completed', 
          detail: 'Consultation with Dr. Smith - Follow-up scheduled', 
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8),
          type: 'appointment',
          priority: 'normal'
        },
        { 
          id: 'act4', 
          title: 'Insurance Claim Processed', 
          detail: 'Claim #12345 approved - $320 covered', 
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 12),
          type: 'insurance',
          priority: 'low'
        },
      ]
      
      setData(d => ({ 
        ...d, 
        appointments: sampleAppointments, 
        activities: sampleActivities 
      }))
      setLastRefresh(new Date())
      setRefreshing(false)
      setLoading(false)
    } catch (e) {
      setError('Failed to load dashboard data. Please try again.')
      setRefreshing(false)
      setLoading(false)
    }
  }, [])

  // Initial data load
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      fetchDashboardData()
    }, 300000) // 5 minutes
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [fetchDashboardData])

  // Manual refresh
  const handleRefresh = useCallback(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Appointment actions
  const handleCancelAppointment = useCallback((appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      setData(d => ({
        ...d,
        appointments: d.appointments.filter(a => a.id !== appointmentId)
      }))
      setShowAppointmentModal(false)
      alert('Appointment cancelled successfully')
    }
  }, [])

  const handleRescheduleAppointment = useCallback((appointmentId) => {
    alert(`Reschedule appointment ${appointmentId} - Opening booking interface...`)
    setShowAppointmentModal(false)
  }, [])

  const handleViewAppointmentDetails = useCallback((appointment) => {
    setSelectedAppointment(appointment)
    setShowAppointmentModal(true)
  }, [])

  // Filter and sort appointments
  const upcomingAppointments = useMemo(() => {
    const now = new Date()
    return data.appointments
      .filter(appt => appt.date > now)
      .sort((a, b) => a.date - b.date)
      .slice(0, 3)
  }, [data.appointments])

  // Calculate appointment statistics
  const appointmentStats = useMemo(() => {
    const now = new Date()
    const upcoming = data.appointments.filter(a => a.date > now).length
    const thisWeek = data.appointments.filter(a => {
      const diff = a.date - now
      return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000
    }).length
    return { upcoming, thisWeek }
  }, [data.appointments])

  // Check for urgent items
  const urgentItems = useMemo(() => {
    const urgent = []
    
    // Check overdue bills
    const now = new Date()
    data.finance.upcomingBills?.forEach(bill => {
      const dueDate = new Date(bill.dueDate)
      if (dueDate < now) {
        urgent.push({ type: 'bill', message: `Overdue bill: ${bill.description}`, priority: 'high' })
      }
    })
    
    // Check prescription refills
    data.prescriptions?.forEach(rx => {
      if (rx.refillsLeft === 0) {
        urgent.push({ type: 'prescription', message: `${rx.name} needs refill`, priority: 'high' })
      }
    })
    
    // Check upcoming appointments
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    data.appointments.forEach(appt => {
      if (appt.date < tomorrow && appt.date > now) {
        urgent.push({ type: 'appointment', message: `Appointment tomorrow: ${appt.title}`, priority: 'medium' })
      }
    })
    
    return urgent
  }, [data.finance.upcomingBills, data.prescriptions, data.appointments])

  const now = useMemo(() => new Date(), [lastRefresh])
  const currentDateStr = formatDate(now)
  const timeOfDay = getTimeOfDay()

  const filteredAnnouncements = useMemo(() =>
    data.announcements.filter(a => a.branch === 'All' || a.branch === branch), [data.announcements, branch])

  // Calculate time since last refresh
  const timeSinceRefresh = useMemo(() => {
    const diff = Math.floor((now - lastRefresh) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }, [now, lastRefresh])

  return (
    <div className="dashboard-root">
      <header className="dashboard-header">
        <div>
          <h1>Good {timeOfDay}, {data.patient.name.split(' ')[0]}!</h1>
          <p className="muted">
            {currentDateStr} • {appointmentStats.upcoming} upcoming appointments
            {appointmentStats.thisWeek > 0 && ` • ${appointmentStats.thisWeek} this week`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <button 
            className="btn-outline" 
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh dashboard"
            style={{ padding: '8px 12px' }}
          >
            {refreshing ? '⟳' : '↻'} {timeSinceRefresh}
          </button>
          <select 
            value={branch} 
            onChange={(e) => setBranch(e.target.value)}
            className="btn-outline"
            style={{ padding: '8px 12px', cursor: 'pointer' }}
          >
            <option value="Main Branch">Main Branch</option>
            <option value="Downtown Branch">Downtown Branch</option>
            <option value="West Side Branch">West Side Branch</option>
          </select>
          <NotificationBell count={unread} onOpen={() => setUnread(0)} />
        </div>
      </header>

      {/* Urgent Alerts */}
      {urgentItems.length > 0 && (
        <div className="banner banner-warning" role="alert">
          <div className="badge badge-warn">!</div>
          <div className="banner-content">
            <strong>Action Required</strong>
            <span>{urgentItems[0].message}</span>
          </div>
          <button className="btn-link" onClick={() => alert('View all urgent items')}>
            View All ({urgentItems.length})
          </button>
        </div>
      )}

      {error && (
        <div className="banner banner-error" role="alert">
          <div className="badge badge-danger">✕</div>
          <div className="banner-content">
            <strong>Error</strong>
            <span>{error}</span>
          </div>
          <button className="btn-link" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}
      
      {!error && showBalanceBanner && data.finance.balance > 0 && (
        <div className="banner banner-warning">
          <div className="badge badge-danger">!</div>
          <div className="banner-content">
            <strong>Outstanding Balance</strong>
            <span>You have an outstanding balance of ${data.finance.balance.toFixed(2)}. Please settle your account.</span>
          </div>
          <button className="btn-link" onClick={() => setShowBalanceBanner(false)}>Dismiss</button>
        </div>
      )}

      <main className={`dashboard-grid ${loading ? 'is-loading' : ''}`}>
        {/* Upcoming Appointments */}
        <DashboardWidget title="Upcoming Appointments" className="grid-span-2">
          <div className="stack-3">
            {loading && <div className="skeleton h-20" />}
            {!loading && upcomingAppointments.length === 0 && (
              <div className="notice notice-info">
                <p>No upcoming appointments scheduled.</p>
                <button className="btn-primary" style={{ marginTop: 'var(--space-2)' }}>
                  Schedule Appointment
                </button>
              </div>
            )}
            {!loading && upcomingAppointments.map(appt => (
              <div 
                key={appt.id} 
                onClick={() => handleViewAppointmentDetails(appt)}
                style={{ cursor: 'pointer' }}
              >
                <AppointmentCard appt={appt} />
              </div>
            ))}
            {!loading && data.appointments.length > 3 && (
              <p className="muted tiny" style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}>
                +{data.appointments.length - 3} more appointments
              </p>
            )}
            <div className="actions-row">
              <button className="btn-primary" onClick={() => alert('Opening booking interface...')}>
                Book Appointment
              </button>
              <button className="btn-outline" onClick={() => alert('Opening records viewer...')}>
                View All Appointments
              </button>
            </div>
          </div>
        </DashboardWidget>

        {/* Insurance Status */}
        <DashboardWidget title="Insurance Status">
          <div className="stack-3">
            <div className="card tone-success">
              <div className="badge badge-success" aria-hidden>✓</div>
              <div>
                <div className="card-title">Primary Insurance</div>
                <div className="muted">BlueCross BlueShield • Active</div>
              </div>
              <div className="muted text-right">
                <div className="tiny">Valid until</div>
                <div>Dec 2025</div>
              </div>
            </div>
            <div className="card tone-warning">
              <div className="badge badge-warn" aria-hidden>!</div>
              <div>
                <div className="card-title">Secondary Insurance</div>
                <div className="muted">Dental Coverage • Expiring Soon</div>
              </div>
              <div className="muted text-right">
                <div className="tiny">Expires</div>
                <div>Jan 31</div>
              </div>
            </div>
            <button 
              className="btn-outline" 
              onClick={() => alert('Opening insurance management...')}
              style={{ marginTop: 'var(--space-2)' }}
            >
              Manage Insurance
            </button>
          </div>
        </DashboardWidget>

        {/* Prescriptions */}
        <DashboardWidget title="Active Prescriptions">
          <div className="stack-2">
            {data.prescriptions?.map(rx => (
              <div key={rx.id} className={`card ${rx.refillsLeft === 0 ? 'tone-warning' : ''}`}>
                <div className={`badge ${rx.refillsLeft === 0 ? 'badge-warn' : 'badge-success'}`}>
                  {rx.refillsLeft === 0 ? '!' : '✓'}
                </div>
                <div>
                  <div className="card-title">{rx.name}</div>
                  <div className="muted tiny">
                    {rx.refillsLeft > 0 ? `${rx.refillsLeft} refills left` : 'Refill needed'}
                  </div>
                </div>
                <div className="text-right">
                  <button 
                    className="btn-outline" 
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                    onClick={() => alert(`Request refill for ${rx.name}`)}
                  >
                    {rx.refillsLeft === 0 ? 'Request' : 'Refill'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DashboardWidget>

        {/* Branch Announcements */}
        <DashboardWidget title={`${branch} Announcements`}>
          <div className="stack-2">
            {filteredAnnouncements.length === 0 ? (
              <p className="muted">No announcements at this time.</p>
            ) : (
              filteredAnnouncements.map(a => (
                <div key={a.id} className={`notice notice-${a.level}`}> 
                  <div className="notice-title">{a.title}</div>
                  <div className="muted tiny">{a.body}</div>
                </div>
              ))
            )}
            <button 
              className="btn-outline" 
              onClick={() => alert('View all announcements...')}
              style={{ marginTop: 'var(--space-2)', width: '100%' }}
            >
              View All Announcements
            </button>
          </div>
        </DashboardWidget>

        {/* Recent Medical Activity */}
        <DashboardWidget title="Recent Medical Activity" className="grid-span-3">
          {loading ? (
            <div className="skeleton h-40" />
          ) : (
            <>
              <ActivityTimeline items={data.activities.slice(0, 5)} />
              {data.activities.length > 5 && (
                <button 
                  className="btn-outline" 
                  onClick={() => alert('View all activity...')}
                  style={{ marginTop: 'var(--space-3)', width: '100%' }}
                >
                  View All Activity ({data.activities.length} total)
                </button>
              )}
            </>
          )}
        </DashboardWidget>

        {/* Financial Summary */}
        <DashboardWidget title="Financial Summary">
          <FinancialSummary 
            balance={data.finance.balance} 
            payments={data.finance.recentPayments}
            upcomingBills={data.finance.upcomingBills}
          />
          <button 
            className="btn-primary" 
            onClick={() => alert('Opening billing page...')}
            style={{ marginTop: 'var(--space-3)', width: '100%' }}
          >
            View Billing Details
          </button>
        </DashboardWidget>

        {/* Quick Actions */}
        <DashboardWidget title="Quick Actions">
          <QuickActions onAction={(action) => {
            console.log('Quick action:', action)
            alert(`Action: ${action}`)
          }} />
        </DashboardWidget>

        {/* Health Metrics */}
        <DashboardWidget title="Health Metrics" className="grid-span-2">
          <HealthMetrics metrics={data.metrics} />
          <button 
            className="btn-outline" 
            onClick={() => alert('Opening health tracking...')}
            style={{ marginTop: 'var(--space-3)', width: '100%' }}
          >
            View Detailed Health Stats
          </button>
        </DashboardWidget>
      </main>

      {/* Appointment Details Modal */}
      {showAppointmentModal && selectedAppointment && (
        <div className="modal" onClick={() => setShowAppointmentModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{selectedAppointment.title}</h2>
            
            <div className="stack-3" style={{ marginTop: 'var(--space-4)' }}>
              <div>
                <div className="muted tiny">Doctor</div>
                <div className="strong">{selectedAppointment.doctor}</div>
                <div className="muted tiny">{selectedAppointment.specialty}</div>
              </div>
              
              <div>
                <div className="muted tiny">Date & Time</div>
                <div className="strong">
                  {formatDate(selectedAppointment.date)} at {formatTime(selectedAppointment.date)}
                </div>
                <div className="muted tiny">Duration: {selectedAppointment.duration} minutes</div>
              </div>
              
              <div>
                <div className="muted tiny">Location</div>
                <div className="strong">{selectedAppointment.branch}</div>
                <div className="muted tiny">{selectedAppointment.room}</div>
              </div>
              
              <div className="stat-row">
                <div>
                  <div className="muted tiny">Status</div>
                  <span className={`badge-${selectedAppointment.status}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                    {selectedAppointment.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="actions-row" style={{ marginTop: 'var(--space-5)' }}>
              <button 
                className="btn-outline" 
                onClick={() => handleRescheduleAppointment(selectedAppointment.id)}
              >
                Reschedule
              </button>
              <button 
                className="btn-outline" 
                onClick={() => handleCancelAppointment(selectedAppointment.id)}
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={() => setShowAppointmentModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



