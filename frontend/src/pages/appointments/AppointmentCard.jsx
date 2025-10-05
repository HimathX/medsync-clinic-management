import './Appointments.css'

function formatTime(time) {
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `: `
}

export default function AppointmentCard({ data, selected, onSelect, onView, onReschedule, onCancel }) {
  const statusClass = data.status.toLowerCase()
  
  return (
    <div className={`appointment-card `}>
      <label className="appointment-checkbox">
        <input type="checkbox" checked={selected} onChange={onSelect} />
      </label>
      <div className="appointment-avatar" />
      <div className="appointment-info">
        <div className="appointment-row-1">
          <div>
            <div className="appointment-name">{data.doctor}</div>
            <div className="appointment-creds">{data.creds}</div>
          </div>
          <span className={`status-badge `}>{data.status}</span>
        </div>
        <div className="appointment-row-2">
          <div>
            <span className="appointment-label">Date & Time</span>
            <span className="appointment-value">{data.date} at {formatTime(data.time)}</span>
          </div>
          <div>
            <span className="appointment-label">Duration</span>
            <span className="appointment-value">{data.durationMin} min</span>
          </div>
        </div>
        <div className="appointment-row-2">
          <div>
            <span className="appointment-label">Branch</span>
            <span className="appointment-value">{data.branch}</span>
          </div>
          <div>
            <span className="appointment-label">Type</span>
            <span className="appointment-value">{data.type}</span>
          </div>
        </div>
        <div className="appointment-notes">
          <span className="appointment-label">Notes</span>
          <span className="appointment-value">{data.notes}</span>
        </div>
        <div className="appointment-actions">
          <button className="appointment-btn" onClick={onView}>View Details</button>
          <button className="appointment-btn primary" onClick={onReschedule}>Reschedule</button>
          <button className="appointment-btn danger" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
