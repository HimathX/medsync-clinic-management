// src/pages/Profile.js - Modern User Profile Management
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Profile() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const patientId = currentUser?.patientId || localStorage.getItem('patientId');
  const [tab, setTab] = useState('personal');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    name: '', 
    gender: '', 
    nationality: '',
    dob: '',
    nic: '',
    bloodGroup: '',
    phone: '', 
    phone2: '', 
    email: '',
    address: '', 
    address2: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    allergies: '',
    chronicConditions: '',
    e1: {name: '', relation: 'Spouse', phone: '', email: ''},
    e2: {name: '', relation: 'Parent', phone: '', email: ''},
    insurer: '',
    policy: '',
    group: '',
    coverageType: 'Individual',
    effectiveFrom: '',
    effectiveTo: '',
    mailingSame: true,
    twoFA: true,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch profile data on mount
  useEffect(() => {
    if (!patientId) {
      navigate('/patient-login');
      return;
    }
    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const fetchProfileData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/profile-patient/patients/${patientId}/profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile data:', data);
        
        setForm({
          name: data.full_name || '',
          gender: data.gender || '',
          nationality: data.country || 'Sri Lankan',
          dob: data.DOB || '',
          nic: data.NIC || '',
          bloodGroup: data.blood_group || '',
          phone: data.contact_num1 || '',
          phone2: data.contact_num2 || '',
          email: data.email || '',
          address: data.address_line1 || '',
          address2: data.address_line2 || '',
          city: data.city || '',
          province: data.province || '',
          postalCode: data.postal_code || '',
          country: data.country || 'Sri Lanka',
          emergencyName: data.emergency_contact_name || '',
          emergencyRelation: data.emergency_contact_relationship || '',
          emergencyPhone: data.emergency_contact_phone || '',
          allergies: data.allergies || '',
          chronicConditions: data.chronic_conditions || '',
          e1: {name: '', relation: 'Spouse', phone: '', email: ''},
          e2: {name: '', relation: 'Parent', phone: '', email: ''},
          insurer: '',
          policy: '',
          group: '',
          coverageType: 'Individual',
          effectiveFrom: '',
          effectiveTo: '',
          mailingSame: true,
          twoFA: true,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (err) {
      console.error('❌ Error fetching profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/profile-patient/patients/${patientId}/profile`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            full_name: form.name,
            email: form.email,
            contact_num1: form.phone,
            contact_num2: form.phone2,
            address_line1: form.address,
            address_line2: form.address2,
            city: form.city,
            province: form.province,
            postal_code: form.postalCode,
            country: form.country,
            emergency_contact_name: form.emergencyName,
            emergency_contact_relationship: form.emergencyRelation,
            emergency_contact_phone: form.emergencyPhone,
            allergies: form.allergies,
            chronic_conditions: form.chronicConditions
          })
        }
      );

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        // Refresh profile data
        fetchProfileData();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      console.error('❌ Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaveLoading(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="profile-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2>Loading Profile...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header Section */}
      <div className="profile-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">👤</div>
            <div>
              <h1 className="header-title">My Profile</h1>
              <p className="header-subtitle">Manage your personal information and account settings</p>
            </div>
          </div>
          <div className="header-right">
            <span className="role-badge">
              {currentUser?.userType?.toUpperCase() || 'USER'}
            </span>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="success-banner">
          <span className="success-icon">✓</span>
          Profile updated successfully!
        </div>
      )}

      {/* Tab Navigation */}
      <div className="profile-tabs">
        <button
          className={`profile-tab ${tab === 'personal' ? 'active' : ''}`}
          onClick={() => setTab('personal')}
        >
          <span className="tab-icon">👤</span>
          Personal Info
        </button>
        <button
          className={`profile-tab ${tab === 'emergency' ? 'active' : ''}`}
          onClick={() => setTab('emergency')}
        >
          <span className="tab-icon">🚨</span>
          Emergency Contacts
        </button>
        <button
          className={`profile-tab ${tab === 'insurance' ? 'active' : ''}`}
          onClick={() => setTab('insurance')}
        >
          <span className="tab-icon">🏥</span>
          Insurance
        </button>
        <button
          className={`profile-tab ${tab === 'medical' ? 'active' : ''}`}
          onClick={() => setTab('medical')}
        >
          <span className="tab-icon">💊</span>
          Medical History
        </button>
        <button
          className={`profile-tab ${tab === 'security' ? 'active' : ''}`}
          onClick={() => setTab('security')}
        >
          <span className="tab-icon">🔒</span>
          Security
        </button>
      </div>

      {/* Personal Info Tab */}
      {tab === 'personal' && (
        <div className="profile-content">
          <div className="profile-card">
            <div className="card-header-section">
              <h2 className="card-heading">Personal Information</h2>
              <p className="card-description">Update your personal details and contact information</p>
            </div>

            <div className="profile-photo-section">
              <div className="photo-container">
                <div className="photo-wrapper">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="profile-photo" />
                  ) : (
                    <div className="photo-placeholder">
                      <span className="photo-icon">📷</span>
                      <span className="photo-text">No Photo</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="photo-upload" className="upload-button">
                  Change Photo
                </label>
              </div>

              <div className="form-section">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-input"
                      value={form.gender}
                      onChange={(e) => setForm({...form, gender: e.target.value})}
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nationality</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.nationality}
                      onChange={(e) => setForm({...form, nationality: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.dob}
                      onChange={(e) => setForm({...form, dob: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Primary Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={form.phone}
                      onChange={(e) => setForm({...form, phone: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Secondary Phone (Optional)</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={form.phone2}
                      onChange={(e) => setForm({...form, phone2: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                  />
                  <span className="input-hint">✓ Verified</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Current Address</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={form.address}
                    onChange={(e) => setForm({...form, address: e.target.value})}
                  />
                </div>

                <div className="form-checkbox">
                  <input
                    type="checkbox"
                    id="mailing-same"
                    checked={form.mailingSame}
                    onChange={(e) => setForm({...form, mailingSame: e.target.checked})}
                  />
                  <label htmlFor="mailing-same">Mailing address same as current address</label>
                </div>

                {error && (
                  <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px' }}>
                    {error}
                  </div>
                )}
                {saveSuccess && (
                  <div style={{ padding: '12px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '16px' }}>
                    ✅ Profile updated successfully!
                  </div>
                )}

                <div className="form-actions">
                  <button className="btn-save" onClick={handleSave} disabled={saveLoading}>
                    {saveLoading ? '💾 Saving...' : '💾 Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contacts Tab */}
      {tab === 'emergency' && (
        <div className="profile-content">
          <div className="profile-card">
            <div className="card-header-section">
              <h2 className="card-heading">🚨 Emergency Contacts</h2>
              <p className="card-description">Provide emergency contact information for urgent situations</p>
            </div>

            <div className="emergency-section">
              <h3 className="section-title">Primary Emergency Contact</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.e1.name}
                    onChange={(e) => setForm({...form, e1: {...form.e1, name: e.target.value}})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Relationship</label>
                  <select
                    className="form-input"
                    value={form.e1.relation}
                    onChange={(e) => setForm({...form, e1: {...form.e1, relation: e.target.value}})}
                  >
                    <option>Spouse</option>
                    <option>Parent</option>
                    <option>Sibling</option>
                    <option>Friend</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={form.e1.phone}
                    onChange={(e) => setForm({...form, e1: {...form.e1, phone: e.target.value}})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.e1.email}
                  onChange={(e) => setForm({...form, e1: {...form.e1, email: e.target.value}})}
                />
              </div>
            </div>

            <div className="emergency-section">
              <h3 className="section-title">Secondary Emergency Contact (Optional)</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.e2.name}
                    onChange={(e) => setForm({...form, e2: {...form.e2, name: e.target.value}})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Relationship</label>
                  <select
                    className="form-input"
                    value={form.e2.relation}
                    onChange={(e) => setForm({...form, e2: {...form.e2, relation: e.target.value}})}
                  >
                    <option>Parent</option>
                    <option>Sibling</option>
                    <option>Friend</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={form.e2.phone}
                    onChange={(e) => setForm({...form, e2: {...form.e2, phone: e.target.value}})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.e2.email}
                  onChange={(e) => setForm({...form, e2: {...form.e2, email: e.target.value}})}
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px' }}>
                {error}
              </div>
            )}
            {saveSuccess && (
              <div style={{ padding: '12px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '16px' }}>
                ✅ Profile updated successfully!
              </div>
            )}

            <div className="form-actions">
              <button className="btn-save" onClick={handleSave} disabled={saveLoading}>
                {saveLoading ? '💾 Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insurance Tab */}
      {tab === 'insurance' && (
        <div className="profile-content">
          <div className="profile-card">
            <div className="card-header-section">
              <h2 className="card-heading">🏥 Insurance Information</h2>
              <p className="card-description">Manage your insurance coverage details</p>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Insurance Company</label>
                <input type="text" className="form-input" value={form.insurer} onChange={(e) => setForm({...form, insurer: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Policy Number</label>
                <input type="text" className="form-input" value={form.policy} onChange={(e) => setForm({...form, policy: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Group Number</label>
                <input type="text" className="form-input" value={form.group} onChange={(e) => setForm({...form, group: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Coverage Type</label>
                <select className="form-input" value={form.coverageType} onChange={(e) => setForm({...form, coverageType: e.target.value})}>
                  <option>Individual</option>
                  <option>Family</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Effective From</label>
                <input type="date" className="form-input" value={form.effectiveFrom} onChange={(e) => setForm({...form, effectiveFrom: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Effective To</label>
                <input type="date" className="form-input" value={form.effectiveTo} onChange={(e) => setForm({...form, effectiveTo: e.target.value})} />
              </div>
            </div>
            {error && (
              <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px' }}>
                {error}
              </div>
            )}
            {saveSuccess && (
              <div style={{ padding: '12px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '16px' }}>
                ✅ Profile updated successfully!
              </div>
            )}

            <div className="form-actions">
              <button className="btn-save" onClick={handleSave} disabled={saveLoading}>
                {saveLoading ? '💾 Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medical History Tab */}
      {tab === 'medical' && (
        <div className="profile-content">
          <div className="profile-card">
            <div className="card-header-section">
              <h2 className="card-heading">💊 Medical History</h2>
              <p className="card-description">Your medical information is securely stored</p>
            </div>
            <div className="info-banner">
              <span className="info-icon">ℹ️</span>
              <p>This information is shared with your healthcare providers to ensure safe treatment.</p>
            </div>
            <div className="medical-sections">
              <div className="medical-box">
                <h3 className="medical-title">🌿 Allergies</h3>
                <p className="medical-placeholder">No allergies recorded</p>
                <button className="btn-secondary">Add Allergy</button>
              </div>
              <div className="medical-box">
                <h3 className="medical-title">🩺 Chronic Conditions</h3>
                <p className="medical-placeholder">No conditions recorded</p>
                <button className="btn-secondary">Add Condition</button>
              </div>
              <div className="medical-box">
                <h3 className="medical-title">💊 Current Medications</h3>
                <p className="medical-placeholder">No medications recorded</p>
                <button className="btn-secondary">Add Medication</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <div className="profile-content">
          <div className="profile-card">
            <div className="card-header-section">
              <h2 className="card-heading">🔒 Security Settings</h2>
              <p className="card-description">Manage your password and security preferences</p>
            </div>
            <h3 className="section-title">Change Password</h3>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" value={form.currentPassword} onChange={(e) => setForm({...form, currentPassword: e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" value={form.newPassword} onChange={(e) => setForm({...form, newPassword: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-input" value={form.confirmPassword} onChange={(e) => setForm({...form, confirmPassword: e.target.value})} />
              </div>
            </div>
            <div className="security-section">
              <h3 className="section-title">Two-Factor Authentication</h3>
              <div className="toggle-section">
                <div>
                  <h4 className="toggle-title">Enable 2FA</h4>
                  <p className="toggle-description">Add an extra layer of security to your account</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={form.twoFA} onChange={(e) => setForm({...form, twoFA: e.target.checked})} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            {error && (
              <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px' }}>
                {error}
              </div>
            )}
            {saveSuccess && (
              <div style={{ padding: '12px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '16px' }}>
                ✅ Profile updated successfully!
              </div>
            )}

            <div className="form-actions">
              <button className="btn-save" onClick={handleSave} disabled={saveLoading}>
                {saveLoading ? '💾 Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .profile-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .profile-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 40px;
          margin-bottom: 30px;
          box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .header-icon {
          width: 70px;
          height: 70px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 35px;
        }

        .header-title {
          font-size: 32px;
          font-weight: 800;
          color: white;
          margin: 0 0 8px 0;
        }

        .header-subtitle {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
        }

        .role-badge {
          background: rgba(255, 255, 255, 0.25);
          color: white;
          padding: 12px 24px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .success-banner {
          background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          margin-bottom: 25px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          animation: slideDown 0.3s ease;
        }

        .success-icon {
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .profile-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .profile-tab {
          padding: 14px 24px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .profile-tab:hover {
          border-color: #667eea;
          color: #667eea;
          transform: translateY(-2px);
        }

        .profile-tab.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .tab-icon {
          font-size: 20px;
        }

        .profile-content {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .profile-card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .card-header-section {
          margin-bottom: 30px;
        }

        .card-heading {
          font-size: 24px;
          font-weight: 800;
          color: #1a2332;
          margin: 0 0 8px 0;
        }

        .card-description {
          font-size: 15px;
          color: #64748b;
          margin: 0;
        }

        .profile-photo-section {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 40px;
        }

        .photo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .photo-wrapper {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid #e2e8f0;
        }

        .profile-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .photo-icon {
          font-size: 40px;
        }

        .photo-text {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
        }

        .upload-button {
          padding: 10px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .upload-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 14px;
          font-weight: 700;
          color: #1a2332;
        }

        .form-input, .form-textarea {
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 15px;
          font-family: inherit;
          transition: all 0.3s;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-textarea {
          resize: vertical;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .input-hint {
          font-size: 13px;
          color: #10B981;
          font-weight: 600;
        }

        .form-checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .form-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .form-checkbox label {
          font-size: 14px;
          color: #475569;
          cursor: pointer;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #f1f5f9;
        }

        .btn-save {
          padding: 14px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-save:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .emergency-section, .security-section {
          margin-bottom: 30px;
          padding-bottom: 30px;
          border-bottom: 2px solid #f1f5f9;
        }

        .emergency-section:last-of-type, .security-section:last-of-type {
          border-bottom: none;
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a2332;
          margin: 0 0 20px 0;
        }

        .info-banner {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 16px 20px;
          border-radius: 12px;
          border-left: 4px solid #0EA5E9;
          margin-bottom: 30px;
          display: flex;
          gap: 12px;
        }

        .info-icon {
          font-size: 20px;
        }

        .info-banner p {
          margin: 0;
          font-size: 14px;
          color: #475569;
        }

        .medical-sections {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .medical-box {
          padding: 24px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          text-align: center;
        }

        .medical-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a2332;
          margin: 0 0 12px 0;
        }

        .medical-placeholder {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 16px 0;
        }

        .btn-secondary {
          padding: 10px 20px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #667eea;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-secondary:hover {
          border-color: #667eea;
          background: #f8fafc;
        }

        .toggle-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
        }

        .toggle-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a2332;
          margin: 0 0 4px 0;
        }

        .toggle-description {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 30px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: 0.3s;
          border-radius: 34px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 22px;
          width: 22px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        .toggle-switch input:checked + .toggle-slider {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(30px);
        }

        @media (max-width: 768px) {
          .profile-page {
            padding: 20px 15px;
          }

          .profile-header {
            padding: 30px 20px;
          }

          .header-content {
            flex-direction: column;
            gap: 20px;
          }

          .profile-tabs {
            flex-direction: column;
          }

          .profile-tab {
            width: 100%;
            justify-content: center;
          }

          .profile-card {
            padding: 24px 20px;
          }

          .profile-photo-section {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
