import { useState } from 'react';
import './auth.css';

export default function SignUp({ onSignUp, switchToLogin }) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [values, setValues] = useState({
    name: '',
    dob: '',
    gender: '',
    id: '',
    phone: '',
    email: '',
    emergencyName: '',
    emergencyPhone: '',
    insurance: '',
    branch: 'Colombo',
    twofa: false,
    password: '',
    confirm: ''
  });

  function validate() {
    const e = {};
    if (!values.name) e.name = 'Required';
    if (!values.dob) e.dob = 'Required';
    if (!values.gender) e.gender = 'Required';
    if (!values.phone || !/^\+?\d{7,15}$/.test(values.phone)) {
      e.phone = 'Invalid phone';
    }
    if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      e.email = 'Invalid email';
    }
    if (!values.password || values.password.length < 8) {
      e.password = 'Min 8 chars';
    }
    if (values.password && !/[A-Z]/.test(values.password)) {
      e.password = 'Use uppercase for strength';
    }
    if (values.password !== values.confirm) {
      e.confirm = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    
    // Notify parent of successful signup
    onSignUp && onSignUp();
  }

  function set(name, value) {
    setValues(s => ({ ...s, [name]: value }));
  }

  return (
    <div className="auth-form">
      <div className="auth-header">
        <h1>MedSync</h1>
        <p className="muted">Create your account</p>
      </div>

      <form className="stack-4" onSubmit={handleSubmit} noValidate>
        <div className="grid-2">
          {/* Full Name */}
          <label className={`input-field ${errors.name ? 'has-error' : ''}`}>
            <span className="float-label">Full Name</span>
            <input 
              className="input" 
              type="text" 
              value={values.name} 
              placeholder="Jane Doe"
              onChange={(e) => set('name', e.target.value)}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </label>

          {/* Date of Birth */}
          <label className={`input-field ${errors.dob ? 'has-error' : ''}`}>
            <span className="float-label">Date of Birth</span>
            <input 
              className="input" 
              type="date" 
              value={values.dob}
              onChange={(e) => set('dob', e.target.value)}
            />
            {errors.dob && <span className="error-text">{errors.dob}</span>}
          </label>

          {/* Gender */}
          <label className={`input-field ${errors.gender ? 'has-error' : ''}`}>
            <span className="float-label">Gender</span>
            <input 
              className="input" 
              type="text" 
              value={values.gender} 
              placeholder="Female"
              onChange={(e) => set('gender', e.target.value)}
            />
            {errors.gender && <span className="error-text">{errors.gender}</span>}
          </label>

          {/* NIC/Passport */}
          <label className="input-field">
            <span className="float-label">NIC/Passport</span>
            <input 
              className="input" 
              type="text" 
              value={values.id} 
              placeholder="123456789V"
              onChange={(e) => set('id', e.target.value)}
            />
          </label>

          {/* Phone */}
          <label className={`input-field ${errors.phone ? 'has-error' : ''}`}>
            <span className="float-label">Phone</span>
            <input 
              className="input" 
              type="tel" 
              value={values.phone} 
              onChange={(e) => set('phone', e.target.value)}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </label>

          {/* Email */}
          <label className={`input-field ${errors.email ? 'has-error' : ''}`}>
            <span className="float-label">Email</span>
            <input 
              className="input" 
              type="email" 
              value={values.email} 
              onChange={(e) => set('email', e.target.value)}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </label>

          {/* Emergency Contact */}
          <label className="input-field">
            <span className="float-label">Emergency Contact</span>
            <input 
              className="input" 
              type="text" 
              value={values.emergencyName} 
              placeholder="Relative name"
              onChange={(e) => set('emergencyName', e.target.value)}
            />
          </label>

          {/* Emergency Phone */}
          <label className="input-field">
            <span className="float-label">Emergency Phone</span>
            <input 
              className="input" 
              type="tel" 
              value={values.emergencyPhone} 
              placeholder="+94 77 000 1111"
              onChange={(e) => set('emergencyPhone', e.target.value)}
            />
          </label>

          {/* Insurance Provider */}
          <label className="input-field">
            <span className="float-label">Insurance Provider</span>
            <input 
              className="input" 
              type="text" 
              value={values.insurance} 
              placeholder="AIA"
              onChange={(e) => set('insurance', e.target.value)}
            />
          </label>

          {/* Branch Selector */}
          <label className="input-field">
            <span className="float-label">Branch</span>
            <select 
              className="input" 
              value={values.branch}
              onChange={(e) => set('branch', e.target.value)}
            >
              <option>Colombo</option>
              <option>Kandy</option>
              <option>Galle</option>
            </select>
          </label>

          {/* Password */}
          <label className={`input-field ${errors.password ? 'has-error' : ''}`}>
            <span className="float-label">Password</span>
            <input 
              className="input" 
              type="password" 
              value={values.password} 
              placeholder="Strong password"
              onChange={(e) => set('password', e.target.value)}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </label>

          {/* Confirm Password */}
          <label className={`input-field ${errors.confirm ? 'has-error' : ''}`}>
            <span className="float-label">Confirm Password</span>
            <input 
              className="input" 
              type="password" 
              value={values.confirm} 
              placeholder="Repeat password"
              onChange={(e) => set('confirm', e.target.value)}
            />
            {errors.confirm && <span className="error-text">{errors.confirm}</span>}
          </label>
        </div>

        {/* Two-Factor Authentication */}
        <label className="checkbox">
          <input 
            type="checkbox" 
            checked={values.twofa}
            onChange={(e) => set('twofa', e.target.checked)}
          />
          <span>Enable Two-factor authentication</span>
        </label>

        {/* Submit Button */}
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? (
            <span className="spinner" style={{ width: 16, height: 16 }} aria-hidden />
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <p className="muted link-row">
        Already have an account?{' '}
        <button className="link" onClick={switchToLogin}>
          Login
        </button>
      </p>
    </div>
  );
}
