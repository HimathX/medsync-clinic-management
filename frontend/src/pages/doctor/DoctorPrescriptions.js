import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorHeader from '../../components/DoctorHeader';
import '../../styles/doctor.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorPrescriptions = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    fetchPrescriptions();
  }, [navigate]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/prescription/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data);
      } else {
        throw new Error('Failed to fetch prescriptions');
      }
    } catch (err) {
      setError('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
          <h1>Prescriptions</h1>
          <p>View and manage prescriptions</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Prescriptions Table */}
        <div className="table-container">
          {prescriptions.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-prescription"></i>
              <p>No prescriptions found</p>
            </div>
          ) : (
            <table className="doctor-table">
              <thead>
                <tr>
                  <th>Prescription ID</th>
                  <th>Patient ID</th>
                  <th>Consultation ID</th>
                  <th>Date</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((rx) => (
                  <tr key={rx.prescription_id}>
                    <td>#{rx.prescription_id}</td>
                    <td>#{rx.patient_id}</td>
                    <td>#{rx.consultation_id}</td>
                    <td>{formatDate(rx.prescription_date)}</td>
                    <td>{rx.instructions || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorPrescriptions;
