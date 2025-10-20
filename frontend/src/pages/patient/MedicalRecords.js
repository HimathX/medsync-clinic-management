// src/pages/patient/MedicalRecords.js - Patient Medical Records
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../../services/authService'
import prescriptionService from '../../services/prescriptionService'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function PatientMedicalRecords() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Medical records state
  const [consultations, setConsultations] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [treatments, setTreatments] = useState([])
  const [allRecords, setAllRecords] = useState([])
  
  // Modal state
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showModal, setShowModal] = useState(false)
  
  // Get patient ID
  const currentUser = authService.getCurrentUser();
  const patientId = currentUser?.patientId || localStorage.getItem('patientId');

  // Fetch medical records on mount
  useEffect(() => {
    if (!patientId) {
      navigate('/patient-login');
      return;
    }
    fetchMedicalRecords();
  }, [patientId, navigate]);

  const fetchMedicalRecords = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Fetch consultations
      const consultationResponse = await fetch(
        `${API_BASE_URL}/consultations/patient/${patientId}/history`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Fetch prescriptions using the new endpoint
      let prescriptionData = {};
      try {
        prescriptionData = await prescriptionService.getPatientPrescriptions(patientId, 0, 100, 'recent');
      } catch (error) {
        console.warn('⚠️ Warning fetching prescriptions:', error);
        prescriptionData = { consultations_with_prescriptions: [] };
      }

      if (consultationResponse.ok) {
        const consultationDataResponse = await consultationResponse.json();
        
        console.log('✅ Consultations:', consultationDataResponse);
        console.log('✅ Prescriptions:', prescriptionData);
        
        // Extract consultation IDs to fetch treatments
        const consultationIds = (Array.isArray(consultationDataResponse) ? consultationDataResponse : consultationDataResponse.consultations || [])
          .map(c => c.consultation_rec_id)
          .filter(id => id);
        
        // Fetch treatments for all consultations
        let allTreatments = [];
        if (consultationIds.length > 0) {
          const treatmentPromises = consultationIds.map(consultationId =>
            fetch(`${API_BASE_URL}/treatment-records/consultation/${consultationId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }).then(res => res.ok ? res.json() : { treatments: [] })
          );
          
          const treatmentResults = await Promise.all(treatmentPromises);
          allTreatments = treatmentResults.flatMap(result => result.treatments || []);
          console.log('✅ Treatments:', allTreatments);
        }
        
        // Get consultation IDs that have prescriptions to filter them out
        const consultationsWithPrescriptions = prescriptionData.consultations_with_prescriptions || [];
        const consultationIdsWithPrescriptions = new Set(
          consultationsWithPrescriptions.map(c => c.consultation_rec_id)
        );
        
        // Process consultations (exclude those with prescriptions to avoid duplicates)
        const allConsultations = Array.isArray(consultationDataResponse) ? consultationDataResponse : consultationDataResponse.consultations || [];
        const consultationRecords = allConsultations
          .filter(item => !consultationIdsWithPrescriptions.has(item.consultation_rec_id))
          .map(item => ({
            id: item.consultation_rec_id || item.id,
            date: item.consultation_date || item.date,
            type: 'Consultation',
            doctor: item.doctor_name || 'N/A',
            description: item.diagnosis || item.description || 'Medical consultation',
            details: item
          }));
        
        // Process prescriptions from the new endpoint
        const prescriptionRecords = [];
        
        consultationsWithPrescriptions.forEach(consultation => {
          const medications = consultation.medications || [];
          // Always create a prescription record for consultations with medications
          // Use a unique ID by prefixing with 'rx-' to avoid key conflicts
          prescriptionRecords.push({
            id: `rx-${consultation.consultation_rec_id || consultation.id}`,
            consultationId: consultation.consultation_rec_id,
            date: consultation.consultation_date || consultation.date,
            type: 'Prescription',
            doctor: consultation.doctor_name || 'N/A',
            description: `${medications.length} medication${medications.length !== 1 ? 's' : ''} prescribed`,
            details: {
              ...consultation,
              medications: medications
            }
          });
        });
        
        // Process treatments
        const treatmentRecords = allTreatments.map(item => ({
          id: item.treatment_id || item.id,
          date: item.created_at || item.date,
          type: 'Treatment',
          doctor: 'N/A',
          description: item.treatment_name || 'Treatment procedure',
          details: item
        }));
        
        setConsultations(consultationRecords);
        setPrescriptions(prescriptionRecords);
        setTreatments(treatmentRecords);
        
        // Combine and sort all records by date
        const combined = [...consultationRecords, ...prescriptionRecords, ...treatmentRecords]
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setAllRecords(combined);
        
      } else {
        throw new Error('Failed to fetch medical records');
      }
    } catch (err) {
      console.error('❌ Error fetching medical records:', err);
      setError('Failed to load medical records');
      setAllRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered records based on active tab
  const getFilteredRecords = () => {
    if (activeTab === 'consultations') return consultations;
    if (activeTab === 'prescriptions') return prescriptions;
    if (activeTab === 'treatments') return treatments;
    return allRecords;
  };

  const records = getFilteredRecords()

  const handleRecordClick = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRecord(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="patient-portal">
        <nav className="patient-top-nav">
          <div className="patient-top-nav-content">
            <button className="btn-secondary" onClick={() => navigate('/patient/dashboard')}>← Back</button>
            <h2 style={{color: 'white', margin: 0}}>Medical Records</h2>
            <div></div>
          </div>
        </nav>
        <div className="patient-container" style={{paddingTop: '40px', textAlign: 'center'}}>
          <div style={{fontSize: '48px', marginBottom: '20px'}}>⏳</div>
          <h2>Loading Medical Records...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-portal">
      <nav className="patient-top-nav">
        <div className="patient-top-nav-content">
          <button className="btn-secondary" onClick={() => navigate('/patient/dashboard')}>← Back</button>
          <h2 style={{color: 'white', margin: 0}}>Medical Records</h2>
          <button className="btn-secondary" onClick={fetchMedicalRecords} title="Refresh">
            🔄 Refresh
          </button>
        </div>
      </nav>

      <div className="patient-container" style={{paddingTop: '40px'}}>
        {error && (
          <div style={{background: '#fee2e2', padding: '20px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center'}}>
            <div style={{fontSize: '36px', marginBottom: '12px'}}>⚠️</div>
            <div style={{color: '#991b1b', fontWeight: '600'}}>{error}</div>
            <button className="btn-primary" onClick={fetchMedicalRecords} style={{marginTop: '12px'}}>Retry</button>
          </div>
        )}
        
        <div style={{background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'}}>
          <div style={{display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #e2e8f0'}}>
            {[{ key: 'all', label: `All Records (${allRecords.length})` }, 
              // { key: 'consultations', label: `Consultations (${consultations.length})` },
              { key: 'prescriptions', label: `Prescriptions (${prescriptions.length})` },
              { key: 'treatments', label: `Treatments (${treatments.length})` }].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '15px 25px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.key ? '3px solid #7c3aed' : '3px solid transparent',
                  fontWeight: 700,
                  fontSize: '16px',
                  color: activeTab === tab.key ? '#7c3aed' : '#64748b',
                  cursor: 'pointer',
                  marginBottom: '-2px'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {records.length === 0 ? (
            <div style={{textAlign: 'center', padding: '60px', color: '#9ca3af'}}>
              <div style={{fontSize: '64px', marginBottom: '20px'}}>📋</div>
              <h3 style={{color: '#6b7280', marginBottom: '8px'}}>No Medical Records Found</h3>
              <p>You don't have any {activeTab === 'all' ? 'medical records' : activeTab} yet.</p>
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
              {records.map(record => (
                <div 
                  key={record.id} 
                  onClick={() => handleRecordClick(record)}
                  style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    padding: '25px',
                    borderRadius: '16px',
                    border: '2px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <div>
                      <h4 style={{fontSize: '18px', fontWeight: 700, color: '#1a2332', marginBottom: '8px'}}>
                        {record.description}
                      </h4>
                      <p style={{fontSize: '14px', color: '#64748b', marginBottom: '5px'}}>
                        {record.doctor} • {new Date(record.date).toLocaleDateString()}
                      </p>
                      <span style={{
                        padding: '4px 12px',
                        background: record.type === 'Consultation' ? '#10b981' : 
                                   record.type === 'Prescription' ? '#f59e0b' : '#8b5cf6',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}>
                        {record.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for displaying full record details */}
      {showModal && selectedRecord && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={closeModal}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '40px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>

            {/* Record Header */}
            <div style={{marginBottom: '30px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
                <span style={{
                  padding: '6px 16px',
                  background: selectedRecord.type === 'Consultation' ? '#10b981' : 
                             selectedRecord.type === 'Prescription' ? '#f59e0b' : '#8b5cf6',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '700'
                }}>
                  {selectedRecord.type}
                </span>
                <span style={{color: '#64748b', fontSize: '14px'}}>
                  {new Date(selectedRecord.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <h2 style={{fontSize: '24px', fontWeight: '700', color: '#1a2332', margin: '0 0 8px 0'}}>
                {selectedRecord.description}
              </h2>
              <p style={{color: '#64748b', margin: 0}}>
                Doctor: {selectedRecord.doctor}
              </p>
            </div>

            {/* Record Details */}
            <div style={{borderTop: '2px solid #e2e8f0', paddingTop: '24px'}}>
              {selectedRecord.type === 'Prescription' && selectedRecord.details.medications && (
                <div>
                  <h3 style={{fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#1a2332'}}>
                    💊 Prescribed Medications
                  </h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                    {selectedRecord.details.medications.map((med, index) => (
                      <div 
                        key={index}
                        style={{
                          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                          padding: '20px',
                          borderRadius: '12px',
                          border: '2px solid #fcd34d'
                        }}
                      >
                        <div style={{marginBottom: '16px'}}>
                          <h4 style={{fontSize: '18px', fontWeight: '700', color: '#92400e', margin: '0 0 4px 0'}}>
                            💊 {med.generic_name || 'N/A'}
                          </h4>
                          <p style={{color: '#b45309', margin: '0', fontSize: '14px', fontWeight: '600'}}>
                            {med.manufacturer && `by ${med.manufacturer}`}
                          </p>
                        </div>
                        
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', marginBottom: '12px'}}>
                          <div>
                            <span style={{color: '#92400e', fontWeight: '600'}}>Form:</span>
                            <span style={{marginLeft: '8px', color: '#1a2332', fontWeight: '500'}}>
                              {med.form || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span style={{color: '#92400e', fontWeight: '600'}}>Dosage:</span>
                            <span style={{marginLeft: '8px', color: '#1a2332', fontWeight: '500'}}>
                              {med.dosage || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span style={{color: '#92400e', fontWeight: '600'}}>Frequency:</span>
                            <span style={{marginLeft: '8px', color: '#1a2332', fontWeight: '500'}}>
                              {med.frequency || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span style={{color: '#92400e', fontWeight: '600'}}>Duration:</span>
                            <span style={{marginLeft: '8px', color: '#1a2332', fontWeight: '500'}}>
                              {med.duration_days ? `${med.duration_days} days` : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {med.instructions && (
                          <div style={{marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #fcd34d'}}>
                            <span style={{color: '#92400e', fontWeight: '600', fontSize: '14px'}}>📋 Instructions:</span>
                            <p style={{margin: '4px 0 0 0', color: '#1a2332', fontSize: '14px'}}>
                              {med.instructions}
                            </p>
                          </div>
                        )}

                        {med.contraindications && (
                          <div style={{marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #fcd34d'}}>
                            <span style={{color: '#92400e', fontWeight: '600', fontSize: '14px'}}>⚠️ Contraindications:</span>
                            <p style={{margin: '4px 0 0 0', color: '#1a2332', fontSize: '14px'}}>
                              {med.contraindications}
                            </p>
                          </div>
                        )}

                        {med.side_effects && (
                          <div>
                            <span style={{color: '#92400e', fontWeight: '600', fontSize: '14px'}}>⚡ Side Effects:</span>
                            <p style={{margin: '4px 0 0 0', color: '#1a2332', fontSize: '14px'}}>
                              {med.side_effects}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecord.type === 'Consultation' && (
                <div>
                  <h3 style={{fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#1a2332'}}>
                    🏥 Consultation Details
                  </h3>
                  <div style={{background: '#f8fafc', padding: '20px', borderRadius: '12px'}}>
                    {selectedRecord.details.diagnosis && (
                      <div style={{marginBottom: '16px'}}>
                        <h4 style={{fontSize: '14px', fontWeight: '700', color: '#64748b', marginBottom: '8px'}}>Diagnosis:</h4>
                        <p style={{margin: 0, color: '#1a2332'}}>{selectedRecord.details.diagnosis}</p>
                      </div>
                    )}
                    {selectedRecord.details.symptoms && (
                      <div style={{marginBottom: '16px'}}>
                        <h4 style={{fontSize: '14px', fontWeight: '700', color: '#64748b', marginBottom: '8px'}}>Symptoms:</h4>
                        <p style={{margin: 0, color: '#1a2332'}}>{selectedRecord.details.symptoms}</p>
                      </div>
                    )}
                    {selectedRecord.details.treatment_plan && (
                      <div>
                        <h4 style={{fontSize: '14px', fontWeight: '700', color: '#64748b', marginBottom: '8px'}}>Treatment Plan:</h4>
                        <p style={{margin: 0, color: '#1a2332'}}>{selectedRecord.details.treatment_plan}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRecord.type === 'Treatment' && (
                <div>
                  <h3 style={{fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#1a2332'}}>
                    🩺 Treatment Details
                  </h3>
                  <div style={{background: '#f8fafc', padding: '20px', borderRadius: '12px'}}>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                      {selectedRecord.details.treatment_name && (
                        <div>
                          <h4 style={{fontSize: '14px', fontWeight: '700', color: '#64748b', marginBottom: '4px'}}>Treatment:</h4>
                          <p style={{margin: 0, color: '#1a2332'}}>{selectedRecord.details.treatment_name}</p>
                        </div>
                      )}
                      {selectedRecord.details.treatment_description && (
                        <div>
                          <h4 style={{fontSize: '14px', fontWeight: '700', color: '#64748b', marginBottom: '4px'}}>Description:</h4>
                          <p style={{margin: 0, color: '#1a2332'}}>{selectedRecord.details.treatment_description}</p>
                        </div>
                      )}
                      {selectedRecord.details.duration && (
                        <div>
                          <h4 style={{fontSize: '14px', fontWeight: '700', color: '#64748b', marginBottom: '4px'}}>Duration:</h4>
                          <p style={{margin: 0, color: '#1a2332'}}>{selectedRecord.details.duration}</p>
                        </div>
                      )}
                      {selectedRecord.details.base_price && (
                        <div>
                          <h4 style={{fontSize: '14px', fontWeight: '700', color: '#64748b', marginBottom: '4px'}}>Cost:</h4>
                          <p style={{margin: 0, color: '#1a2332'}}>Rs. {selectedRecord.details.base_price}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #e2e8f0', textAlign: 'right'}}>
              <button
                onClick={closeModal}
                className="btn-primary"
                style={{padding: '12px 24px'}}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
