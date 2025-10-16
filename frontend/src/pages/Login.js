// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/auth.css';

export default function Login({ onLogin, loginType = 'staff' }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      // Call backend authentication API
      const response = await authService.login(email, password);
      
      if (response.success) {
        // Determine user role from user_type
        let role = 'Staff';
        if (response.user_type === 'patient') {
          role = 'Patient';
        } else if (response.user_type === 'doctor') {
          role = 'Doctor';
        } else if (response.user_type === 'admin') {
          role = 'System Admin';
        } else if (response.user_type === 'staff') {
          role = 'Admin Staff';
        }

        // Call the parent onLogin callback if provided
        if (onLogin) {
          onLogin(role, response.user_type);
        }

        // Redirect based on user type
        if (response.user_type === 'patient') {
          navigate('/patient-dashboard');
        } else {
          // Staff, doctor, admin go to staff dashboard
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle different error types
      if (err.response) {
        // Backend returned an error response
        if (err.response.status === 401) {
          setError('Invalid email or password');
        } else if (err.response.status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(err.response.data?.detail || 'Login failed. Please try again.');
        }
      } else if (err.request) {
        // Request was made but no response received
        setError('Cannot connect to server. Please check your connection.');
      } else {
        // Other errors
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isStaffLogin = loginType === 'staff';

  return (
    <div className="auth" style={{minHeight:'100vh', display:'grid', placeItems:'center', background:'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)'}}>
      <section className="card" style={{ maxWidth: 520, width: '95vw', padding: '2rem', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16}}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>
              {isStaffLogin ? '👨‍⚕️ Staff Portal Login' : '🧑‍🤝‍🧑 Patient Portal Login'}
            </h2>
            <p className="label">
              {isStaffLogin ? 'Sign in to access the staff dashboard' : 'Sign in to access your medical records'}
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="form">
          <label className="label">
            Email Address
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              autoComplete="email"
              disabled={loading}
              required
            />
          </label>
          <label className="label">
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </label>
          
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
          
          <button 
            type="submit" 
            className="btn primary block" 
            style={{marginTop:16, position: 'relative'}}
            disabled={loading}
          >
            {loading ? (
              <>
                <span style={{opacity: 0.7}}>⏳</span> Signing in...
              </>
            ) : (
              isStaffLogin ? 'Sign in to Staff Portal' : 'Sign in to Patient Portal'
            )}
          </button>
        </form>
        
        <div style={{marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0'}}>
          <button 
            className="btn" 
            onClick={() => navigate('/')}
            style={{width: '100%', marginBottom: 8}}
          >
            ← Back to Home
          </button>
          {isStaffLogin ? (
            <p className="label" style={{textAlign: 'center', marginTop: 8, fontSize: 12}}>
              🔒 Secured with SSL • Staff Access Only
            </p>
          ) : (
            <p className="label" style={{textAlign: 'center', marginTop: 8, fontSize: 12}}>
              <a href="#forgot" style={{color: 'var(--accent-red)', textDecoration: 'none'}}>Forgot Password?</a>
              {' • '}
              <span 
                onClick={() => navigate('/patient-signup')} 
                style={{color: 'var(--accent-red)', textDecoration: 'none', cursor: 'pointer'}}
              >
                New Patient Registration
              </span>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
