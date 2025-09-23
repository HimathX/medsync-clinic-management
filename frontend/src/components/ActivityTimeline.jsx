export default function ActivityTimeline({ items = [] }) {
  return (
    <ol className="timeline">
      {items.map(item => (
        <li key={item.id} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div className="timeline-title">{item.title}</div>
            <div className="muted">{item.detail}</div>
            <div className="tiny muted">{formatDate(item.date)}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

function formatDate(date) {
  if (!date) return ''
  if (date instanceof Date) return date.toISOString().slice(0, 10)
  return String(date)
}


