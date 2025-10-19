import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Personal Information
    full_name: '',
    NIC: '',
    email: '',
    gender: '',
    DOB: '',
    password: '',
    confirmPassword: '',
    
    // Contact Information
    contact_num1: '',
    contact_num2: '',
    
    // Address Information
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Sri Lanka',
    
    // Medical Information
    license_number: '',
    specialization_ids: [],
    
    // Employment Information
    branch_name: '',
    salary: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const genderOptions = ['Male', 'Female', 'Other'];
  const provinceOptions = ['Western', 'Central', 'Southern', 'Northern', 'Eastern', 'North Western', 'North Central', 'Uva', 'Sabaragamuwa'];
  const branchOptions = ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!formData.license_number) {
      setError('Medical license number is required');
      return;
    }

    setLoading(true);

    try {
      // Prepare data for backend (remove confirmPassword)
      const { confirmPassword, ...registrationData } = formData;
      
      // Convert salary to decimal
      const dataToSend = {
        ...registrationData,
        salary: parseFloat(registrationData.salary)
      };

      const response = await fetch(`${API_BASE_URL}/doctors/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/doctor/login');
        }, 2000);
      } else {
        setError(data.detail || 'Registration failed. Please check your information.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box auth-box-large">
        <div className="auth-header">
          <div className="auth-icon doctor-icon">
            <i className="fas fa-user-md"></i>
          </div>
          <h1>Doctor Registration</h1>
          <p>Join our medical team</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <i className="fas fa-check-circle"></i>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form signup-form">
          {/* Personal Information Section */}
          <div className="form-section">
            <h3><i className="fas fa-user"></i> Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="full_name">Full Name *</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Dr. John Smith"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="NIC">NIC Number *</label>
                <input
                  type="text"
                  id="NIC"
                  name="NIC"
                  value={formData.NIC}
                  onChange={handleChange}
                  placeholder="123456789V"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Gender *</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Gender</option>
                  {genderOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="DOB">Date of Birth *</label>
                <input
                  type="date"
                  id="DOB"
                  name="DOB"
                  value={formData.DOB}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="form-section">
            <h3><i className="fas fa-phone"></i> Contact Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="doctor@example.com"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact_num1">Primary Phone *</label>
                <input
                  type="tel"
                  id="contact_num1"
                  name="contact_num1"
                  value={formData.contact_num1}
                  onChange={handleChange}
                  placeholder="+94771234567"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="contact_num2">Secondary Phone (Optional)</label>
              <input
                type="tel"
                id="contact_num2"
                name="contact_num2"
                value={formData.contact_num2}
                onChange={handleChange}
                placeholder="+94111234567"
                disabled={loading}
              />
            </div>
          </div>

          {/* Address Information Section */}
          <div className="form-section">
            <h3><i className="fas fa-map-marker-alt"></i> Address Information</h3>
            <div className="form-group">
              <label htmlFor="address_line1">Address Line 1 *</label>
              <input
                type="text"
                id="address_line1"
                name="address_line1"
                value={formData.address_line1}
                onChange={handleChange}
                placeholder="123 Main Street"
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="address_line2">Address Line 2 (Optional)</label>
              <input
                type="text"
                id="address_line2"
                name="address_line2"
                value={formData.address_line2}
                onChange={handleChange}
                placeholder="Apartment, Suite, etc."
                disabled={loading}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Colombo"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="province">Province *</label>
                <select
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Province</option>
                  {provinceOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="postal_code">Postal Code *</label>
                <input
                  type="text"
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  placeholder="10100"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="country">Country *</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={loading}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Medical Information Section */}
          <div className="form-section">
            <h3><i className="fas fa-stethoscope"></i> Medical Information</h3>
            <div className="form-group">
              <label htmlFor="license_number">Medical License Number *</label>
              <input
                type="text"
                id="license_number"
                name="license_number"
                value={formData.license_number}
                onChange={handleChange}
                placeholder="ML123456"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Employment Information Section */}
          <div className="form-section">
            <h3><i className="fas fa-briefcase"></i> Employment Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="branch_name">Branch *</label>
                <select
                  id="branch_name"
                  name="branch_name"
                  value={formData.branch_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Branch</option>
                  {branchOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="salary">Monthly Salary (LKR) *</label>
                <input
                  type="number"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="150000"
                  min="0"
                  step="0.01"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Account Security Section */}
          <div className="form-section">
            <h3><i className="fas fa-lock"></i> Account Security</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  required
                  minLength={8}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-submit btn-doctor" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Registering...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus"></i> Register as Doctor
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button onClick={() => navigate('/doctor/login')} className="link-button">
              Login Here
            </button>
          </p>
          <p>
            <button onClick={() => navigate('/')} className="link-button">
              <i className="fas fa-arrow-left"></i> Back to Home
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorSignup;
