function Reimbursements({ reimbursements }) {
  const getStatusClass = (status) => {
    const statusMap = {
      completed: 'status-completed',
      processing: 'status-processing',
      pending: 'status-pending',
      failed: 'status-failed'
    };
    return statusMap[status] || '';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const totalReimbursed = reimbursements
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingAmount = reimbursements
    .filter(r => r.status === 'processing' || r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="reimbursements-section">
      {/* Reimbursement Summary */}
      <div className="reimbursement-summary">
        <div className="summary-card">
          <span className="summary-amount">${totalReimbursed.toFixed(2)}</span>
          <span className="summary-label">Total Reimbursed</span>
        </div>
        <div className="summary-card pending">
          <span className="summary-amount">${pendingAmount.toFixed(2)}</span>
          <span className="summary-label">Pending Reimbursement</span>
        </div>
      </div>

      {/* Reimbursements List */}
      <div className="reimbursements-list">
        <h3>Reimbursement History</h3>
        {reimbursements.map(reimbursement => (
          <div key={reimbursement.id} className="reimbursement-card">
            <div className="reimbursement-header">
              <div className="reimbursement-info">
                <span className="reimbursement-id">{reimbursement.id}</span>
                <span className="reimbursement-claim">Related to: {reimbursement.claimId}</span>
              </div>
              <span className={`reimbursement-status ${getStatusClass(reimbursement.status)}`}>
                {reimbursement.status.charAt(0).toUpperCase() + reimbursement.status.slice(1)}
              </span>
            </div>

            <div className="reimbursement-body">
              <div className="reimbursement-amount-section">
                <span className="reimbursement-amount">${reimbursement.amount.toFixed(2)}</span>
                <span className="reimbursement-date">{formatDate(reimbursement.date)}</span>
              </div>

              {reimbursement.method && (
                <div className="reimbursement-method">
                  <span className="method-label">Payment Method:</span>
                  <span className="method-value">{reimbursement.method}</span>
                  {reimbursement.accountEnding && (
                    <span className="account-info">{reimbursement.accountEnding}</span>
                  )}
                </div>
              )}

              {reimbursement.expectedDate && (
                <div className="expected-date">
                  <span className="expected-label">Expected:</span>
                  <span className="expected-value">{formatDate(reimbursement.expectedDate)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {reimbursements.length === 0 && (
        <div className="empty-state">
          <p>No reimbursements found</p>
        </div>
      )}
    </div>
  );
}

export default Reimbursements;
