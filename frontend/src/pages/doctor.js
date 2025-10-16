// src/pages/Doctors.js - Doctor Directory (Staff/Admin View)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import doctorService from '../services/doctorService';
import branchService from '../services/branchService';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorMessage from '../components/shared/ErrorMessage';
import EmptyState from '../components/shared/EmptyState';

export default function Doctors() {
  const navigate = useNavigate();
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
    return <LoadingSpinner message="Loading doctor directory..." />;
  }

  if (error) {
    return <ErrorMessage title="Error Loading Doctors" message={error} onRetry={fetchDoctorsData} />;
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
          <div style={{gridColumn: '1 / -1'}}>
            <EmptyState 
              icon="🔍"
              title="No Doctors Found"
              message="No doctors match your search criteria. Try adjusting your filters."
            />
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
                <button className="btn" onClick={() => navigate(`/staff/doctor/${d.id}`)}>View Profile</button>
                <button className="btn primary" onClick={() => navigate(`/staff/appointments?doctor=${d.id}`)}>View Schedule</button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
