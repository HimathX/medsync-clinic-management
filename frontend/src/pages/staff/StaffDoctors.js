import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorHeader from '../../components/DoctorHeader';
import '../../styles/staff.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const StaffDoctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    fetchDoctors();
  }, [navigate]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/doctors/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      } else {
        throw new Error('Failed to fetch doctors');
      }
    } catch (err) {
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="staff-container">
        <DoctorHeader />
        <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>
      </div>
    );
  }

  return (
    <div className="staff-container">
      <DoctorHeader />
      <div className="staff-content">
        <div className="staff-header">
          <h1>Doctor Directory</h1>
          <p>View all doctors</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="doctors-grid">
          {doctors.length === 0 ? (
            <div className="empty-state"><i className="fas fa-user-md"></i><p>No doctors found</p></div>
          ) : (
            doctors.map((doctor) => (
              <div key={doctor.doctor_id} className="doctor-card">
                <div className="doctor-avatar"><i className="fas fa-user-md"></i></div>
                <div className="doctor-info">
                  <h3>Dr. {doctor.first_name} {doctor.last_name}</h3>
                  <p className="specialization">
                    <i className="fas fa-stethoscope"></i> {doctor.specialization || 'General'}
                  </p>
                  <p><i className="fas fa-envelope"></i> {doctor.email || 'N/A'}</p>
                  <p><i className="fas fa-phone"></i> {doctor.phone_no || 'N/A'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDoctors;
