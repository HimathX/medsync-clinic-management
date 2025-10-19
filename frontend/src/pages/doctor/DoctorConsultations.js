import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DoctorHeader from '../../components/DoctorHeader';
import '../../styles/doctor.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorConsultations = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(searchParams.get('patient') || '');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    fetchConsultations();
  }, [navigate]);

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/consultation/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setConsultations(data);
      } else {
        throw new Error('Failed to fetch consultations');
      }
    } catch (err) {
      setError('Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="doctor-container">
        <DoctorHeader />
        <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>
      </div>
    );
  }

  return (
    <div className="doctor-container">
      <DoctorHeader />
      <div className="doctor-content">
        <div className="doctor-header">
          <h1>Consultations</h1>
          <p>Manage patient consultations</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Consultations Grid */}
        <div className="consultations-grid">
          {consultations.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-stethoscope"></i>
              <p>No consultations found</p>
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                <i className="fas fa-plus"></i> Start New Consultation
              </button>
            </div>
          ) : (
            consultations.map((consult) => (
              <div key={consult.consultation_id} className="consultation-card">
                <div className="consultation-header">
                  <h3>Patient ID: #{consult.patient_id}</h3>
                  <span className="date-badge">{formatDate(consult.consultation_date)}</span>
                </div>
                <div className="consultation-body">
                  <p><strong>Symptoms:</strong> {consult.symptoms || 'N/A'}</p>
                  <p><strong>Diagnosis:</strong> {consult.diagnosis || 'Pending'}</p>
                  <p><strong>Notes:</strong> {consult.doctor_notes || 'No notes'}</p>
                </div>
                <div className="consultation-footer">
                  <button className="btn-secondary" onClick={() => navigate(`/doctor/prescriptions?consultation=${consult.consultation_id}`)}>
                    <i className="fas fa-prescription"></i> Prescribe
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorConsultations;
