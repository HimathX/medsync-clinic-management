import styles from './AppointmentCalendar.module.css'

export default function AppointmentCalendar({ appointments, onSelect }) {
  const today = new Date()
  const start = new Date(today); start.setDate(1)
  const month = start.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const days = Array.from({ length: 42 }).map((_, i) => {
    const d = new Date(start); d.setDate(1 - start.getDay() + i)
    return d
  })

  function dayAppointments(d){
    const key = d.toISOString().slice(0,10)
    return appointments.filter(a => a.date === key)
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>{month}</div>
      <div className={styles.grid}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(k => <div key={k} className={styles.dow}>{k}</div>)}
        {days.map((d,i) => {
          const items = dayAppointments(d)
          const isThisMonth = d.getMonth() === start.getMonth()
          return (
            <div key={i} className={`${styles.cell} ${isThisMonth? '': styles.faded}`}>
              <div className={styles.dateNum}>{d.getDate()}</div>
              <div className={styles.markers}>
                {items.slice(0,3).map(a => (
                  <button key={a.id} className={`${styles.marker} ${styles[a.status.toLowerCase()]}`} title={`${a.doctor} • ${a.time}`} onClick={() => onSelect(a.id)} />
                ))}
                {items.length>3 && <div className={styles.more}>+{items.length-3}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


