function InsuranceTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'policy', label: 'Policy Overview' },
    { id: 'coverage', label: 'Coverage Details' },
    { id: 'claims', label: 'Claims Management' },
    { id: 'reimbursements', label: 'Reimbursements' },
    { id: 'network', label: 'Provider Network' }
  ];

  return (
    <div className="insurance-tabs">
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
  );
}

export default InsuranceTabs;
