import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import specializationService from '../../services/specializationService';
import '../../styles/patientDashboard.css';

const DoctorSpecializationBrowser = () => {
  const navigate = useNavigate();
  
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  useEffect(() => {
    // Check authentication
    const userId = localStorage.getItem('user_id');
    const userType = localStorage.getItem('user_type');

    if (!userId || userType !== 'doctor') {
      navigate('/doctor/login', { replace: true });
      return;
    }

    fetchSpecializations();
  }, [navigate, activeOnly]);

  const fetchSpecializations = async () => {
    setLoading(true);
    try {
      console.log('📊 Fetching specializations, activeOnly:', activeOnly);
      const data = await specializationService.getAllSpecializations(0, 100, activeOnly);
      setSpecializations(data.specializations || []);
      setError('');
    } catch (err) {
      console.error('❌ Error fetching specializations:', err);
      setError('Failed to load specializations');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchSpecializations();
      return;
    }

    setLoading(true);
    try {
      const data = await specializationService.searchSpecializations(searchTerm);
      setSpecializations(data.specializations || []);
    } catch (err) {
      console.error('❌ Error searching specializations:', err);
      setError('Failed to search specializations');
    } finally {
      setLoading(false);
    }
  };

  const handleSpecializationClick = async (specialization) => {
    setSelectedSpecialization(specialization);
    setShowDetails(true);
    await fetchDoctorsBySpecialization(specialization.specialization_id);
  };

  const fetchDoctorsBySpecialization = async (specializationId) => {
    setLoadingDoctors(true);
    try {
      const data = await specializationService.getDoctorsBySpecialization(specializationId);
      setDoctors(data.doctors || []);
    } catch (err) {
      console.error('❌ Error fetching doctors:', err);
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchSpecializations();
  };

  if (loading && specializations.length === 0) {
    return (
      <div className="patient-portal">
        <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
          <p>Loading specializations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-portal">
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .specialization-card {
            background: #fff;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            border: 1px solid #e5e7eb;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .specialization-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          }
          .specialization-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
          }
          .search-container {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
          }
          .search-input {
            flex: 1;
            min-width: 200px;
            padding: 12px 16px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 16px;
          }
          .btn-search {
            padding: 12px 24px;
            background: #3b82f6;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          }
          .btn-clear {
            padding: 12px 24px;
            background: #6b7280;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          }
          .filter-container {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
          }
          .filter-checkbox {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          .modal-content {
            background: #fff;
            border-radius: 12px;
            padding: 30px;
            max-width: 800px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
          }
          .doctor-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            margin-bottom: 10px;
            border: 1px solid #e2e8f0;
          }
        `}
      </style>

      {/* Header */}
      <header className="patient-main-header">
        <div className="patient-header-content">
          <div className="patient-logo-wrapper">
            <div className="patient-logo-cross">+</div>
            <div>
              <h1 className="patient-brand-name">MedSync</h1>
              <p className="patient-brand-subtitle">Doctor Portal</p>
            </div>
          </div>

          <div className="patient-user-section">
            <button onClick={() => navigate('/doctor/dashboard')} className="btn-back">← Back to Dashboard</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="patient-container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <section style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1a2332', marginBottom: '8px' }}>
            Browse Specializations 🏥
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
            Explore available medical specializations and find doctors
          </p>
        </section>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search specializations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn-search" onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
          {searchTerm && (
            <button className="btn-clear" onClick={clearSearch}>
              Clear
            </button>
          )}
        </div>

        <div className="filter-container">
          <div className="filter-checkbox">
            <input
              type="checkbox"
              id="activeOnly"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            <label htmlFor="activeOnly" style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
              Show only specializations with active doctors
            </label>
          </div>
        </div>

        {/* Specializations Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #e5e7eb', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '10px', color: '#64748b' }}>Loading specializations...</p>
          </div>
        ) : specializations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
            <p>No specializations found</p>
            {searchTerm && (
              <button className="btn-clear" onClick={clearSearch} style={{ marginTop: '10px' }}>
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="specialization-grid">
            {specializations.map((spec, index) => (
              <div 
                key={spec.specialization_id || index}
                className="specialization-card"
                onClick={() => handleSpecializationClick(spec)}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#fff', 
                    fontSize: '20px',
                    marginRight: '15px'
                  }}>
                    🏥
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a2332', margin: '0 0 5px 0' }}>
                      {spec.specialization_title}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '0' }}>
                      {spec.doctor_count || 0} doctors
                    </p>
                  </div>
                </div>
                
                {spec.other_details && (
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 15px 0', lineHeight: '1.5' }}>
                    {spec.other_details}
                  </p>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Click to view details
                  </span>
                  <i className="fas fa-arrow-right" style={{ color: '#3b82f6' }}></i>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Specialization Details Modal */}
      {showDetails && selectedSpecialization && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332', margin: '0' }}>
                {selectedSpecialization.specialization_title}
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            {selectedSpecialization.other_details && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
                  Description
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
                  {selectedSpecialization.other_details}
                </p>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
                Doctors with this Specialization
              </h3>
              
              {loadingDoctors ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #e5e7eb', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  <p style={{ marginTop: '10px', color: '#64748b' }}>Loading doctors...</p>
                </div>
              ) : doctors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                  <p>No doctors found with this specialization</p>
                </div>
              ) : (
                <div>
                  {doctors.map((doctor, index) => (
                    <div key={doctor.doctor_id || index} className="doctor-item">
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1a2332', margin: '0 0 5px 0' }}>
                          {doctor.full_name}
                        </h4>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 5px 0' }}>
                          {doctor.email}
                        </p>
                        <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#64748b' }}>
                          {doctor.room_no && <span>Room: {doctor.room_no}</span>}
                          {doctor.consultation_fee && <span>Fee: Rs. {doctor.consultation_fee}</span>}
                          {doctor.branch_name && <span>Branch: {doctor.branch_name}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '12px', 
                          fontWeight: '600',
                          background: doctor.is_available ? '#d1fae5' : '#fee2e2',
                          color: doctor.is_available ? '#065f46' : '#991b1b'
                        }}>
                          {doctor.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  padding: '12px 24px',
                  background: '#6b7280',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSpecializationBrowser;
