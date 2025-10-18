import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorHeader from '../../components/DoctorHeader';
import '../../styles/doctor.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorPatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    fetchPatients();
  }, [navigate]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/patients/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        throw new Error('Failed to fetch patients');
      }
    } catch (err) {
      setError('Failed to load patients');
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
      </div>
    </div>
  );
};

export default DoctorPatients;
