// src/pages/doctor/DoctorSettings.js - Doctor Settings & Preferences
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import '../../styles/patientDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function DoctorSettings() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const doctorId = currentUser?.userId || currentUser?.doctor_id;

  const [loading, setLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // profile, schedule, notifications, security
  const [saved, setSaved] = useState(false);

  // Profile Settings
  const [profileData, setProfileData] = useState({
    full_name: currentUser?.fullName || '',
    email: currentUser?.email || '',
    phone: '',
    specialization: '',
    room_no: '',
    consultation_fee: '',
    bio: ''
  });

  // Schedule Settings
  const [scheduleSettings, setScheduleSettings] = useState({
    appointmentDuration: 30,
    breakTime: 15,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '09:00',
    endTime: '17:00'
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    newPatientAlerts: true,
    cancelationAlerts: true,
    dailySummary: true
  });

  // Security Settings
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!doctorId) {
      navigate('/doctor-login');
    }
  }, [doctorId]);

  const handleLogout = () => {
    authService.logout();
    navigate('/doctor-login');
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      // API call to update profile
      // await fetch(`${API_BASE_URL}/doctors/${doctorId}`, { method: 'PUT', body: profileData });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      setLoading(true);
      // API call to update schedule settings
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save schedule settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setLoading(true);
      // API call to update notification settings
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (securityData.newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    try {
      setLoading(true);
      // API call to change password
      alert('Password changed successfully');
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      alert('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-portal">
      {/* Top Navigation */}
      <nav className="patient-top-nav">
        <div className="patient-top-nav-content">
          <div className="patient-nav-links">
            <button onClick={() => navigate('/doctor/dashboard')} style={{ background: 'none', border: 'none', color: '#e0e0e0', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
          </div>
          {saved && (
            <div style={{ color: '#10b981', fontWeight: '600' }}>
              ✅ Changes saved successfully
            </div>
          )}
        </div>
      </nav>

      {/* Main Header */}
      <header className="patient-main-header">
        <div className="patient-header-content">
          <div className="patient-logo-wrapper">
            <div className="patient-logo-cross">+</div>
            <div>
              <h1 className="patient-brand-name">MedSync</h1>
              <p className="patient-brand-subtitle">Settings</p>
            </div>
          </div>

          <div className="patient-user-section">
            <div className="patient-info-display" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="patient-info-text">
                <div className="patient-name-display">Dr. {currentUser?.fullName || 'Doctor'}</div>
                <div className="patient-id-display">Settings</div>
              </div>
              <div className="patient-avatar-wrapper">
                <div className="patient-avatar">
                  {(currentUser?.fullName || 'D').charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            {showProfileMenu && (
              <div className="patient-profile-dropdown">
                <button className="patient-dropdown-item" onClick={() => navigate('/doctor/profile')}>
                  <span className="dropdown-icon">👤</span>
                  <span>My Profile</span>
                </button>
                <button className="patient-dropdown-item" onClick={() => navigate('/doctor/dashboard')}>
                  <span className="dropdown-icon">🏠</span>
                  <span>Dashboard</span>
                </button>
                <div className="patient-dropdown-divider"></div>
                <button className="patient-dropdown-item logout-item" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="patient-container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        {/* Page Header */}
        <section style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1a2332', marginBottom: '8px' }}>
            Settings ⚙️
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
            Manage your preferences and account settings
          </p>
        </section>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '16px 32px',
              border: 'none',
              background: 'none',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              borderBottom: activeTab === 'profile' ? '3px solid #7c3aed' : '3px solid transparent',
              color: activeTab === 'profile' ? '#7c3aed' : '#64748b',
              transition: 'all 0.3s'
            }}
          >
            👤 Profile
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            style={{
              padding: '16px 32px',
              border: 'none',
              background: 'none',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              borderBottom: activeTab === 'schedule' ? '3px solid #7c3aed' : '3px solid transparent',
              color: activeTab === 'schedule' ? '#7c3aed' : '#64748b',
              transition: 'all 0.3s'
            }}
          >
            📅 Schedule
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            style={{
              padding: '16px 32px',
              border: 'none',
              background: 'none',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              borderBottom: activeTab === 'notifications' ? '3px solid #7c3aed' : '3px solid transparent',
              color: activeTab === 'notifications' ? '#7c3aed' : '#64748b',
              transition: 'all 0.3s'
            }}
          >
            🔔 Notifications
          </button>
          <button
            onClick={() => setActiveTab('security')}
            style={{
              padding: '16px 32px',
              border: 'none',
              background: 'none',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              borderBottom: activeTab === 'security' ? '3px solid #7c3aed' : '3px solid transparent',
              color: activeTab === 'security' ? '#7c3aed' : '#64748b',
              transition: 'all 0.3s'
            }}
          >
            🔒 Security
          </button>
        </div>

        {/* Tab Content */}
        <div className="dashboard-section">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332', marginBottom: '24px' }}>
                Profile Information
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1a2332' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '15px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1a2332' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '15px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1a2332' }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+94 XX XXX XXXX"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '15px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1a2332' }}>
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={profileData.room_no}
                    onChange={(e) => setProfileData({ ...profileData, room_no: e.target.value })}
                    placeholder="e.g. R101"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '15px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1a2332' }}>
                    Consultation Fee (LKR)
                  </label>
                  <input
                    type="number"
                    value={profileData.consultation_fee}
                    onChange={(e) => setProfileData({ ...profileData, consultation_fee: e.target.value })}
                    placeholder="e.g. 2500"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '15px'
                    }}
                  />
                </div>
              </div>
              <div style={{ marginTop: '24px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1a2332' }}>
                  Professional Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  rows="4"
                  placeholder="Brief description of your qualifications and experience..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <button 
                className="btn-action-primary" 
                onClick={handleSaveProfile}
                disabled={loading}
                style={{ marginTop: '24px' }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332', marginBottom: '24px' }}>
                Schedule Preferences
              </h2>
              <div style={{ display: 'grid', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1a2332' }}>
                    Default Appointment Duration (minutes)
                  </label>
                  <select
                    value={scheduleSettings.appointmentDuration}
                    onChange={(e) => setScheduleSettings({ ...scheduleSettings, appointmentDuration: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '15px'
                    }}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1a2332' }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={scheduleSettings.startTime}
                      onChange={(e) => setScheduleSettings({ ...scheduleSettings, startTime: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '15px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1a2332' }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      value={scheduleSettings.endTime}
                      onChange={(e) => setScheduleSettings({ ...scheduleSettings, endTime: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '15px'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px', color: '#1a2332' }}>
                    Working Days
                  </label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={scheduleSettings.workingDays.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setScheduleSettings({ ...scheduleSettings, workingDays: [...scheduleSettings.workingDays, day] });
                            } else {
                              setScheduleSettings({ ...scheduleSettings, workingDays: scheduleSettings.workingDays.filter(d => d !== day) });
                            }
                          }}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <span style={{ fontWeight: '500' }}>{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button 
                className="btn-action-primary" 
                onClick={handleSaveSchedule}
                disabled={loading}
                style={{ marginTop: '24px' }}
              >
                {loading ? 'Saving...' : 'Save Schedule Settings'}
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332', marginBottom: '24px' }}>
                Notification Preferences
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {Object.entries({
                  emailNotifications: 'Email Notifications',
                  smsNotifications: 'SMS Notifications',
                  appointmentReminders: 'Appointment Reminders',
                  newPatientAlerts: 'New Patient Alerts',
                  cancelationAlerts: 'Cancellation Alerts',
                  dailySummary: 'Daily Summary Report'
                }).map(([key, label]) => (
                  <div key={key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1a2332', marginBottom: '4px' }}>{label}</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        Receive notifications via {label.toLowerCase()}
                      </div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                      <input
                        type="checkbox"
                        checked={notificationSettings[key]}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, [key]: e.target.checked })}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: notificationSettings[key] ? '#7c3aed' : '#cbd5e1',
                        transition: '0.4s',
                        borderRadius: '34px'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '26px',
                          width: '26px',
                          left: notificationSettings[key] ? '30px' : '4px',
                          bottom: '4px',
                          background: 'white',
                          transition: '0.4s',
                          borderRadius: '50%'
                        }}></span>
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              <button 
                className="btn-action-primary" 
                onClick={handleSaveNotifications}
                disabled={loading}
                style={{ marginTop: '24px' }}
              >
                {loading ? 'Saving...' : 'Save Notification Settings'}
              </button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332', marginBottom: '24px' }}>
                Change Password
              </h2>
              <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1a2332' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={securityData.currentPassword}
                    onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '15px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1a2332' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={securityData.newPassword}
                    onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '15px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1a2332' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={securityData.confirmPassword}
                    onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '15px'
                    }}
                  />
                </div>
                <button 
                  className="btn-action-primary" 
                  onClick={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>

              <div style={{
                marginTop: '40px',
                padding: '24px',
                background: '#fef3c7',
                border: '2px solid #fbbf24',
                borderRadius: '12px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#92400e', marginBottom: '12px' }}>
                  ⚠️ Security Recommendations
                </h3>
                <ul style={{ color: '#92400e', paddingLeft: '20px' }}>
                  <li>Use a strong password with at least 8 characters</li>
                  <li>Include uppercase, lowercase, numbers, and special characters</li>
                  <li>Don't share your password with anyone</li>
                  <li>Change your password regularly</li>
                  <li>Enable two-factor authentication for added security</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
