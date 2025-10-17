// src/pages/patient/Prescriptions.js - Patient Prescriptions with Real Data
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import prescriptionService from '../../services/prescriptionService';
import authService from '../../services/authService';
import '../../styles/patientDashboard.css';

export default function PatientPrescriptions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prescriptionHistory, setPrescriptionHistory] = useState([]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  // Get patient ID from auth
  const currentUser = authService.getCurrentUser();
  const patientId = currentUser?.patientId || localStorage.getItem('patientId');

  useEffect(() => {
    if (!patientId) {
      navigate('/patient-login');
      return;
    }
    fetchPrescriptionHistory();
  }, [patientId]);

  const fetchPrescriptionHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('💊 Fetching prescription history for patient:', patientId);

      const data = await prescriptionService.getPatientPrescriptionHistory(patientId);

      console.log('✅ Prescription history fetched:', data);

      setPrescriptionHistory(data.history || []);
    } catch (err) {
      console.error('❌ Error fetching prescriptions:', err);
      setError(err.message || 'Failed to load prescription history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-portal">
      <nav className="patient-top-nav">
        <div className="patient-top-nav-content">
          <button className="btn-secondary" onClick={() => navigate('/patient/dashboard')}>← Back to Dashboard</button>
          <h2 style={{color: 'white', margin: 0}}>My Prescriptions</h2>
          <div></div>
        </div>
      </nav>

      <div className="patient-container" style={{paddingTop: '40px'}}>
        {/* Summary Cards */}
        <div className="prescriptions-summary-grid">
          <div className="summary-card">
            <div className="summary-icon">💊</div>
            <div className="summary-details">
              <h3 className="summary-number">{prescriptionHistory.length}</h3>
              <p className="summary-label">Total Consultations</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📋</div>
            <div className="summary-details">
              <h3 className="summary-number">
                {prescriptionHistory.reduce((total, consultation) => total + consultation.medications.length, 0)}
              </h3>
              <p className="summary-label">Total Prescriptions</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">👨‍⚕️</div>
            <div className="summary-details">
              <h3 className="summary-number">
                {new Set(prescriptionHistory.map(c => c.doctor_name)).size}
              </h3>
              <p className="summary-label">Doctors</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="spinner">⏳</div>
            <p>Loading prescriptions...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Prescriptions</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={fetchPrescriptionHistory}>
              🔄 Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && prescriptionHistory.length === 0 && (
          <div className="empty-prescriptions-state">
            <div className="empty-icon">💊</div>
            <h3>No Prescriptions Yet</h3>
            <p>You don't have any prescription history. Your prescriptions will appear here after consultations.</p>
            <button className="btn-primary" onClick={() => navigate('/patient/book')}>
              📅 Book Appointment
            </button>
          </div>
        )}

        {/* Prescriptions List */}
        {!loading && !error && prescriptionHistory.length > 0 && (
          <div className="prescriptions-container">
            <h3 style={{fontSize: '28px', fontWeight: 800, color: '#1a2332', marginBottom: '24px'}}>
              Prescription History
            </h3>

            <div className="prescriptions-timeline">
              {prescriptionHistory.map((consultation, index) => (
                <div key={consultation.consultation_rec_id} className="prescription-consultation-card">
                  <div className="consultation-header">
                    <div className="consultation-info">
                      <h4 className="consultation-date">
                        📅 {new Date(consultation.available_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h4>
                      <p className="consultation-doctor">👨‍⚕️ {consultation.doctor_name}</p>
                    </div>
                    <button 
                      className="view-details-btn"
                      onClick={() => setSelectedConsultation(consultation)}
                    >
                      View Details
                    </button>
                  </div>

                  {consultation.diagnoses && (
                    <div className="consultation-diagnosis">
                      <strong>Diagnosis:</strong> {consultation.diagnoses}
                    </div>
                  )}

                  <div className="medications-list">
                    {consultation.medications.map((med) => (
                      <div key={med.prescription_item_id} className="medication-item">
                        <div className="medication-icon">💊</div>
                        <div className="medication-details">
                          <h5 className="medication-name">{med.generic_name}</h5>
                          <div className="medication-info-grid">
                            <div className="info-item">
                              <span className="info-label">Dosage:</span>
                              <span className="info-value">{med.dosage}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">Frequency:</span>
                              <span className="info-value">{med.frequency}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">Duration:</span>
                              <span className="info-value">{med.duration_days} days</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">Form:</span>
                              <span className="info-value">{med.form}</span>
                            </div>
                          </div>
                          {med.instructions && (
                            <div className="medication-instructions">
                              <strong>Instructions:</strong> {med.instructions}
                            </div>
                          )}
                          {med.manufacturer && (
                            <div className="medication-manufacturer">
                              Manufactured by: {med.manufacturer}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedConsultation && (
          <div className="modal-overlay" onClick={() => setSelectedConsultation(null)}>
            <div className="modal-content prescription-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>💊 Consultation Details</h2>
                <button className="modal-close" onClick={() => setSelectedConsultation(null)}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="detail-section">
                  <h3>Consultation Information</h3>
                  <p><strong>Date:</strong> {new Date(selectedConsultation.available_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                  <p><strong>Doctor:</strong> {selectedConsultation.doctor_name}</p>
                  {selectedConsultation.symptoms && (
                    <p><strong>Symptoms:</strong> {selectedConsultation.symptoms}</p>
                  )}
                  {selectedConsultation.diagnoses && (
                    <p><strong>Diagnosis:</strong> {selectedConsultation.diagnoses}</p>
                  )}
                </div>

                <div className="detail-section">
                  <h3>Prescribed Medications ({selectedConsultation.medications.length})</h3>
                  {selectedConsultation.medications.map((med, index) => (
                    <div key={med.prescription_item_id} className="medication-detail-card">
                      <h4>{index + 1}. {med.generic_name}</h4>
                      <p><strong>Dosage:</strong> {med.dosage}</p>
                      <p><strong>Frequency:</strong> {med.frequency}</p>
                      <p><strong>Duration:</strong> {med.duration_days} days</p>
                      <p><strong>Form:</strong> {med.form}</p>
                      {med.manufacturer && <p><strong>Manufacturer:</strong> {med.manufacturer}</p>}
                      {med.instructions && <p><strong>Instructions:</strong> {med.instructions}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .prescriptions-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .prescriptions-container {
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .prescriptions-timeline {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .prescription-consultation-card {
          background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s;
        }

        .prescription-consultation-card:hover {
          border-color: #7c3aed;
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.15);
        }

        .consultation-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f5f9;
        }

        .consultation-date {
          font-size: 20px;
          font-weight: 700;
          color: #1a2332;
          margin: 0 0 8px 0;
        }

        .consultation-doctor {
          font-size: 16px;
          color: #64748b;
          font-weight: 600;
          margin: 0;
        }

        .consultation-diagnosis {
          background: #fef3c7;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
          color: #92400e;
        }

        .view-details-btn {
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .view-details-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }

        .medications-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .medication-item {
          display: flex;
          gap: 16px;
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #f1f5f9;
        }

        .medication-icon {
          font-size: 40px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
          border-radius: 12px;
          flex-shrink: 0;
        }

        .medication-details {
          flex: 1;
        }

        .medication-name {
          font-size: 18px;
          font-weight: 700;
          color: #1a2332;
          margin: 0 0 12px 0;
        }

        .medication-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
        }

        .info-value {
          font-size: 14px;
          color: #1a2332;
          font-weight: 600;
        }

        .medication-instructions {
          background: #dbeafe;
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          color: #1e40af;
          margin-top: 8px;
        }

        .medication-manufacturer {
          font-size: 12px;
          color: #64748b;
          margin-top: 8px;
        }

        .empty-prescriptions-state {
          background: white;
          border-radius: 20px;
          padding: 60px 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          text-align: center;
        }

        .empty-prescriptions-state .empty-icon {
          font-size: 80px;
          margin-bottom: 20px;
          display: block;
        }

        .empty-prescriptions-state h3 {
          font-size: 28px;
          font-weight: 700;
          color: #1a2332;
          margin-bottom: 12px;
        }

        .empty-prescriptions-state p {
          font-size: 16px;
          color: #64748b;
          margin-bottom: 24px;
        }

        .prescription-modal {
          max-width: 800px;
        }

        .medication-detail-card {
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 16px;
          border: 1px solid #e2e8f0;
        }

        .medication-detail-card h4 {
          color: #7c3aed;
          margin-bottom: 12px;
        }

        .medication-detail-card p {
          margin: 6px 0;
          color: #475569;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .prescriptions-summary-grid {
            grid-template-columns: 1fr;
          }

          .consultation-header {
            flex-direction: column;
            gap: 12px;
          }

          .view-details-btn {
            width: 100%;
          }

          .medication-info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
