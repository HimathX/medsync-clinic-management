import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorNavBar from '../../components/DoctorNavBar';
import DoctorPageHeader from '../../components/DoctorPageHeader';
import '../../styles/doctor.css';
import '../../styles/patientDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorPatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [doctorData, setDoctorData] = useState({
    name: 'Doctor',
    specialization: 'Physician'
  });

  useEffect(() => {
    // Check doctor authentication
    const checkAuth = () => {
      console.log('🔐 Checking doctor authentication...');
      
      const userId = localStorage.getItem('user_id');
      const userType = localStorage.getItem('user_type');
      const doctorId = localStorage.getItem('doctor_id');
      const token = localStorage.getItem('token');

      console.log('Auth data:', { userId, userType, doctorId });

      // Load doctor data
      const fullName = localStorage.getItem('full_name') || 'Doctor';
      setDoctorData({
        name: fullName,
        specialization: localStorage.getItem('specialization') || 'Physician'
      });

      // Check if user is authenticated as a doctor
      if (!userId || !token) {
        console.log('❌ No authentication found, redirecting to login');
        navigate('/doctor-login', { replace: true });
        return;
      }

      if (userType !== 'doctor') {
        console.log('❌ User type is not doctor:', userType);
        navigate('/doctor-login', { replace: true });
        return;
      }

      console.log('✅ Auth verified, fetching patients for doctor:', doctorId);
      if (doctorId) {
        fetchPatients(doctorId);
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchPatients = async (doctorId) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      console.log('📡 Fetching patients for doctor:', doctorId);
      
      // Fetch consultations for this doctor to get list of unique patients
      const response = await fetch(`${API_BASE_URL}/consultations/?doctor_id=${doctorId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch consultations: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Fetched consultations response:', data);

      // Extract unique patients from consultations
      const uniquePatients = {};
      const consultations = data.consultations || data || [];
      
      if (Array.isArray(consultations)) {
        consultations.forEach(consultation => {
          if (consultation.patient_id && !uniquePatients[consultation.patient_id]) {
            uniquePatients[consultation.patient_id] = {
              patient_id: consultation.patient_id,
              first_name: consultation.patient_first_name || consultation.patient_name?.split(' ')[0] || 'Patient',
              last_name: consultation.patient_name?.split(' ').slice(1).join(' ') || '',
              email: consultation.patient_email || 'N/A',
              phone_no: consultation.patient_phone || 'N/A',
              date_of_birth: consultation.patient_dob || 'N/A'
            };
          }
        });
      }

      const patientList = Object.values(uniquePatients);
      console.log('✅ Extracted patients:', patientList);
      setPatients(patientList);
    } catch (err) {
      console.error('Error loading patients:', err);
      setError(err.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_id?.toString().includes(search)
  );

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
          <p>Loading...</p>
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
          <h1>My Patients</h1>
          <p>View your patient records</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Search */}
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input 
            type="text"
            placeholder="Search patients by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Patients Grid */}
        <div className="patients-grid">
          {filteredPatients.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-user-injured"></i>
              <p>No patients found</p>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <div key={patient.patient_id} className="patient-card">
                <div className="patient-avatar">
                  <i className="fas fa-user"></i>
                </div>
                <div className="patient-info">
                  <h3>{patient.first_name} {patient.last_name}</h3>
                  <p><i className="fas fa-id-card"></i> ID: #{patient.patient_id}</p>
                  <p><i className="fas fa-envelope"></i> {patient.email || 'N/A'}</p>
                  <p><i className="fas fa-phone"></i> {patient.phone_no || 'N/A'}</p>
                  <p><i className="fas fa-birthday-cake"></i> DOB: {formatDate(patient.date_of_birth)}</p>
                </div>
                <div className="patient-actions">
                  <button 
                    className="btn-primary"
                    onClick={() => navigate(`/doctor/consultations?patient=${patient.patient_id}`)}
                  >
                    <i className="fas fa-stethoscope"></i> Consult
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default DoctorPatients;
