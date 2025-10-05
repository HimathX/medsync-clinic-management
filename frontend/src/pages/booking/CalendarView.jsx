import { useMemo } from 'react'
import styles from './CalendarView.module.css'

export default function CalendarView({ doctor, date, onSelectDate }) {
  const days = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 21 }).map((_, i) => {
      const d = new Date(now)
      d.setDate(now.getDate() + i)
      return d
    })
  }, [])

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>Availability</div>
      <div className={styles.grid}>
        {days.map(d => {
          const key = d.toDateString()
          const isSelected = date && new Date(date).toDateString() === key
          const isDisabled = d.getDay() === 0 // Sundays off
          return (
            <button
              key={key}
              className={`${styles.day} ${isSelected ? styles.selected : ''}`}
              disabled={isDisabled}
              onClick={() => onSelectDate(d.toISOString().slice(0,10))}
            >
              <div className={styles.dow}>{d.toLocaleDateString(undefined, { weekday: 'short' })}</div>
              <div className={styles.num}>{d.getDate()}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}


