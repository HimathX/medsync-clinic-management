import { useState } from 'react';
import './auth.css';

export default function Login({ onLogin, switchToSignUp }) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [values, setValues] = useState({ 
    email: '', 
    phone: '', 
    password: '' 
  });

  function validate() {
    const next = {};
    if (!values.email && !values.phone) {
      next.email = 'Email or phone is required';
    }
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      next.email = 'Invalid email';
    }
    if (values.phone && !/^\+?\d{7,15}$/.test(values.phone)) {
      next.phone = 'Invalid phone number';
    }
    if (!values.password || values.password.length < 6) {
      next.password = 'Minimum 6 characters';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    
    // Notify parent of successful login
    onLogin && onLogin();
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    setShowForgotPassword(false);
    alert('Reset link sent to your email');
  }

  function onChange(name, value) {
    setValues(v => ({ ...v, [name]: value }));
  }

  return (
    <div className="auth-form">
      <div className="auth-header">
        <h1>MedSync</h1>
        <p className="muted">Welcome back</p>
      </div>

      <form className="stack-4" onSubmit={handleSubmit} noValidate>
        {/* Email Input */}
        <label className={`input-field ${errors.email ? 'has-error' : ''}`}>
          <span className="float-label">Email</span>
          <input 
            className="input" 
            type="email" 
            value={values.email} 
            onChange={(e) => onChange('email', e.target.value)}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </label>

        {/* Password Input */}
        <label className={`input-field ${errors.password ? 'has-error' : ''}`}>
          <span className="float-label">Password</span>
          <input 
            className="input" 
            type="password" 
            value={values.password} 
            onChange={(e) => onChange('password', e.target.value)}
          />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </label>

        {/* Forgot Password Link */}
        <div className="between">
          <button 
            type="button" 
            className="link" 
            onClick={() => setShowForgotPassword(true)}
          >
            Forgot password?
          </button>
          <div />
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? (
            <span className="spinner" style={{ width: 16, height: 16 }} aria-hidden />
          ) : (
            'Login'
          )}
        </button>
      </form>

      {/* Switch to Sign Up */}
      <p className="muted link-row">
        Don't have an account?{' '}
        <button className="link" onClick={switchToSignUp}>
          Sign Up
        </button>
      </p>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setShowForgotPassword(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reset your password</h3>
              <button 
                className="icon-btn" 
                aria-label="Close" 
                onClick={() => setShowForgotPassword(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="muted">Enter your email to receive a reset link.</p>
              <form className="stack-3" onSubmit={handleForgotPassword}>
                <input 
                  className="input" 
                  type="email" 
                  placeholder="you@example.com" 
                  required 
                />
                <div className="actions-row">
                  <button 
                    type="button" 
                    className="btn-outline" 
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Send Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
