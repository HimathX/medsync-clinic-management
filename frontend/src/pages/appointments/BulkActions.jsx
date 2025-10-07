import styles from './BulkActions.module.css'

export default function BulkActions({ total, selectedIds, onSelectAll, onClear, onCancel, onReschedule }) {
  const count = selectedIds.length
  return (
    <div className={styles.wrapper}>
      <label className={styles.left}>
        <input type="checkbox" checked={count>0 && count>=Math.min(total, selectedIds.length)} onChange={(e)=> e.target.checked? onSelectAll(): onClear()} />
        <span>Select All ({count} selected)</span>
      </label>
      <div className={styles.actions}>
        <button className={styles.btn} onClick={onReschedule} disabled={!count}>Reschedule</button>
        <button className={`${styles.btn} ${styles.danger}`} onClick={onCancel} disabled={!count}>Cancel</button>
      </div>
    </div>
  )
}


