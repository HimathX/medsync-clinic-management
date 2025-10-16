// src/pages/ReportsHistory.js
import React from 'react';

export default function ReportsHistory() {
  return (
    <div>
      <h1>Reports & History</h1>
      <section className="card section">
        <h3>Health Metrics</h3>
        <div className="slot" style={{height:180}} />
      </section>
      <section className="card section">
        <h3>Appointment Analytics</h3>
        <div className="slot" style={{height:180}} />
      </section>
      <section className="card section">
        <h3>Financial Reports</h3>
        <div className="slot" style={{height:180}} />
        <div style={{display:'flex', gap:8, marginTop:8}}>
          <button className="btn">Export PDF</button>
          <button className="btn">Export CSV</button>
        </div>
      </section>
    </div>
  );
}
