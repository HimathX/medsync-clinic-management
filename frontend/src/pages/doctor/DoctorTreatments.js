import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorHeader from '../../components/DoctorHeader';
import treatmentService from '../../services/treatmentService';
import authService from '../../services/authService';
import '../../styles/doctor.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorTreatments = () => {
  const navigate = useNavigate();
  const [treatments, setTreatments] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('catalogue');
  const [statistics, setStatistics] = useState([]);
  const [filters, setFilters] = useState({ search: '', minPrice: '', maxPrice: '' });
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate('/doctor-login', { replace: true });
      return;
    }
    fetchData();
  }, [currentUser, navigate]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch treatment catalogue
      const catalogueData = await treatmentService.getAllTreatmentServices(
        0, 
        100, 
        filters.search || null,
        filters.minPrice || null,
        filters.maxPrice || null
      );
      setCatalogue(catalogueData.treatments || []);
      setTreatments([]); // Treatment records not needed for doctor view

      // Fetch statistics
      const statsData = await treatmentService.getTreatmentCatalogueStatistics(10);
      setStatistics(statsData.top_treatments || []);

    } catch (err) {
      console.error('Error loading treatments:', err);
      setError('Failed to load treatments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount || 0);
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

  const handleSearch = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="doctor-container">
        <DoctorHeader />
        <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>
      </div>
    );
  }

  return (
    <div className="doctor-container">
      <DoctorHeader />
      <div className="doctor-content">
        <div className="doctor-header">
          <h1>Treatments</h1>
          <p>Manage treatment plans</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Tabs */}
        <div className="tabs-container">
          <button 
            className={`tab-button ${activeTab === 'catalogue' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalogue')}
          >
            <i className="fas fa-book-medical"></i> Treatment Catalogue ({catalogue.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            <i className="fas fa-chart-bar"></i> Statistics
          </button>
          <button 
            className={`tab-button ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            <i className="fas fa-procedures"></i> Treatment Records ({treatments.length})
          </button>
        </div>

        {/* Search Filters for Catalogue */}
        {activeTab === 'catalogue' && (
          <div className="filters-section" style={{ marginBottom: '20px' }}>
            <div className="filter-row">
              <div className="filter-group">
                <label><i className="fas fa-search"></i> Search</label>
                <input 
                  type="text" 
                  placeholder="Search treatments..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>
              <div className="filter-group">
                <label><i className="fas fa-dollar-sign"></i> Min Price</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                />
              </div>
              <div className="filter-group">
                <label><i className="fas fa-dollar-sign"></i> Max Price</label>
                <input 
                  type="number" 
                  placeholder="100000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                />
              </div>
              <button className="btn-primary" onClick={handleSearch}>
                <i className="fas fa-search"></i> Search
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === 'catalogue' ? (
          <div className="table-container">
            {treatments.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-procedures"></i>
                <p>No active treatments</p>
              </div>
            ) : (
              <table className="doctor-table">
                <thead>
                  <tr>
                    <th>Treatment ID</th>
                    <th>Patient ID</th>
                    <th>Service</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {treatments.map((treatment) => (
                    <tr key={treatment.treatment_id}>
                      <td>#{treatment.treatment_id}</td>
                      <td>#{treatment.patient_id}</td>
                      <td>{treatment.service_name || 'N/A'}</td>
                      <td>
                        <span className={`status-badge status-${treatment.status?.toLowerCase()}`}>
                          {treatment.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : activeTab === 'statistics' ? (
          <div className="table-container">
            <h3 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>
              <i className="fas fa-chart-line"></i> Most Performed Treatments
            </h3>
            {statistics.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-chart-bar"></i>
                <p>No statistics available</p>
              </div>
            ) : (
              <table className="doctor-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Treatment</th>
                    <th>Base Price</th>
                    <th>Duration</th>
                    <th>Times Performed</th>
                    <th>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.map((stat, index) => (
                    <tr key={stat.treatment_service_code}>
                      <td>
                        <span className={`rank-badge ${index < 3 ? 'top-rank' : ''}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{stat.treatment_name}</td>
                      <td>{formatCurrency(stat.base_price)}</td>
                      <td>{formatDuration(stat.duration)}</td>
                      <td>
                        <span className="badge badge-primary">{stat.times_performed}</span>
                      </td>
                      <td style={{ fontWeight: '700', color: '#10b981' }}>
                        {formatCurrency(stat.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="treatments-grid">
            {catalogue.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-book-medical"></i>
                <p>No treatments in catalogue</p>
              </div>
            ) : (
              catalogue.map((item) => (
                <div key={item.treatment_service_code} className="treatment-card">
                  <div className="treatment-header">
                    <h3>{item.treatment_name}</h3>
                    <span className="price-badge">{formatCurrency(item.base_price)}</span>
                  </div>
                  <div className="treatment-body">
                    <p>{item.description || 'No description available'}</p>
                    <div style={{ marginTop: '12px', fontSize: '14px', color: '#64748b' }}>
                      <i className="fas fa-clock"></i> Duration: {formatDuration(item.duration)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorTreatments;
