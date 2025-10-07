import RecordCard from './RecordCard.jsx'

export default function MedicalTimeline({ records, onDownload, onViewDetails }) {
  if (records.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔍</div>
        <h3>No records found</h3>
        <p className="muted">Try adjusting your filters or search query</p>
      </div>
    )
  }

  return (
    <div className="timeline-container">
      <h2 className="timeline-title">Medical Timeline</h2>
      <div className="timeline">
        <div className="timeline-line"></div>
        {records.map(record => (
          <div key={record.id} className="timeline-item">
            <div className="timeline-marker">
              <div className="timeline-icon">
                {record.type === 'consultation' && '👨‍⚕️'}
                {record.type === 'surgery' && '🏥'}
                {record.type === 'treatment' && '🏥'}
                {record.type === 'diagnostic' && '🔬'}
                {record.type === 'prescription' && '💊'}
              </div>
            </div>
            <RecordCard
              record={record}
              onDownload={onDownload}
              onViewDetails={onViewDetails}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
