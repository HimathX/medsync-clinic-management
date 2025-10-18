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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(storedUser);
    const id = user.doctor_id || user.id;
    if (id) {
      fetchDoctorProfile(id);
    }
  }, [navigate]);

  const fetchDoctorProfile = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setDoctorData(data);
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
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

        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar">
              <i className="fas fa-user-md"></i>
            </div>
            <div className="profile-header-info">
              <h2>Dr. {doctorData.first_name} {doctorData.last_name}</h2>
              <span className="role-badge">{doctorData.specialization || 'General Practitioner'}</span>
            </div>
          </div>

          <div className="profile-section">
            <h3><i className="fas fa-user"></i> Personal Information</h3>
            <div className="profile-details-grid">
              <div className="profile-detail">
                <span className="label">Doctor ID</span>
                <span className="value">#{doctorData.doctor_id}</span>
              </div>
              <div className="profile-detail">
                <span className="label">First Name</span>
                <span className="value">{doctorData.first_name || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Last Name</span>
                <span className="value">{doctorData.last_name || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">NIC</span>
                <span className="value">{doctorData.nic || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Date of Birth</span>
                <span className="value">{formatDate(doctorData.date_of_birth)}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Gender</span>
                <span className="value">{doctorData.gender || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3><i className="fas fa-address-book"></i> Contact Information</h3>
            <div className="profile-details-grid">
              <div className="profile-detail">
                <span className="label">Email</span>
                <span className="value">{doctorData.email || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Phone</span>
                <span className="value">{doctorData.phone_no || 'N/A'}</span>
              </div>
              <div className="profile-detail full-width">
                <span className="label">Address</span>
                <span className="value">{doctorData.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3><i className="fas fa-graduation-cap"></i> Professional Information</h3>
            <div className="profile-details-grid">
              <div className="profile-detail">
                <span className="label">Specialization</span>
                <span className="value">{doctorData.specialization || 'General Practitioner'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">License Number</span>
                <span className="value">{doctorData.license_number || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Years of Experience</span>
                <span className="value">{doctorData.years_experience || 0} years</span>
              </div>
              <div className="profile-detail full-width">
                <span className="label">Qualifications</span>
                <span className="value">{doctorData.qualifications || 'N/A'}</span>
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
                <span className="value">{formatDate(doctorData.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
