import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorHeader from '../../components/DoctorHeader';
import '../../styles/doctor.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorProfile = () => {
  const navigate = useNavigate();
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Specialization states
  const [specializations, setSpecializations] = useState([]);
  const [allSpecializations, setAllSpecializations] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [certificationDate, setCertificationDate] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Get doctor ID from localStorage (stored during login)
    const doctorId = localStorage.getItem('doctor_id');
    const userId = localStorage.getItem('user_id');
    const userType = localStorage.getItem('user_type');
    
    // Check authentication
    if (!userType || userType !== 'doctor' || !doctorId) {
      console.log('❌ Not authenticated as doctor');
      navigate('/doctor-login');
      return;
    }
    
    console.log('✅ Doctor authenticated, fetching profile for ID:', doctorId);
    
    // Fetch doctor profile and specializations
    if (doctorId) {
      fetchDoctorProfile(doctorId);
      fetchDoctorSpecializations(doctorId);
      fetchAllSpecializations();
    }
  }, [navigate]);

  const fetchDoctorProfile = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('📡 Fetching doctor profile from:', `${API_BASE_URL}/doctors/${id}`);
      
      const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch profile');
      }
      
      const data = await response.json();
      console.log('✅ Doctor profile loaded:', data);
      
      // Backend returns { doctor: {...}, specializations: [...] }
      if (data.doctor) {
        setDoctorData(data.doctor);
      } else {
        // Fallback if response is direct doctor object
        setDoctorData(data);
      }
      
      setError('');
    } catch (err) {
      console.error('❌ Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorSpecializations = async (doctorId) => {
    try {
      console.log('📡 Fetching doctor specializations from:', `${API_BASE_URL}/doctors/${doctorId}/specializations`);
      
      const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/specializations`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch specializations');
      }
      
      const data = await response.json();
      console.log('✅ Specializations loaded:', data);
      setSpecializations(data.specializations || []);
    } catch (err) {
      console.error('❌ Error fetching specializations:', err);
    }
  };

  const fetchAllSpecializations = async () => {
    try {
      console.log('📡 Fetching all specializations from:', `${API_BASE_URL}/doctors/specializations/all`);
      
      const response = await fetch(`${API_BASE_URL}/doctors/specializations/all`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch all specializations');
      }
      
      const data = await response.json();
      console.log('✅ All specializations loaded:', data);
      setAllSpecializations(data.specializations || []);
    } catch (err) {
      console.error('❌ Error fetching all specializations:', err);
    }
  };

  const handleAddSpecialization = async (e) => {
    e.preventDefault();
    
    if (!selectedSpecialization || !certificationDate) {
      setError('Please select a specialization and certification date');
      return;
    }
    
    setSubmitLoading(true);
    setError('');
    
    try {
      const doctorId = localStorage.getItem('doctor_id');
      
      const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/specializations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          specialization_id: selectedSpecialization,
          certification_date: certificationDate
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add specialization');
      }
      
      const data = await response.json();
      console.log('✅ Specialization added:', data);
      
      // Refresh specializations
      await fetchDoctorSpecializations(doctorId);
      
      // Reset form and close modal
      setSelectedSpecialization('');
      setCertificationDate('');
      setShowAddModal(false);
      setSuccessMessage('Specialization added successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('❌ Error adding specialization:', err);
      setError(err.message || 'Failed to add specialization');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRemoveSpecialization = async (specializationId) => {
    if (!window.confirm('Are you sure you want to remove this specialization?')) {
      return;
    }
    
    try {
      const doctorId = localStorage.getItem('doctor_id');
      
      const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/specializations/${specializationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to remove specialization');
      }
      
      console.log('✅ Specialization removed');
      
      // Refresh specializations
      await fetchDoctorSpecializations(doctorId);
      
      setSuccessMessage('Specialization removed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('❌ Error removing specialization:', err);
      setError(err.message || 'Failed to remove specialization');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="doctor-container">
        <DoctorHeader />
        <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>
      </div>
    );
  }

  if (error || !doctorData) {
    return (
      <div className="doctor-container">
        <DoctorHeader />
        <div className="doctor-content">
          <div className="error-message">{error || 'Profile not available'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-container">
      <DoctorHeader />
      <div className="doctor-content">
        <div className="doctor-header">
          <h1>My Profile</h1>
          <p>View your professional information</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success" style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            color: '#155724'
          }}>
            <i className="fas fa-check-circle" style={{ marginRight: '10px' }}></i>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger" style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '8px',
            color: '#721c24'
          }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: '10px' }}></i>
            {error}
          </div>
        )}

        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar">
              <i className="fas fa-user-md"></i>
            </div>
            <div className="profile-header-info">
              <h2>Dr. {doctorData.full_name || `${doctorData.first_name || ''} ${doctorData.last_name || ''}`}</h2>
              <span className="role-badge">Doctor</span>
            </div>
          </div>

          <div className="profile-section">
            <h3><i className="fas fa-user"></i> Personal Information</h3>
            <div className="profile-details-grid">
              <div className="profile-detail">
                <span className="label">Doctor ID</span>
                <span className="value">#{doctorData.doctor_id || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Full Name</span>
                <span className="value">{doctorData.full_name || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">NIC</span>
                <span className="value">{doctorData.NIC || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Email</span>
                <span className="value">{doctorData.email || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Gender</span>
                <span className="value">{doctorData.gender || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Date of Birth</span>
                <span className="value">{formatDate(doctorData.DOB)}</span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3><i className="fas fa-address-book"></i> Contact Information</h3>
            <div className="profile-details-grid">
              <div className="profile-detail">
                <span className="label">Phone Number</span>
                <span className="value">{doctorData.contact_num1 || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Secondary Phone</span>
                <span className="value">{doctorData.contact_num2 || 'N/A'}</span>
              </div>
              <div className="profile-detail full-width">
                <span className="label">Address</span>
                <span className="value">
                  {[
                    doctorData.address_line1,
                    doctorData.address_line2,
                    doctorData.city,
                    doctorData.postal_code
                  ].filter(Boolean).join(', ') || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3><i className="fas fa-graduation-cap"></i> Professional Information</h3>
            <div className="profile-details-grid">
              <div className="profile-detail">
                <span className="label">Medical License Number</span>
                <span className="value">{doctorData.medical_licence_no || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Room Number</span>
                <span className="value">{doctorData.room_no || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Consultation Fee</span>
                <span className="value">Rs. {doctorData.consultation_fee || 0}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Available</span>
                <span className="value">{doctorData.is_available ? '✅ Yes' : '❌ No'}</span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3><i className="fas fa-hospital"></i> Employment</h3>
            <div className="profile-details-grid">
              <div className="profile-detail">
                <span className="label">Branch ID</span>
                <span className="value">#{doctorData.branch_id || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Join Date</span>
                <span className="value">{formatDate(doctorData.joined_date)}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Status</span>
                <span className="value">{doctorData.is_active ? '✅ Active' : '❌ Inactive'}</span>
              </div>
            </div>
          </div>

          {/* Specializations Section */}
          <div className="profile-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3><i className="fas fa-stethoscope"></i> Specializations</h3>
              <button 
                className="btn-primary" 
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
                Add Specialization
              </button>
            </div>
            
            {specializations.length === 0 ? (
              <div style={{
                padding: '30px',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                color: '#6c757d'
              }}>
                <i className="fas fa-info-circle" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
                <p>No specializations added yet</p>
              </div>
            ) : (
              <div className="specializations-list">
                {specializations.map((spec) => (
                  <div 
                    key={spec.specialization_id}
                    className="specialization-card"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '15px',
                      marginBottom: '10px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '8px'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#059669' }}>
                        <i className="fas fa-certificate" style={{ marginRight: '8px' }}></i>
                        {spec.specialization_title}
                      </h4>
                      <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
                        <i className="fas fa-calendar" style={{ marginRight: '5px' }}></i>
                        Certified: {formatDate(spec.certification_date)}
                      </p>
                      {spec.other_details && (
                        <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                          {spec.other_details}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveSpecialization(spec.specialization_id)}
                      style={{
                        padding: '8px 15px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      <i className="fas fa-trash" style={{ marginRight: '5px' }}></i>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Specialization Modal */}
        {showAddModal && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div className="modal-content" style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>
                  <i className="fas fa-plus-circle" style={{ marginRight: '10px', color: '#10b981' }}></i>
                  Add Specialization
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedSpecialization('');
                    setCertificationDate('');
                    setError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleAddSpecialization}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Specialization *
                  </label>
                  <select
                    value={selectedSpecialization}
                    onChange={(e) => setSelectedSpecialization(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">-- Select Specialization --</option>
                    {allSpecializations
                      .filter(spec => !specializations.find(s => s.specialization_id === spec.specialization_id))
                      .map((spec) => (
                        <option key={spec.specialization_id} value={spec.specialization_id}>
                          {spec.specialization_title}
                          {spec.doctor_count > 0 && ` (${spec.doctor_count} doctors)`}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Certification Date *
                  </label>
                  <input
                    type="date"
                    value={certificationDate}
                    onChange={(e) => setCertificationDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedSpecialization('');
                      setCertificationDate('');
                      setError('');
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#e5e7eb',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: submitLoading ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: submitLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {submitLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                        Adding...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check" style={{ marginRight: '8px' }}></i>
                        Add Specialization
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorProfile;
