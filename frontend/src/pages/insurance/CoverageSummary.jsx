function CoverageSummary({ deductible, deductibleMet, remaining, progress, outOfPocketMax, currentSpending }) {
  return (
    <div className="coverage-summary-card">
      <h3>Coverage Summary</h3>
      
      <div className="summary-section">
        <div className="summary-row">
          <span className="summary-label">Annual Deductible</span>
          <span className="summary-value">${deductible.toLocaleString()}</span>
        </div>
        
        <div className="summary-row">
          <span className="summary-label">Deductible Met</span>
          <span className="summary-value met">${deductibleMet.toLocaleString()}</span>
        </div>
        
        <div className="summary-row">
          <span className="summary-label">Remaining</span>
          <span className="summary-value remaining">${remaining.toLocaleString()}</span>
        </div>
        
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="summary-section bordered">
        <div className="summary-row">
          <span className="summary-label">Out-of-Pocket Max</span>
          <span className="summary-value">${outOfPocketMax.toLocaleString()}</span>
        </div>
        
        <div className="summary-row">
          <span className="summary-label">Current Spending</span>
          <span className="summary-value spending">${currentSpending.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export default CoverageSummary;
