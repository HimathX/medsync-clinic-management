import { useEffect, useMemo, useState } from 'react'
import styles from './DoctorSearch.module.css'

const MOCK_DOCTORS = [
  { id: 'wilson', name: 'Dr. James Wilson', specialty: 'Surgery', branch: 'Colombo', rating: 4.6 },
  { id: 'chen', name: 'Dr. Michael Chen', specialty: 'Neurology', branch: 'Kandy', rating: 4.9 },
  { id: 'johnson', name: 'Dr. Sarah Johnson', specialty: 'Cardiology', branch: 'Colombo', rating: 4.8 },
  { id: 'patel', name: 'Dr. Priya Patel', specialty: 'Orthopedics', branch: 'Galle', rating: 4.7 },
]

export default function DoctorSearch({ value, onSelectDoctor, onNext }) {
  const [q, setQ] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [branch, setBranch] = useState('')
  const [loading, setLoading] = useState(false)

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    return MOCK_DOCTORS.filter(d =>
      (!term || d.name.toLowerCase().includes(term)) &&
      (!specialty || d.specialty === specialty) &&
      (!branch || d.branch === branch)
    )
  }, [q, specialty, branch])

  useEffect(() => {
    setLoading(true)
    const id = setTimeout(() => {
      setLoading(false)
    }, 300)
    return () => { clearTimeout(id); setLoading(false) }
  }, [q, specialty, branch])

  return (
    <div className={styles.wrapper}>
      <div className={styles.filters}>
        <input className={styles.input} placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={styles.select} value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
          <option value="">All Specialties</option>
          {[...new Set(MOCK_DOCTORS.map(d => d.specialty))].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={styles.select} value={branch} onChange={(e) => setBranch(e.target.value)}>
          <option value="">All Branches</option>
          {[...new Set(MOCK_DOCTORS.map(d => d.branch))].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${styles.card} ${styles.skeleton}`}> </div>
          ))}
        </div>
      ) : (
        <div className={styles.grid}>
          {results.map(d => (
            <DoctorCard key={d.id} doctor={d} selected={value?.doctor?.id === d.id} onSelect={() => onSelectDoctor(d)} />
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.next} disabled={!value?.doctor} onClick={onNext}>Next</button>
      </div>
    </div>
  )
}

function DoctorCard({ doctor, onSelect, selected }) {
  return (
    <button onClick={onSelect} className={`${styles.card} ${selected ? styles.selected : ''}`}>
      <div className={styles.avatar} />
      <div className={styles.info}>
        <div className={styles.name}>{doctor.name}</div>
        <div className={styles.meta}><span>{doctor.specialty}</span> • <span>{doctor.branch}</span></div>
        <div className={styles.rating}>★ {doctor.rating.toFixed(1)}</div>
      </div>
    </button>
  )
}


