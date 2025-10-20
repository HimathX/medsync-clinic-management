import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DoctorNavBar from '../../components/DoctorNavBar';
import DoctorPageHeader from '../../components/DoctorPageHeader';
import '../../styles/doctor.css';
import '../../styles/patientDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorConsultations = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctorData, setDoctorData] = useState({
    name: 'Doctor',
    specialization: 'Physician'
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(searchParams.get('patient') || '');

  useEffect(() => {
    const checkAuth = () => {
      const userId = localStorage.getItem('user_id');
      const userType = localStorage.getItem('user_type');
      const doctorId = localStorage.getItem('doctor_id');
      const token = localStorage.getItem('token');

      // Load doctor data
      const fullName = localStorage.getItem('full_name') || 'Doctor';
      setDoctorData({
        name: fullName,
        specialization: localStorage.getItem('specialization') || 'Physician'
      });

      if (!userId || !token || userType !== 'doctor') {
        navigate('/doctor-login', { replace: true });
        return;
      }
    };

    checkAuth();
    fetchConsultations(localStorage.getItem('doctor_id'));
  }, [navigate]);

  const fetchConsultations = async (doctorId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No token found');
        setError('Authentication token missing. Please login again.');
        setLoading(false);
        return;
      }

      console.log('📡 Fetching consultations for doctor:', doctorId);
      
      // Use doctor_id filter to get only this doctor's consultations
      const url = `${API_BASE_URL}/consultations?doctor_id=${doctorId}`;
      console.log('📍 API URL:', url);

      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Consultations loaded:', data);
        setConsultations(Array.isArray(data) ? data : data.consultations || []);
        setError('');
      } else if (response.status === 404) {
        console.log('ℹ️ No consultations found (404)');
        setConsultations([]);
        setError('');
      } else {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Failed to fetch consultations: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Error loading consultations:', err);
      setError(`Failed to load consultations: ${err.message}`);
      setConsultations([]);
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
      <div className="patient-portal">
        <DoctorNavBar />
        <DoctorPageHeader doctorName={doctorData.name} specialization={doctorData.specialization} />
        <div className="patient-container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '40px' }}>
          <div className="spinner"></div>
          <p>Loading consultations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-portal">
      <DoctorNavBar />
      <DoctorPageHeader doctorName={doctorData.name} specialization={doctorData.specialization} />
      <main className="patient-container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <div className="doctor-header">
          <h1>Consultations</h1>
          <p>Manage patient consultations and medical records</p>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '20px', padding: '16px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b' }}>
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}

        {/* Consultations Grid */}
        <div className="consultations-grid">
          {consultations.length === 0 && !error ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '60px 40px', background: '#f3f4f6', borderRadius: '12px', border: '2px dashed #d1d5db' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>No Consultations Yet</h2>
              <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px', maxWidth: '500px' }}>
                Start creating consultations from your appointments to build patient medical records.
              </p>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/doctor/appointments')}
                style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}
              >
                📅 Go to Appointments
              </button>
            </div>
          ) : consultations.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {consultations.map((consult) => (
                <div key={consult.consultation_rec_id || consult.id} className="consultation-card" style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
                >
                  <div className="consultation-header" style={{ marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                    <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>
                      👤 {consult.patient_name || `Patient #${consult.patient_id}`}
                    </h3>
                    <span className="date-badge" style={{ fontSize: '12px', color: '#6b7280' }}>
                      📅 {formatDate(consult.created_at || consult.consultation_date)}
                    </span>
                  </div>
                  <div className="consultation-body" style={{ marginBottom: '16px' }}>
                    <p style={{ margin: '8px 0', color: '#374151', fontSize: '14px' }}>
                      <strong>🏥 Symptoms:</strong> {consult.symptoms ? consult.symptoms.substring(0, 100) + (consult.symptoms.length > 100 ? '...' : '') : 'N/A'}
                    </p>
                    <p style={{ margin: '8px 0', color: '#374151', fontSize: '14px' }}>
                      <strong>🔍 Diagnoses:</strong> {consult.diagnoses ? consult.diagnoses.substring(0, 100) + (consult.diagnoses.length > 100 ? '...' : '') : 'Pending'}
                    </p>
                    {consult.follow_up_required && (
                      <p style={{ margin: '8px 0', color: '#d97706', fontWeight: '600', fontSize: '14px' }}>
                        🔔 Follow-up: {formatDate(consult.follow_up_date)}
                      </p>
                    )}
                  </div>
                  <div className="consultation-footer" style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="btn-secondary"
                      onClick={() => navigate(`/doctor/consultation?id=${consult.consultation_rec_id || consult.id}`)}
                      style={{ flex: 1, padding: '10px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                      onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                    >
                      👁️ View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default DoctorConsultations;
