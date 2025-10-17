// src/pages/patient/Insurance.js - Patient Insurance Coverage Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import insuranceService from '../../services/insuranceService';
import authService from '../../services/authService';
import '../../styles/patientDashboard.css';

export default function Insurance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myInsurances, setMyInsurances] = useState([]);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [activeTab, setActiveTab] = useState('my-insurance'); // 'my-insurance', 'packages'
  const [selectedItem, setSelectedItem] = useState(null);

  // Get patient ID from auth
  const currentUser = authService.getCurrentUser();
  const patientId = currentUser?.patientId || localStorage.getItem('patientId');

  useEffect(() => {
    if (!patientId) {
      navigate('/patient-login');
      return;
    }
    fetchInsuranceData();
  }, [patientId]);

  const fetchInsuranceData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('💼 Fetching insurance data for patient:', patientId);

      const [insurancesData, packagesData] = await Promise.all([
        insuranceService.getPatientInsurances(patientId),
        insuranceService.getAllPackages(0, 100, true) // Only active packages
      ]);

      console.log('✅ Insurance data fetched:', { insurances: insurancesData, packages: packagesData });

      setMyInsurances(insurancesData.insurances || []);
      setAvailablePackages(packagesData.packages || []);
    } catch (err) {
      console.error('❌ Error fetching insurance data:', err);
      setError(err.message || 'Failed to load insurance information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'status-active-insurance',
      'Inactive': 'status-inactive',
      'Expired': 'status-expired',
      'Pending': 'status-pending'
    };
    return colors[status] || 'status-pending';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const calculateDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="patient-portal">
      {/* Header */}
      <nav className="patient-top-nav">
        <div className="patient-top-nav-content">
          <button className="btn-secondary" onClick={() => navigate('/patient/dashboard')}>
            ← Back to Dashboard
          </button>
          <h2 style={{ color: 'white', margin: 0 }}>Insurance Coverage</h2>
          <div></div>
        </div>
      </nav>

      <div className="patient-container" style={{ paddingTop: '40px' }}>
        {/* Summary Cards */}
        <div className="insurance-summary-grid">
          <div className="insurance-summary-card">
            <div className="summary-icon">💼</div>
            <div className="summary-details">
              <h3 className="summary-number">{myInsurances.length}</h3>
              <p className="summary-label">My Insurance Plans</p>
            </div>
          </div>
          <div className="insurance-summary-card">
            <div className="summary-icon">✅</div>
            <div className="summary-details">
              <h3 className="summary-number">
                {myInsurances.filter(i => i.status === 'Active').length}
              </h3>
              <p className="summary-label">Active Coverage</p>
            </div>
          </div>
          <div className="insurance-summary-card">
            <div className="summary-icon">📦</div>
            <div className="summary-details">
              <h3 className="summary-number">{availablePackages.length}</h3>
              <p className="summary-label">Available Packages</p>
            </div>
          </div>
          <div className="insurance-summary-card">
            <div className="summary-icon">💰</div>
            <div className="summary-details">
              <h3 className="summary-number">
                {myInsurances.length > 0 && myInsurances[0].annual_limit
                  ? formatCurrency(myInsurances[0].annual_limit)
                  : 'N/A'}
              </h3>
              <p className="summary-label">Annual Coverage</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="insurance-tabs">
          <button
            className={`insurance-tab ${activeTab === 'my-insurance' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-insurance')}
          >
            💼 My Insurance ({myInsurances.length})
          </button>
          <button
            className={`insurance-tab ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => setActiveTab('packages')}
          >
            📦 Available Packages ({availablePackages.length})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="spinner">⏳</div>
            <p>Loading insurance information...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Insurance Data</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={fetchInsuranceData}>
              🔄 Try Again
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <div className="insurance-content">
            {/* My Insurance Tab */}
            {activeTab === 'my-insurance' && (
              <div className="insurance-section">
                {myInsurances.length === 0 ? (
                  <div className="empty-insurance-state">
                    <div className="empty-insurance-graphic">
                      <div className="insurance-card-illustration">
                        <div className="card-chip"></div>
                        <div className="card-stripe"></div>
                      </div>
                    </div>
                    <h3 className="empty-title">No Insurance Coverage</h3>
                    <p className="empty-description">
                      You don't have any active insurance plans. Browse our available packages
                      to find coverage that fits your needs.
                    </p>
                    <button 
                      className="btn-primary-large" 
                      onClick={() => setActiveTab('packages')}
                    >
                      📦 View Available Packages
                    </button>
                  </div>
                ) : (
                  <div className="insurance-cards-grid">
                    {myInsurances.map((insurance) => {
                      const daysRemaining = calculateDaysRemaining(insurance.end_date);
                      const isExpiringSoon = daysRemaining < 30 && daysRemaining > 0;
                      
                      return (
                        <div
                          key={insurance.insurance_id}
                          className="insurance-card-item"
                          onClick={() => setSelectedItem({ type: 'insurance', data: insurance })}
                        >
                          <div className="insurance-card-header">
                            <div className="insurance-icon">💼</div>
                            <span className={`status-badge-insurance ${getStatusColor(insurance.status)}`}>
                              {insurance.status}
                            </span>
                          </div>

                          <h3 className="insurance-plan-name">{insurance.package_name}</h3>

                          <div className="insurance-details-grid">
                            <div className="insurance-detail-item">
                              <span className="detail-icon">💰</span>
                              <div>
                                <p className="detail-label">Annual Limit</p>
                                <p className="detail-value">{formatCurrency(insurance.annual_limit)}</p>
                              </div>
                            </div>

                            <div className="insurance-detail-item">
                              <span className="detail-icon">📊</span>
                              <div>
                                <p className="detail-label">Copayment</p>
                                <p className="detail-value">{insurance.copayment_percentage}%</p>
                              </div>
                            </div>

                            <div className="insurance-detail-item">
                              <span className="detail-icon">📅</span>
                              <div>
                                <p className="detail-label">Valid Until</p>
                                <p className="detail-value">
                                  {new Date(insurance.end_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>

                            {insurance.status === 'Active' && (
                              <div className="insurance-detail-item">
                                <span className="detail-icon">⏰</span>
                                <div>
                                  <p className="detail-label">Days Remaining</p>
                                  <p className={`detail-value ${isExpiringSoon ? 'expiring-soon' : ''}`}>
                                    {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {isExpiringSoon && insurance.status === 'Active' && (
                            <div className="expiring-banner">
                              ⚠️ Expiring soon! Renew before {new Date(insurance.end_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Available Packages Tab */}
            {activeTab === 'packages' && (
              <div className="insurance-section">
                {availablePackages.length === 0 ? (
                  <div className="empty-insurance-state">
                    <span className="empty-icon">📦</span>
                    <p>No insurance packages available at the moment</p>
                  </div>
                ) : (
                  <div className="packages-grid">
                    {availablePackages.map((pkg) => (
                      <div
                        key={pkg.insurance_package_id}
                        className="package-card"
                        onClick={() => setSelectedItem({ type: 'package', data: pkg })}
                      >
                        <div className="package-header">
                          <h3 className="package-name">{pkg.package_name}</h3>
                          <div className="package-price">
                            {formatCurrency(pkg.annual_limit)}
                            <span className="price-period">/year</span>
                          </div>
                        </div>

                        {pkg.description && (
                          <p className="package-description">{pkg.description}</p>
                        )}

                        <div className="package-features">
                          <div className="feature-item">
                            <span className="feature-icon">💰</span>
                            <span>Annual Coverage: {formatCurrency(pkg.annual_limit)}</span>
                          </div>
                          <div className="feature-item">
                            <span className="feature-icon">📊</span>
                            <span>Copayment: {pkg.copayment_percentage}%</span>
                          </div>
                          <div className="feature-item">
                            <span className="feature-icon">✅</span>
                            <span>Comprehensive Coverage</span>
                          </div>
                          <div className="feature-item">
                            <span className="feature-icon">🏥</span>
                            <span>All Clinics Included</span>
                          </div>
                        </div>

                        <button 
                          className="btn-primary-package"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('Please contact our staff to enroll in this package');
                          }}
                        >
                          Request Enrollment
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {selectedItem && (
          <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
            <div className="modal-content insurance-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {selectedItem.type === 'insurance' ? '💼 My Insurance Details' : '📦 Package Details'}
                </h2>
                <button className="modal-close" onClick={() => setSelectedItem(null)}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                {selectedItem.type === 'insurance' ? (
                  <>
                    <div className="detail-section">
                      <h3>Coverage Information</h3>
                      <p><strong>Package:</strong> {selectedItem.data.package_name}</p>
                      <p><strong>Status:</strong> <span className={`status-badge-insurance ${getStatusColor(selectedItem.data.status)}`}>{selectedItem.data.status}</span></p>
                      <p><strong>Annual Limit:</strong> {formatCurrency(selectedItem.data.annual_limit)}</p>
                      <p><strong>Copayment:</strong> {selectedItem.data.copayment_percentage}% (You pay this percentage)</p>
                    </div>

                    <div className="detail-section">
                      <h3>Validity Period</h3>
                      <p><strong>Start Date:</strong> {new Date(selectedItem.data.start_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</p>
                      <p><strong>End Date:</strong> {new Date(selectedItem.data.end_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</p>
                      {selectedItem.data.status === 'Active' && (
                        <p><strong>Days Remaining:</strong> {calculateDaysRemaining(selectedItem.data.end_date)} days</p>
                      )}
                    </div>

                    {selectedItem.data.package_description && (
                      <div className="detail-section">
                        <h3>Package Description</h3>
                        <p>{selectedItem.data.package_description}</p>
                      </div>
                    )}

                    <div className="detail-section">
                      <h3>Insurance ID</h3>
                      <p className="insurance-id-display">{selectedItem.data.insurance_id}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="detail-section">
                      <h3>Package Information</h3>
                      <p><strong>Package Name:</strong> {selectedItem.data.package_name}</p>
                      <p><strong>Annual Coverage:</strong> {formatCurrency(selectedItem.data.annual_limit)}</p>
                      <p><strong>Copayment:</strong> {selectedItem.data.copayment_percentage}%</p>
                    </div>

                    {selectedItem.data.description && (
                      <div className="detail-section">
                        <h3>Description</h3>
                        <p>{selectedItem.data.description}</p>
                      </div>
                    )}

                    <div className="detail-section">
                      <h3>Benefits</h3>
                      <ul className="benefits-list">
                        <li>✅ Comprehensive medical coverage</li>
                        <li>✅ Access to all clinic facilities</li>
                        <li>✅ Coverage for consultations and treatments</li>
                        <li>✅ {selectedItem.data.copayment_percentage}% copayment (You pay only {selectedItem.data.copayment_percentage}%)</li>
                        <li>✅ Annual limit of {formatCurrency(selectedItem.data.annual_limit)}</li>
                      </ul>
                    </div>

                    <button 
                      className="btn-primary-large"
                      onClick={() => {
                        setSelectedItem(null);
                        alert('Please visit our clinic or contact staff to enroll in this package');
                      }}
                    >
                      Request Enrollment
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .insurance-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .insurance-summary-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          transition: all 0.3s;
        }

        .insurance-summary-card:hover {
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.15);
          transform: translateY(-2px);
        }

        .insurance-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          background: white;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .insurance-tab {
          flex: 1;
          padding: 12px 20px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 15px;
        }

        .insurance-tab:hover {
          border-color: #7c3aed;
          background: #faf5ff;
        }

        .insurance-tab.active {
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          color: white;
          border-color: #7c3aed;
        }

        .insurance-content {
          min-height: 400px;
        }

        .insurance-section {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .empty-insurance-state {
          text-align: center;
          padding: 60px 30px;
        }

        .empty-insurance-graphic {
          margin-bottom: 30px;
        }

        .insurance-card-illustration {
          width: 200px;
          height: 120px;
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          border-radius: 16px;
          margin: 0 auto;
          position: relative;
          box-shadow: 0 10px 30px rgba(124, 58, 237, 0.3);
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .card-chip {
          width: 40px;
          height: 30px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          border-radius: 6px;
          position: absolute;
          top: 20px;
          left: 20px;
        }

        .card-stripe {
          height: 8px;
          background: rgba(255, 255, 255, 0.3);
          position: absolute;
          bottom: 30px;
          left: 20px;
          right: 20px;
          border-radius: 4px;
        }

        .insurance-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 24px;
        }

        .insurance-card-item {
          background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
          border: 2px solid #f1f5f9;
          border-radius: 20px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .insurance-card-item:hover {
          border-color: #7c3aed;
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.15);
          transform: translateY(-4px);
        }

        .insurance-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .insurance-icon {
          font-size: 40px;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
          border-radius: 16px;
        }

        .insurance-plan-name {
          font-size: 22px;
          font-weight: 800;
          color: #1a2332;
          margin-bottom: 20px;
        }

        .insurance-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        .insurance-detail-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 12px;
        }

        .detail-icon {
          font-size: 24px;
        }

        .detail-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          margin: 0;
        }

        .detail-value {
          font-size: 15px;
          color: #1a2332;
          font-weight: 700;
          margin: 4px 0 0 0;
        }

        .detail-value.expiring-soon {
          color: #dc2626;
        }

        .status-badge-insurance {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .status-active-insurance { background: #d1fae5; color: #065f46; }
        .status-inactive { background: #e5e7eb; color: #374151; }
        .status-expired { background: #fee2e2; color: #991b1b; }
        .status-pending { background: #fef3c7; color: #92400e; }

        .expiring-banner {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 10px;
          padding: 12px;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: #92400e;
        }

        .packages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .package-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          padding: 28px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .package-card:hover {
          border-color: #7c3aed;
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.15);
          transform: translateY(-4px);
        }

        .package-header {
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }

        .package-name {
          font-size: 24px;
          font-weight: 800;
          color: #1a2332;
          margin: 0 0 12px 0;
        }

        .package-price {
          font-size: 32px;
          font-weight: 800;
          color: #7c3aed;
          margin: 0;
        }

        .price-period {
          font-size: 16px;
          font-weight: 600;
          color: #64748b;
        }

        .package-description {
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .package-features {
          margin-bottom: 24px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #475569;
        }

        .feature-item:last-child {
          border-bottom: none;
        }

        .feature-icon {
          font-size: 20px;
        }

        .btn-primary-package {
          width: 100%;
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary-package:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
        }

        .insurance-modal {
          max-width: 700px;
        }

        .insurance-id-display {
          font-family: monospace;
          background: #f1f5f9;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          word-break: break-all;
        }

        .benefits-list {
          list-style: none;
          padding: 0;
        }

        .benefits-list li {
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .benefits-list li:last-child {
          border-bottom: none;
        }

        @media (max-width: 768px) {
          .insurance-summary-grid {
            grid-template-columns: 1fr;
          }

          .insurance-tabs {
            flex-direction: column;
          }

          .insurance-cards-grid,
          .packages-grid {
            grid-template-columns: 1fr;
          }

          .insurance-details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
