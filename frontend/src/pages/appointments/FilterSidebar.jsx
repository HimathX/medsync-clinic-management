import { useMemo, useState } from 'react'
import styles from './FilterSidebar.module.css'

export default function FilterSidebar({ filters, onChange, onClear }) {
  const [open, setOpen] = useState({ date: true, status: true, doctor: true, branch: true, type: true })
  const doctors = useMemo(() => ['Dr. Priya Patel','Dr. James Wilson','Dr. Michael Chen','Dr. Sarah Johnson'], [])
  const branches = useMemo(() => ['Colombo','Galle','Kandy'], [])
  const types = useMemo(() => ['Consultation','Follow-up','Procedure'], [])

  function Section({ id, title, children }) {
    return (
      <div className={styles.section}>
        <button className={styles.sectionHeader} onClick={() => setOpen(o => ({ ...o, [id]: !o[id] }))}>
          <span>{title}</span>
          <span className={styles.chev}>{open[id] ? '▾' : '▸'}</span>
        </button>
        {open[id] && <div className={styles.sectionBody}>{children}</div>}
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h4>Filters</h4>
        <button className={styles.clear} onClick={onClear}>Clear All</button>
      </div>
      <Section id="date" title="Date Range">
        <input className={styles.input} type="date" value={filters.from} onChange={(e) => onChange({ from: e.target.value })} />
        <input className={styles.input} type="date" value={filters.to} onChange={(e) => onChange({ to: e.target.value })} />
      </Section>
      <Section id="status" title="Status">
        <select className={styles.select} value={filters.status} onChange={(e) => onChange({ status: e.target.value })}>
          <option value="">All Status</option>
          <option>Scheduled</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>
      </Section>
      <Section id="doctor" title="Doctor">
        <select className={styles.select} value={filters.doctor} onChange={(e) => onChange({ doctor: e.target.value })}>
          <option value="">All Doctors</option>
          {doctors.map(d => <option key={d}>{d}</option>)}
        </select>
      </Section>
      <Section id="branch" title="Branch">
        <select className={styles.select} value={filters.branch} onChange={(e) => onChange({ branch: e.target.value })}>
          <option value="">All Branches</option>
          {branches.map(b => <option key={b}>{b}</option>)}
        </select>
      </Section>
      <Section id="type" title="Appointment Type">
        <select className={styles.select} value={filters.type} onChange={(e) => onChange({ type: e.target.value })}>
          <option value="">All Types</option>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
      </Section>
    </div>
  )
}


