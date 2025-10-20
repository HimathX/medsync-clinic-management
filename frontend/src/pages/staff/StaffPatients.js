import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffHeader from '../../components/StaffHeader';
import authService from '../../services/authService';
import '../../styles/staff.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const StaffPatients = () => {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ skip: 0, limit: 20 });
  const [branch, setBranch] = useState('Colombo');
  const [patients, setPatients] = useState([]);
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/staff-login');
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    full_name: '',
    NIC: '',
    DOB: '',
    gender: '',
    email: '',
    password: '',
    contact_num1: '',
    contact_num2: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Sri Lanka',
    blood_group: '',
    registered_branch_name: localStorage.getItem('branch_name') || 'Main Branch'
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
      console.log('🔍 Fetching patients from API...');
      const response = await fetch(`${API_BASE_URL}/patients/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Patients API Response:', data);
        
        // The API returns { total: number, patients: array }
        if (data.patients && Array.isArray(data.patients)) {
          setPatients(data.patients);
          console.log('✅ Set patients:', data.patients.length, 'patients');
        } else if (Array.isArray(data)) {
          // Fallback if API returns array directly
          setPatients(data);
          console.log('✅ Set patients (array):', data.length, 'patients');
        } else {
          console.warn('⚠️ Unexpected data format:', data);
          setPatients([]);
        }
      } else {
        throw new Error('Failed to fetch patients');
      }
    } catch (err) {
      console.error('❌ Error fetching patients:', err);
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

      const data = await response.json();
      
      if (response.ok) {
        alert(`Patient registered successfully! Patient ID: ${data.patient_id}`);
        setShowAddModal(false);
        setNewPatient({
          full_name: '',
          NIC: '',
          DOB: '',
          gender: '',
          email: '',
          password: '',
          contact_num1: '',
          contact_num2: '',
          address_line1: '',
          address_line2: '',
          city: '',
          province: '',
          postal_code: '',
          country: 'Sri Lanka',
          blood_group: '',
          registered_branch_name: localStorage.getItem('branch_name') || 'Main Branch'
        });
        fetchPatients();
      } else {
        throw new Error(data.detail || 'Failed to register patient');
      }
    } catch (err) {
      console.error('❌ Error registering patient:', err);
      alert(err.message || 'Failed to register patient');
    }
  };

  // Search patient by NIC
  const searchPatientByNIC = async (nic) => {
    if (!nic) {
      setError('Please enter a NIC to search');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/patients/search/by-nic/${nic}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Patient found by NIC:', data);
        // Combine user and patient data
        const patientData = { ...data.user, ...data.patient };
        setPatients([patientData]);
      } else if (response.status === 404) {
        setPatients([]);
        setError(`No patient found with NIC: ${nic}`);
      } else {
        throw new Error('Failed to search patient');
      }
    } catch (err) {
      console.error('❌ Error searching by NIC:', err);
      setError('Failed to search patient by NIC');
    } finally {
      setLoading(false);
    }
  };

  // View patient details
  const viewPatientDetails = async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Patient details:', data);
        // Navigate to patient detail page or show modal
        navigate(`/staff/patient/${patientId}`);
      } else {
        throw new Error('Failed to fetch patient details');
      }
    } catch (err) {
      console.error('❌ Error fetching patient details:', err);
      alert('Failed to load patient details');
    }
  };

  // View patient appointments
  const viewPatientAppointments = async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Patient appointments:', data);
        return data.appointments;
      } else {
        throw new Error('Failed to fetch appointments');
      }
    } catch (err) {
      console.error('❌ Error fetching appointments:', err);
      return [];
    }
  };

  // View patient allergies
  const viewPatientAllergies = async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/allergies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Patient allergies:', data);
        return data.allergies;
      } else {
        throw new Error('Failed to fetch allergies');
      }
    } catch (err) {
      console.error('❌ Error fetching allergies:', err);
      return [];
    }
  };

  const filteredPatients = Array.isArray(patients) ? patients.filter(p => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(searchLower) ||
      p.NIC?.toLowerCase().includes(searchLower) ||
      p.email?.toLowerCase().includes(searchLower) ||
      p.patient_id?.toString().includes(searchLower)
    );
  }) : [];

  if (loading) {
    return (
      <div className="staff-container">
        <StaffHeader 
          staffName={currentUser?.fullName || 'Staff'}
          staffRole={currentUser?.userType?.charAt(0).toUpperCase() + currentUser?.userType?.slice(1) || 'Staff'}
          branch={branch}
          setBranch={setBranch}
          onLogout={handleLogout}
        />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-container">
      <StaffHeader 
        staffName={currentUser?.fullName || 'Staff'}
        staffRole={currentUser?.userType?.charAt(0).toUpperCase() + currentUser?.userType?.slice(1) || 'Staff'}
        branch={branch}
        setBranch={setBranch}
        onLogout={handleLogout}
      />
      <div className="staff-content">
        <div className="staff-header">
          <div>
            <h1>Patient Management</h1>
            <p>Manage patient records • Total: {patients.length} patients</p>
          </div>
          <button className="btn-add" onClick={() => setShowAddModal(true)}>
            <i className="fas fa-plus"></i> Add Patient
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Search Section */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#64748b' }}>
              General Search
            </label>
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search by name, NIC, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => { setSearchTerm(''); fetchPatients(); }}
                  style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#64748b' }}>
              Search by NIC
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Enter NIC..."
                style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', minWidth: '200px' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    searchPatientByNIC(e.target.value);
                  }
                }}
              />
              <button 
                className="btn-primary"
                onClick={(e) => {
                  const nicInput = e.target.previousSibling;
                  searchPatientByNIC(nicInput.value);
                }}
              >
                <i className="fas fa-search"></i> Search NIC
              </button>
            </div>
          </div>
          <button 
            className="btn-secondary"
            onClick={fetchPatients}
            title="Reset and load all patients"
          >
            <i className="fas fa-sync-alt"></i> Reset
          </button>
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
                  <th>Patient ID</th>
                  <th>Full Name</th>
                  <th>NIC</th>
                  <th>Email</th>
                  <th>Blood Group</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.patient_id}>
                    <td>#{patient.patient_id?.substring(0, 8)}...</td>
                    <td>{patient.full_name || 'N/A'}</td>
                    <td>{patient.NIC || 'N/A'}</td>
                    <td>{patient.email || 'N/A'}</td>
                    <td>{patient.blood_group || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-view-small"
                          onClick={() => viewPatientDetails(patient.patient_id)}
                          title="View Full Details"
                          style={{ background: '#3b82f6', color: 'white', padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button 
                          className="btn-view-small"
                          onClick={async () => {
                            const appointments = await viewPatientAppointments(patient.patient_id);
                            alert(`Patient has ${appointments.length} appointment(s)`);
                          }}
                          title="View Appointments"
                          style={{ background: '#10b981', color: 'white', padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <i className="fas fa-calendar-alt"></i>
                        </button>
                        <button 
                          className="btn-view-small"
                          onClick={async () => {
                            const allergies = await viewPatientAllergies(patient.patient_id);
                            if (allergies.length > 0) {
                              alert(`Patient Allergies:\n${allergies.map(a => a.allergy_name).join('\n')}`);
                            } else {
                              alert('No allergies recorded for this patient');
                            }
                          }}
                          title="View Allergies"
                          style={{ background: '#f59e0b', color: 'white', padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <i className="fas fa-exclamation-triangle"></i>
                        </button>
                      </div>
                    </td>
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
                  {/* Personal Information */}
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newPatient.full_name}
                      onChange={(e) => setNewPatient({...newPatient, full_name: e.target.value})}
                      placeholder="e.g., John Doe Silva"
                    />
                  </div>
                  <div className="form-group">
                    <label>NIC *</label>
                    <input
                      type="text"
                      required
                      value={newPatient.NIC}
                      onChange={(e) => setNewPatient({...newPatient, NIC: e.target.value})}
                      placeholder="e.g., 199912345678"
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={newPatient.DOB}
                      onChange={(e) => setNewPatient({...newPatient, DOB: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      required
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Blood Group</label>
                    <select
                      value={newPatient.blood_group}
                      onChange={(e) => setNewPatient({...newPatient, blood_group: e.target.value})}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  
                  {/* Contact Information */}
                  <div className="form-group">
                    <label>Primary Contact *</label>
                    <input
                      type="tel"
                      required
                      value={newPatient.contact_num1}
                      onChange={(e) => setNewPatient({...newPatient, contact_num1: e.target.value})}
                      placeholder="e.g., 0771234567"
                    />
                  </div>
                  <div className="form-group">
                    <label>Secondary Contact</label>
                    <input
                      type="tel"
                      value={newPatient.contact_num2}
                      onChange={(e) => setNewPatient({...newPatient, contact_num2: e.target.value})}
                      placeholder="e.g., 0771234567"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      required
                      value={newPatient.email}
                      onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                      placeholder="e.g., john@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      required
                      minLength="6"
                      value={newPatient.password}
                      onChange={(e) => setNewPatient({...newPatient, password: e.target.value})}
                      placeholder="Min 6 characters"
                    />
                  </div>
                  
                  {/* Address Information */}
                  <div className="form-group full-width">
                    <label>Address Line 1 *</label>
                    <input
                      type="text"
                      required
                      value={newPatient.address_line1}
                      onChange={(e) => setNewPatient({...newPatient, address_line1: e.target.value})}
                      placeholder="e.g., 123 Main Street"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      value={newPatient.address_line2}
                      onChange={(e) => setNewPatient({...newPatient, address_line2: e.target.value})}
                      placeholder="Apartment, suite, etc. (optional)"
                    />
                  </div>
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      required
                      value={newPatient.city}
                      onChange={(e) => setNewPatient({...newPatient, city: e.target.value})}
                      placeholder="e.g., Colombo"
                    />
                  </div>
                  <div className="form-group">
                    <label>Province *</label>
                    <select
                      required
                      value={newPatient.province}
                      onChange={(e) => setNewPatient({...newPatient, province: e.target.value})}
                    >
                      <option value="">Select Province</option>
                      <option value="Western">Western</option>
                      <option value="Central">Central</option>
                      <option value="Southern">Southern</option>
                      <option value="Northern">Northern</option>
                      <option value="Eastern">Eastern</option>
                      <option value="North Western">North Western</option>
                      <option value="North Central">North Central</option>
                      <option value="Uva">Uva</option>
                      <option value="Sabaragamuwa">Sabaragamuwa</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Postal Code *</label>
                    <input
                      type="text"
                      required
                      value={newPatient.postal_code}
                      onChange={(e) => setNewPatient({...newPatient, postal_code: e.target.value})}
                      placeholder="e.g., 10100"
                    />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      value={newPatient.country}
                      onChange={(e) => setNewPatient({...newPatient, country: e.target.value})}
                      placeholder="Sri Lanka"
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label>Registered Branch *</label>
                    <select
                      required
                      value={newPatient.registered_branch_name}
                      onChange={(e) => setNewPatient({...newPatient, registered_branch_name: e.target.value})}
                    >
                      <option value="Main Branch">Main Branch</option>
                      <option value="Colombo">Colombo</option>
                      <option value="Kandy">Kandy</option>
                      <option value="Galle">Galle</option>
                    </select>
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
