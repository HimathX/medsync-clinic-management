import styles from './ViewToggle.module.css'

export default function ViewToggle({ value, onChange }) {
  return (
    <div className={styles.toggle}>
      <button className={`${styles.btn} ${value==='list'?styles.active:''}`} onClick={() => onChange('list')}>List View</button>
      <button className={`${styles.btn} ${value==='calendar'?styles.active:''}`} onClick={() => onChange('calendar')}>Calendar View</button>
    </div>
  )
}


