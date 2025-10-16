// src/pages/MedicalRecords.js
import React, { useState } from 'react';

export default function MedicalRecords() {
  const [activeCategory, setActiveCategory] = useState('Consultations');
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  const records = {
    Consultations: [
      { id: 1, date: '2025-09-20', doctor: 'Dr. Perera', patient: 'John Silva', diagnosis: 'Hypertension', notes: 'Blood pressure elevated. Prescribed medication.' },
      { id: 2, date: '2025-09-18', doctor: 'Dr. Fernando', patient: 'Mary Johnson', diagnosis: 'Common Cold', notes: 'Rest and fluids recommended.' },
    ],
    Treatments: [
      { id: 3, date: '2025-09-19', doctor: 'Dr. Silva', patient: 'David Brown', treatment: 'Physiotherapy', duration: '6 weeks', notes: 'Lower back pain treatment.' },
    ],
    Diagnostics: [
      { id: 4, date: '2025-09-21', doctor: 'Dr. Perera', patient: 'Emma Wilson', test: 'ECG', result: 'Normal sinus rhythm', notes: 'No abnormalities detected.' },
    ],
    Prescriptions: [
      { id: 5, date: '2025-09-20', doctor: 'Dr. Fernando', patient: 'John Silva', medication: 'Amlodipine 5mg', dosage: '1 tablet daily', duration: '30 days' },
    ],
    Documents: [
      { id: 6, date: '2025-09-15', patient: 'Mary Johnson', type: 'Lab Report', description: 'Complete Blood Count' },
    ]
  };

  return (
    <div>
      <h1>Medical Records</h1>
      
      {/* Category Tabs */}
      <section className="card section">
        <nav style={{display:'flex', gap:8}}>
          {Object.keys(records).map(category => (
            <button
              key={category}
              className={`btn ${activeCategory === category ? 'primary' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </nav>
      </section>

      {/* Records List */}
      <section className="card section">
        <h3>{activeCategory}</h3>
        <div className="section">
          {records[activeCategory].map(record => (
            <div
              key={record.id}
              className="card"
              style={{marginBottom: 12, cursor: 'pointer'}}
              onClick={() => setSelectedRecord(record)}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                  <strong>{record.patient}</strong>
                  <div className="label">
                    Date: {record.date} • Doctor: {record.doctor}
                  </div>
                  <div className="label">
                    {record.diagnosis || record.treatment || record.test || record.medication || record.type}
                  </div>
                </div>
                <button className="btn" onClick={(e) => {e.stopPropagation(); alert('Viewing details')}}>
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Document Viewer */}
      {selectedRecord && (
        <section className="card section">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
            <h3>Record Details</h3>
            <button className="btn" onClick={() => setSelectedRecord(null)}>Close</button>
          </div>
          <div className="card" style={{background: '#f5f5f5', padding: 20}}>
            <div style={{marginBottom: 12}}><strong>Patient:</strong> {selectedRecord.patient}</div>
            <div style={{marginBottom: 12}}><strong>Date:</strong> {selectedRecord.date}</div>
            <div style={{marginBottom: 12}}><strong>Doctor:</strong> {selectedRecord.doctor}</div>
            {selectedRecord.diagnosis && <div style={{marginBottom: 12}}><strong>Diagnosis:</strong> {selectedRecord.diagnosis}</div>}
            {selectedRecord.treatment && <div style={{marginBottom: 12}}><strong>Treatment:</strong> {selectedRecord.treatment}</div>}
            {selectedRecord.test && <div style={{marginBottom: 12}}><strong>Test:</strong> {selectedRecord.test}</div>}
            {selectedRecord.medication && <div style={{marginBottom: 12}}><strong>Medication:</strong> {selectedRecord.medication}</div>}
            {selectedRecord.notes && <div style={{marginBottom: 12}}><strong>Notes:</strong> {selectedRecord.notes}</div>}
            {selectedRecord.result && <div style={{marginBottom: 12}}><strong>Result:</strong> {selectedRecord.result}</div>}
          </div>
          <div style={{display:'flex', gap:8, marginTop:16}}>
            <button className="btn primary">Download</button>
            <button className="btn">Print</button>
            <button className="btn">Share</button>
          </div>
        </section>
      )}
    </div>
  );
}
