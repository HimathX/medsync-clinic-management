// src/pages/doctor/DoctorReports.js - Doctor Reports & Analytics
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import '../../styles/patientDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function DoctorReports() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const doctorId = currentUser?.userId || currentUser?.doctor_id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'week', 'month', 'year'
  const [reportData, setReportData] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalPatients: 0,
    averageConsultationTime: 0,
    revenue: 0,
    monthlyTrend: [],
    topDiagnoses: [],
    patientDemographics: {}
  });

  useEffect(() => {
    if (!doctorId) {
      navigate('/doctor-login');
    } else {
      fetchReportData();
    }
  }, [doctorId, selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate fetching report data
      // In production, this would call actual API endpoints
      const mockData = {
        totalAppointments: 245,
        completedAppointments: 215,
        cancelledAppointments: 30,
        totalPatients: 180,
        averageConsultationTime: 25, // minutes
        revenue: 537500, // LKR
        monthlyTrend: [
          { month: 'Jan', appointments: 45, revenue: 112500 },
          { month: 'Feb', appointments: 52, revenue: 130000 },
          { month: 'Mar', appointments: 48, revenue: 120000 },
          { month: 'Apr', appointments: 55, revenue: 137500 },
          { month: 'May', appointments: 45, revenue: 112500 }
        ],
        topDiagnoses: [
          { name: 'Common Cold', count: 45 },
          { name: 'Hypertension', count: 38 },
          { name: 'Diabetes Management', count: 32 },
          { name: 'Allergies', count: 28 },
          { name: 'General Checkup', count: 25 }
        ],
        patientDemographics: {
          ageGroups: {
            '0-18': 25,
            '19-35': 65,
            '36-50': 55,
            '51-65': 25,
            '65+': 10
          },
          gender: {
            male: 95,
            female: 85
          }
        }
      };

      setReportData(mockData);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/doctor-login');
  };

  const exportReport = (format) => {
    alert(`Exporting report as ${format}...`);
    // Implement actual export functionality
  };

  if (loading) {
    return (
      <div className="patient-portal">
        <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-portal">
      {/* Top Navigation */}
      <nav className="patient-top-nav">
        <div className="patient-top-nav-content">
          <div className="patient-nav-links">
            <button onClick={() => navigate('/doctor/dashboard')} style={{ background: 'none', border: 'none', color: '#e0e0e0', cursor: 'pointer' }}>
              ← Back to Dashboard
            </button>
          </div>
          <div className="patient-nav-actions">
            <a href="tel:+94112345678" className="patient-contact-link">📞 +94 11 234 5678</a>
          </div>
        </div>
      </nav>

      {/* Main Header */}
      <header className="patient-main-header">
        <div className="patient-header-content">
          <div className="patient-logo-wrapper">
            <div className="patient-logo-cross">+</div>
            <div>
              <h1 className="patient-brand-name">MedSync</h1>
              <p className="patient-brand-subtitle">Reports & Analytics</p>
            </div>
          </div>

          <div className="patient-user-section">
            <div className="patient-info-display" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="patient-info-text">
                <div className="patient-name-display">Dr. {currentUser?.fullName || 'Doctor'}</div>
                <div className="patient-id-display">Reports Dashboard</div>
              </div>
              <div className="patient-avatar-wrapper">
                <div className="patient-avatar">
                  {(currentUser?.fullName || 'D').charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            {showProfileMenu && (
              <div className="patient-profile-dropdown">
                <button className="patient-dropdown-item" onClick={() => navigate('/doctor/profile')}>
                  <span className="dropdown-icon">👤</span>
                  <span>My Profile</span>
                </button>
                <button className="patient-dropdown-item" onClick={() => navigate('/doctor/dashboard')}>
                  <span className="dropdown-icon">🏠</span>
                  <span>Dashboard</span>
                </button>
                <div className="patient-dropdown-divider"></div>
                <button className="patient-dropdown-item logout-item" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="patient-container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        {/* Page Header */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1a2332', marginBottom: '8px' }}>
                Reports & Analytics 📊
              </h1>
              <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
                View your performance metrics and insights
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-view-all" onClick={() => exportReport('PDF')}>
                📄 Export PDF
              </button>
              <button className="btn-view-all" onClick={() => exportReport('Excel')}>
                📊 Export Excel
              </button>
            </div>
          </div>
        </section>

        {/* Period Filter */}
        <section style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className={selectedPeriod === 'week' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setSelectedPeriod('week')}
              style={{
                padding: '12px 24px',
                border: selectedPeriod === 'week' ? '2px solid #7c3aed' : '2px solid #e2e8f0',
                background: selectedPeriod === 'week' ? '#f3f4f6' : 'white',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              This Week
            </button>
            <button
              className={selectedPeriod === 'month' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setSelectedPeriod('month')}
              style={{
                padding: '12px 24px',
                border: selectedPeriod === 'month' ? '2px solid #7c3aed' : '2px solid #e2e8f0',
                background: selectedPeriod === 'month' ? '#f3f4f6' : 'white',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              This Month
            </button>
            <button
              className={selectedPeriod === 'year' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setSelectedPeriod('year')}
              style={{
                padding: '12px 24px',
                border: selectedPeriod === 'year' ? '2px solid #7c3aed' : '2px solid #e2e8f0',
                background: selectedPeriod === 'year' ? '#f3f4f6' : 'white',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              This Year
            </button>
          </div>
        </section>

        {/* Key Metrics */}
        <section className="dashboard-stats-grid" style={{ marginBottom: '40px' }}>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="stat-icon">📅</div>
            <div className="stat-value">{reportData.totalAppointments}</div>
            <div className="stat-label">Total Appointments</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <div className="stat-icon">✅</div>
            <div className="stat-value">{reportData.completedAppointments}</div>
            <div className="stat-label">Completed</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <div className="stat-icon">👥</div>
            <div className="stat-value">{reportData.totalPatients}</div>
            <div className="stat-label">Total Patients</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <div className="stat-icon">⏱️</div>
            <div className="stat-value">{reportData.averageConsultationTime}</div>
            <div className="stat-label">Avg. Time (min)</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <div className="stat-icon">💰</div>
            <div className="stat-value">LKR {(reportData.revenue / 1000).toFixed(0)}K</div>
            <div className="stat-label">Total Revenue</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}>
            <div className="stat-icon">📈</div>
            <div className="stat-value">{((reportData.completedAppointments / reportData.totalAppointments) * 100).toFixed(0)}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </section>

        {/* Monthly Trend */}
        <section className="dashboard-section" style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>
            Monthly Trend 📈
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: '20px', minWidth: '600px' }}>
              {reportData.monthlyTrend.map((month, index) => (
                <div key={index} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    height: `${(month.appointments / 60) * 200}px`,
                    minHeight: '40px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '8px 8px 0 0',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '18px',
                    padding: '10px'
                  }}>
                    {month.appointments}
                  </div>
                  <div style={{ marginTop: '12px', fontWeight: '600', color: '#1a2332' }}>
                    {month.month}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    LKR {(month.revenue / 1000).toFixed(0)}K
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '30px' }}>
          {/* Top Diagnoses */}
          <section className="dashboard-section">
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>
              Top Diagnoses 🩺
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reportData.topDiagnoses.map((diagnosis, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '2px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '700'
                    }}>
                      {index + 1}
                    </div>
                    <span style={{ fontWeight: '600', color: '#1a2332' }}>{diagnosis.name}</span>
                  </div>
                  <span style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontWeight: '700',
                    fontSize: '14px'
                  }}>
                    {diagnosis.count} cases
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Patient Demographics */}
          <section className="dashboard-section">
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>
              Patient Demographics 👥
            </h2>
            
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#64748b', marginBottom: '12px' }}>Age Groups</h3>
            <div style={{ marginBottom: '30px' }}>
              {Object.entries(reportData.patientDemographics.ageGroups || {}).map(([age, count]) => (
                <div key={age} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600', color: '#1a2332' }}>{age} years</span>
                    <span style={{ fontWeight: '700', color: '#7c3aed' }}>{count}</span>
                  </div>
                  <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(count / 180) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '10px'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#64748b', marginBottom: '12px' }}>Gender Distribution</h3>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{
                flex: 1,
                padding: '20px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderRadius: '12px',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px' }}>
                  {reportData.patientDemographics.gender?.male || 0}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>Male</div>
              </div>
              <div style={{
                flex: 1,
                padding: '20px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '12px',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px' }}>
                  {reportData.patientDemographics.gender?.female || 0}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>Female</div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
