// src/pages/Dashboard.js
import React from 'react';

export default function Dashboard({ user }) {
  const today = new Date().toLocaleDateString();
  const upcoming = [
    { id:1, doctor:'Dr. Perera', specialty:'Cardiology', branch:user.branch, date:'2025-09-22', time:'10:00', type:'Consultation' },
    { id:2, doctor:'Dr. Silva', specialty:'Dermatology', branch:'Kandy', date:'2025-09-25', time:'14:30', type:'Follow-up' },
    { id:3, doctor:'Dr. Fernando', specialty:'ENT', branch:'Galle', date:'2025-09-30', time:'09:00', type:'Consultation' },
  ];
  const notifications = [
    {id:1, type:'Medical', text:'Lab results ready for viewing', when:'Just now'},
    {id:2, type:'Billing', text:'Invoice #INV-1023 is due on 2025-09-28', when:'2h ago'},
    {id:3, type:'System', text:'Policy update: privacy terms revised', when:'Yesterday'},
  ];

  return (
    <div>
      <section className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <h1 style={{marginTop:0}}>Welcome, {user.name}</h1>
            <p className="label">Today is {today}</p>
          </div>
          <div style={{display:'flex', gap:8}}>
            <a href="#/book" className="btn primary">Book New Appointment</a>
            <button className="btn warn">Emergency Request</button>
          </div>
        </div>
      </section>

      <div className="grid grid-3 section" style={{gridTemplateColumns:'2fr 1.5fr 1fr'}}>
        <section className="card">
          <h3>Upcoming Appointments</h3>
          {upcoming.map(a => (
            <div key={a.id} className="slot" style={{marginBottom:8}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div><strong>{a.date} {a.time}</strong> — {a.type}</div>
                  <div className="label">{a.doctor} • {a.specialty} • {a.branch}</div>
                </div>
                <div style={{display:'flex', gap:6}}>
                  <button className="btn">Reschedule</button>
                  <button className="btn warn">Cancel</button>
                </div>
              </div>
            </div>
          ))}
          <a href="#/appointments" className="btn link">View All</a>
        </section>

        <section className="card">
          <h3>Health Summary</h3>
          <ul className="label" style={{marginTop:8}}>
            <li>Last BP: 120/80 (2025-09-10)</li>
            <li>Active prescriptions: 2</li>
            <li>Next recommended check-up: 2025-11-01</li>
          </ul>
          <div className="slot" title="Vitals Trend" style={{height:120, marginTop:8}} />
        </section>

        <section className="card">
          <h3>Financial Overview</h3>
          <div className="grid grid-3" style={{gridTemplateColumns:'1fr 1fr 1fr'}}>
            <div className="card"><div className="label">Outstanding</div><div style={{fontWeight:800}}>LKR 8,500</div></div>
            <div className="card"><div className="label">Recent Payment</div><div style={{fontWeight:800}}>LKR 5,000</div></div>
            <div className="card"><div className="label">Claims</div><div style={{fontWeight:800}}>1 pending</div></div>
          </div>
          <a href="#/billing" className="btn" style={{marginTop:8}}>Make Payment</a>
        </section>
      </div>

      <div className="grid grid-2 section">
        <section className="card">
          <h3>Recent Activity</h3>
          <ul className="label">
            <li>Completed Dermatology consult — 2025-09-12</li>
            <li>Payment of LKR 5,000 confirmed — 2025-09-12</li>
            <li>Claim #CLM-221 approved — 2025-09-11</li>
          </ul>
        </section>
        <section className="card">
          <h3>Notifications</h3>
          {notifications.map(n => (
            <div key={n.id} className="slot" style={{marginBottom:8}}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <div><strong>{n.type}</strong>: {n.text}</div>
                <span className="label">{n.when}</span>
              </div>
            </div>
          ))}
        </section>
      </div>

      <section className="card section">
        <h3>Branch Information</h3>
        <div className="grid grid-3">
          <div className="card"><strong>Colombo</strong><p className="label">011-1234567 • Open now</p></div>
          <div className="card"><strong>Kandy</strong><p className="label">081-7654321 • Open now</p></div>
          <div className="card"><strong>Galle</strong><p className="label">091-5551234 • Open now</p></div>
        </div>
      </section>
    </div>
  );
}
