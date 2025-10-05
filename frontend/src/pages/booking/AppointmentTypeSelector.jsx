import styles from './AppointmentTypeSelector.module.css'

export default function AppointmentTypeSelector({ type, reason, requirements, onChange }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        <label className={styles.label}>Appointment Type</label>
        <div className={styles.types}>
          {['consultation','follow-up','emergency'].map(v => (
            <label key={v} className={`${styles.type} ${type === v ? styles.active : ''}`}>
              <input type="radio" name="apptType" value={v} checked={type === v} onChange={() => onChange({ type: v })} />
              <span>{v.replace('-', ' ')}</span>
            </label>
          ))}
        </div>
      </div>
      <div className={styles.row}>
        <label className={styles.label}>Reason for visit</label>
        <textarea className={styles.textarea} placeholder="Describe your symptoms or reason" value={reason} onChange={(e) => onChange({ reason: e.target.value })} />
      </div>
      <div className={styles.row}>
        <label className={styles.label}>Special requirements</label>
        <div className={styles.choices}>
          {['Wheelchair access','Interpreter needed','Quiet room'].map(opt => {
            const checked = requirements.includes(opt)
            return (
              <label key={opt} className={`${styles.check} ${checked ? styles.checked : ''}`}>
                <input type="checkbox" checked={checked} onChange={() => {
                  const next = checked ? requirements.filter(x => x !== opt) : [...requirements, opt]
                  onChange({ requirements: next })
                }} />
                <span>{opt}</span>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}


