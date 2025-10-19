// Modern Treatment Catalogue Page for Doctors
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import treatmentService from '../../services/treatmentService';
import authService from '../../services/authService';
import '../../styles/patientDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorTreatmentCatalogue = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: ''
  });
  const [selectedTreatment, setSelectedTreatment] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/doctor-login', { replace: true });
      return;
    }
    fetchTreatments();
    fetchStatistics();
  }, [currentUser, navigate]);

  const fetchTreatments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await treatmentService.getAllTreatmentServices(
        0, 
        100, 
        filters.search || null,
        filters.minPrice || null,
        filters.maxPrice || null
      );
      setTreatments(data.treatments || []);
    } catch (err) {
      console.error('Error fetching treatments:', err);
      setError('Failed to load treatment catalogue');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const data = await treatmentService.getTreatmentCatalogueStatistics(10);
      setStatistics(data.top_treatments || []);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const handleSearch = () => {
    fetchTreatments();
  };

  const handleViewDetails = async (treatment) => {
    try {
      const details = await treatmentService.getTreatmentServiceByCode(treatment.treatment_service_code);
      setSelectedTreatment(details);
    } catch (err) {
      console.error('Error fetching treatment details:', err);
      alert('Failed to load treatment details');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', { 
      style: 'currency', 
      currency: 'LKR' 
    }).format(price || 0);
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    if (typeof duration === 'string') {
      const parts = duration.split(':');
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes} min`;
    }
    return duration;
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/doctor-login');
  };

  if (loading) {
    return (
      <div className="patient-portal">
        <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
          <p>Loading treatment catalogue...</p>
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
            <a href="#/doctor/dashboard">Dashboard</a>
            <a href="#/doctor/appointments">Appointments</a>
            <a href="#treatments" className="active">Treatment Catalogue</a>
          </div>
          <div className="patient-nav-actions">
            <a href="tel:+94112345678" className="patient-contact-link">📞 +94 11 234 5678</a>
            <a href="/support" className="patient-emergency-link">🆘 Support</a>
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
              <p className="patient-brand-subtitle">Treatment Catalogue</p>
            </div>
          </div>

          <div className="patient-user-section">
            <div className="patient-info-display" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="patient-info-text">
                <div className="patient-name-display">Dr. {currentUser?.fullName || currentUser?.full_name || 'Doctor'}</div>
                <div className="patient-id-display">Physician</div>
              </div>
              <div className="patient-avatar-wrapper">
                <div className="patient-avatar">
                  {(currentUser?.fullName || currentUser?.full_name || 'D').charAt(0).toUpperCase()}
                </div>
                <div className="avatar-status-indicator"></div>
              </div>
            </div>

            {showProfileMenu && (
              <div className="patient-profile-dropdown">
                <button className="patient-dropdown-item" onClick={() => navigate('/doctor/profile')}>
                  <span className="dropdown-icon">👤</span>
                  <span>My Profile</span>
                </button>
                <button className="patient-dropdown-item" onClick={() => navigate('/doctor/schedule')}>
                  <span className="dropdown-icon">📅</span>
                  <span>My Schedule</span>
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
        {/* Page Title */}
        <section style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1a2332', marginBottom: '8px' }}>
            Treatment Catalogue 💊
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
            Browse available medical treatments and services
          </p>
        </section>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '30px' }}>
            <strong>Error:</strong> {error}
            <button onClick={fetchTreatments} style={{ marginLeft: '20px' }}>Retry</button>
          </div>
        )}

        {/* Tabs */}
        <section style={{ marginBottom: '30px' }}>
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '8px',
            marginBottom: '30px'
          }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '12px 24px',
                background: activeTab === 'all' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: activeTab === 'all' ? 'white' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              📋 All Treatments ({treatments.length})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              style={{
                padding: '12px 24px',
                background: activeTab === 'stats' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: activeTab === 'stats' ? 'white' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              📊 Most Popular
            </button>
          </div>

          {activeTab === 'all' && (
            <>
              {/* Search & Filter */}
              <div style={{ 
                background: 'white', 
                borderRadius: '16px', 
                padding: '24px', 
                marginBottom: '30px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a2332' }}>
                      🔍 Search Treatment
                    </label>
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a2332' }}>
                      💰 Min Price (LKR)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a2332' }}>
                      💰 Max Price (LKR)
                    </label>
                    <input
                      type="number"
                      placeholder="100000"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      onClick={handleSearch}
                      style={{
                        width: '100%',
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      🔍 Search
                    </button>
                  </div>
                </div>
              </div>

              {/* Treatments Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {treatments.map((treatment) => (
                  <div
                    key={treatment.treatment_service_code}
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '24px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      border: '2px solid #e2e8f0',
                      transition: 'all 0.3s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                    }}
                    onClick={() => handleViewDetails(treatment)}
                  >
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2332', marginBottom: '8px' }}>
                        {treatment.treatment_name}
                      </h3>
                      <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                        {treatment.description || 'No description available'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Price</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#667eea' }}>
                          {formatPrice(treatment.base_price)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Duration</div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a2332' }}>
                          ⏱️ {formatDuration(treatment.duration)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {treatments.length === 0 && (
                <div className="empty-state-card">
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>💊</div>
                  <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#1a2332' }}>No treatments found</h3>
                  <p style={{ color: '#64748b' }}>Try adjusting your filters</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'stats' && (
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>
                Most Frequently Performed Treatments
              </h3>
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#1a2332' }}>Rank</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700', color: '#1a2332' }}>Treatment</th>
                      <th style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: '#1a2332' }}>Times Performed</th>
                      <th style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: '#1a2332' }}>Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.map((stat, index) => (
                      <tr key={stat.treatment_service_code} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            background: index < 3 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
                            color: index < 3 ? 'white' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700'
                          }}>
                            {index + 1}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: '600', color: '#1a2332', marginBottom: '4px' }}>
                            {stat.treatment_name}
                          </div>
                          <div style={{ fontSize: '14px', color: '#64748b' }}>
                            {formatPrice(stat.base_price)} • {formatDuration(stat.duration)}
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#667eea' }}>
                          {stat.times_performed}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: '#10b981' }}>
                          {formatPrice(stat.total_revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {statistics.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                    <p>No statistics available yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Treatment Details Modal */}
        {selectedTreatment && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={() => setSelectedTreatment(null)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '24px',
                padding: '40px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1a2332', margin: 0 }}>
                  {selectedTreatment.treatment.treatment_name}
                </h2>
                <button
                  onClick={() => setSelectedTreatment(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '32px',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '0',
                    width: '40px',
                    height: '40px'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>Description</div>
                <p style={{ fontSize: '16px', color: '#1a2332', lineHeight: '1.6' }}>
                  {selectedTreatment.treatment.description || 'No description available'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '12px' }}>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Base Price</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#667eea' }}>
                    {formatPrice(selectedTreatment.treatment.base_price)}
                  </div>
                </div>
                <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '12px' }}>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Duration</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a2332' }}>
                    {formatDuration(selectedTreatment.treatment.duration)}
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px', background: '#f0f9ff', borderRadius: '12px' }}>
                <div style={{ fontSize: '14px', color: '#0284c7', marginBottom: '8px', fontWeight: '600' }}>
                  📊 Usage Statistics
                </div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#0284c7' }}>
                  {selectedTreatment.usage_stats.total_treatments_performed}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  Times performed
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorTreatmentCatalogue;
