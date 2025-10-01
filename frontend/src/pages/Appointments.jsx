import { useMemo, useState } from 'react'
import ViewToggle from '../components/appointments/ViewToggle.jsx'
import SearchBar from '../components/appointments/SearchBar.jsx'
import FilterSidebar from '../components/appointments/FilterSidebar.jsx'
import AppointmentCard from '../components/appointments/AppointmentCard.jsx'
import AppointmentCalendar from '../components/appointments/AppointmentCalendar.jsx'
import BulkActions from '../components/appointments/BulkActions.jsx'
import PaginationControls from '../components/appointments/PaginationControls.jsx'
import styles from '../components/appointments/AppointmentsPage.module.css'

const MOCK = [
  { id: 'a1', doctor: 'Dr. Priya Patel', creds: 'MBBS, MS', specialty: 'Orthopedics', branch: 'Galle', status: 'Scheduled', type: 'Procedure', date: '2024-01-20', time: '11:30', durationMin: 60, notes: 'Knee examination and treatment' },
  { id: 'a2', doctor: 'Dr. James Wilson', creds: 'MD, FRCS', specialty: 'Surgery', branch: 'Colombo', status: 'Scheduled', type: 'Consultation', date: '2024-01-18', time: '10:00', durationMin: 30, notes: 'Regular checkup appointment' },
  { id: 'a3', doctor: 'Dr. Michael Chen', creds: 'MD, PhD', specialty: 'Neurology', branch: 'Kandy', status: 'Completed', type: 'Follow-up', date: '2024-01-15', time: '14:00', durationMin: 45, notes: 'Post-surgery follow-up' },
  { id: 'a4', doctor: 'Dr. Sarah Johnson', creds: 'MD, MBBS', specialty: 'Cardiology', branch: 'Colombo', status: 'Cancelled', type: 'Consultation', date: '2024-01-12', time: '09:00', durationMin: 30, notes: 'Cancelled due to emergency' },
]

export default function Appointments() {
  const [view, setView] = useState('list')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ status: '', doctor: '', branch: '', type: '', from: '', to: '' })
  const [selected, setSelected] = useState([])
  const [page, setPage] = useState(1)
  const pageSize = 3

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return MOCK.filter(a =>
      (!term || a.doctor.toLowerCase().includes(term) || a.notes.toLowerCase().includes(term)) &&
      (!filters.status || a.status === filters.status) &&
      (!filters.doctor || a.doctor === filters.doctor) &&
      (!filters.branch || a.branch === filters.branch) &&
      (!filters.type || a.type === filters.type) &&
      (!filters.from || a.date >= filters.from) &&
      (!filters.to || a.date <= filters.to)
    )
  }, [query, filters])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page])

  function toggleSelect(id) {
    setSelected((s) => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  function selectAll(ids) { setSelected(ids) }
  function clearSelection() { setSelected([]) }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2>My Appointments</h2>
          <p className="muted">Manage and track all your medical appointments</p>
        </div>
        <ViewToggle value={view} onChange={setView} />
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <FilterSidebar
            filters={filters}
            onChange={(partial) => { setPage(1); setFilters((f) => ({ ...f, ...partial })) }}
            onClear={() => { setPage(1); setFilters({ status: '', doctor: '', branch: '', type: '', from: '', to: '' }) }}
          />
        </aside>
        <main className={styles.main}>
          <div className={styles.toolbar}>
            <SearchBar value={query} onChange={(v) => { setPage(1); setQuery(v) }} />
            <BulkActions
              total={filtered.length}
              selectedIds={selected}
              onSelectAll={() => selectAll(paged.map(a => a.id))}
              onClear={clearSelection}
              onCancel={() => alert('Cancel ' + selected.length + ' appointments')}
              onReschedule={() => alert('Reschedule ' + selected.length + ' appointments')}
            />
          </div>

          {view === 'list' ? (
            <div className={styles.list}>
              {paged.map(a => (
                <AppointmentCard key={a.id} data={a} selected={selected.includes(a.id)} onSelect={() => toggleSelect(a.id)}
                  onView={() => alert('View details for ' + a.id)} onCancel={() => alert('Cancel ' + a.id)} onReschedule={() => alert('Reschedule ' + a.id)} />
              ))}
              {filtered.length > pageSize && (
                <PaginationControls page={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
              )}
            </div>
          ) : (
            <AppointmentCalendar appointments={filtered} onSelect={(id) => alert('Open ' + id)} />
          )}
        </main>
      </div>
    </div>
  )
}


