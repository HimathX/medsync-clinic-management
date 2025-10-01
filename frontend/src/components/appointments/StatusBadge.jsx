import styles from './StatusBadge.module.css'

export default function StatusBadge({ status }) {
  const tone = status === 'Scheduled' ? styles.scheduled : status === 'Completed' ? styles.completed : styles.cancelled
  return <span className={`${styles.badge} ${tone}`}>{status}</span>
}


