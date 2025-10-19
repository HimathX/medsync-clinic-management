import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';
import '../styles/DoctorLogin.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('📤 Sending login request to:', `${API_BASE_URL}/doctors/login`);
      console.log('📋 Credentials:', { email: formData.email, password: '***' });

      // Use the doctor-specific login endpoint
      const response = await fetch(`${API_BASE_URL}/doctors/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      console.log('📥 Response status:', response.status);
      
      const data = await response.json();
      console.log('📥 Response data:', data);

      if (response.ok && data.success) {
        // Verify response has required fields
        if (!data.user_id || !data.email) {
          setError('Invalid response from server');
          console.error('❌ Missing required fields in response');
          setLoading(false);
          return;
        }

        // Store authentication data in localStorage
        localStorage.setItem('token', data.user_id);
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('user_type', data.user_type || 'doctor');
        localStorage.setItem('full_name', data.full_name || '');
        localStorage.setItem('email', data.email);
        localStorage.setItem('doctor_id', data.doctor_id || data.user_id);
        localStorage.setItem('room_no', data.room_no || '');
        localStorage.setItem('consultation_fee', data.consultation_fee || 0);
        localStorage.setItem('branch_name', data.branch_name || '');
        localStorage.setItem('specializations', JSON.stringify(data.specializations || []));

        console.log('✅ Doctor login successful!');
        console.log('   📍 Stored data:');
        console.log('   - User ID:', data.user_id);
        console.log('   - Full Name:', data.full_name);
        console.log('   - Email:', data.email);
        console.log('   - Doctor ID:', data.doctor_id);
        console.log('   - Room:', data.room_no);
        console.log('   - Branch:', data.branch_name);
        console.log('   - Specializations:', data.specializations);

        // Use a small delay to ensure localStorage is written
        setTimeout(() => {
          console.log('🚀 Redirecting to /doctor/dashboard');
          navigate('/doctor/dashboard', { replace: true });
        }, 500);

      } else {
        // Handle error response
        const errorMsg = data.detail || data.message || 'Invalid email or password';
        setError(errorMsg);
        console.error('❌ Login failed:', errorMsg);
        console.error('   Response:', data);
      }
    } catch (err) {
      console.error('💥 Login error:', err);
      setError(err.message || 'Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-login-container doctor-theme">
      <div className="login-background"></div>
      <div className="login-overlay"></div>
      
      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Doctor Portal</h1>
            <p className="login-subtitle">Welcome back, Doctor</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  name="email"
                  className="modern-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="doctor@medsync.com"
                  disabled={loading}
                  required
                />
                <span className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3.33333 5L10 10.8333L16.6667 5M3.33333 15H16.6667C17.5833 15 18.3333 14.25 18.3333 13.3333V6.66667C18.3333 5.75 17.5833 5 16.6667 5H3.33333C2.41667 5 1.66667 5.75 1.66667 6.66667V13.3333C1.66667 14.25 2.41667 15 3.33333 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="modern-input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M14.95 14.95C13.5255 16.0358 11.7904 16.6374 10 16.6667C4.16667 16.6667 1.66667 10 1.66667 10C2.49596 8.35558 3.64605 6.89485 5.05 5.7M8.25 3.53333C8.82365 3.39907 9.41093 3.33195 10 3.33333C15.8333 3.33333 18.3333 10 18.3333 10C17.9286 10.9463 17.4152 11.8474 16.8 12.6833M11.7667 11.7667C11.5378 12.0123 11.2618 12.2093 10.9552 12.3459C10.6486 12.4826 10.3174 12.5563 9.98181 12.5626C9.64617 12.5689 9.31252 12.5076 9.00102 12.3823C8.68952 12.257 8.40647 12.0702 8.16916 11.8329C7.93185 11.5956 7.74503 11.3125 7.6197 11.001C7.49436 10.6895 7.43313 10.3559 7.43943 10.0202C7.44573 9.68462 7.51944 9.35343 7.65609 9.04683C7.79274 8.74022 7.98974 8.46428 8.23533 8.23533" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1.66667 1.66667L18.3333 18.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M1.66667 10C1.66667 10 4.16667 3.33333 10 3.33333C15.8333 3.33333 18.3333 10 18.3333 10C18.3333 10 15.8333 16.6667 10 16.6667C4.16667 16.6667 1.66667 10 1.66667 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 6.66667V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 13.3333H10.0083" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="signin-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing In...
                </>
              ) : (
                'SIGN IN'
              )}
            </button>

            <div className="form-footer">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span>Remember Me</span>
              </label>
              <a href="#forgot" className="forgot-password">
                Forgot Password?
              </a>
            </div>
          </form>

          <div className="login-links">
            <button 
              className="link-button" 
              onClick={() => navigate('/')}
            >
              ← Back to Home
            </button>
            <span className="separator">•</span>
            <button 
              className="link-button" 
              onClick={() => navigate('/doctor-signup')}
            >
              Register as Doctor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;
