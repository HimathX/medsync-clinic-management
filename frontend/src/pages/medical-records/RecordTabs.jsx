export default function RecordTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'timeline', label: 'Timeline View' },
    { id: 'consultations', label: 'Consultations' },
    { id: 'treatments', label: 'Treatments' },
    { id: 'diagnostics', label: 'Diagnostics' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'documents', label: 'Documents' }
  ]

  return (
    <div className="record-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
