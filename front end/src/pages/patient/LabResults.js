// src/pages/patient/LabResults.js - Patient Lab Results
import { useNavigate } from 'react-router-dom'

export default function PatientLabResults() {
  const navigate = useNavigate()

  const labResults = [
    { id: 1, test: 'Complete Blood Count', date: '2025-09-22', status: 'Ready', doctor: 'Dr. Silva', category: 'Hematology' },
    { id: 2, test: 'Lipid Panel', date: '2025-09-20', status: 'Ready', doctor: 'Dr. Perera', category: 'Biochemistry' },
    { id: 3, test: 'Thyroid Function Test', date: '2025-09-18', status: 'Processing', doctor: 'Dr. Fernando', category: 'Endocrinology' },
  ]

  return (
    <div className="patient-portal">
      <nav className="patient-top-nav">
        <div className="patient-top-nav-content">
          <button className="btn-secondary" onClick={() => navigate('/patient/dashboard')}>← Back</button>
          <h2 style={{color: 'white', margin: 0}}>Laboratory Results</h2>
          <div></div>
        </div>
      </nav>

      <div className="patient-container" style={{paddingTop: '40px'}}>
        <div style={{background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'}}>
          <h3 style={{fontSize: '32px', fontWeight: 800, color: '#1a2332', marginBottom: '30px'}}>
            Recent Lab Results
          </h3>

          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            {labResults.map(result => (
              <div key={result.id} style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                padding: '25px',
                borderRadius: '16px',
                border: '2px solid #e2e8f0'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div style={{flexGrow: 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px'}}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '30px'
                      }}>
                        🧪
                      </div>
                      <div>
                        <h4 style={{fontSize: '20px', fontWeight: 700, color: '#1a2332', marginBottom: '5px'}}>
                          {result.test}
                        </h4>
                        <p style={{fontSize: '14px', color: '#64748b'}}>
                          {result.category} • Ordered by {result.doctor}
                        </p>
                      </div>
                    </div>
                    <div style={{display: 'flex', gap: '30px', marginTop: '15px'}}>
                      <div>
                        <div style={{fontSize: '13px', color: '#64748b', marginBottom: '3px'}}>Test Date</div>
                        <div style={{fontSize: '15px', fontWeight: 700, color: '#1a2332'}}>
                          {new Date(result.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div style={{fontSize: '13px', color: '#64748b', marginBottom: '3px'}}>Status</div>
                        <span style={{
                          padding: '4px 16px',
                          background: result.status === 'Ready' ? 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' : 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          {result.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    {result.status === 'Ready' && (
                      <>
                        <button className="btn-primary" onClick={() => alert('Viewing results for ' + result.test)}>
                          View Results
                        </button>
                        <button className="btn-outline">Download PDF</button>
                      </>
                    )}
                    {result.status === 'Processing' && (
                      <button className="btn-outline" disabled>
                        Processing...
                      </button>
                    )}
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
