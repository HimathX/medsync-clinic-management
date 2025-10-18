import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorHeader from '../../components/DoctorHeader';
import '../../styles/staff.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const StaffPatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    first_name: '',
    last_name: '',
    nic: '',
    date_of_birth: '',
    gender: '',
    email: '',
    phone_no: '',
    address: '',
    password: ''
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    fetchPatients();
  }, [navigate]);

  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/patients/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        throw new Error('Failed to fetch patients');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/patients/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPatient)
      });

      if (response.ok) {
        alert('Patient registered successfully');
        setShowAddModal(false);
        setNewPatient({
          first_name: '',
          last_name: '',
          nic: '',
          date_of_birth: '',
          gender: '',
          email: '',
          phone_no: '',
          address: '',
          password: ''
        });
        fetchPatients();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to register patient');
      }
    } catch (err) {
      console.error('Error:', err);
      alert(err.message);
    }
  };

  const filteredPatients = patients.filter(p =>
    searchTerm === '' ||
    p.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient_id?.toString().includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="staff-container">
        <DoctorHeader />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-container">
      <DoctorHeader />
      <div className="staff-content">
        <div className="staff-header">
          <div>
            <h1>Patient Management</h1>
            <p>Manage patient records</p>
          </div>
          <button className="btn-add" onClick={() => setShowAddModal(true)}>
            <i className="fas fa-plus"></i> Add Patient
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Search */}
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by name, NIC, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Patients Table */}
        <div className="table-container">
          {filteredPatients.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-users"></i>
              <p>No patients found</p>
            </div>
          ) : (
            <table className="staff-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>NIC</th>
                  <th>Phone</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.patient_id}>
                    <td>#{patient.patient_id}</td>
                    <td>{patient.first_name} {patient.last_name}</td>
                    <td>{patient.nic || 'N/A'}</td>
                    <td>{patient.phone_no || 'N/A'}</td>
                    <td>{patient.email || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Patient Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add New Patient</h2>
                <button className="btn-close" onClick={() => setShowAddModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleAddPatient}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      required
                      value={newPatient.first_name}
                      onChange={(e) => setNewPatient({...newPatient, first_name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      required
                      value={newPatient.last_name}
                      onChange={(e) => setNewPatient({...newPatient, last_name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>NIC *</label>
                    <input
                      type="text"
                      required
                      value={newPatient.nic}
                      onChange={(e) => setNewPatient({...newPatient, nic: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={newPatient.date_of_birth}
                      onChange={(e) => setNewPatient({...newPatient, date_of_birth: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      required
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      required
                      value={newPatient.phone_no}
                      onChange={(e) => setNewPatient({...newPatient, phone_no: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      required
                      value={newPatient.email}
                      onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      required
                      value={newPatient.password}
                      onChange={(e) => setNewPatient({...newPatient, password: e.target.value})}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Address</label>
                    <textarea
                      value={newPatient.address}
                      onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
                      rows="2"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">Register</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffPatients;
