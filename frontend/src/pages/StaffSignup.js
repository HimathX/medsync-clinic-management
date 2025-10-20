// src/pages/StaffSignup.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/auth.css';
import '../styles/staffAuth.css';

export default function StaffSignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [branches, setBranches] = useState([]);

  const [formData, setFormData] = useState({
    // Personal Info
    full_name: '',
    NIC: '',
    email: '',
    gender: 'Male',
    DOB: '',
    password: '',
    confirmPassword: '',
    
    // Contact
    contact_num1: '',
    contact_num2: '',
    
    // Address
    address_line1: '',
    address_line2: '',
    city: '',
    province: 'Western',
    postal_code: '',
    country: 'Sri Lanka',
    
    // Employment
    branch_name: '',
    role: 'nurse',
    salary: '',
    joined_date: new Date().toISOString().split('T')[0]
  });

  // Fetch branches on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get('/branches');
        if (response.data.branches) {
          setBranches(response.data.branches);
          if (response.data.branches.length > 0) {
            setFormData(prev => ({ ...prev, branch_name: response.data.branches[0].branch_name }));
          }
        }
      } catch (err) {
        console.error('Error fetching branches:', err);
        setError('Could not load branches. Please refresh the page.');
      }
    };
    fetchBranches();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    // Required fields
    if (!formData.full_name || !formData.NIC || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Password validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // NIC validation
    if (formData.NIC.length < 10) {
      setError('Please enter a valid NIC number');
      return false;
    }

    // Contact validation
    if (!formData.contact_num1) {
      setError('Primary contact number is required');
      return false;
    }

    // Salary validation
    if (!formData.salary || parseFloat(formData.salary) <= 0) {
      setError('Please enter a valid salary');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Prepare data (exclude confirmPassword)
      const { confirmPassword, ...registrationData } = formData;

      // Call staff registration API
      const response = await api.post('/staff/register', registrationData);

      if (response.data.success) {
        setSuccess(`Registration successful! Staff ID: ${response.data.staff_id}`);
        
        // Clear form
        setTimeout(() => {
          navigate('/staff-login');
        }, 2000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.response) {
        setError(err.response.data?.detail || 'Registration failed. Please try again.');
      } else if (err.request) {
        setError('Cannot connect to server. Please check your connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-auth-container">
      <section className="staff-auth-card" style={{ maxWidth: 900 }}>
        <div className="staff-auth-header" style={{ marginBottom: '2rem' }}>
          <h2>👔 Staff Member Registration</h2>
          <p>Register a new staff member account</p>
        </div>

        <form onSubmit={handleSubmit} className="staff-auth-form">
          {/* Personal Information */}
          <fieldset className="staff-fieldset">
            <legend>Personal Information</legend>
            
            <div className="staff-form-grid">
              <label className="staff-form-group">
                <span className="staff-form-label">Full Name *</span>
                <input
                  className="staff-form-input"
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                  disabled={loading}
                />
              </label>

              <label className="staff-form-group">
                <span className="staff-form-label">NIC Number *</span>
                <input
                  className="staff-form-input"
                  type="text"
                  name="NIC"
                  value={formData.NIC}
                  onChange={handleChange}
                  placeholder="199012345678"
                  required
                  disabled={loading}
                />
              </label>

              <label className="staff-form-group">
                <span className="staff-form-label">Email Address *</span>
                <input
                  className="staff-form-input"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="staff@medsync.lk"
                  required
                  disabled={loading}
                />
              </label>

              <label className="staff-form-group">
                <span className="staff-form-label">Gender *</span>
                <select
                  className="staff-form-select"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="staff-form-group">
                <span className="staff-form-label">Date of Birth *</span>
                <input
                  className="staff-form-input"
                  type="date"
                  name="DOB"
                  value={formData.DOB}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  disabled={loading}
                />
              </label>
            </div>
          </fieldset>

          {/* Contact Information */}
          <fieldset className="staff-fieldset">
            <legend>Contact Information</legend>
            
            <div className="staff-form-grid">
              <label className="staff-form-group">
                <span className="staff-form-label">Primary Contact Number *</span>
                <input
                  className="staff-form-input"
                  type="tel"
                  name="contact_num1"
                  value={formData.contact_num1}
                  onChange={handleChange}
                  placeholder="+94771234567"
                  required
                  disabled={loading}
                />
              </label>

              <label className="staff-form-group">
                <span className="staff-form-label">Secondary Contact Number</span>
                <input
                  className="staff-form-input"
                  type="tel"
                  name="contact_num2"
                  value={formData.contact_num2}
                  onChange={handleChange}
                  placeholder="+94112345678"
                  disabled={loading}
                />
              </label>
            </div>
          </fieldset>

          {/* Address Information */}
          <fieldset className="staff-fieldset">
            <legend>Address</legend>
            
            <div className="staff-form-grid">
              <label className="staff-form-group staff-form-grid-full">
                <span className="staff-form-label">Address Line 1 *</span>
                <input
                  className="staff-form-input"
                  type="text"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleChange}
                  placeholder="123 Main Street"
                  required
                  disabled={loading}
                />
              </label>

              <label className="staff-form-group staff-form-grid-full">
                <span className="staff-form-label">Address Line 2</span>
                <input
                  className="staff-form-input"
                  type="text"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleChange}
                  placeholder="Apartment, suite, etc."
                  disabled={loading}
                />
              </label>

              <label className="staff-form-group">
                <span className="staff-form-label">City *</span>
                <input
                  className="staff-form-input"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Colombo"
                  required
                  disabled={loading}
                />
              </label>

              <label className="staff-form-group">
                <span className="staff-form-label">Province *</span>
                <select
                  className="staff-form-select"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="Western">Western</option>
                  <option value="Central">Central</option>
                  <option value="Southern">Southern</option>
                  <option value="Northern">Northern</option>
                  <option value="Eastern">Eastern</option>
                  <option value="North Western">North Western</option>
                  <option value="North Central">North Central</option>
                  <option value="Uva">Uva</option>
                  <option value="Sabaragamuwa">Sabaragamuwa</option>
                </select>
              </label>

              <label className="staff-form-group">
                <span className="staff-form-label">Postal Code *</span>
                <input
                  className="staff-form-input"
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  placeholder="00100"
                  required
                  disabled={loading}
                />
              </label>
            </div>
          </fieldset>

          {/* Employment Information */}
          <fieldset className="staff-fieldset">
            <legend>Employment Details</legend>
            
            <div className="staff-form-grid">
              <label className="staff-form-group">
                <span className="staff-form-label">Branch *</span>
                <select
                  className="staff-form-select"
                  name="branch_name"
                  value={formData.branch_name}
                  onChange={handleChange}
                  required
                  disabled={loading || branches.length === 0}
                >
                  {branches.length === 0 ? (
                    <option>Loading branches...</option>
                  ) : (
                    branches.map(branch => (
                      <option key={branch.branch_id} value={branch.branch_name}>
                        {branch.branch_name}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="staff-form-group">
                <span className="staff-form-label">Role *</span>
                <select
                  className="staff-form-select"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="nurse">Nurse</option>
                  <option value="admin">Admin</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="manager">Manager</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="lab_technician">Lab Technician</option>
                </select>
              </label>

              <label className="staff-form-group">
                <span className="staff-form-label">Monthly Salary (LKR) *</span>
                <input
                  className="staff-form-input"
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="65000.00"
                  min="0"
                  step="0.01"
                  required
                  disabled={loading}
                />
              </label>

              <label className="staff-form-group">
                <span className="staff-form-label">Joining Date *</span>
                <input
                  className="staff-form-input"
                  type="date"
                  name="joined_date"
                  value={formData.joined_date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  disabled={loading}
                />
              </label>
            </div>
          </fieldset>

          {/* Password */}
          <fieldset className="staff-fieldset">
            <legend>Security</legend>
            
            <div className="staff-form-grid">
              <label className="staff-form-group">
                <span className="staff-form-label">Password * (min 8 characters)</span>
                <input
                  className="staff-form-input"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  minLength="8"
                  required
                  disabled={loading}
                />
              </label>

              <label className="staff-form-group">
                <span className="staff-form-label">Confirm Password *</span>
                <input
                  className="staff-form-input"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  minLength="8"
                  required
                  disabled={loading}
                />
              </label>
            </div>
          </fieldset>

          {error && (
            <div className="staff-error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="staff-success-message">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="staff-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="staff-loading-spinner"></span>
                Registering...
              </>
            ) : (
              '✅ Register Staff Member'
            )}
          </button>
        </form>

        <div className="staff-auth-footer">
          <button
            className="staff-secondary-btn"
            onClick={() => navigate('/')}
            type="button"
            style={{ width: '100%' }}
          >
            ← Back to Home
          </button>
          <p className="staff-auth-footer-text">
            Already have an account?
            <br />
            <button
              className="staff-auth-link"
              onClick={() => navigate('/staff-login')}
              type="button"
            >
              Sign in here
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
