import { useEffect, useMemo, useState } from 'react'
import '../dashboard.css'
import DashboardWidget from '../components/DashboardWidget.jsx'
import AppointmentCard from '../components/AppointmentCard.jsx'
import ActivityTimeline from '../components/ActivityTimeline.jsx'
import FinancialSummary from '../components/FinancialSummary.jsx'
import QuickActions from '../components/QuickActions.jsx'
import HealthMetrics from '../components/HealthMetrics.jsx'
import NotificationBell from '../components/NotificationBell.jsx'

function formatDate(date) {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [branch, setBranch] = useState('Main Branch')
  const [unread, setUnread] = useState(3)
  const [data, setData] = useState({
    patient: { name: 'John Doe' },
    appointments: [],
    activities: [],
    finance: { balance: 245, recentPayments: [{ id: 'p1', date: '2024-12-01', amount: 120 }] },
    metrics: { steps: 8400, stepsGoal: 10000, sleepHours: 6.8, heartRate: 72 },
    announcements: [
      { id: 'a1', branch: 'All', title: 'New Telehealth Services', body: 'Virtual consultations now available at all branches', level: 'info' },
      { id: 'a2', branch: 'Main Branch', title: 'Holiday Hours Update', body: 'Modified hours during holiday season', level: 'warning' },
    ],
  })

  // Simulate fetch with loading/error
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    const timer = setTimeout(() => {
      if (cancelled) return
      try {
        const now = new Date()
        const sampleAppointments = [
          { id: 'appt1', title: 'Annual Checkup', doctor: 'Dr. Sarah Johnson', branch: 'Main Branch', date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 10, 30), status: 'scheduled' },
          { id: 'appt2', title: 'Follow-up', doctor: 'Dr. Michael Chen', branch: 'Downtown Branch', date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 14, 15), status: 'scheduled' },
          { id: 'appt3', title: 'Dental Cleaning', doctor: 'Dr. Patel', branch: 'Main Branch', date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 9, 9, 0), status: 'scheduled' },
        ]
        const sampleActivities = [
          { id: 'act1', title: 'Lab Results Available', detail: 'Blood work completed', date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3) },
          { id: 'act2', title: 'Prescription Refilled', detail: 'Medication pickup ready', date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5) },
          { id: 'act3', title: 'Appointment Completed', detail: 'Consultation with Dr. Smith', date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8) },
        ]
        setData(d => ({ ...d, appointments: sampleAppointments, activities: sampleActivities }))
        setLoading(false)
      } catch (e) {
        setError('Failed to load dashboard data')
        setLoading(false)
      }
    }, 700)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  // Auto-refresh appointments (mock realtime)
  useEffect(() => {
    const interval = setInterval(() => {
      setData(d => {
        if (d.appointments.length === 0) return d
        const shuffled = [...d.appointments]
        shuffled.sort((a, b) => Math.random() - 0.5)
        return { ...d, appointments: shuffled }
      })
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const now = new Date()
  const currentDateStr = formatDate(now)

  const filteredAnnouncements = useMemo(() =>
    data.announcements.filter(a => a.branch === 'All' || a.branch === branch), [data.announcements, branch])

  return (
    <div className="dashboard-root">
      <header className="dashboard-header">
        <div>
          <h1>Patient Dashboard</h1>
          <p className="muted">Welcome back, <strong>{data.patient.name}</strong> • {currentDateStr}</p>
        </div>
        <NotificationBell count={unread} onOpen={() => setUnread(0)} />
      </header>

      {error && <div className="banner banner-error" role="alert">{error}</div>}
      {!error && (
        <div className="banner banner-warning">
          <div className="badge badge-danger">!</div>
          <div className="banner-content">
            <strong>Outstanding Balance</strong>
            <span>You have an outstanding balance of ${data.finance.balance.toFixed(2)}. Please settle your account.</span>
          </div>
          <button className="btn-link" onClick={() => setData(d => ({ ...d, finance: { ...d.finance, balance: 0 } }))}>Dismiss</button>
        </div>
      )}

      <main className={`dashboard-grid ${loading ? 'is-loading' : ''}`}>
        <DashboardWidget title="Upcoming Appointments" className="grid-span-2">
          <div className="stack-3">
            {loading && <div className="skeleton h-20" />}
            {!loading && data.appointments.slice(0, 3).map(appt => (
              <AppointmentCard key={appt.id} appt={appt} />
            ))}
            <div className="actions-row">
              <button className="btn-primary" onClick={() => alert('Open booking modal')}>Book Appointment</button>
              <button className="btn-outline" onClick={() => alert('Open records viewer')}>View Records</button>
            </div>
          </div>
        </DashboardWidget>

        <DashboardWidget title="Insurance Status">
          <div className="stack-3">
            <div className="card tone-success">
              <div className="badge badge-success" aria-hidden>✓</div>
              <div>
                <div className="card-title">Primary Insurance</div>
                <div className="muted">BlueCross BlueShield • Active</div>
              </div>
              <div className="muted text-right">Valid until Dec 2024</div>
            </div>
            <div className="card tone-warning">
              <div className="badge badge-warn" aria-hidden>!</div>
              <div>
                <div className="card-title">Secondary Insurance</div>
                <div className="muted">Dental Coverage • Expiring Soon</div>
              </div>
              <div className="muted text-right">Expires Jan 31</div>
            </div>
          </div>
        </DashboardWidget>

        <DashboardWidget title="Branch Announcements">
          <div className="stack-2">
            {filteredAnnouncements.map(a => (
              <div key={a.id} className={`notice notice-${a.level}`}> 
                <div className="notice-title">{a.title}</div>
                <div className="muted">{a.body}</div>
              </div>
            ))}
          </div>
        </DashboardWidget>

        <DashboardWidget title="Recent Medical Activity" className="grid-span-3">
          {loading ? <div className="skeleton h-40" /> : <ActivityTimeline items={data.activities.slice(0, 5)} />}
        </DashboardWidget>

        <DashboardWidget title="Financial Summary">
          <FinancialSummary balance={data.finance.balance} payments={data.finance.recentPayments} />
        </DashboardWidget>

        <DashboardWidget title="Quick Actions">
          <QuickActions onAction={(a) => alert(a)} />
        </DashboardWidget>

        <DashboardWidget title="Health Metrics" className="grid-span-2">
          <HealthMetrics metrics={data.metrics} />
        </DashboardWidget>
      </main>
    </div>
  )
}



