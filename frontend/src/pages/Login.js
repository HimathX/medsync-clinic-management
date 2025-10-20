// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/auth.css';
import '../styles/PatientLogin.css';

export default function Login({ onLogin, loginType = 'staff' }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

        // Dispatch custom event to notify App.js of auth change
        window.dispatchEvent(new Event('authChanged'));
        console.log('🔔 Dispatched authChanged event');
        
        // Force a full page reload to ensure App.js re-checks authentication
        console.log('🔄 Forcing page reload to refresh authentication state');

        // Small delay to ensure localStorage is synced
        setTimeout(() => {
          // Redirect based on user type
          if (userType === 'patient') {
            console.log('✅ Redirecting patient to /patient/dashboard');
            window.location.href = '/patient/dashboard';
          } else if (userType === 'doctor' || userType === 'employee' || userType === 'admin' || 
                     userType === 'staff' || userType === 'manager' || userType === 'nurse' || 
                     userType === 'receptionist') {
            // All staff types go to staff dashboard
            console.log('✅ Redirecting staff to /staff/dashboard');
            window.location.href = '/staff/dashboard';
          }
        }, 100);
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

  // Modern Patient Login Design
  if (!isStaffLogin) {
    return (
      <div className="modern-login-container">
        <div className="login-background"></div>
        <div className="login-overlay"></div>
        
        <div className="login-content">
          <div className="login-card">
            <div className="login-header">
              <h1 className="login-title">Patient Portal</h1>
              <p className="login-subtitle">Have an account?</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    className="modern-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
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
                    className="modern-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                onClick={() => navigate('/patient-signup')}
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Staff Login (keep original design)
  return (
    <div className="auth" style={{minHeight:'100vh', display:'grid', placeItems:'center', background:'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)'}}>
      <section className="card" style={{ maxWidth: 520, width: '95vw', padding: '2rem', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16}}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>
              👨‍⚕️ Staff Portal Login
            </h2>
            <p className="label">
              Sign in to access the staff dashboard
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
              'Sign in to Staff Portal'
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
        </div>
      </section>
    </div>
  );
}
