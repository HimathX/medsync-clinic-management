// src/pages/Doctors.js
import React, { useState } from 'react';

export default function Doctors() {
  const [q, setQ] = useState('');
  const [spec, setSpec] = useState('All');
  const [branch, setBranch] = useState('All');
  const data = [
    {id:1, name:'Dr. Perera', spec:'Cardiology', exp:12, rating:4.8, branches:['Colombo'], langs:['English','Sinhala']},
    {id:2, name:'Dr. Silva', spec:'Dermatology', exp:8, rating:4.6, branches:['Kandy','Colombo'], langs:['English']},
  ];
  const filtered = data.filter(d =>
    (!q || d.name.toLowerCase().includes(q.toLowerCase())) &&
    (spec==='All'||d.spec===spec) &&
    (branch==='All'||d.branches.includes(branch))
  );
  return (
    <div>
      <h1>Doctor Directory</h1>
      <section className="card section">
        <div className="grid grid-4">
          <input className="input" placeholder="Search by name or specialty" value={q} onChange={e=>setQ(e.target.value)} />
          <select className="select" value={spec} onChange={e=>setSpec(e.target.value)}><option>All</option><option>Cardiology</option><option>Dermatology</option><option>ENT</option></select>
          <select className="select" value={branch} onChange={e=>setBranch(e.target.value)}><option>All</option><option>Colombo</option><option>Kandy</option><option>Galle</option></select>
          <select className="select"><option>Sort: Availability</option><option>Sort: Rating</option><option>Sort: Experience</option></select>
        </div>
      </section>
      <section className="grid grid-2 section">
        {filtered.map(d => (
          <div key={d.id} className="card">
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <div>
                <strong>{d.name}</strong> <span className="label">{d.spec}</span>
                <div className="label">{d.exp} years • {d.rating}★ • {d.branches.join(', ')}</div>
                <div className="label">Languages: {d.langs.join(', ')}</div>
              </div>
              <div className="slot" style={{width:48,height:48,borderRadius:24,display:'grid',placeItems:'center'}}>👨‍⚕️</div>
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:8}}>
              <button className="btn">Read Reviews</button>
              <a className="btn primary" href="#/book">Book Appointment</a>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
