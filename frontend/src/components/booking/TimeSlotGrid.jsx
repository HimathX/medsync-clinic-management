import styles from './TimeSlotGrid.module.css'

export default function TimeSlotGrid({ doctor, date, time, loading, slots = [], onSelectTime }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>Time Slots</div>
      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`${styles.slot} ${styles.skeleton}`} />
          ))}
        </div>
      ) : (
        <div className={styles.grid}>
          {slots.map(s => (
            <button
              key={s.t}
              className={`${styles.slot} ${time === s.t ? styles.selected : ''}`}
              disabled={!s.available}
              onClick={() => onSelectTime(s.t)}
              title={!s.available ? 'Conflicting appointment' : ''}
            >
              {s.t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


