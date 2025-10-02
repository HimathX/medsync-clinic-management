// src/pages/Login.js
import React, { useState } from 'react';
import '../styles/auth.css';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin Staff');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password) {
      onLogin(role);
    } else {
      setError('Please fill in all fields');
    }
  };

  return (
    <div className="auth" style={{minHeight:'100vh', display:'grid', placeItems:'center', background:'#f7fbff'}}>
      <section className="card" style={{ maxWidth: 520, width: '95vw', padding: '2rem' }}>
        <h2 style={{ marginTop: 0 }}>MedSync Staff Login</h2>
        <p className="label">Sign in to continue to MedSync</p>
        <form onSubmit={handleSubmit} className="form">
          <label className="label">
            Username
            <input
              className="input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
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
          {error && <div className="error" style={{color: 'red', marginBottom: '1rem'}}>{error}</div>}
          <button type="submit" className="btn primary block">
            Sign in
          </button>
        </form>
        <div className="label" style={{marginTop: '1rem', textAlign: 'center'}}>
          🔒 Secured with SSL • Staff Access Only
        </div>
      </section>
    </div>
  );
}
