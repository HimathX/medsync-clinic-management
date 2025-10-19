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
      
      // Call backend authentication API with loginType
      const response = await authService.login(email, password, loginType);
      
      if (response.success) {
        // ACCESS CONTROL: Check if user is trying to login from the correct portal
        const userType = response.user_type.toLowerCase();
        
        // Patient trying to login from staff portal - BLOCK
        if (loginType === 'staff' && userType === 'patient') {
          setError('Patients cannot access the staff portal. Please use the Patient Portal.');
          setLoading(false);
          return;
        }
        
        // Staff/Doctor/Employee trying to login from patient portal - BLOCK
        if (loginType === 'patient' && (userType === 'doctor' || userType === 'employee' || userType === 'admin' || userType === 'staff')) {
          setError('Staff members cannot access the patient portal. Please use the Staff Portal.');
          setLoading(false);
          return;
        }
        
        // Determine user role from user_type
        let role = 'Staff';
        if (userType === 'patient') {
          role = 'Patient';
        } else if (userType === 'doctor') {
          role = 'Doctor';
        } else if (userType === 'admin') {
          role = 'System Admin';
        } else if (userType === 'manager') {
          role = 'Manager';
        } else if (userType === 'nurse') {
          role = 'Nurse';
        } else if (userType === 'receptionist') {
          role = 'Receptionist';
        } else if (userType === 'employee' || userType === 'staff') {
          role = 'Staff';
        }

        // Call the parent onLogin callback if provided
        if (onLogin) {
          onLogin(role, userType);
        }

        // Redirect based on user type
        if (userType === 'patient') {
          navigate('/patient/dashboard');
        } else if (userType === 'doctor' || userType === 'employee' || userType === 'admin' || 
                   userType === 'staff' || userType === 'manager' || userType === 'nurse' || 
                   userType === 'receptionist') {
          // All staff types go to staff dashboard
          navigate('/');
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
              <br />
              <span 
                onClick={() => navigate('/staff-signup')} 
                style={{color: 'var(--accent-red)', textDecoration: 'none', cursor: 'pointer', marginTop: 4, display: 'inline-block'}}
              >
                New Staff Registration
              </span>
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
