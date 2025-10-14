function PolicyOverview({ policy, selectedPolicy, onPolicyChange }) {
  return (
    <div className="policy-overview">
      {/* Policy Selector */}
      <div className="policy-selector">
        <button
          className={`policy-selector-btn ${selectedPolicy === 'primary' ? 'active' : ''}`}
          onClick={() => onPolicyChange('primary')}
        >
          Primary Insurance
        </button>
        <button
          className={`policy-selector-btn ${selectedPolicy === 'secondary' ? 'active' : ''}`}
          onClick={() => onPolicyChange('secondary')}
        >
          Secondary Insurance
        </button>
      </div>

      {/* Insurance Card */}
      <div className="insurance-card">
        <div className="card-header">
          <div className="provider-logo">
            {policy.providerShort}
          </div>
          <div className="provider-info">
            <h2>{policy.provider}</h2>
            <p className="plan-name">{policy.planName}</p>
          </div>
        </div>

        <div className="card-details">
          <div className="detail-row">
            <div className="detail-item">
              <span className="detail-label">Policy Holder</span>
              <span className="detail-value">{policy.policyHolder}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Policy Number</span>
              <span className="detail-value">{policy.policyNumber}</span>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-item">
              <span className="detail-label">Group Number</span>
              <span className="detail-value">{policy.groupNumber}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Coverage Type</span>
              <span className="detail-value">{policy.coverageType}</span>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-item">
              <span className="detail-label">Effective Date</span>
              <span className="detail-value">{policy.effectiveDate}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Renewal Date</span>
              <span className="detail-value">{policy.renewalDate}</span>
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-item">
              <span className="detail-label">Monthly Premium</span>
              <span className="detail-value">${policy.monthlyPremium.toFixed(2)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Deductible</span>
              <span className="detail-value">${policy.deductible.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copay Information */}
      {policy.copays && (
        <div className="copay-grid">
          <div className="copay-card">
            <span className="copay-label">Copay - Primary Care</span>
            <span className="copay-amount">${policy.copays.primaryCare}</span>
          </div>
          <div className="copay-card">
            <span className="copay-label">Copay - Specialist</span>
            <span className="copay-amount">${policy.copays.specialist}</span>
          </div>
          <div className="copay-card">
            <span className="copay-label">Emergency Room</span>
            <span className="copay-amount">${policy.copays.emergencyRoom}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PolicyOverview;
