import styles from './BookingConfirmation.module.css'

export default function BookingConfirmation({ data, onBack, onConfirm }) {
  return (
    <div className={styles.wrapper}>
      <h3>Confirm your booking</h3>
      <div className={styles.summary}>
        <div><strong>Doctor:</strong> {data?.doctor?.name}</div>
        <div><strong>Type:</strong> {data?.type}</div>
        <div><strong>Date:</strong> {data?.date}</div>
        <div><strong>Time:</strong> {data?.time}</div>
        {data?.reason ? <div><strong>Reason:</strong> {data.reason}</div> : null}
        {data?.requirements?.length ? <div><strong>Requirements:</strong> {data.requirements.join(', ')}</div> : null}
      </div>
      <div className={styles.actions}>
        <button className={styles.back} onClick={onBack}>Back</button>
        <button className={styles.confirm} onClick={onConfirm}>Confirm Booking</button>
      </div>
    </div>
  )
}


