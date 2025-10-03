// src/pages/MyAppointments.js
import React, { useState } from 'react';

export default function MyAppointments() {
  const [view, setView] = useState('list');
  const [filters, setFilters] = useState({ status:'All', branch:'All', type:'All' });
  const [items] = useState([
    {id:1, date:'2025-09-25', time:'10:00', doctor:'Dr. Perera', spec:'Cardiology', branch:'Colombo', status:'Scheduled', type:'Consultation', duration:30},
    {id:2, date:'2025-09-12', time:'14:00', doctor:'Dr. Silva', spec:'Dermatology', branch:'Kandy', status:'Completed', type:'Follow-up', duration:20},
    {id:3, date:'2025-09-05', time:'11:30', doctor:'Dr. Fernando', spec:'ENT', branch:'Galle', status:'Cancelled', type:'Consultation', duration:30},
  ]);
  const statuses = ['All','Scheduled','Completed','Cancelled'];
  const filtered = items.filter(i =>
    (filters.status==='All'||i.status===filters.status) &&
    (filters.branch==='All'||i.branch===filters.branch) &&
    (filters.type==='All'||i.type===filters.type)
  );

  return (
    <div>
      <h1>My Appointments</h1>
      <div style={{display:'flex', gap:8, alignItems:'center'}}>
        <button className={'btn'+(view==='list'?' primary':'')} onClick={()=>setView('list')}>List</button>
        <button className={'btn'+(view==='calendar'?' primary':'')} onClick={()=>setView('calendar')}>Calendar</button>
        <select className="select" value={filters.status} onChange={e=>setFilters({...filters, status:e.target.value})}>{statuses.map(s=><option key={s}>{s}</option>)}</select>
        <select className="select" value={filters.branch} onChange={e=>setFilters({...filters, branch:e.target.value})}><option>All</option><option>Colombo</option><option>Kandy</option><option>Galle</option></select>
        <select className="select" value={filters.type} onChange={e=>setFilters({...filters, type:e.target.value})}><option>All</option><option>Consultation</option><option>Procedure</option><option>Follow-up</option></select>
        <button className="btn" onClick={()=>setFilters({status:'All', branch:'All', type:'All'})}>Clear Filters</button>
      </div>

      {view==='list' ? (
        <section className="section">
          {filtered.map(a => (
            <div key={a.id} className="card" style={{marginBottom:8}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div><strong>{a.date} {a.time}</strong> — {a.type} <span className="label">({a.duration} mins)</span></div>
                  <div className="label">{a.doctor} • {a.spec} • {a.branch}</div>
                </div>
                <div style={{display:'flex', gap:6}}>
                  {a.status==='Scheduled' && <button className="btn">Reschedule</button>}
                  {a.status==='Scheduled' && <button className="btn warn">Cancel</button>}
                  <button className="btn">Details</button>
                </div>
              </div>
              <div className="label" style={{marginTop:4}}>Status: {a.status}</div>
            </div>
          ))}
        </section>
      ) : (
        <section className="card section">
          <div className="label">Monthly/Week/Day calendar visualization (mock)</div>
          <div className="slot" style={{height:240}} />
        </section>
      )}

      <section className="card section">
        <h3>Appointment History</h3>
        <div className="label">Completed appointments with notes, prescriptions, and downloads (mock)</div>
        <div className="grid grid-2">
          <div className="slot" style={{height:120}} />
          <div className="slot" style={{height:120}} />
        </div>
      </section>
    </div>
  );
}
