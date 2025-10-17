// src/pages/patient/HealthConditions.js - Patient Health Conditions & Allergies
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import conditionsService from '../../services/conditionsService';
import authService from '../../services/authService';
import '../../styles/patientDashboard.css';

export default function HealthConditions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'conditions', 'allergies'
  const [selectedItem, setSelectedItem] = useState(null);

  // Get patient ID from auth
  const currentUser = authService.getCurrentUser();
  const patientId = currentUser?.patientId || localStorage.getItem('patientId');

  useEffect(() => {
    if (!patientId) {
      navigate('/patient-login');
      return;
    }
    fetchHealthData();
  }, [patientId]);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🏥 Fetching health conditions for patient:', patientId);

      const [allergiesData, conditionsData] = await Promise.all([
        conditionsService.getPatientAllergies(patientId),
        conditionsService.getPatientConditions(patientId, false)
      ]);

      console.log('✅ Health data fetched:', { allergies: allergiesData, conditions: conditionsData });

      setAllergies(allergiesData.allergies || []);
      setConditions(conditionsData.conditions || []);
    } catch (err) {
      console.error('❌ Error fetching health data:', err);
      setError(err.message || 'Failed to load health conditions');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'Mild': 'severity-mild',
      'Moderate': 'severity-moderate',
      'Severe': 'severity-severe',
      'Life-threatening': 'severity-critical'
    };
    return colors[severity] || 'severity-mild';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'status-active',
      'In Treatment': 'status-treatment',
      'Managed': 'status-managed',
      'Resolved': 'status-resolved'
    };
    return colors[status] || 'status-active';
  };

  return (
    <div className="patient-portal">
      {/* Header */}
      <nav className="patient-top-nav">
        <div className="patient-top-nav-content">
          <button className="btn-secondary" onClick={() => navigate('/patient/dashboard')}>
            ← Back to Dashboard
          </button>
          <h2 style={{ color: 'white', margin: 0 }}>Health Conditions</h2>
          <div></div>
        </div>
      </nav>

      <div className="patient-container" style={{ paddingTop: '40px' }}>
        {/* Summary Cards */}
        <div className="summary-cards-grid">
          <div className="summary-card">
            <div className="summary-icon">🤧</div>
            <div className="summary-details">
              <h3 className="summary-number">{allergies.length}</h3>
              <p className="summary-label">Known Allergies</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">🏥</div>
            <div className="summary-details">
              <h3 className="summary-number">{conditions.length}</h3>
              <p className="summary-label">Medical Conditions</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">⚠️</div>
            <div className="summary-details">
              <h3 className="summary-number">
                {conditions.filter(c => c.is_chronic).length}
              </h3>
              <p className="summary-label">Chronic Conditions</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">✅</div>
            <div className="summary-details">
              <h3 className="summary-number">
                {conditions.filter(c => c.current_status === 'Active' || c.current_status === 'In Treatment').length}
              </h3>
              <p className="summary-label">Active Conditions</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="health-tabs">
          <button
            className={`health-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            📋 All ({allergies.length + conditions.length})
          </button>
          <button
            className={`health-tab ${activeTab === 'conditions' ? 'active' : ''}`}
            onClick={() => setActiveTab('conditions')}
          >
            🏥 Medical Conditions ({conditions.length})
          </button>
          <button
            className={`health-tab ${activeTab === 'allergies' ? 'active' : ''}`}
            onClick={() => setActiveTab('allergies')}
          >
            🤧 Allergies ({allergies.length})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="spinner">⏳</div>
            <p>Loading health conditions...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Health Data</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={fetchHealthData}>
              🔄 Try Again
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <div className="health-content">
            {/* Allergies Section */}
            {(activeTab === 'all' || activeTab === 'allergies') && (
              <div className="health-section">
                <h2 className="section-title">🤧 Allergies</h2>
                {allergies.length === 0 ? (
                  <div className="empty-health-state">
                    <span className="empty-icon">🎉</span>
                    <p>No known allergies recorded</p>
                  </div>
                ) : (
                  <div className="health-items-grid">
                    {allergies.map((allergy) => (
                      <div
                        key={allergy.patient_allergy_id}
                        className="health-item allergy-item"
                        onClick={() => setSelectedItem({ type: 'allergy', data: allergy })}
                      >
                        <div className="item-header">
                          <div className="item-icon">🤧</div>
                          <div className="item-title-section">
                            <h3 className="item-title">{allergy.allergy_name}</h3>
                            <span className={`severity-badge ${getSeverityColor(allergy.severity)}`}>
                              {allergy.severity}
                            </span>
                          </div>
                        </div>
                        <div className="item-details">
                          {allergy.reaction_description && (
                            <div className="detail-row">
                              <span className="detail-label">Reaction:</span>
                              <span className="detail-value">{allergy.reaction_description}</span>
                            </div>
                          )}
                          {allergy.diagnosed_date && (
                            <div className="detail-row">
                              <span className="detail-label">Diagnosed:</span>
                              <span className="detail-value">
                                {new Date(allergy.diagnosed_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Medical Conditions Section */}
            {(activeTab === 'all' || activeTab === 'conditions') && (
              <div className="health-section">
                <h2 className="section-title">🏥 Medical Conditions</h2>
                {conditions.length === 0 ? (
                  <div className="empty-health-state">
                    <span className="empty-icon">🎉</span>
                    <p>No medical conditions recorded</p>
                  </div>
                ) : (
                  <div className="health-items-grid">
                    {conditions.map((condition) => (
                      <div
                        key={`${condition.patient_id}-${condition.condition_id}`}
                        className="health-item condition-item"
                        onClick={() => setSelectedItem({ type: 'condition', data: condition })}
                      >
                        <div className="item-header">
                          <div className="item-icon">
                            {condition.is_chronic ? '⚠️' : '🏥'}
                          </div>
                          <div className="item-title-section">
                            <h3 className="item-title">{condition.condition_name}</h3>
                            <span className={`status-badge ${getStatusColor(condition.current_status)}`}>
                              {condition.current_status}
                            </span>
                          </div>
                        </div>

                        <div className="item-meta">
                          <span className="meta-tag">{condition.category_name}</span>
                          {condition.is_chronic && (
                            <span className="meta-tag chronic">Chronic</span>
                          )}
                        </div>

                        <div className="item-details">
                          {condition.diagnosed_date && (
                            <div className="detail-row">
                              <span className="detail-label">Diagnosed:</span>
                              <span className="detail-value">
                                {new Date(condition.diagnosed_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                          {condition.severity && (
                            <div className="detail-row">
                              <span className="detail-label">Severity:</span>
                              <span className="detail-value">{condition.severity}</span>
                            </div>
                          )}
                          {condition.notes && (
                            <div className="detail-row">
                              <span className="detail-label">Notes:</span>
                              <span className="detail-value">{condition.notes}</span>
                            </div>
                          )}
                        </div>
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
            <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {selectedItem.type === 'allergy' ? '🤧' : '🏥'} {' '}
                  {selectedItem.type === 'allergy' ? 'Allergy Details' : 'Condition Details'}
                </h2>
                <button className="modal-close" onClick={() => setSelectedItem(null)}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                {selectedItem.type === 'allergy' ? (
                  <>
                    <div className="detail-section">
                      <h3>Allergy Information</h3>
                      <p><strong>Allergen:</strong> {selectedItem.data.allergy_name}</p>
                      <p><strong>Severity:</strong> <span className={`severity-badge ${getSeverityColor(selectedItem.data.severity)}`}>{selectedItem.data.severity}</span></p>
                      {selectedItem.data.reaction_description && (
                        <p><strong>Reaction:</strong> {selectedItem.data.reaction_description}</p>
                      )}
                      {selectedItem.data.diagnosed_date && (
                        <p><strong>Diagnosed:</strong> {new Date(selectedItem.data.diagnosed_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="detail-section">
                      <h3>Condition Information</h3>
                      <p><strong>Condition:</strong> {selectedItem.data.condition_name}</p>
                      <p><strong>Category:</strong> {selectedItem.data.category_name}</p>
                      <p><strong>Status:</strong> <span className={`status-badge ${getStatusColor(selectedItem.data.current_status)}`}>{selectedItem.data.current_status}</span></p>
                      <p><strong>Type:</strong> {selectedItem.data.is_chronic ? 'Chronic' : 'Acute'}</p>
                      {selectedItem.data.severity && (
                        <p><strong>Severity:</strong> {selectedItem.data.severity}</p>
                      )}
                      {selectedItem.data.diagnosed_date && (
                        <p><strong>Diagnosed:</strong> {new Date(selectedItem.data.diagnosed_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</p>
                      )}
                    </div>

                    {selectedItem.data.condition_description && (
                      <div className="detail-section">
                        <h3>Description</h3>
                        <p>{selectedItem.data.condition_description}</p>
                      </div>
                    )}

                    {selectedItem.data.notes && (
                      <div className="detail-section">
                        <h3>Medical Notes</h3>
                        <p>{selectedItem.data.notes}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .summary-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .summary-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          transition: all 0.3s;
        }

        .summary-card:hover {
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.15);
          transform: translateY(-2px);
        }

        .summary-icon {
          font-size: 48px;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
          border-radius: 16px;
        }

        .summary-details {
          flex: 1;
        }

        .summary-number {
          font-size: 32px;
          font-weight: 800;
          color: #7c3aed;
          margin: 0 0 5px 0;
        }

        .summary-label {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          font-weight: 600;
        }

        .health-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          background: white;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .health-tab {
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

        .health-tab:hover {
          border-color: #7c3aed;
          background: #faf5ff;
        }

        .health-tab.active {
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          color: white;
          border-color: #7c3aed;
        }

        .health-content {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .health-section {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .section-title {
          font-size: 24px;
          font-weight: 700;
          color: #1a2332;
          margin: 0 0 24px 0;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f5f9;
        }

        .health-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .health-item {
          background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
          border: 2px solid #f1f5f9;
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .health-item:hover {
          border-color: #7c3aed;
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.15);
          transform: translateY(-2px);
        }

        .item-header {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          margin-bottom: 15px;
        }

        .item-icon {
          font-size: 36px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
          border-radius: 12px;
          flex-shrink: 0;
        }

        .item-title-section {
          flex: 1;
        }

        .item-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a2332;
          margin: 0 0 8px 0;
        }

        .severity-badge, .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .severity-mild { background: #dbeafe; color: #1e40af; }
        .severity-moderate { background: #fef3c7; color: #92400e; }
        .severity-severe { background: #fed7aa; color: #9a3412; }
        .severity-critical { background: #fee2e2; color: #991b1b; }

        .status-active { background: #fef3c7; color: #92400e; }
        .status-treatment { background: #dbeafe; color: #1e40af; }
        .status-managed { background: #d1fae5; color: #065f46; }
        .status-resolved { background: #e5e7eb; color: #374151; }

        .item-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .meta-tag {
          padding: 4px 12px;
          background: #f1f5f9;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
        }

        .meta-tag.chronic {
          background: #fef3c7;
          color: #92400e;
        }

        .item-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .detail-label {
          font-weight: 600;
          color: #64748b;
          font-size: 13px;
          flex-shrink: 0;
        }

        .detail-value {
          color: #1a2332;
          font-size: 13px;
          text-align: right;
        }

        .empty-health-state {
          text-align: center;
          padding: 40px 20px;
        }

        .empty-health-state .empty-icon {
          font-size: 64px;
          display: block;
          margin-bottom: 15px;
        }

        .empty-health-state p {
          color: #64748b;
          font-size: 16px;
        }

        .detail-modal {
          max-width: 700px;
        }

        .detail-section {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 2px solid #f1f5f9;
        }

        .detail-section:last-child {
          border-bottom: none;
        }

        .detail-section h3 {
          font-size: 18px;
          font-weight: 700;
          color: #1a2332;
          margin-bottom: 12px;
        }

        .detail-section p {
          margin: 8px 0;
          color: #475569;
          line-height: 1.6;
        }

        .detail-section strong {
          color: #1a2332;
          font-weight: 600;
          margin-right: 8px;
        }

        @media (max-width: 768px) {
          .summary-cards-grid {
            grid-template-columns: 1fr;
          }

          .health-tabs {
            flex-direction: column;
          }

          .health-items-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
