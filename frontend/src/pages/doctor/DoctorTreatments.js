import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorHeader from '../../components/DoctorHeader';
import '../../styles/doctor.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorTreatments = () => {
  const navigate = useNavigate();
  const [treatments, setTreatments] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      const [treatmentsRes, catalogueRes] = await Promise.all([
        fetch(`${API_BASE_URL}/treatment/`, { headers }),
        fetch(`${API_BASE_URL}/treatment-catalogue/`, { headers })
      ]);

      if (treatmentsRes.ok) {
        const data = await treatmentsRes.json();
        setTreatments(data);
      }

      if (catalogueRes.ok) {
        const data = await catalogueRes.json();
        setCatalogue(data);
      }
    } catch (err) {
      setError('Failed to load treatments');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount || 0);
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
            className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <i className="fas fa-procedures"></i> Active Treatments ({treatments.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'catalogue' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalogue')}
          >
            <i className="fas fa-book-medical"></i> Treatment Catalogue ({catalogue.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'active' ? (
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
        ) : (
          <div className="treatments-grid">
            {catalogue.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-book-medical"></i>
                <p>No treatments in catalogue</p>
              </div>
            ) : (
              catalogue.map((item) => (
                <div key={item.service_id} className="treatment-card">
                  <div className="treatment-header">
                    <h3>{item.service_name}</h3>
                    <span className="price-badge">{formatCurrency(item.price)}</span>
                  </div>
                  <div className="treatment-body">
                    <p>{item.description || 'No description available'}</p>
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
