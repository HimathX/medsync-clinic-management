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
      // Use staff login endpoint since doctors login through staff system
      const response = await fetch(`${API_BASE_URL}/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        // Check if user is actually a doctor
        if (data.user_type !== 'doctor') {
          setError('Invalid credentials. This login is for doctors only.');
          setLoading(false);
          return;
        }

        // Store authentication data
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify({
          userId: data.user_id,
          userType: data.user_type,
          email: formData.email,
          doctor_id: data.user_id,
          isAuthenticated: true
        }));

        // Redirect to doctor dashboard
        navigate('/doctor/dashboard');
      } else {
        setError(data.detail || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to connect to server. Please try again.');
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
            {error}
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
              minLength={8}
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
            <button onClick={() => navigate('/doctor/signup')} className="link-button">
              Register as Doctor
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

export default DoctorLogin;
