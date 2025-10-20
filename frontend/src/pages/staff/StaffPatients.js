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
  const [metrics, setMetrics] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [showAllergiesModal, setShowAllergiesModal] = useState(false);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [selectedPatientName, setSelectedPatientName] = useState('');
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
    const userId = localStorage.getItem('user_id');
    const userType = localStorage.getItem('user_type');
    
    console.log('🔍 StaffPatients - Auth check:', { userId, userType });
    
    if (!userId || !userType) {
      console.log('❌ No auth found, redirecting to login');
      navigate('/staff-login');
      return;
    }
    
    console.log('✅ Auth verified, fetching patients...');
    fetchPatients();
    fetchMetrics();
  }, [navigate]);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('📊 Fetching patient metrics...');
      const response = await fetch(`${API_BASE_URL}/patients/metrics/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Patient metrics:', data);
        setMetrics(data);
      }
    } catch (err) {
      console.error('❌ Error fetching metrics:', err);
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching detailed patients from API...');
      const response = await fetch(`${API_BASE_URL}/patients/all/detailed?skip=${pagination.skip}&limit=${pagination.limit}`, {
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

  // View complete patient profile
  const viewPatientDetails = async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('📋 Fetching complete patient profile...');
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/complete`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Complete patient profile:', data);
        setSelectedPatient(data);
        setShowDetailsModal(true);
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

        {/* Patient Metrics Dashboard */}
        {metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="stat-card" style={{ background: '#3b82f6', color: 'white' }}>
              <div className="stat-icon"><i className="fas fa-users"></i></div>
              <div className="stat-content">
                <div className="stat-value">{metrics.total_patients}</div>
                <div className="stat-label">Total Patients</div>
              </div>
            </div>
            <div className="stat-card" style={{ background: '#10b981', color: 'white' }}>
              <div className="stat-icon"><i className="fas fa-user-plus"></i></div>
              <div className="stat-content">
                <div className="stat-value">{metrics.new_patients_last_30_days}</div>
                <div className="stat-label">New (30 days)</div>
              </div>
            </div>
            <div className="stat-card" style={{ background: '#f59e0b', color: 'white' }}>
              <div className="stat-icon"><i className="fas fa-calendar-check"></i></div>
              <div className="stat-content">
                <div className="stat-value">{metrics.patients_with_active_appointments}</div>
                <div className="stat-label">Active Appointments</div>
              </div>
            </div>
            <div className="stat-card" style={{ background: '#ef4444', color: 'white' }}>
              <div className="stat-icon"><i className="fas fa-exclamation-triangle"></i></div>
              <div className="stat-content">
                <div className="stat-value">{metrics.patients_with_allergies}</div>
                <div className="stat-label">With Allergies</div>
              </div>
            </div>
          </div>
        )}

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
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => viewPatientDetails(patient.patient_id)}
                          title="View Complete Profile"
                          style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white', 
                            padding: '8px 14px', 
                            border: 'none', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                          }}
                        >
                          <i className="fas fa-user-circle"></i>
                          <span style={{ fontSize: '12px' }}>Profile</span>
                        </button>
                        <button 
                          onClick={async () => {
                            const appointments = await viewPatientAppointments(patient.patient_id);
                            setSelectedAppointments(appointments);
                            setSelectedPatientName(patient.full_name);
                            setShowAppointmentsModal(true);
                          }}
                          title="View All Appointments"
                          style={{ 
                            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                            color: 'white', 
                            padding: '8px 14px', 
                            border: 'none', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            boxShadow: '0 2px 8px rgba(17, 153, 142, 0.3)',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(17, 153, 142, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(17, 153, 142, 0.3)';
                          }}
                        >
                          <i className="fas fa-calendar-check"></i>
                          <span style={{ fontSize: '12px' }}>Appointments</span>
                        </button>
                        <button 
                          onClick={async () => {
                            const allergies = await viewPatientAllergies(patient.patient_id);
                            setSelectedAllergies(allergies);
                            setSelectedPatientName(patient.full_name);
                            setShowAllergiesModal(true);
                          }}
                          title="View Allergies & Medical Info"
                          style={{ 
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            color: 'white', 
                            padding: '8px 14px', 
                            border: 'none', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            boxShadow: '0 2px 8px rgba(245, 87, 108, 0.3)',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 87, 108, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 87, 108, 0.3)';
                          }}
                        >
                          <i className="fas fa-allergies"></i>
                          <span style={{ fontSize: '12px' }}>Allergies</span>
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

        {/* Complete Patient Details Modal */}
        {showDetailsModal && selectedPatient && (
          <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="modal-content" style={{ maxWidth: '1200px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Complete Patient Profile</h2>
                <button className="btn-close" onClick={() => setShowDetailsModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                {/* Patient Basic Info */}
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px', color: '#1e293b' }}><i className="fas fa-user"></i> Patient Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    <div><strong>Name:</strong> {selectedPatient.patient_info?.full_name}</div>
                    <div><strong>NIC:</strong> {selectedPatient.patient_info?.NIC}</div>
                    <div><strong>Email:</strong> {selectedPatient.patient_info?.email}</div>
                    <div><strong>Age:</strong> {selectedPatient.patient_info?.age} years</div>
                    <div><strong>Gender:</strong> {selectedPatient.patient_info?.gender}</div>
                    <div><strong>Blood Group:</strong> {selectedPatient.patient_info?.blood_group}</div>
                    <div><strong>Contact 1:</strong> {selectedPatient.patient_info?.contact_num1}</div>
                    <div><strong>Contact 2:</strong> {selectedPatient.patient_info?.contact_num2 || 'N/A'}</div>
                    <div><strong>Branch:</strong> {selectedPatient.patient_info?.registered_branch}</div>
                  </div>
                </div>

                {/* Statistics */}
                <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px', color: '#1e40af' }}><i className="fas fa-chart-bar"></i> Statistics</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', textAlign: 'center' }}>
                    <div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{selectedPatient.statistics?.total_appointments || 0}</div><div style={{ fontSize: '14px', color: '#64748b' }}>Appointments</div></div>
                    <div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{selectedPatient.statistics?.total_consultations || 0}</div><div style={{ fontSize: '14px', color: '#64748b' }}>Consultations</div></div>
                    <div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{selectedPatient.statistics?.total_prescriptions || 0}</div><div style={{ fontSize: '14px', color: '#64748b' }}>Prescriptions</div></div>
                    <div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{selectedPatient.statistics?.total_allergies || 0}</div><div style={{ fontSize: '14px', color: '#64748b' }}>Allergies</div></div>
                  </div>
                </div>

                {/* Allergies */}
                {selectedPatient.allergies?.length > 0 && (
                  <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '16px', color: '#92400e' }}><i className="fas fa-exclamation-triangle"></i> Allergies</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedPatient.allergies.map((allergy, idx) => (
                        <span key={idx} style={{ background: '#fed7aa', padding: '6px 12px', borderRadius: '6px', fontSize: '14px' }}>
                          {allergy.allergy_name} {allergy.severity && `(${allergy.severity})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Appointments */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px' }}><i className="fas fa-calendar-alt"></i> Recent Appointments ({selectedPatient.appointments?.length || 0})</h3>
                  {selectedPatient.appointments?.length > 0 ? (
                    <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                      <table className="staff-table" style={{ fontSize: '14px' }}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Doctor</th>
                            <th>Specialization</th>
                            <th>Status</th>
                            <th>Branch</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPatient.appointments.slice(0, 5).map((apt, idx) => (
                            <tr key={idx}>
                              <td>{apt.appointment_date} {apt.start_time}</td>
                              <td>{apt.doctor_name}</td>
                              <td>{apt.specialization || 'N/A'}</td>
                              <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: apt.status === 'Completed' ? '#d1fae5' : '#dbeafe', color: apt.status === 'Completed' ? '#065f46' : '#1e40af' }}>{apt.status}</span></td>
                              <td>{apt.branch_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>No appointments found</p>
                  )}
                </div>

                {/* Consultations */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px' }}><i className="fas fa-stethoscope"></i> Recent Consultations ({selectedPatient.consultations?.length || 0})</h3>
                  {selectedPatient.consultations?.length > 0 ? (
                    <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                      {selectedPatient.consultations.slice(0, 3).map((consult, idx) => (
                        <div key={idx} style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <strong>{consult.doctor_name}</strong>
                            <span style={{ color: '#64748b', fontSize: '14px' }}>{consult.consultation_date}</span>
                          </div>
                          <div><strong>Diagnosis:</strong> {consult.diagnoses || 'N/A'}</div>
                          {consult.treatment_plan && <div><strong>Treatment:</strong> {consult.treatment_plan}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>No consultations found</p>
                  )}
                </div>

                {/* Prescriptions */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px' }}><i className="fas fa-pills"></i> Recent Prescriptions ({selectedPatient.prescriptions?.length || 0})</h3>
                  {selectedPatient.prescriptions?.length > 0 ? (
                    <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                      {selectedPatient.prescriptions.slice(0, 5).map((rx, idx) => (
                        <div key={idx} style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px', marginBottom: '8px', borderLeft: '4px solid #3b82f6' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <strong>{rx.generic_name}</strong> ({rx.form})
                              <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                                {rx.dosage} - {rx.frequency}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>by {rx.doctor_name}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>No prescriptions found</p>
                  )}
                </div>

                {/* Billing Summary */}
                <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px' }}>
                  <h3 style={{ marginBottom: '16px', color: '#166534' }}><i className="fas fa-dollar-sign"></i> Billing Summary</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>
                        LKR {selectedPatient.statistics?.total_amount_invoiced?.toFixed(2) || '0.00'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>Total Invoiced</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                        LKR {selectedPatient.statistics?.total_amount_paid?.toFixed(2) || '0.00'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>Total Paid</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: selectedPatient.statistics?.outstanding_balance > 0 ? '#ef4444' : '#10b981' }}>
                        LKR {selectedPatient.statistics?.outstanding_balance?.toFixed(2) || '0.00'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>Outstanding</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '16px', fontSize: '14px', color: '#64748b' }}>
                    <div>Total Invoices: {selectedPatient.statistics?.total_invoices || 0}</div>
                    <div>Total Payments: {selectedPatient.statistics?.total_payments || 0}</div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-primary" onClick={() => setShowDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Modal */}
        {showAppointmentsModal && (
          <div className="modal-overlay" onClick={() => setShowAppointmentsModal(false)}>
            <div className="modal-content" style={{ maxWidth: '1000px', maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}>
                <h2><i className="fas fa-calendar-alt"></i> Appointments - {selectedPatientName}</h2>
                <button className="btn-close" onClick={() => setShowAppointmentsModal(false)} style={{ color: 'white' }}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                {selectedAppointments.length > 0 ? (
                  <>
                    <div style={{ marginBottom: '20px', padding: '16px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#065f46' }}>
                        Total Appointments: {selectedAppointments.length}
                      </div>
                      <div style={{ fontSize: '14px', color: '#064e3b', marginTop: '4px' }}>
                        Showing all appointments for this patient
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '16px' }}>
                      {selectedAppointments.map((apt, idx) => (
                        <div key={idx} style={{ 
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '20px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                            <div>
                              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                                Appointment #{apt.appointment_id?.substring(0, 8)}
                              </div>
                              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                <i className="fas fa-calendar"></i> {new Date(apt.appointment_date || apt.created_at).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </div>
                            </div>
                            <span style={{ 
                              padding: '6px 16px', 
                              borderRadius: '20px', 
                              fontSize: '12px',
                              fontWeight: '600',
                              background: apt.status === 'Completed' ? '#d1fae5' : 
                                         apt.status === 'Cancelled' ? '#fee2e2' : 
                                         apt.status === 'No-Show' ? '#fef3c7' : '#dbeafe',
                              color: apt.status === 'Completed' ? '#065f46' : 
                                     apt.status === 'Cancelled' ? '#991b1b' : 
                                     apt.status === 'No-Show' ? '#92400e' : '#1e40af'
                            }}>
                              {apt.status || 'Scheduled'}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                            <div>
                              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Time Slot</div>
                              <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                                <i className="fas fa-clock"></i> {apt.start_time || 'Not specified'}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Appointment Type</div>
                              <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                                <i className="fas fa-notes-medical"></i> {apt.appointment_type || 'General Consultation'}
                              </div>
                            </div>
                          </div>

                          {apt.notes && (
                            <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Notes</div>
                              <div style={{ fontSize: '14px', color: '#374151' }}>{apt.notes}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <i className="fas fa-calendar-times" style={{ fontSize: '48px', marginBottom: '16px', color: '#d1d5db' }}></i>
                    <p style={{ fontSize: '18px', fontWeight: '500' }}>No appointments found</p>
                    <p style={{ fontSize: '14px' }}>This patient hasn't scheduled any appointments yet.</p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-primary" onClick={() => setShowAppointmentsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Allergies Modal */}
        {showAllergiesModal && (
          <div className="modal-overlay" onClick={() => setShowAllergiesModal(false)}>
            <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <h2><i className="fas fa-allergies"></i> Allergies & Medical Info - {selectedPatientName}</h2>
                <button className="btn-close" onClick={() => setShowAllergiesModal(false)} style={{ color: 'white' }}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                {selectedAllergies.length > 0 ? (
                  <>
                    <div style={{ marginBottom: '20px', padding: '16px', background: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#92400e' }}>
                        <i className="fas fa-exclamation-triangle"></i> {selectedAllergies.length} Active Allerg{selectedAllergies.length === 1 ? 'y' : 'ies'} Found
                      </div>
                      <div style={{ fontSize: '14px', color: '#78350f', marginTop: '4px' }}>
                        Please review carefully before prescribing medication
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '16px' }}>
                      {selectedAllergies.map((allergy, idx) => (
                        <div key={idx} style={{ 
                          background: 'white',
                          border: '2px solid #fed7aa',
                          borderRadius: '12px',
                          padding: '20px',
                          boxShadow: '0 2px 4px rgba(245, 158, 11, 0.1)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.2)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(245, 158, 11, 0.1)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#92400e' }}>
                              <i className="fas fa-pills"></i> {allergy.allergy_name}
                            </div>
                            {allergy.severity && (
                              <span style={{ 
                                padding: '6px 16px', 
                                borderRadius: '20px', 
                                fontSize: '12px',
                                fontWeight: '600',
                                background: allergy.severity.toLowerCase() === 'high' ? '#fee2e2' : 
                                           allergy.severity.toLowerCase() === 'medium' ? '#fef3c7' : '#dbeafe',
                                color: allergy.severity.toLowerCase() === 'high' ? '#991b1b' : 
                                       allergy.severity.toLowerCase() === 'medium' ? '#92400e' : '#1e40af'
                              }}>
                                {allergy.severity} Severity
                              </span>
                            )}
                          </div>

                          {allergy.reaction && (
                            <div style={{ marginTop: '12px', padding: '12px', background: '#fef3c7', borderRadius: '8px' }}>
                              <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '4px', fontWeight: '600' }}>
                                <i className="fas fa-heartbeat"></i> Reaction
                              </div>
                              <div style={{ fontSize: '14px', color: '#78350f' }}>{allergy.reaction}</div>
                            </div>
                          )}

                          {allergy.notes && (
                            <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                                <i className="fas fa-sticky-note"></i> Additional Notes
                              </div>
                              <div style={{ fontSize: '14px', color: '#374151' }}>{allergy.notes}</div>
                            </div>
                          )}

                          {allergy.recorded_date && (
                            <div style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af' }}>
                              <i className="fas fa-calendar-plus"></i> Recorded: {new Date(allergy.recorded_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <i className="fas fa-check-circle" style={{ fontSize: '48px', marginBottom: '16px', color: '#10b981' }}></i>
                    <p style={{ fontSize: '18px', fontWeight: '500', color: '#10b981' }}>No allergies recorded</p>
                    <p style={{ fontSize: '14px' }}>This patient has no known allergies on file.</p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-primary" onClick={() => setShowAllergiesModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffPatients;
