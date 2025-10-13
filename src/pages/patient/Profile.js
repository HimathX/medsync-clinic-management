import React, { useState, useEffect } from 'react';
import '../../styles/PatientProfile.css';

const PatientProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Patient data state
  const [profileData, setProfileData] = useState({
    // Personal Information
    patient_id: 'P-2024-001',
    full_name: 'John Doe',
    email: 'john.doe@email.com',
    NIC: '199012345678',
    gender: 'Male',
    DOB: '1990-05-15',
    blood_group: 'O+',
    
    // Contact Information
    contact_num1: '+94771234567',
    contact_num2: '+94112345678',
    
    // Address
    address_line1: '123 Main Street',
    address_line2: 'Colombo 03',
    city: 'Colombo',
    province: 'Western',
    postal_code: '00300',
    country: 'Sri Lanka',
    
    // Emergency Contact
    emergency_contact_name: 'Jane Doe',
    emergency_contact_relationship: 'Spouse',
    emergency_contact_phone: '+94771234568',
    
    // Medical Information
    allergies: 'Penicillin, Pollen',
    chronic_conditions: 'Type 2 Diabetes',
    current_medications: 'Metformin 500mg',
    
    // Insurance
    insurance_provider: 'Ceylinco Healthcare',
    insurance_policy_number: 'CH-2024-12345',
    
    // Branch
    registered_branch: 'Colombo',
    registration_date: '2024-01-15'
  });

  const [stats, setStats] = useState({
    totalAppointments: 12,
    upcomingAppointments: 2,
    prescriptions: 8,
    lastVisit: '2024-09-15'
  });

  // Form state for editing
  const [formData, setFormData] = useState({ ...profileData });

  useEffect(() => {
    fetchPatientProfile();
  }, []);

  const fetchPatientProfile = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setFormData({ ...profileData });
    }
    setIsEditing(!isEditing);
    setMessage({ type: '', text: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // TODO: Replace with actual API call
      setTimeout(() => {
        setProfileData({ ...formData });
        setIsEditing(false);
        setLoading(false);
        setMessage({ type: 'success', text: '✓ Profile updated successfully!' });
        
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }, 1000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: '✕ Failed to update profile' });
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="patient-profile">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <div className="loading-text">Processing...</div>
        </div>
      )}

      {/* Page Header - Simplified */}
      <div className="profile-page-header">
        <div className="profile-page-header-content">
          <div>
            <h1 className="profile-page-title">My Profile</h1>
          </div>
          <div className="header-actions">
            <button 
              className={`btn ${isEditing ? 'secondary' : 'primary'}`}
              onClick={handleEditToggle}
            >
              {isEditing ? '✕ Cancel' : '✎ Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="profile-summary">
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon primary">📅</div>
            <div className="summary-label">Total Appointments</div>
            <div className="summary-value">{stats.totalAppointments}</div>
          </div>
          <div className="summary-card">
            <div className="summary-icon success">⏰</div>
            <div className="summary-label">Upcoming</div>
            <div className="summary-value">{stats.upcomingAppointments}</div>
          </div>
          <div className="summary-card">
            <div className="summary-icon warning">💊</div>
            <div className="summary-label">Prescriptions</div>
            <div className="summary-value">{stats.prescriptions}</div>
          </div>
          <div className="summary-card">
            <div className="summary-icon info">🩺</div>
            <div className="summary-label">Last Visit</div>
            <div className="summary-value" style={{fontSize: 'var(--text-lg)'}}>
              {formatDate(stats.lastVisit)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-main-content">
        {message.text && (
          <div className={`alert ${message.type}`}>
            <span className="alert-icon">{message.type === 'success' ? '✓' : '✕'}</span>
            <span>{message.text}</span>
          </div>
        )}

        <div className="profile-content">
          {/* Sidebar */}
          <div className="profile-sidebar">
            {/* Avatar Card */}
            <div className="profile-card">
              <div className="avatar-section">
                <div className="avatar-wrapper">
                  <div className="avatar-circle">
                    {getInitials(profileData.full_name)}
                  </div>
                  <div className="avatar-status" title="Account Active"></div>
                </div>
                <h2>{profileData.full_name}</h2>
                <p className="patient-id-display">{profileData.patient_id}</p>
              </div>

              <div className="quick-info">
                <div className="info-item">
                  <div className="info-icon-wrapper">
                    <span className="info-icon">👤</span>
                  </div>
                  <div className="info-content">
                    <div className="info-label">Age</div>
                    <div className="info-value">{calculateAge(profileData.DOB)} years old</div>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-wrapper">
                    <span className="info-icon">⚥</span>
                  </div>
                  <div className="info-content">
                    <div className="info-label">Gender</div>
                    <div className="info-value">{profileData.gender}</div>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-wrapper">
                    <span className="info-icon">🩸</span>
                  </div>
                  <div className="info-content">
                    <div className="info-label">Blood Group</div>
                    <div className="info-value">
                      <span className="blood-group-badge">{profileData.blood_group}</span>
                    </div>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-wrapper">
                    <span className="info-icon">🏥</span>
                  </div>
                  <div className="info-content">
                    <div className="info-label">Registered Branch</div>
                    <div className="info-value">{profileData.registered_branch}</div>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-wrapper">
                    <span className="info-icon">📆</span>
                  </div>
                  <div className="info-content">
                    <div className="info-label">Member Since</div>
                    <div className="info-value">{formatDate(profileData.registration_date)}</div>
                  </div>
                </div>
              </div>

              <div className="verification-badge">
                <span className="verification-icon">✓</span>
                <span className="verification-text">Verified Account</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="profile-main">
            <form onSubmit={handleSave}>
              {/* Personal Information */}
              <div className="section-card">
                <div className="section-header">
                  <div className="section-title">
                    <div className="section-icon">👤</div>
                    <h3>Personal Information</h3>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>NIC Number</label>
                    <input
                      type="text"
                      name="NIC"
                      value={formData.NIC}
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="DOB"
                      value={formData.DOB}
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      disabled
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Blood Group</label>
                    <input
                      type="text"
                      name="blood_group"
                      value={formData.blood_group}
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="section-card">
                <div className="section-header">
                  <div className="section-title">
                    <div className="section-icon">📞</div>
                    <h3>Contact Information</h3>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Primary Phone</label>
                    <input
                      type="tel"
                      name="contact_num1"
                      value={formData.contact_num1}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Secondary Phone</label>
                    <input
                      type="tel"
                      name="contact_num2"
                      value={formData.contact_num2}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="section-card">
                <div className="section-header">
                  <div className="section-title">
                    <div className="section-icon">📍</div>
                    <h3>Address</h3>
                  </div>
                </div>
                <div className="form-grid-full">
                  <div className="form-group">
                    <label>Address Line 1</label>
                    <input
                      type="text"
                      name="address_line1"
                      value={formData.address_line1}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      name="address_line2"
                      value={formData.address_line2}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Province</label>
                    <input
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Postal Code</label>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="section-card">
                <div className="section-header">
                  <div className="section-title">
                    <div className="section-icon">🚨</div>
                    <h3>Emergency Contact</h3>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Contact Name</label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Relationship</label>
                    <input
                      type="text"
                      name="emergency_contact_relationship"
                      value={formData.emergency_contact_relationship}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="section-card">
                <div className="section-header">
                  <div className="section-title">
                    <div className="section-icon">🩺</div>
                    <h3>Medical Information</h3>
                  </div>
                </div>
                <div className="form-grid-full">
                  <div className="form-group">
                    <label>Allergies</label>
                    <textarea
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="List any known allergies"
                    />
                  </div>
                  <div className="form-group">
                    <label>Chronic Conditions</label>
                    <textarea
                      name="chronic_conditions"
                      value={formData.chronic_conditions}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="List any chronic conditions"
                    />
                  </div>
                  <div className="form-group">
                    <label>Current Medications</label>
                    <textarea
                      name="current_medications"
                      value={formData.current_medications}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="List current medications"
                    />
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              <div className="section-card">
                <div className="section-header">
                  <div className="section-title">
                    <div className="section-icon">🛡️</div>
                    <h3>Insurance Information</h3>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Insurance Provider</label>
                    <input
                      type="text"
                      name="insurance_provider"
                      value={formData.insurance_provider}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Policy Number</label>
                    <input
                      type="text"
                      name="insurance_policy_number"
                      value={formData.insurance_policy_number}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              {isEditing && (
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn secondary"
                    onClick={handleEditToggle}
                  >
                    ✕ Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn primary"
                    disabled={loading}
                  >
                    {loading ? '⏳ Saving...' : '✓ Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;