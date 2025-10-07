import StatusBadge from './StatusBadge.jsx'
import styles from './AppointmentCard.module.css'

export default function AppointmentCard({ data, selected, onSelect, onView, onReschedule, onCancel }) {
  return (
    <div className={`${styles.card} ${selected ? styles.selected : ''}`}>
      <label className={styles.checkbox}>
        <input type="checkbox" checked={selected} onChange={onSelect} />
      </label>
      <div className={styles.avatar} />
      <div className={styles.info}>
        <div className={styles.row1}>
          <div>
            <div className={styles.name}>{data.doctor}</div>
            <div className={styles.creds}>{data.creds}</div>
          </div>
          <StatusBadge status={data.status} />
        </div>
        <div className={styles.row2}>
          <div>
            <span className={styles.label}>Date & Time</span>
            <span className={styles.value}>{data.date} at {formatTime(data.time)}</span>
          </div>
          <div>
            <span className={styles.label}>Duration</span>
            <span className={styles.value}>{data.durationMin} min</span>
          </div>
        </div>
        <div className={styles.row2}>
          <div>
            <span className={styles.label}>Branch</span>
            <span className={styles.value}>{data.branch}</span>
          </div>
          <div>
            <span className={styles.label}>Type</span>
            <span className={styles.value}>{data.type}</span>
          </div>
        </div>
        <div className={styles.notes}>
          <span className={styles.label}>Notes</span>
          <span className={styles.value}>{data.notes}</span>
        </div>
        <div className={styles.actions}>
          <button className={styles.btn} onClick={onView}>View Details</button>
          <button className={`${styles.btn} ${styles.primary}`} onClick={onReschedule}>Reschedule</button>
          <button className={`${styles.btn} ${styles.danger}`} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function formatTime(t){
  const [h,m] = t.split(':').map(Number)
  const d = new Date(); d.setHours(h, m)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}


