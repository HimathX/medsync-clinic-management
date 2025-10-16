// src/pages/patient/MedicalRecords.js - Patient Medical Records
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function PatientMedicalRecords() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')

  const records = [
    { id: 1, date: '2025-09-20', type: 'Consultation', doctor: 'Dr. Perera', description: 'Cardiology checkup', file: 'report.pdf' },
    { id: 2, date: '2025-09-15', type: 'Lab Test', doctor: 'Dr. Silva', description: 'Blood test results', file: 'lab-report.pdf' },
    { id: 3, date: '2025-08-10', type: 'Prescription', doctor: 'Dr. Fernando', description: 'Medication prescription', file: 'prescription.pdf' },
  ]

  return (
    <div className="patient-portal">
      <nav className="patient-top-nav">
        <div className="patient-top-nav-content">
          <button className="btn-secondary" onClick={() => navigate('/patient/dashboard')}>← Back</button>
          <h2 style={{color: 'white', margin: 0}}>Medical Records</h2>
          <div></div>
        </div>
      </nav>

      <div className="patient-container" style={{paddingTop: '40px'}}>
        <div style={{background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'}}>
          <div style={{display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #e2e8f0'}}>
            {['all', 'consultations', 'lab-tests', 'prescriptions', 'documents'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '15px 25px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab ? '3px solid #7c3aed' : '3px solid transparent',
                  fontWeight: 700,
                  fontSize: '16px',
                  color: activeTab === tab ? '#7c3aed' : '#64748b',
                  cursor: 'pointer',
                  marginBottom: '-2px',
                  textTransform: 'capitalize'
                }}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            {records.map(record => (
              <div key={record.id} style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                padding: '25px',
                borderRadius: '16px',
                border: '2px solid #e2e8f0'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <h4 style={{fontSize: '18px', fontWeight: 700, color: '#1a2332', marginBottom: '8px'}}>
                      {record.description}
                    </h4>
                    <p style={{fontSize: '14px', color: '#64748b', marginBottom: '5px'}}>
                      {record.doctor} • {new Date(record.date).toLocaleDateString()}
                    </p>
                    <span style={{
                      padding: '4px 12px',
                      background: '#0EA5E9',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700
                    }}>
                      {record.type}
                    </span>
                  </div>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button className="btn-outline" onClick={() => alert('Viewing ' + record.file)}>
                      View
                    </button>
                    <button className="btn-primary">Download</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
