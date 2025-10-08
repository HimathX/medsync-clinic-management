import styles from './StepIndicator.module.css'

export default function StepIndicator({ steps, activeKey }) {
  const index = steps.findIndex(s => s.key === activeKey)
  return (
    <div className={styles.wrapper}>
      {steps.map((s, i) => (
        <div key={s.key} className={`${styles.step} ${i <= index ? styles.active : ''}`}>
          <div className={styles.dot}>{i + 1}</div>
          <div className={styles.label}>{s.label}</div>
          {i < steps.length - 1 && <div className={`${styles.bar} ${i < index ? styles.filled : ''}`} />}
        </div>
      ))}
    </div>
  )
}


