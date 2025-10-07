import styles from './PaginationControls.module.css'

export default function PaginationControls({ page, pageSize, total, onChange }) {
  const max = Math.ceil(total / pageSize)
  return (
    <div className={styles.wrapper}>
      <button className={styles.btn} disabled={page<=1} onClick={() => onChange(page-1)}>Prev</button>
      <span className={styles.label}>Page {page} of {max}</span>
      <button className={styles.btn} disabled={page>=max} onClick={() => onChange(page+1)}>Next</button>
    </div>
  )
}


