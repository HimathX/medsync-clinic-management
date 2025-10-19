import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import branchService from '../services/branchService';
import '../styles/auth.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorSignup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [branches, setBranches] = useState([]);
  
  const [formData, setFormData] = useState({
    // Personal Information
    full_name: '',
    NIC: '',
    gender: 'Male',
    DOB: '',
    
    // Contact Information
    email: '',
    contact_num1: '',
    contact_num2: '',
    
    // Address Information
    address_line1: '',
    address_line2: '',
    city: '',
    province: 'Western',
    postal_code: '',
    country: 'Sri Lanka',
    
    // Medical Information
    license_number: '',
    specialization_ids: [],
    
    // Employment Information
    branch_name: '',
    salary: '',
    
    // Security
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const branchesData = await branchService.getAllBranches();
      setBranches(branchesData || []);
      if (branchesData && branchesData.length > 0) {
        setFormData(prev => ({ ...prev, branch_name: branchesData[0].branch_name }));
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Failed to load branches. Please refresh the page.');
    }
  };

  const genderOptions = ['Male', 'Female', 'Other'];
  const provinceOptions = ['Western', 'Central', 'Southern', 'Northern', 'Eastern', 'North Western', 'North Central', 'Uva', 'Sabaragamuwa'];

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
    if (!formData.DOB) {
      setError('Date of birth is required');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
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
    if (!formData.license_number.trim()) {
      setError('Medical license number is required');
      return false;
    }
    if (!formData.branch_name) {
      setError('Please select a branch');
      return false;
    }
    if (!formData.salary || parseFloat(formData.salary) <= 0) {
      setError('Please enter a valid salary');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
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
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      setStep(4);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep4()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Prepare data for backend
      const { confirmPassword, ...registrationData } = formData;
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
        alert(`Registration successful! 🎉\n\nYour Doctor ID: ${data.doctor_id}\n\nYou can now login with your email and password.`);
        navigate('/doctor/login');
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
    <div className="auth" style={{
      minHeight:'100vh', 
      display:'flex', 
      alignItems:'center', 
      justifyContent:'center', 
      background:'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)', 
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
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>⚕️</div>
          <h2 style={{ 
            marginTop: 0, 
            marginBottom: 10, 
            fontSize: '32px',
            fontWeight: '700',
            color: '#0f172a',
            letterSpacing: '-0.5px'
          }}>
            Doctor Registration
          </h2>
          <p className="label" style={{
            fontSize: '16px',
            color: '#64748b',
            fontWeight: '400'
          }}>
            Join our medical team and make a difference
          </p>
          
          {/* Progress Steps */}
          <div style={{marginTop: '25px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'}}>
            {[1, 2, 3, 4].map(s => (
              <div key={s} style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: step >= s ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#e2e8f0',
                  color: step >= s ? 'white' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s',
                  boxShadow: step >= s ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                }}>
                  {step > s ? '✓' : s}
                </div>
                {s < 4 && (
                  <div style={{
                    width: '40px',
                    height: '3px',
                    borderRadius: '2px',
                    background: step > s ? 'linear-gradient(90deg, #3b82f6, #1d4ed8)' : '#e2e8f0',
                    transition: 'all 0.3s'
                  }} />
                )}
              </div>
            ))}
          </div>
          <p className="label" style={{
            marginTop: '15px', 
            fontSize: '14px',
            color: '#3b82f6',
            fontWeight: '600'
          }}>
            Step {step} of 4
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div style={{animation: 'fadeIn 0.3s'}}>
              <h3 style={{marginBottom: '24px', fontSize: '22px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <span style={{fontSize: '24px'}}>👨‍⚕️</span> Personal Information
              </h3>
              
              <div style={{marginBottom: '15px'}}>
                <label className="label">Full Name *</label>
                <input
                  className="input"
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Dr. John Smith"
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
              </div>

              <div style={{marginBottom: '15px'}}>
                <label className="label">Gender *</label>
                <select
                  className="select"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  {genderOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Contact & Address */}
          {step === 2 && (
            <div style={{animation: 'fadeIn 0.3s'}}>
              <h3 style={{marginBottom: '24px', fontSize: '22px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <span style={{fontSize: '24px'}}>📞</span> Contact & Address Information
              </h3>
              
              <div className="grid grid-2" style={{gap: '15px', marginBottom: '15px'}}>
                <div>
                  <label className="label">Email Address *</label>
                  <input
                    className="input"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="doctor@example.com"
                    disabled={loading}
                    required
                  />
                </div>
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
              </div>

              <div style={{marginBottom: '15px'}}>
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
                    placeholder="Colombo"
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
                    {provinceOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
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

          {/* Step 3: Medical & Employment Information */}
          {step === 3 && (
            <div style={{animation: 'fadeIn 0.3s'}}>
              <h3 style={{marginBottom: '24px', fontSize: '22px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <span style={{fontSize: '24px'}}>🩺</span> Medical & Employment Information
              </h3>
              
              <div style={{marginBottom: '15px'}}>
                <label className="label">Medical License Number *</label>
                <input
                  className="input"
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  placeholder="ML123456"
                  disabled={loading}
                  required
                />
              </div>

              <div className="grid grid-2" style={{gap: '15px', marginBottom: '15px'}}>
                <div>
                  <label className="label">Select Branch *</label>
                  <select
                    className="select"
                    name="branch_name"
                    value={formData.branch_name}
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
                </div>
                <div>
                  <label className="label">Monthly Salary (LKR) *</label>
                  <input
                    className="input"
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="150000"
                    min="0"
                    step="0.01"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                borderRadius: '12px',
                border: '2px solid #93c5fd',
                marginBottom: '15px'
              }}>
                <p style={{fontSize: '14px', margin: 0, color: '#1e3a8a', fontWeight: '500'}}>
                  ℹ️ Your professional credentials will be verified by our medical board
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Account Security */}
          {step === 4 && (
            <div style={{animation: 'fadeIn 0.3s'}}>
              <h3 style={{marginBottom: '24px', fontSize: '22px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <span style={{fontSize: '24px'}}>🔒</span> Account Security
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

              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                borderRadius: '12px',
                border: '2px solid #93c5fd',
                marginBottom: '15px'
              }}>
                <p style={{fontSize: '14px', margin: 0, color: '#1e3a8a', fontWeight: '500'}}>
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
            
            {step < 4 ? (
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
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
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
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)'
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
            <a href="/doctor/login" style={{color: '#3b82f6', textDecoration: 'none', fontWeight: 600, borderBottom: '2px solid transparent', transition: 'border-color 0.2s'}}>
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
};

export default DoctorSignup;
