// src/pages/Treatments.js
import React, { useState } from 'react';

export default function Treatments() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const treatments = [
    { id: 1, name: 'ECG', code: 'ECG001', category: 'Diagnostic Procedures', price: 5000, duration: 15, branch:['Colombo','Kandy'] },
    { id: 2, name: 'Full Blood Count', code: 'LAB101', category: 'Laboratory Tests', price: 2500, duration: 10, branch:['All'] },
    { id: 3, name: 'General Consultation', code: 'CONS001', category: 'Consultations', price: 3000, duration: 20, branch:['All'] },
  ];
  const filtered = treatments.filter(t =>
    (!search || t.name.toLowerCase().includes(search.toLowerCase()) || t.code.toLowerCase().includes(search.toLowerCase())) &&
    (category==='All' || t.category===category)
  );

  return (
    <div>
      <h1>Treatment Catalog</h1>
      <section className="card section">
        <div className="grid grid-4" style={{gridTemplateColumns:'2fr 1fr 1fr 1fr'}}>
          <input className="input" placeholder="Search by name/code/symptom" value={search} onChange={e=>setSearch(e.target.value)} />
          <select className="select" value={category} onChange={e=>setCategory(e.target.value)}>
            <option>All</option><option>Consultations</option><option>Diagnostic Procedures</option><option>Laboratory Tests</option><option>Therapeutic Procedures</option><option>Emergency Services</option><option>Preventive Care</option>
          </select>
          <select className="select"><option>Branch: All</option><option>Colombo</option><option>Kandy</option><option>Galle</option></select>
          <select className="select"><option>Duration: Any</option><option>{"<"} 15 min</option><option>15–30 min</option><option>{">"} 30 min</option></select>
        </div>
      </section>
      <section className="grid grid-3 section">
        {filtered.map(t => (
          <div key={t.id} className="card">
            <strong>{t.name}</strong> <span className="label">({t.code})</span>
            <div className="label">{t.category} • {t.duration} min</div>
            <div style={{fontWeight:800, marginTop:4}}>LKR {t.price}</div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:8}}>
              <button className="btn" onClick={()=>alert('Prep instructions (mock)')}>Preparation</button>
              <a className="btn primary" href="#/book">Book This Treatment</a>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
