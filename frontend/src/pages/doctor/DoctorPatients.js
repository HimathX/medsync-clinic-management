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
        {/* Page Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '48px' }}>👥</div>
            <div>
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: '700',
                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '8px'
              }}>
                My Patients
              </h1>
              <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
                View and manage your patient records
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '16px 20px',
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid #fca5a5',
            borderRadius: '12px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)'
          }}>
            <i className="fas fa-exclamation-circle" style={{ fontSize: '20px', color: '#ef4444' }}></i>
            <span style={{ fontWeight: '600' }}>{error}</span>
          </div>
        )}

        {/* Search Bar */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <label style={{ 
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#475569'
          }}>
            <i className="fas fa-search" style={{ marginRight: '8px', color: '#10b981' }}></i>
            Search Patients
          </label>
          <input 
            type="text"
            placeholder="Search patients by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 18px',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '15px',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#10b981'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        {/* Stats Card */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          color: 'white',
          boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '14px', opacity: '0.9', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
              Total Patients
            </div>
            <div style={{ fontSize: '36px', fontWeight: '700' }}>
              {filteredPatients.length}
            </div>
          </div>
          <div style={{ fontSize: '64px', opacity: '0.2' }}>👥</div>
        </div>

        {/* Patients Grid */}
        {filteredPatients.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 40px', 
            background: 'white', 
            borderRadius: '16px',
            border: '2px dashed #e2e8f0'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>👥</div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>No patients found</h3>
            <p style={{ fontSize: '16px', color: '#64748b' }}>
              {search ? 'Try adjusting your search criteria' : 'No patients have been assigned to you yet'}
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '24px' 
          }}>
            {filteredPatients.map((patient) => (
              <div 
                key={patient.patient_id} 
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
              >
                {/* Patient Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    color: 'white',
                    boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)'
                  }}>
                    <i className="fas fa-user"></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontSize: '20px', 
                      fontWeight: '700', 
                      color: '#1e293b',
                      marginBottom: '4px'
                    }}>
                      {patient.first_name} {patient.last_name}
                    </h3>
                    <div style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      color: '#64748b',
                      background: '#f1f5f9',
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }}>
                      <i className="fas fa-id-card"></i>
                      <span>ID: #{patient.patient_id}</span>
                    </div>
                  </div>
                </div>

                {/* Patient Details */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  marginBottom: '20px',
                  paddingBottom: '20px',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#475569' }}>
                    <div style={{ 
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10b981'
                    }}>
                      <i className="fas fa-envelope"></i>
                    </div>
                    <span style={{ flex: 1, wordBreak: 'break-all' }}>{patient.email || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#475569' }}>
                    <div style={{ 
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10b981'
                    }}>
                      <i className="fas fa-phone"></i>
                    </div>
                    <span>{patient.phone_no || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#475569' }}>
                    <div style={{ 
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10b981'
                    }}>
                      <i className="fas fa-birthday-cake"></i>
                    </div>
                    <span>DOB: {formatDate(patient.date_of_birth)}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button 
                  onClick={() => navigate(`/doctor/consultations?patient=${patient.patient_id}`)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
                  }}
                >
                  <i className="fas fa-stethoscope"></i>
                  <span>View Consultations</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorPatients;
