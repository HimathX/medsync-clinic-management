// src/pages/Settings.js
import React, { useState } from 'react';

export default function Settings({ lang = 'English', setLang = ()=>{} }) {
  const [theme, setTheme] = useState('Light');
  const [twoFA, setTwoFA] = useState(true);
  const [digest, setDigest] = useState('Daily');

  return (
    <div>
      <h1>Settings</h1>
      <section className="card section">
        <h3>Account</h3>
        <div className="grid grid-3">
          <label className="label">Language
            <select className="select" value={lang} onChange={e=>setLang(e.target.value)}>
              <option>English</option><option>Sinhala</option><option>Tamil</option>
            </select>
          </label>
          <label className="label">Theme
            <select className="select" value={theme} onChange={e=>setTheme(e.target.value)}>
              <option>Light</option><option>Dark</option><option>Auto</option>
            </select>
          </label>
          <label className="label" style={{display:'flex',alignItems:'center',gap:8}}>
            <input type="checkbox" checked={twoFA} onChange={e=>setTwoFA(e.target.checked)} /> Two-Factor
          </label>
        </div>
      </section>
      <section className="card section">
        <h3>Notifications</h3>
        <div className="grid grid-3">
          <label className="label">Digest
            <select className="select" value={digest} onChange={e=>setDigest(e.target.value)}>
              <option>Immediate</option><option>Daily</option><option>Weekly</option>
            </select>
          </label>
          <label className="label"><input type="checkbox" defaultChecked /> Appointment reminders</label>
          <label className="label"><input type="checkbox" defaultChecked /> Billing updates</label>
        </div>
      </section>
      <section className="card section">
        <h3>Data & Privacy</h3>
        <div className="grid grid-3">
          <button className="btn">Download Data</button>
          <button className="btn">Delete Account</button>
          <button className="btn">Manage Sharing</button>
        </div>
      </section>
    </div>
  );
}
