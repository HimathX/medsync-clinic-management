import { useMemo, useState } from 'react'
import AppointmentCard from './AppointmentCard.jsx'
import './Appointments.css'

const MOCK = [
  { id: 'a1', doctor: 'Dr. Priya Patel', creds: 'MBBS, MS', specialty: 'Orthopedics', branch: 'Galle', status: 'Scheduled', type: 'Procedure', date: '2024-01-20', time: '11:30', durationMin: 60, notes: 'Knee examination and treatment' },
  { id: 'a2', doctor: 'Dr. James Wilson', creds: 'MD, FRCS', specialty: 'Surgery', branch: 'Colombo', status: 'Scheduled', type: 'Consultation', date: '2024-01-18', time: '10:00', durationMin: 30, notes: 'Regular checkup appointment' },
  { id: 'a3', doctor: 'Dr. Michael Chen', creds: 'MD, PhD', specialty: 'Neurology', branch: 'Kandy', status: 'Completed', type: 'Follow-up', date: '2024-01-15', time: '14:00', durationMin: 45, notes: 'Post-surgery follow-up' },
  { id: 'a4', doctor: 'Dr. Sarah Johnson', creds: 'MD, MBBS', specialty: 'Cardiology', branch: 'Colombo', status: 'Cancelled', type: 'Consultation', date: '2024-01-12', time: '09:00', durationMin: 30, notes: 'Cancelled due to emergency' },
]

// ============================================
// INTERNAL COMPONENTS
// ============================================

// View Toggle Component
function ViewToggle({ value, onChange }) {
  return (
    <div className="view-toggle">
      <button 
        className={`view-toggle-btn ${value === 'list' ? 'active' : ''}`} 
        onClick={() => onChange('list')}
      >
        List View
      </button>
      <button 
        className={`view-toggle-btn ${value === 'calendar' ? 'active' : ''}`} 
        onClick={() => onChange('calendar')}
      >
        Calendar View
      </button>
    </div>
  )
}

// Search Bar Component
function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <input 
        className="search-input" 
        placeholder="Search appointments..." 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
    </div>
  )
}

// Filter Sidebar Component
function FilterSidebar({ filters, onChange, onClear }) {
  const [open, setOpen] = useState({ 
    date: true, 
    status: true, 
    doctor: true, 
    branch: true, 
    type: true 
  })
  
  const doctors = useMemo(() => [
    'Dr. Priya Patel',
    'Dr. James Wilson',
    'Dr. Michael Chen',
    'Dr. Sarah Johnson'
  ], [])
  
  const branches = useMemo(() => ['Colombo', 'Galle', 'Kandy'], [])
  const types = useMemo(() => ['Consultation', 'Follow-up', 'Procedure'], [])

  function Section({ id, title, children }) {
    return (
      <div className="filter-section">
        <button 
          className="filter-section-header" 
          onClick={() => setOpen(o => ({ ...o, [id]: !o[id] }))}
        >
          <span>{title}</span>
          <span className="chevron">{open[id] ? '▾' : '▸'}</span>
        </button>
        {open[id] && <div className="filter-section-body">{children}</div>}
      </div>
    )
  }

  return (
    <div className="filter-sidebar">
      <div className="filter-header">
        <h4>Filters</h4>
        <button className="clear-filters-btn" onClick={onClear}>Clear All</button>
      </div>
      
      <Section id="date" title="Date Range">
        <input 
          className="filter-input" 
          type="date" 
          value={filters.from} 
          onChange={(e) => onChange({ from: e.target.value })} 
        />
        <input 
          className="filter-input" 
          type="date" 
          value={filters.to} 
          onChange={(e) => onChange({ to: e.target.value })} 
        />
      </Section>
      
      <Section id="status" title="Status">
        <select 
          className="filter-select" 
          value={filters.status} 
          onChange={(e) => onChange({ status: e.target.value })}
        >
          <option value="">All Status</option>
          <option>Scheduled</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>
      </Section>
      
      <Section id="doctor" title="Doctor">
        <select 
          className="filter-select" 
          value={filters.doctor} 
          onChange={(e) => onChange({ doctor: e.target.value })}
        >
          <option value="">All Doctors</option>
          {doctors.map(d => <option key={d}>{d}</option>)}
        </select>
      </Section>
      
      <Section id="branch" title="Branch">
        <select 
          className="filter-select" 
          value={filters.branch} 
          onChange={(e) => onChange({ branch: e.target.value })}
        >
          <option value="">All Branches</option>
          {branches.map(b => <option key={b}>{b}</option>)}
        </select>
      </Section>
      
      <Section id="type" title="Appointment Type">
        <select 
          className="filter-select" 
          value={filters.type} 
          onChange={(e) => onChange({ type: e.target.value })}
        >
          <option value="">All Types</option>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
      </Section>
    </div>
  )
}

// Bulk Actions Component
function BulkActions({ total, selectedIds, onSelectAll, onClear, onCancel, onReschedule }) {
  const count = selectedIds.length
  
  return (
    <div className="bulk-actions">
      <label className="bulk-select-all">
        <input 
          type="checkbox" 
          checked={count > 0 && count >= Math.min(total, selectedIds.length)} 
          onChange={(e) => e.target.checked ? onSelectAll() : onClear()} 
        />
        <span>Select All ({count} selected)</span>
      </label>
      <div className="bulk-actions-btns">
        <button 
          className="bulk-btn" 
          onClick={onReschedule} 
          disabled={!count}
        >
          Reschedule
        </button>
        <button 
          className="bulk-btn danger" 
          onClick={onCancel} 
          disabled={!count}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// Pagination Controls Component
function PaginationControls({ page, pageSize, total, onChange }) {
  const max = Math.ceil(total / pageSize)
  
  return (
    <div className="pagination">
      <button 
        className="pagination-btn" 
        disabled={page <= 1} 
        onClick={() => onChange(page - 1)}
      >
        Prev
      </button>
      <span className="pagination-label">Page {page} of {max}</span>
      <button 
        className="pagination-btn" 
        disabled={page >= max} 
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  )
}

// Appointment Calendar Component
function AppointmentCalendar({ appointments, onSelect }) {
  const today = new Date()
  const start = new Date(today)
  start.setDate(1)
  
  const month = start.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const days = Array.from({ length: 42 }).map((_, i) => {
    const d = new Date(start)
    d.setDate(1 - start.getDay() + i)
    return d
  })

  function dayAppointments(d) {
    const key = d.toISOString().slice(0, 10)
    return appointments.filter(a => a.date === key)
  }

  return (
    <div className="calendar-wrapper">
      <div className="calendar-header">{month}</div>
      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(k => 
          <div key={k} className="calendar-dow">{k}</div>
        )}
        {days.map((d, i) => {
          const items = dayAppointments(d)
          const isThisMonth = d.getMonth() === start.getMonth()
          
          return (
            <div 
              key={i} 
              className={`calendar-cell ${isThisMonth ? '' : 'faded'}`}
            >
              <div className="calendar-date">{d.getDate()}</div>
              <div className="calendar-markers">
                {items.slice(0, 3).map(a => (
                  <button 
                    key={a.id} 
                    className={`calendar-marker ${a.status.toLowerCase()}`}
                    title={`${a.doctor} • ${a.time}`}
                    onClick={() => onSelect(a.id)}
                  />
                ))}
                {items.length > 3 && (
                  <div className="calendar-more">+{items.length - 3}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function Appointments() {
  const [view, setView] = useState('list')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ 
    status: '', 
    doctor: '', 
    branch: '', 
    type: '', 
    from: '', 
    to: '' 
  })
  const [selected, setSelected] = useState([])
  const [page, setPage] = useState(1)
  const pageSize = 3

  // Filter appointments based on search query and filters
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

  // Paginate filtered results
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page])

  // Selection handlers
  function toggleSelect(id) {
    setSelected((s) => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  function selectAll(ids) { 
    setSelected(ids) 
  }
  
  function clearSelection() { 
    setSelected([]) 
  }

  return (
    <div className="appointments-page">
      <div className="appointments-header">
        <div>
          <h2>My Appointments</h2>
          <p className="muted">Manage and track all your medical appointments</p>
        </div>
        <ViewToggle value={view} onChange={setView} />
      </div>

      <div className="appointments-layout">
        <aside className="appointments-sidebar">
          <FilterSidebar
            filters={filters}
            onChange={(partial) => { 
              setPage(1)
              setFilters((f) => ({ ...f, ...partial })) 
            }}
            onClear={() => { 
              setPage(1)
              setFilters({ status: '', doctor: '', branch: '', type: '', from: '', to: '' }) 
            }}
          />
        </aside>
        
        <main className="appointments-main">
          <div className="appointments-toolbar">
            <SearchBar 
              value={query} 
              onChange={(v) => { 
                setPage(1)
                setQuery(v) 
              }} 
            />
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
            <div className="appointments-list">
              {paged.map(a => (
                <AppointmentCard 
                  key={a.id} 
                  data={a} 
                  selected={selected.includes(a.id)} 
                  onSelect={() => toggleSelect(a.id)}
                  onView={() => alert('View details for ' + a.id)} 
                  onCancel={() => alert('Cancel ' + a.id)} 
                  onReschedule={() => alert('Reschedule ' + a.id)} 
                />
              ))}
              {filtered.length > pageSize && (
                <PaginationControls 
                  page={page} 
                  total={filtered.length} 
                  pageSize={pageSize} 
                  onChange={setPage} 
                />
              )}
            </div>
          ) : (
            <AppointmentCalendar 
              appointments={filtered} 
              onSelect={(id) => alert('Open ' + id)} 
            />
          )}
        </main>
      </div>
    </div>
  )
}


