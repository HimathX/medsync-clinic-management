// src/pages/MedicalRecords.js
import React from 'react';

export default function MedicalRecords() {
  return (
    <div>
      <h1>Medical Records</h1>
      <section className="card section">
        <h3>Timeline</h3>
        <div className="slot" style={{height:160}} />
      </section>
      <section className="card section">
        <nav style={{display:'flex', gap:8}}>
          <button className="btn primary">Consultations</button>
          <button className="btn">Treatments</button>
          <button className="btn">Diagnostics</button>
          <button className="btn">Prescriptions</button>
          <button className="btn">Documents</button>
        </nav>
        <div className="section">
          <div className="slot" style={{height:160}} />
        </div>
      </section>
      <section className="card section">
        <h3>Document Viewer</h3>
        <div className="slot" style={{height:220}} />
        <div style={{display:'flex', gap:8, marginTop:8}}>
          <button className="btn">Download</button>
          <button className="btn">Print</button>
        </div>
      </section>
    </div>
  );
}
