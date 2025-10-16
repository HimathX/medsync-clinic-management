// src/pages/AppointmentBooking.js
import React, { useState } from 'react';

export default function AppointmentBooking({ user }) {
  const [step, setStep] = useState(1);
  const [filters, setFilters] = useState({ name:'', specialty:'', branch:user.branch, availability:'this week', sort:'next available' });
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState('2025-09-25');
  const [time, setTime] = useState('10:00');
  const [details, setDetails] = useState({ type:'Consultation', subType:'New patient', reason:'', requirements:[], contact:'SMS' });

  const doctors = [
    {id:1, name:'Dr. Perera', title:'MD', spec:'Cardiology', branches:['Colombo'], next:'2025-09-25 09:30', rating:4.8, lang:['English','Sinhala'], exp:12},
    {id:2, name:'Dr. Silva', title:'MD', spec:'Dermatology', branches:['Kandy','Colombo'], next:'2025-09-26 11:00', rating:4.6, lang:['English'], exp:8},
  ];

  const filtered = doctors.filter(d =>
    (!filters.name || d.name.toLowerCase().includes(filters.name.toLowerCase())) &&
    (!filters.specialty || d.spec===filters.specialty) &&
    (!filters.branch || d.branches.includes(filters.branch))
  );

  const book = () => { alert(`Booked ${selectedDoctor?.name} on ${date} at ${time} (${details.type})`); setStep(4); };

  return (
    <div>
      <h1>Book an Appointment</h1>
      <div className="label">Step {step} of 3</div>

      {step===1 && (
        <section className="card section">
          <h3>Find a Doctor</h3>
          <div className="grid grid-4" style={{gridTemplateColumns:'1fr 1fr 1fr 1fr'}}>
            <input className="input" placeholder="Search by doctor" value={filters.name} onChange={e=>setFilters({...filters, name:e.target.value})} />
            <select className="select" value={filters.specialty} onChange={e=>setFilters({...filters, specialty:e.target.value})}>
              <option value="">All Specialties</option><option>Cardiology</option><option>Dermatology</option><option>ENT</option>
            </select>
            <select className="select" value={filters.branch} onChange={e=>setFilters({...filters, branch:e.target.value})}>
              <option>Colombo</option><option>Kandy</option><option>Galle</option>
            </select>
            <select className="select" value={filters.sort} onChange={e=>setFilters({...filters, sort:e.target.value})}>
              <option>next available</option><option>name</option><option>rating</option>
            </select>
          </div>
          <div className="section grid grid-2">
            {filtered.map(d => (
              <div key={d.id} className="card">
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <div>
                    <strong>{d.name}</strong> <span className="label">({d.title})</span>
                    <div className="label">{d.spec} • {d.branches.join(', ')}</div>
                    <div className="label">Next: {d.next}</div>
                    <div className="label">Languages: {d.lang.join(', ')} • {d.exp} yrs</div>
                  </div>
                  <div className="slot" style={{width:48,height:48,borderRadius:24,display:'grid',placeItems:'center'}}>👨‍⚕️</div>
                </div>
                <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:8}}>
                  <button className="btn" onClick={()=>alert('Open profile (mock)')}>View Profile</button>
                  <button className="btn primary" onClick={()=>{setSelectedDoctor(d); setStep(2);}}>Book Appointment</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {step===2 && selectedDoctor && (
        <section className="card section">
          <h3>Select Date & Time — {selectedDoctor.name}</h3>
          <div className="grid grid-2">
            <label className="label">Date<input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} /></label>
            <label className="label">Time<input className="input" type="time" value={time} onChange={e=>setTime(e.target.value)} /></label>
          </div>
          <div className="label">Morning • Afternoon • Evening slots (mock visualization)</div>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <button className="btn" onClick={()=>setStep(1)}>Back</button>
            <button className="btn primary" onClick={()=>setStep(3)}>Continue</button>
          </div>
        </section>
      )}

      {step===3 && selectedDoctor && (
        <section className="card section">
          <h3>Appointment Details</h3>
          <div className="grid grid-3">
            <label className="label">Type
              <select className="select" value={details.type} onChange={e=>setDetails({...details, type:e.target.value})}>
                <option>Consultation</option><option>Procedure</option><option>Emergency</option>
              </select>
            </label>
            <label className="label">Subtype
              <select className="select" value={details.subType} onChange={e=>setDetails({...details, subType:e.target.value})}>
                <option>New patient</option><option>Follow-up</option><option>Routine check-up</option>
              </select>
            </label>
            <label className="label">Preferred Contact
              <select className="select" value={details.contact} onChange={e=>setDetails({...details, contact:e.target.value})}>
                <option>SMS</option><option>Phone</option><option>Email</option>
              </select>
            </label>
          </div>
          <label className="label">Reason for Visit
            <textarea className="textarea" placeholder="Describe symptoms or concerns" value={details.reason} onChange={e=>setDetails({...details, reason:e.target.value})} />
          </label>
          <div className="grid grid-3">
            <label className="label"><input type="checkbox" onChange={()=>{}} /> Wheelchair access</label>
            <label className="label"><input type="checkbox" onChange={()=>{}} /> Interpreter services</label>
            <label className="label"><input type="checkbox" onChange={()=>{}} /> Extended time</label>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', marginTop:8}}>
            <button className="btn" onClick={()=>setStep(2)}>Back</button>
            <button className="btn primary" onClick={book}>Confirm Booking</button>
          </div>
        </section>
      )}

      {step===4 && (
        <section className="card section">
          <h3>Booking Confirmed</h3>
          <div className="label">Summary, preparation instructions, calendar integration (mock)</div>
          <div style={{display:'flex', gap:8, marginTop:8}}>
            <button className="btn">Add to Google Calendar</button>
            <button className="btn">Email Confirmation</button>
          </div>
        </section>
      )}
    </div>
  );
}
