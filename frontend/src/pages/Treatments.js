// src/pages/Treatments.js
import React, { useState, useEffect } from 'react';
import treatmentService from '../services/treatmentService';
import branchService from '../services/branchService';

export default function Treatments() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [branch, setBranch] = useState('All');
  const [treatments, setTreatments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTreatmentsData();
  }, []);

  const fetchTreatmentsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch treatments from backend
      const treatmentsData = await treatmentService.getAllTreatments();
      const formattedTreatments = (treatmentsData || []).map(t => ({
        id: t.treatment_id,
        name: t.treatment_name || 'Treatment',
        code: t.treatment_code || `T${t.treatment_id}`,
        category: t.category || 'General',
        price: parseFloat(t.cost) || 0,
        duration: t.duration_minutes || 30,
        branch: t.available_branches || ['All'],
        description: t.description || ''
      }));
      setTreatments(formattedTreatments);

      // Extract unique categories
      const uniqueCategories = ['All', ...new Set(formattedTreatments.map(t => t.category))];
      setCategories(uniqueCategories);

      // Fetch branches
      const branchesData = await branchService.getAllBranches();
      setBranches(['All', ...(branchesData || []).map(b => b.branch_name)]);

    } catch (err) {
      console.error('Error fetching treatments:', err);
      setError('Failed to load treatments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = treatments.filter(t =>
    (!search || t.name.toLowerCase().includes(search.toLowerCase()) || t.code.toLowerCase().includes(search.toLowerCase())) &&
    (category === 'All' || t.category === category) &&
    (branch === 'All' || t.branch.includes(branch) || t.branch.includes('All'))
  );

  if (loading) {
    return (
      <div style={{padding: '20px', textAlign: 'center'}}>
        <div style={{fontSize: '48px', marginBottom: '20px'}}>⏳</div>
        <h2>Loading Treatments...</h2>
        <p style={{color: '#64748b'}}>Please wait while we fetch the treatment catalog</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{padding: '20px', textAlign: 'center'}}>
        <div style={{fontSize: '48px', marginBottom: '20px'}}>⚠️</div>
        <h2 style={{color: 'var(--accent-red)'}}>Error Loading Treatments</h2>
        <p style={{color: '#64748b', marginBottom: '20px'}}>{error}</p>
        <button className="btn primary" onClick={fetchTreatmentsData}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Treatment Catalog ({treatments.length} treatments)</h1>
      <section className="card section">
        <div className="grid grid-4" style={{gridTemplateColumns:'2fr 1fr 1fr 1fr'}}>
          <input className="input" placeholder="Search by name/code/symptom" value={search} onChange={e=>setSearch(e.target.value)} />
          <select className="select" value={category} onChange={e=>setCategory(e.target.value)}>
            {categories.map(cat => <option key={cat}>{cat}</option>)}
          </select>
          <select className="select" value={branch} onChange={e=>setBranch(e.target.value)}>
            {branches.map(br => <option key={br}>{br === 'All' ? 'Branch: All' : br}</option>)}
          </select>
          <button className="btn" onClick={fetchTreatmentsData} style={{padding: '10px 20px'}}>🔄 Refresh</button>
        </div>
      </section>
      <section className="grid grid-3 section">
        {filtered.length === 0 ? (
          <div style={{gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#64748b'}}>
            <div style={{fontSize: '48px', marginBottom: '10px'}}>🔍</div>
            <p>No treatments found matching your criteria</p>
          </div>
        ) : (
          filtered.map(t => (
            <div key={t.id} className="card">
              <strong>{t.name}</strong> <span className="label">({t.code})</span>
              <div className="label">{t.category} • {t.duration} min</div>
              {t.description && <p style={{fontSize: '13px', color: '#64748b', marginTop: '8px'}}>{t.description}</p>}
              <div style={{fontWeight:800, marginTop:4}}>LKR {t.price.toLocaleString()}</div>
              <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:8}}>
                <button className="btn" onClick={()=>alert(`Treatment Details:\n${t.name}\n${t.description || 'No additional information'}`)}>View Details</button>
                <a className="btn primary" href="#/book">Book This Treatment</a>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
