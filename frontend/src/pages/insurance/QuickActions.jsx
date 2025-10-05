function QuickActions({ onSubmitClaim, onViewCard, onDownloadPolicy, onFindProvider }) {
  return (
    <div className="quick-actions-card">
      <h3>Quick Actions</h3>
      <div className="actions-list">
        <button className="action-btn primary" onClick={onSubmitClaim}>
          Submit New Claim
        </button>
        <button className="action-btn secondary" onClick={onViewCard}>
          View Digital Card
        </button>
        <button className="action-btn secondary" onClick={onDownloadPolicy}>
          Download Policy
        </button>
        <button className="action-btn secondary" onClick={onFindProvider}>
          Find Provider
        </button>
      </div>
    </div>
  );
}

export default QuickActions;
