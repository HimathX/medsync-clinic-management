import styles from './BookingSummaryModal.module.css'

export default function BookingSummaryModal({ open, data, onClose, onConfirm }) {
  if (!open) return null
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Booking Summary</h3>
          <button className={styles.icon} onClick={onClose}>×</button>
        </div>
        <div className={styles.body}>
          <div className={styles.row}><span>Doctor</span><strong>{data?.doctor?.name}</strong></div>
          <div className={styles.row}><span>Type</span><strong>{data?.type}</strong></div>
          <div className={styles.row}><span>Date</span><strong>{data?.date}</strong></div>
          <div className={styles.row}><span>Time</span><strong>{data?.time}</strong></div>
          {data?.reason && <div className={styles.row}><span>Reason</span><strong>{data.reason}</strong></div>}
          {data?.requirements?.length ? <div className={styles.row}><span>Requirements</span><strong>{data.requirements.join(', ')}</strong></div> : null}
        </div>
        <div className={styles.footer}>
          <button className={styles.cancel} onClick={onClose}>Cancel</button>
          <button className={styles.confirm} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )
}


