// src/pages/StaffSignup.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/auth.css';

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
    <div className="auth" style={{ minHeight: '100vh', padding: '2rem', background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)' }}>
      <section className="card" style={{ maxWidth: 900, width: '95vw', margin: '0 auto', padding: '2rem', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>
            👔 Staff Member Registration
          </h2>
          <p className="label">Register a new staff member account</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          {/* Personal Information */}
          <fieldset style={{ border: '1px solid #ddd', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <legend style={{ fontWeight: 'bold', color: '#333', padding: '0 0.5rem' }}>Personal Information</legend>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <label className="label">
                Full Name *
                <input
                  className="input"
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                  disabled={loading}
                />
              </label>

              <label className="label">
                NIC Number *
                <input
                  className="input"
                  type="text"
                  name="NIC"
                  value={formData.NIC}
                  onChange={handleChange}
                  placeholder="199012345678"
                  required
                  disabled={loading}
                />
              </label>

              <label className="label">
                Email Address *
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="staff@medsync.lk"
                  required
                  disabled={loading}
                />
              </label>

              <label className="label">
                Gender *
                <select
                  className="input"
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

              <label className="label">
                Date of Birth *
                <input
                  className="input"
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
          <fieldset style={{ border: '1px solid #ddd', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <legend style={{ fontWeight: 'bold', color: '#333', padding: '0 0.5rem' }}>Contact Information</legend>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <label className="label">
                Primary Contact Number *
                <input
                  className="input"
                  type="tel"
                  name="contact_num1"
                  value={formData.contact_num1}
                  onChange={handleChange}
                  placeholder="+94771234567"
                  required
                  disabled={loading}
                />
              </label>

              <label className="label">
                Secondary Contact Number
                <input
                  className="input"
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
          <fieldset style={{ border: '1px solid #ddd', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <legend style={{ fontWeight: 'bold', color: '#333', padding: '0 0.5rem' }}>Address</legend>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <label className="label" style={{ gridColumn: 'span 2' }}>
                Address Line 1 *
                <input
                  className="input"
                  type="text"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleChange}
                  placeholder="123 Main Street"
                  required
                  disabled={loading}
                />
              </label>

              <label className="label" style={{ gridColumn: 'span 2' }}>
                Address Line 2
                <input
                  className="input"
                  type="text"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleChange}
                  placeholder="Apartment, suite, etc."
                  disabled={loading}
                />
              </label>

              <label className="label">
                City *
                <input
                  className="input"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Colombo"
                  required
                  disabled={loading}
                />
              </label>

              <label className="label">
                Province *
                <select
                  className="input"
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

              <label className="label">
                Postal Code *
                <input
                  className="input"
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
          <fieldset style={{ border: '1px solid #ddd', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <legend style={{ fontWeight: 'bold', color: '#333', padding: '0 0.5rem' }}>Employment Details</legend>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <label className="label">
                Branch *
                <select
                  className="input"
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

              <label className="label">
                Role *
                <select
                  className="input"
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

              <label className="label">
                Monthly Salary (LKR) *
                <input
                  className="input"
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

              <label className="label">
                Joining Date *
                <input
                  className="input"
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
          <fieldset style={{ border: '1px solid #ddd', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <legend style={{ fontWeight: 'bold', color: '#333', padding: '0 0.5rem' }}>Security</legend>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <label className="label">
                Password * (min 8 characters)
                <input
                  className="input"
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

              <label className="label">
                Confirm Password *
                <input
                  className="input"
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
            <div style={{
              padding: '12px',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c33',
              marginBottom: '1rem',
              fontSize: '14px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px',
              background: '#efe',
              border: '1px solid #cfc',
              borderRadius: '8px',
              color: '#3c3',
              marginBottom: '1rem',
              fontSize: '14px'
            }}>
              ✅ {success}
            </div>
          )}

          <button
            type="submit"
            className="btn primary block"
            style={{ marginTop: 16 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span style={{ opacity: 0.7 }}>⏳</span> Registering...
              </>
            ) : (
              '✅ Register Staff Member'
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
          <button
            className="btn"
            onClick={() => navigate('/')}
            style={{ marginRight: 8 }}
          >
            ← Back to Home
          </button>
          <button
            className="btn"
            onClick={() => navigate('/staff-login')}
          >
            Already have an account? Login
          </button>
        </div>
      </section>
    </div>
  );
}
