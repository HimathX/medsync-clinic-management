// src/pages/patient/Prescriptions.js - Patient Prescriptions
import { useNavigate } from 'react-router-dom'

export default function PatientPrescriptions() {
  const navigate = useNavigate()

  const prescriptions = [
    { id: 1, name: 'Aspirin 100mg', dosage: '1 tablet daily', doctor: 'Dr. Perera', date: '2025-09-20', refills: 2, status: 'Active' },
    { id: 2, name: 'Vitamin D3', dosage: '1 capsule weekly', doctor: 'Dr. Fernando', date: '2025-09-15', refills: 5, status: 'Active' },
    { id: 3, name: 'Metformin 500mg', dosage: '2 tablets daily', doctor: 'Dr. Silva', date: '2025-08-10', refills: 0, status: 'Refill Needed' },
  ]

  return (
    <div className="patient-portal">
      <nav className="patient-top-nav">
        <div className="patient-top-nav-content">
          <button className="btn-secondary" onClick={() => navigate('/patient/dashboard')}>← Back</button>
          <h2 style={{color: 'white', margin: 0}}>Prescriptions</h2>
          <div></div>
        </div>
      </nav>

      <div className="patient-container" style={{paddingTop: '40px'}}>
        <div style={{background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'}}>
          <h3 style={{fontSize: '32px', fontWeight: 800, color: '#1a2332', marginBottom: '30px'}}>
            Active Prescriptions
          </h3>

          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            {prescriptions.map(rx => (
              <div key={rx.id} style={{
                background: rx.status === 'Refill Needed' ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                padding: '25px',
                borderRadius: '16px',
                border: rx.status === 'Refill Needed' ? '2px solid #fcd34d' : '2px solid #86efac'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div style={{flexGrow: 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px'}}>
                      <span style={{fontSize: '32px'}}>💊</span>
                      <div>
                        <h4 style={{fontSize: '20px', fontWeight: 700, color: '#1a2332', marginBottom: '5px'}}>
                          {rx.name}
                        </h4>
                        <p style={{fontSize: '16px', color: '#475569', fontWeight: 600}}>
                          {rx.dosage}
                        </p>
                      </div>
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '15px'}}>
                      <div>
                        <div style={{fontSize: '13px', color: '#64748b', marginBottom: '3px'}}>Prescribed By</div>
                        <div style={{fontSize: '15px', fontWeight: 700, color: '#1a2332'}}>{rx.doctor}</div>
                      </div>
                      <div>
                        <div style={{fontSize: '13px', color: '#64748b', marginBottom: '3px'}}>Date</div>
                        <div style={{fontSize: '15px', fontWeight: 700, color: '#1a2332'}}>
                          {new Date(rx.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div style={{fontSize: '13px', color: '#64748b', marginBottom: '3px'}}>Refills Left</div>
                        <div style={{fontSize: '15px', fontWeight: 700, color: rx.refills === 0 ? '#EF4444' : '#10B981'}}>
                          {rx.refills} {rx.refills === 0 && '(Refill Needed)'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    <button className="btn-primary" onClick={() => alert('Requesting refill for ' + rx.name)}>
                      Request Refill
                    </button>
                    <button className="btn-outline">Download</button>
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
