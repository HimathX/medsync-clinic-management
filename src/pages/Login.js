// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

export default function Login({ onLogin, loginType = 'staff' }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(loginType === 'staff' ? 'Admin Staff' : 'Patient');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password) {
      onLogin(role, loginType);
    } else {
      setError('Please fill in all fields');
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
            {isStaffLogin ? 'Staff Username' : 'Patient ID / Email'}
            <input
              className="input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isStaffLogin ? "Enter your staff username" : "Enter your patient ID or email"}
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
              required
            />
          </label>
          
          {isStaffLogin && (
            <label className="label">
              Role
              <select
                className="select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option>Admin Staff</option>
                <option>Doctor</option>
                <option>Billing Staff</option>
                <option>System Admin</option>
              </select>
            </label>
          )}
          
          {error && <div className="error" style={{color: 'red', marginBottom: '1rem'}}>{error}</div>}
          
          <button type="submit" className="btn primary block" style={{marginTop:16}}>
            {isStaffLogin ? 'Sign in to Staff Portal' : 'Sign in to Patient Portal'}
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
              <a href="#register" style={{color: 'var(--accent-red)', textDecoration: 'none'}}>New Patient Registration</a>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
