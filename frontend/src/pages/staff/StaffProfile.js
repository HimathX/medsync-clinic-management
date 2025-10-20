import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffHeader from '../../components/StaffHeader';
import authService from '../../services/authService';
import '../../styles/staff.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const StaffProfile = () => {
  const navigate = useNavigate();
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [branch, setBranch] = useState('Colombo');
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/staff-login');
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(storedUser);
    fetchStaffProfile(user.staff_id || user.id);
  }, [navigate]);

  const fetchStaffProfile = async (staffId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/staff/${staffId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setStaffData(data);
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
      <div className="staff-container">
        <StaffHeader 
          staffName={currentUser?.fullName || 'Staff'}
          staffRole={currentUser?.userType?.charAt(0).toUpperCase() + currentUser?.userType?.slice(1) || 'Staff'}
          branch={branch}
          setBranch={setBranch}
          onLogout={handleLogout}
        />
        <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>
      </div>
    );
  }

  if (error || !staffData) {
    return (
      <div className="staff-container">
        <StaffHeader 
          staffName={currentUser?.fullName || 'Staff'}
          staffRole={currentUser?.userType?.charAt(0).toUpperCase() + currentUser?.userType?.slice(1) || 'Staff'}
          branch={branch}
          setBranch={setBranch}
          onLogout={handleLogout}
        />
        <div className="staff-content">
          <div className="error-message">{error || 'Profile not available'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-container">
      <StaffHeader 
        staffName={currentUser?.fullName || 'Staff'}
        staffRole={currentUser?.userType?.charAt(0).toUpperCase() + currentUser?.userType?.slice(1) || 'Staff'}
        branch={branch}
        setBranch={setBranch}
        onLogout={handleLogout}
      />
      <div className="staff-content">
        <div className="staff-header">
          <h1>My Profile</h1>
          <p>View your account information</p>
        </div>

        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar"><i className="fas fa-user"></i></div>
            <div className="profile-header-info">
              <h2>{staffData.first_name} {staffData.last_name}</h2>
              <span className="role-badge">{staffData.role}</span>
            </div>
          </div>

          <div className="profile-section">
            <h3><i className="fas fa-user"></i> Personal Information</h3>
            <div className="profile-details-grid">
              <div className="profile-detail">
                <span className="label">Staff ID</span>
                <span className="value">#{staffData.staff_id}</span>
              </div>
              <div className="profile-detail">
                <span className="label">First Name</span>
                <span className="value">{staffData.first_name || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Last Name</span>
                <span className="value">{staffData.last_name || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">NIC</span>
                <span className="value">{staffData.nic || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Date of Birth</span>
                <span className="value">{formatDate(staffData.date_of_birth)}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Gender</span>
                <span className="value">{staffData.gender || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3><i className="fas fa-address-book"></i> Contact Information</h3>
            <div className="profile-details-grid">
              <div className="profile-detail">
                <span className="label">Email</span>
                <span className="value">{staffData.email || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Phone</span>
                <span className="value">{staffData.phone_no || 'N/A'}</span>
              </div>
              <div className="profile-detail full-width">
                <span className="label">Address</span>
                <span className="value">{staffData.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3><i className="fas fa-briefcase"></i> Employment Information</h3>
            <div className="profile-details-grid">
              <div className="profile-detail">
                <span className="label">Role</span>
                <span className="value">{staffData.role}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Branch ID</span>
                <span className="value">#{staffData.branch_id || 'N/A'}</span>
              </div>
              <div className="profile-detail">
                <span className="label">Join Date</span>
                <span className="value">{formatDate(staffData.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
