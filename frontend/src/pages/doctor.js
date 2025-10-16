// src/pages/Doctors.js
import React, { useState, useEffect } from 'react';
import doctorService from '../services/doctorService';
import branchService from '../services/branchService';

export default function Doctors() {
  const [q, setQ] = useState('');
  const [spec, setSpec] = useState('All');
  const [branch, setBranch] = useState('All');
  const [data, setData] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDoctorsData();
  }, []);

  const fetchDoctorsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch doctors from backend
      const doctorsData = await doctorService.getAllDoctors();
      const formattedDoctors = (doctorsData || []).map(doc => ({
        id: doc.doctor_id,
        name: doc.name || `Dr. ${doc.doctor_id}`,
        spec: doc.specialization || 'General',
        exp: doc.years_experience || 0,
        rating: doc.rating || 4.5,
        branches: doc.branches || ['All'],
        langs: doc.languages || ['English'],
        qualifications: doc.qualifications || '',
        licenseNumber: doc.license_number || ''
      }));
      setData(formattedDoctors);

      // Extract unique specializations
      const uniqueSpecs = ['All', ...new Set(formattedDoctors.map(d => d.spec))];
      setSpecializations(uniqueSpecs);

      // Fetch branches
      const branchesData = await branchService.getAllBranches();
      setBranches(['All', ...(branchesData || []).map(b => b.branch_name)]);

    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = data.filter(d =>
    (!q || d.name.toLowerCase().includes(q.toLowerCase()) || d.spec.toLowerCase().includes(q.toLowerCase())) &&
    (spec === 'All' || d.spec === spec) &&
    (branch === 'All' || d.branches.includes(branch) || d.branches.includes('All'))
  );
  if (loading) {
    return (
      <div style={{padding: '20px', textAlign: 'center'}}>
        <div style={{fontSize: '48px', marginBottom: '20px'}}>⏳</div>
        <h2>Loading Doctors...</h2>
        <p style={{color: '#64748b'}}>Please wait while we fetch the doctor directory</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{padding: '20px', textAlign: 'center'}}>
        <div style={{fontSize: '48px', marginBottom: '20px'}}>⚠️</div>
        <h2 style={{color: 'var(--accent-red)'}}>Error Loading Doctors</h2>
        <p style={{color: '#64748b', marginBottom: '20px'}}>{error}</p>
        <button className="btn primary" onClick={fetchDoctorsData}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Doctor Directory ({data.length} doctors)</h1>
      <section className="card section">
        <div className="grid grid-4">
          <input className="input" placeholder="Search by name or specialty" value={q} onChange={e=>setQ(e.target.value)} />
          <select className="select" value={spec} onChange={e=>setSpec(e.target.value)}>
            {specializations.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="select" value={branch} onChange={e=>setBranch(e.target.value)}>
            {branches.map(b => <option key={b}>{b}</option>)}
          </select>
          <button className="btn" onClick={fetchDoctorsData} style={{padding: '10px 20px'}}>🔄 Refresh</button>
        </div>
      </section>
      <section className="grid grid-2 section">
        {filtered.length === 0 ? (
          <div style={{gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#64748b'}}>
            <div style={{fontSize: '48px', marginBottom: '10px'}}>🔍</div>
            <p>No doctors found matching your criteria</p>
          </div>
        ) : (
          filtered.map(d => (
            <div key={d.id} className="card">
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <div>
                  <strong>{d.name}</strong> <span className="label">{d.spec}</span>
                  <div className="label">{d.exp} years • {d.rating}★ • {d.branches.join(', ')}</div>
                  <div className="label">Languages: {d.langs.join(', ')}</div>
                  {d.qualifications && <div className="label" style={{marginTop: '4px'}}>Qualifications: {d.qualifications}</div>}
                  {d.licenseNumber && <div className="label">License: {d.licenseNumber}</div>}
                </div>
                <div className="slot" style={{width:48,height:48,borderRadius:24,display:'grid',placeItems:'center'}}>👨‍⚕️</div>
              </div>
              <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:8}}>
                <button className="btn" onClick={() => alert(`Doctor Details:\n${d.name}\n${d.spec}\n${d.exp} years experience\nRating: ${d.rating}/5`)}>View Profile</button>
                <a className="btn primary" href="#/book">Book Appointment</a>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
