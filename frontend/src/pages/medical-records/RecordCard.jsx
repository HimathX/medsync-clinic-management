export default function RecordCard({ record, onDownload, onViewDetails }) {
  const formatDate = (date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="record-card">
      <div className="record-header">
        <div>
          <h3 className="record-doctor">{record.doctor}</h3>
          <span className="specialty-badge">{record.specialty}</span>
          <p className="muted record-date">{formatDate(record.date)}</p>
        </div>
        <span className={`status-badge status-${record.status}`}>
          {record.status === 'completed' ? 'Completed' : 'Pending'}
        </span>
      </div>

      <div className="record-body">
        {record.chiefComplaint && (
          <div className="record-field">
            <label className="muted">Chief Complaint</label>
            <p>{record.chiefComplaint}</p>
          </div>
        )}

        {record.clinicalFindings && (
          <div className="record-field">
            <label className="muted">Clinical Findings</label>
            <p>{record.clinicalFindings}</p>
          </div>
        )}

        {record.diagnosis && (
          <div className="record-field">
            <label className="muted">Diagnosis</label>
            <p>{record.diagnosis}</p>
          </div>
        )}

        {record.treatment && (
          <div className="record-field">
            <label className="muted">Treatment</label>
            <p>{record.treatment}</p>
          </div>
        )}

        {record.procedure && (
          <div className="record-field">
            <label className="muted">Treatment</label>
            <p>{record.procedure}</p>
          </div>
        )}

        {record.test && (
          <div className="record-field">
            <label className="muted">Test</label>
            <p>{record.test}</p>
          </div>
        )}

        {record.results && (
          <div className="record-field">
            <label className="muted">Results</label>
            <p>{record.results}</p>
          </div>
        )}

        {record.medication && (
          <div className="record-field">
            <label className="muted">Medication</label>
            <p>{record.medication}</p>
          </div>
        )}

        {record.outcome && (
          <div className="record-field">
            <label className="muted">Outcome</label>
            <p>{record.outcome}</p>
          </div>
        )}
      </div>

      <div className="record-actions">
        <button className="btn-outline" onClick={() => onViewDetails(record.id)}>
          View Details
        </button>
        <button className="btn-primary" onClick={() => onDownload(record.id)}>
          Download Report
        </button>
      </div>
    </div>
  )
}
