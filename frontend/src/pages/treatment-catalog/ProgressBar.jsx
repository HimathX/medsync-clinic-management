export default function ProgressBar({ value = 0, label = '' }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="progress">
      <div className="progress-bar" style={{ width: `${pct}%` }} />
      <div className="progress-label">{label} • {pct}%</div>
    </div>
  )
}



