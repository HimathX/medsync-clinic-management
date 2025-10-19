// src/pages/PatientSignup.js - Patient Registration
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import patientService from '../services/patientService';
import branchService from '../services/branchService';
import '../styles/auth.css';

export default function PatientSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [branches, setBranches] = useState([]);

  // Form data matching backend schema
  const [formData, setFormData] = useState({
    // Personal Information
    full_name: '',
    NIC: '',
    email: '',
    gender: 'Male',
    DOB: '',
    password: '',
    confirmPassword: '',
    blood_group: 'O+',
    
    // Contact Information
    contact_num1: '',
    contact_num2: '',
    
    // Address Information
    address_line1: '',
    address_line2: '',
    city: '',
    province: 'Western',
    postal_code: '',
    country: 'Sri Lanka',
    
    // Branch Selection
    registered_branch_name: ''
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const branchesData = await branchService.getAllBranches();
      console.log('Fetched branches:', branchesData); // Debug log
      setBranches(branchesData || []);
      if (branchesData && branchesData.length > 0) {
        setFormData(prev => ({ ...prev, registered_branch_name: branchesData[0].branch_name }));
      } else {
        console.warn('No branches returned from API');
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError('Failed to load branches. Please refresh the page.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.NIC.trim()) {
      setError('NIC number is required');
      return false;
    }
    if (formData.NIC.length !== 10 && formData.NIC.length !== 12) {
      setError('NIC must be 10 or 12 characters');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.DOB) {
      setError('Date of birth is required');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.contact_num1.trim()) {
      setError('Primary contact number is required');
      return false;
    }
    if (!formData.address_line1.trim()) {
      setError('Address line 1 is required');
      return false;
    }
    if (!formData.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!formData.postal_code.trim()) {
      setError('Postal code is required');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.registered_branch_name) {
      setError('Please select a branch');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Prepare data according to backend schema
      const registrationData = {
        full_name: formData.full_name,
        NIC: formData.NIC,
        email: formData.email,
        gender: formData.gender,
        DOB: formData.DOB,
        password: formData.password,
        blood_group: formData.blood_group,
        contact_num1: formData.contact_num1,
        contact_num2: formData.contact_num2 || '',
        address_line1: formData.address_line1,
        address_line2: formData.address_line2 || '',
        city: formData.city,
        province: formData.province,
        postal_code: formData.postal_code,
        country: formData.country,
        registered_branch_name: formData.registered_branch_name
      };

      const response = await patientService.registerPatient(registrationData);

      if (response.success) {
        alert(`Registration successful! 🎉\n\nYour Patient ID: ${response.patient_id}\n\nYou can now login with your email and password.`);
        navigate('/patient-login');
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth" style={{
      minHeight:'100vh', 
      display:'flex', 
      alignItems:'center', 
      justifyContent:'center', 
      background:'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #14b8a6 100%)', 
      padding: '20px'
    }}>
      <section className="card" style={{ 
        maxWidth: 750, 
        width: '100%', 
        padding: '3rem', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        background: 'white',
        borderRadius: '20px'
      }}>
        {/* Header */}
        <div style={{textAlign: 'center', marginBottom: '2.5rem'}}>
          <div style={{
            fontSize: '56px', 
            marginBottom: '15px',
            background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>🏥</div>
          <h2 style={{ 
            marginTop: 0, 
            marginBottom: 10, 
            fontSize: '32px',
            fontWeight: '700',
            color: '#0f172a',
            letterSpacing: '-0.5px'
          }}>
            Patient Registration
          </h2>
          <p className="label" style={{
            fontSize: '16px',
            color: '#64748b',
            fontWeight: '400'
          }}>
            Create your account to access our healthcare services
          </p>
          
          {/* Progress Steps */}
          <div style={{marginTop: '25px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px'}}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: step >= s ? 'linear-gradient(135deg, #0ea5e9, #14b8a6)' : '#e2e8f0',
                  color: step >= s ? 'white' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s',
                  boxShadow: step >= s ? '0 4px 12px rgba(14, 165, 233, 0.3)' : 'none'
                }}>
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && (
                  <div style={{
                    width: '50px',
                    height: '3px',
                    borderRadius: '2px',
                    background: step > s ? 'linear-gradient(90deg, #0ea5e9, #14b8a6)' : '#e2e8f0',
                    transition: 'all 0.3s'
                  }} />
                )}
              </div>
            ))}
          </div>
          <p className="label" style={{
            marginTop: '15px', 
            fontSize: '14px',
            color: '#0ea5e9',
            fontWeight: '600'
          }}>
            Step {step} of 3
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div style={{animation: 'fadeIn 0.3s'}}>
              <h3 style={{marginBottom: '24px', fontSize: '22px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <span style={{fontSize: '24px'}}>👤</span> Personal Information
              </h3>
              
              <div style={{marginBottom: '15px'}}>
                <label className="label">Full Name *</label>
                <input
                  className="input"
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  disabled={loading}
                  required
                />
              </div>

              <div className="grid grid-2" style={{gap: '15px', marginBottom: '15px'}}>
                <div>
                  <label className="label">NIC Number *</label>
                  <input
                    className="input"
                    type="text"
                    name="NIC"
                    value={formData.NIC}
                    onChange={handleInputChange}
                    placeholder="XXXXXXXXXV or XXXXXXXXXXXX"
                    maxLength="12"
                    disabled={loading}
                    required
                  />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input
                    className="input"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-2" style={{gap: '15px', marginBottom: '15px'}}>
                <div>
                  <label className="label">Date of Birth *</label>
                  <input
                    className="input"
                    type="date"
                    name="DOB"
                    value={formData.DOB}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    disabled={loading}
                    required
                  />
                </div>
                <div>
                  <label className="label">Gender *</label>
                  <select
                    className="select"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{marginBottom: '15px'}}>
                <label className="label">Blood Group *</label>
                <select
                  className="select"
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Contact & Address */}
          {step === 2 && (
            <div style={{animation: 'fadeIn 0.3s'}}>
              <h3 style={{marginBottom: '24px', fontSize: '22px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <span style={{fontSize: '24px'}}>📍</span> Contact & Address
              </h3>
              
              <div className="grid grid-2" style={{gap: '15px', marginBottom: '15px'}}>
                <div>
                  <label className="label">Primary Contact Number *</label>
                  <input
                    className="input"
                    type="tel"
                    name="contact_num1"
                    value={formData.contact_num1}
                    onChange={handleInputChange}
                    placeholder="+94771234567"
                    disabled={loading}
                    required
                  />
                </div>
                <div>
                  <label className="label">Secondary Contact Number</label>
                  <input
                    className="input"
                    type="tel"
                    name="contact_num2"
                    value={formData.contact_num2}
                    onChange={handleInputChange}
                    placeholder="+94112345678"
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={{marginBottom: '15px'}}>
                <label className="label">Address Line 1 *</label>
                <input
                  className="input"
                  type="text"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleInputChange}
                  placeholder="House number and street name"
                  disabled={loading}
                  required
                />
              </div>

              <div style={{marginBottom: '15px'}}>
                <label className="label">Address Line 2</label>
                <input
                  className="input"
                  type="text"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleInputChange}
                  placeholder="Apartment, suite, etc. (optional)"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-2" style={{gap: '15px', marginBottom: '15px'}}>
                <div>
                  <label className="label">City *</label>
                  <input
                    className="input"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    disabled={loading}
                    required
                  />
                </div>
                <div>
                  <label className="label">Province *</label>
                  <select
                    className="select"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
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
                </div>
              </div>

              <div className="grid grid-2" style={{gap: '15px', marginBottom: '15px'}}>
                <div>
                  <label className="label">Postal Code *</label>
                  <input
                    className="input"
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    placeholder="00000"
                    disabled={loading}
                    required
                  />
                </div>
                <div>
                  <label className="label">Country *</label>
                  <input
                    className="input"
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Security & Branch */}
          {step === 3 && (
            <div style={{animation: 'fadeIn 0.3s'}}>
              <h3 style={{marginBottom: '24px', fontSize: '22px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <span style={{fontSize: '24px'}}>🔒</span> Security & Branch Selection
              </h3>
              
              <div style={{marginBottom: '15px'}}>
                <label className="label">Password * (minimum 8 characters)</label>
                <input
                  className="input"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter a strong password"
                  minLength="8"
                  disabled={loading}
                  required
                />
              </div>

              <div style={{marginBottom: '15px'}}>
                <label className="label">Confirm Password *</label>
                <input
                  className="input"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter your password"
                  minLength="8"
                  disabled={loading}
                  required
                />
              </div>

              <div style={{marginBottom: '15px'}}>
                <label className="label">Select Branch *</label>
                <select
                  className="select"
                  name="registered_branch_name"
                  value={formData.registered_branch_name}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                >
                  {branches.length === 0 ? (
                    <option value="">Loading branches...</option>
                  ) : (
                    branches.map(branch => (
                      <option key={branch.branch_id} value={branch.branch_name}>
                        {branch.branch_name}
                      </option>
                    ))
                  )}
                </select>
                <p className="label" style={{fontSize: '12px', marginTop: '5px', color: '#64748b'}}>
                  This will be your primary branch for appointments
                </p>
              </div>

              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                borderRadius: '12px',
                border: '2px solid #bae6fd',
                marginBottom: '15px'
              }}>
                <p style={{fontSize: '14px', margin: 0, color: '#075985', fontWeight: '500'}}>
                  ℹ️ By registering, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '14px',
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              border: '2px solid #fca5a5',
              borderRadius: '12px',
              color: '#991b1b',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{fontSize: '18px'}}>⚠️</span> {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
            {step > 1 && (
              <button
                type="button"
                className="btn"
                onClick={handleBack}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  background: 'white',
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ← Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                className="btn primary"
                onClick={handleNext}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '14px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
                }}
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                className="btn primary"
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '14px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: 'none',
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(14, 165, 233, 0.3)'
                }}
              >
                {loading ? '⏳ Registering...' : '✓ Complete Registration'}
              </button>
            )}
          </div>
        </form>

        {/* Footer Links */}
        <div style={{marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '2px solid #e2e8f0', textAlign: 'center'}}>
          <p className="label" style={{fontSize: '15px', color: '#64748b', marginBottom: '15px'}}>
            Already have an account?{' '}
            <a href="/patient-login" style={{color: '#0ea5e9', textDecoration: 'none', fontWeight: 600, borderBottom: '2px solid transparent', transition: 'border-color 0.2s'}}>
              Login here
            </a>
          </p>
          <button 
            className="btn" 
            onClick={() => navigate('/')}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '10px',
              border: '2px solid #e2e8f0',
              background: 'white',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ← Back to Home
          </button>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
