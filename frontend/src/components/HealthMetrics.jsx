import ProgressBar from './ProgressBar.jsx'

export default function HealthMetrics({ metrics }) {
  const stepsPct = Math.round((metrics.steps / metrics.stepsGoal) * 100)
  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-gauge" style={{ ['--pct']: `${stepsPct}%` }} />
        <div className="metric-info">
          <div className="metric-title">Steps</div>
          <div className="metric-value">{metrics.steps.toLocaleString()} / {metrics.stepsGoal.toLocaleString()}</div>
        </div>
      </div>
      <div className="metric-card">
        <div className="metric-title">Sleep</div>
        <ProgressBar value={Math.min(100, Math.round(metrics.sleepHours / 8 * 100))} label={`${metrics.sleepHours} hrs`} />
      </div>
      <div className="metric-card">
        <div className="metric-title">Heart Rate</div>
        <div className="metric-value">{metrics.heartRate} bpm</div>
      </div>
    </div>
  )
}



