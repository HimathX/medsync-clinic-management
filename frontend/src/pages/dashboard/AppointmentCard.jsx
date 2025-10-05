export default function AppointmentCard({ appt }) {
  const dateStr = appt.date instanceof Date ? appt.date.toISOString().slice(0, 10) : appt.date
  const timeStr = appt.date instanceof Date ? appt.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  return (
    <div className="appointment-card" tabIndex={0} role="button" onClick={() => alert(`Open appointment ${appt.id}`)}>
      <div className="appointment-icon" aria-hidden>📅</div>
      <div className="appointment-main">
        <div className="appointment-title">{appt.title}</div>
        <div className="muted">{appt.doctor}</div>
        <div className="muted">{appt.branch}</div>
      </div>
      <div className="appointment-meta">
        <div className="strong">{dateStr}</div>
        <div className="muted right">{timeStr}</div>
      </div>
    </div>
  )
}



