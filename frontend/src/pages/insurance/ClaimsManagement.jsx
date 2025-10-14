function ClaimsManagement({ claims, onViewDetails, onAppeal }) {
  const getStatusClass = (status) => {
    const statusMap = {
      approved: 'status-approved',
      processing: 'status-processing',
      pending: 'status-pending',
      denied: 'status-denied'
    };
    return statusMap[status] || '';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      approved: '✓',
      processing: '⟳',
      pending: '⏱',
      denied: '✕'
    };
    return iconMap[status] || '';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group claims by status
  const claimsByStatus = claims.reduce((acc, claim) => {
    if (!acc[claim.status]) {
      acc[claim.status] = [];
    }
    acc[claim.status].push(claim);
    return acc;
  }, {});

  const stats = {
    total: claims.length,
    approved: claimsByStatus.approved?.length || 0,
    processing: claimsByStatus.processing?.length || 0,
    pending: claimsByStatus.pending?.length || 0,
    denied: claimsByStatus.denied?.length || 0
  };

  return (
    <div className="claims-management">
      {/* Claims Stats */}
      <div className="claims-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total Claims</span>
        </div>
        <div className="stat-card approved">
          <span className="stat-value">{stats.approved}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="stat-card processing">
          <span className="stat-value">{stats.processing}</span>
          <span className="stat-label">Processing</span>
        </div>
        <div className="stat-card pending">
          <span className="stat-value">{stats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-card denied">
          <span className="stat-value">{stats.denied}</span>
          <span className="stat-label">Denied</span>
        </div>
      </div>

      {/* Claims List */}
      <div className="claims-list">
        <h3>Recent Claims</h3>
        {claims.map(claim => (
          <div key={claim.id} className={`claim-card ${getStatusClass(claim.status)}`}>
            <div className="claim-header">
              <div className="claim-id-date">
                <span className="claim-id">{claim.id}</span>
                <span className="claim-date">{formatDate(claim.date)}</span>
              </div>
              <span className={`claim-status ${getStatusClass(claim.status)}`}>
                <span className="status-icon">{getStatusIcon(claim.status)}</span>
                {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
              </span>
            </div>

            <div className="claim-body">
              <div className="claim-provider">
                <span className="provider-icon">🏥</span>
                <span className="provider-name">{claim.provider}</span>
              </div>
              <p className="claim-service">{claim.service}</p>

              <div className="claim-amounts">
                <div className="amount-item">
                  <span className="amount-label">Billed Amount</span>
                  <span className="amount-value">${claim.amount.toFixed(2)}</span>
                </div>
                <div className="amount-item covered">
                  <span className="amount-label">Insurance Covered</span>
                  <span className="amount-value">${claim.covered.toFixed(2)}</span>
                </div>
                <div className="amount-item your-cost">
                  <span className="amount-label">Your Responsibility</span>
                  <span className="amount-value">${claim.yourCost.toFixed(2)}</span>
                </div>
              </div>

              {claim.status === 'denied' && claim.reason && (
                <div className="denial-reason">
                  <strong>Denial Reason:</strong> {claim.reason}
                </div>
              )}

              {claim.processedDate && (
                <div className="claim-meta">
                  <span>Processed: {formatDate(claim.processedDate)}</span>
                </div>
              )}
              {claim.submittedDate && (
                <div className="claim-meta">
                  <span>Submitted: {formatDate(claim.submittedDate)}</span>
                </div>
              )}
            </div>

            <div className="claim-actions">
              <button 
                className="claim-action-btn view"
                onClick={() => onViewDetails(claim.id)}
              >
                View Details
              </button>
              {claim.status === 'denied' && (
                <button 
                  className="claim-action-btn appeal"
                  onClick={() => onAppeal(claim.id)}
                >
                  File Appeal
                </button>
              )}
              <button className="claim-action-btn download">
                Download EOB
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClaimsManagement;
