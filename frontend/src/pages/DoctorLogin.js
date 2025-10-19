import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-icon doctor-icon">
            <i className="fas fa-user-md"></i>
          </div>
          <h1>Doctor Login</h1>
          <p>Access your medical dashboard</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">
              <i className="fas fa-envelope"></i> Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="doctor@medsync.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <i className="fas fa-lock"></i> Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-submit btn-doctor" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Logging in...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i> Login
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/doctor/signup')} 
              className="link-button"
              type="button"
            >
              Register as Doctor
            </button>
          </p>
          <p>
            <button 
              onClick={() => navigate('/')} 
              className="link-button"
              type="button"
            >
              <i className="fas fa-arrow-left"></i> Back to Home
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;
