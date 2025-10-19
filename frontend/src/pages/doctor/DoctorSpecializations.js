import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import specializationService from '../../services/specializationService';
import '../../styles/patientDashboard.css';

const DoctorSpecializations = () => {
  const navigate = useNavigate();
  const doctorId = localStorage.getItem('doctor_id') || localStorage.getItem('user_id');
  
  const [currentSpecializations, setCurrentSpecializations] = useState([]);
  const [availableSpecializations, setAvailableSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] = useState(null);
  const [certificationDate, setCertificationDate] = useState('');

  useEffect(() => {
    // Check authentication
    const userId = localStorage.getItem('user_id');
    const userType = localStorage.getItem('user_type');

    if (!userId || userType !== 'doctor') {
      navigate('/doctor/login', { replace: true });
      return;
    }

    if (doctorId) {
      fetchCurrentSpecializations();
      fetchAvailableSpecializations();
    }
  }, [doctorId, navigate]);

  const fetchCurrentSpecializations = async () => {
    setLoading(true);
    try {
      console.log('📊 Fetching current specializations for doctor:', doctorId);
      const data = await specializationService.getDoctorSpecializations(doctorId);
      setCurrentSpecializations(data.specializations || []);
      setError('');
    } catch (err) {
      console.error('❌ Error fetching current specializations:', err);
      setError('Failed to load current specializations');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSpecializations = async () => {
    setLoadingAvailable(true);
    try {
      console.log('📊 Fetching available specializations');
      const data = await specializationService.getAllSpecializations(0, 100, false);
      setAvailableSpecializations(data.specializations || []);
    } catch (err) {
      console.error('❌ Error fetching available specializations:', err);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchAvailableSpecializations();
      return;
    }

    setLoadingAvailable(true);
    try {
      const data = await specializationService.searchSpecializations(searchTerm);
      setAvailableSpecializations(data.specializations || []);
    } catch (err) {
      console.error('❌ Error searching specializations:', err);
      setError('Failed to search specializations');
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleAddSpecialization = (specialization) => {
    setSelectedSpecialization(specialization);
    setCertificationDate('');
    setShowAddForm(true);
  };

  const handleSubmitAddSpecialization = async () => {
    if (!selectedSpecialization || !certificationDate) {
      setError('Please select a specialization and certification date');
      return;
    }

    try {
      setLoading(true);
      await specializationService.addDoctorSpecialization(
        doctorId,
        selectedSpecialization.specialization_id,
        certificationDate
      );
      
      setSuccess('Specialization added successfully!');
      setShowAddForm(false);
      setSelectedSpecialization(null);
      setCertificationDate('');
      fetchCurrentSpecializations();
    } catch (err) {
      console.error('❌ Error adding specialization:', err);
      setError(err.message || 'Failed to add specialization');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSpecialization = async (specializationId) => {
    if (!window.confirm('Are you sure you want to remove this specialization?')) {
      return;
    }

    try {
      setLoading(true);
      await specializationService.removeDoctorSpecialization(doctorId, specializationId);
      setSuccess('Specialization removed successfully!');
      fetchCurrentSpecializations();
    } catch (err) {
      console.error('❌ Error removing specialization:', err);
      setError(err.message || 'Failed to remove specialization');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading && currentSpecializations.length === 0) {
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
          }
          .specialization-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            margin-bottom: 10px;
            border: 1px solid #e2e8f0;
          }
          .specialization-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .search-container {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
          }
          .search-input {
            flex: 1;
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
          .btn-remove {
            padding: 8px 16px;
            background: #ef4444;
            color: #fff;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
          }
          .btn-add {
            padding: 8px 16px;
            background: #10b981;
            color: #fff;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
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
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
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
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => navigate('/doctor/profile')} className="btn-back">← Back to Profile</button>
              <button 
                onClick={() => navigate('/doctor/specializations/browse')}
                style={{ 
                  padding: '10px 20px', 
                  background: '#10b981', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Browse All Specializations
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="patient-container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <section style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1a2332', marginBottom: '8px' }}>
            Manage Specializations 🏥
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
            Add or remove your medical specializations
          </p>
        </section>

        {/* Error/Success Messages */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '20px', background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>
            <i className="fas fa-check-circle"></i> {success}
          </div>
        )}

        {/* Current Specializations */}
        <div className="specialization-card">
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>
            Your Current Specializations
          </h2>
          
          {currentSpecializations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <i className="fas fa-stethoscope" style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}></i>
              <p>No specializations added yet</p>
            </div>
          ) : (
            <div>
              {currentSpecializations.map((spec, index) => (
                <div key={spec.specialization_id || index} className="specialization-item">
                  <div>
                    <div className="specialization-badge">
                      <span>🏥</span>
                      <span>{spec.specialization_title}</span>
                    </div>
                    {spec.certification_date && (
                      <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                        Certified: {formatDate(spec.certification_date)}
                      </p>
                    )}
                  </div>
                  <button 
                    className="btn-remove"
                    onClick={() => handleRemoveSpecialization(spec.specialization_id)}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Specializations */}
        <div className="specialization-card">
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>
            Available Specializations
          </h2>
          
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search specializations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-search" onClick={handleSearch} disabled={loadingAvailable}>
              {loadingAvailable ? 'Searching...' : 'Search'}
            </button>
          </div>

          {loadingAvailable ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #e5e7eb', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ marginTop: '10px', color: '#64748b' }}>Loading specializations...</p>
            </div>
          ) : availableSpecializations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <p>No specializations found</p>
            </div>
          ) : (
            <div>
              {availableSpecializations.map((spec, index) => {
                const isAlreadyAdded = currentSpecializations.some(
                  current => current.specialization_id === spec.specialization_id
                );
                
                return (
                  <div key={spec.specialization_id || index} className="specialization-item">
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a2332', margin: '0 0 8px 0' }}>
                        {spec.specialization_title}
                      </h3>
                      {spec.other_details && (
                        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 8px 0' }}>
                          {spec.other_details}
                        </p>
                      )}
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '0' }}>
                        {spec.doctor_count || 0} doctors with this specialization
                      </p>
                    </div>
                    <button 
                      className="btn-add"
                      onClick={() => handleAddSpecialization(spec)}
                      disabled={isAlreadyAdded || loading}
                    >
                      {isAlreadyAdded ? 'Added' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Add Specialization Modal */}
      {showAddForm && selectedSpecialization && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>
              Add Specialization
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a2332', marginBottom: '10px' }}>
                {selectedSpecialization.specialization_title}
              </h3>
              {selectedSpecialization.other_details && (
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                  {selectedSpecialization.other_details}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Certification Date *
              </label>
              <input
                type="date"
                value={certificationDate}
                onChange={(e) => setCertificationDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddForm(false)}
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
                Cancel
              </button>
              <button
                onClick={handleSubmitAddSpecialization}
                disabled={!certificationDate || loading}
                style={{
                  padding: '12px 24px',
                  background: certificationDate && !loading ? '#10b981' : '#d1d5db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: certificationDate && !loading ? 'pointer' : 'not-allowed',
                  fontWeight: '600'
                }}
              >
                {loading ? 'Adding...' : 'Add Specialization'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSpecializations;
