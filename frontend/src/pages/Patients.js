import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import patientService from '../services/patientService';
import '../styles/patientPortal.css';

const Patients = ({ role }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patientData, setPatientData] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', dob: '', gender: '', phone: '', email: '', nic: '',
    emergencyName: '', emergencyNumber: '', branch: 'Colombo', insuranceProvider: '', policyNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Personal');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setPatientData([]);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Try searching by NIC first
      if (searchQuery.length === 10 || searchQuery.length === 12) {
        try {
          const result = await patientService.searchByNIC(searchQuery);
          if (result && result.user) {
            setPatientData([{
              id: result.user.user_id,
              name: result.user.full_name,
              phone: result.user.contact_id || 'N/A',
              patient: result
            }]);
            return;
          }
        } catch (nicError) {
          // NIC not found, continue to general search
        }
      }

      // Fall back to getting all patients and filtering locally
      const data = await patientService.getAllPatients(0, 100);
      const filtered = (data.patients || []).filter(p => {
        const searchLower = searchQuery.toLowerCase();
        return (
          p.patient_id?.toString().includes(searchLower) ||
          p.user_id?.toString().includes(searchLower)
        );
      });
      
      setPatientData(filtered.map(p => ({
        id: p.patient_id,
        name: p.user_id || 'Unknown',
        phone: 'N/A',
        patient: p
      })));
    } catch (err) {
      setError(err.message || 'Failed to search patients');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.dob) {
      setError('First Name, Last Name, and Date of Birth are required');
      return;
    }
    
    if (!formData.nic) {
      setError('NIC is required for registration');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const registrationData = {
        full_name: `${formData.firstName} ${formData.lastName}`,
        NIC: formData.nic,
        email: formData.email || `${formData.firstName.toLowerCase()}@temp.com`,
        gender: formData.gender,
        DOB: formData.dob,
        password: 'defaultPassword123', // You may want to generate this or ask for it
        contact_num1: formData.phone,
        contact_num2: formData.emergencyNumber || '',
        address_line1: '',
        address_line2: '',
        city: formData.branch,
        province: 'Western',
        postal_code: '00000',
        country: 'Sri Lanka',
        blood_group: 'O+',
        registered_branch_name: formData.branch
      };

      const result = await patientService.registerPatient(registrationData);
      
      if (result.success) {
        alert(`Patient Registered Successfully! Patient ID: ${result.patient_id}`);
        
        // Reset form
        setFormData({
          firstName: '', lastName: '', dob: '', gender: 'Male', phone: '', email: '', nic: '',
          emergencyName: '', emergencyNumber: '', branch: 'Colombo', 
          insuranceProvider: '', policyNumber: ''
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to register patient. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    // Mock update
    alert('Patient Updated');
  };

  const viewPatient = (patientData) => {
    setSelectedPatient(patientData.patient || patientData);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Patient Management</h1>
        <div className="header-actions">
          <Link to="/patient-portal" className="btn primary">
            📊 View Patient Database
          </Link>
        </div>
      </div>

      {/* Universal Search */}
      <section className="card section">
        <div className="grid" style={{gridTemplateColumns:"1fr auto"}}>
          <input className="input" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by ID, Name, Phone, Insurance" aria-label="Patient Search" />
          <button className="btn" onClick={handleSearch}>Search</button>
        </div>
        <div className="section">
          {patientData.map((p) => (
            <div key={p.id} className="btn" style={{display:"inline-flex", marginRight:8}} onClick={() => viewPatient(p)}>{p.name}</div>
          ))}
        </div>
      </section>

      {/* Registration Form */}
      <section className="card section">
        <h2>Register New Patient</h2>
        <form onSubmit={handleRegister} className="form">
          <div className="grid grid-2">
            <label className="label">First Name
              <input className="input" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} placeholder="First Name" required />
            </label>
            <label className="label">Last Name
              <input className="input" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} placeholder="Last Name" required />
            </label>
          </div>
          <div className="grid">
            <label className="label">NIC (National Identity Card)
              <input className="input" value={formData.nic} onChange={(e) => setFormData({...formData, nic: e.target.value})} placeholder="NIC Number" required />
            </label>
          </div>
          <div className="grid grid-3" style={{gridTemplateColumns:"1fr 1fr 1fr"}}>
            <label className="label">Date of Birth
              <input className="input" type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} placeholder="DOB" required />
            </label>
            <label className="label">Gender
              <select className="select" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </label>
            <label className="label">Branch
              <select className="select" value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})}>
                <option>Colombo</option>
                <option>Kandy</option>
                <option>Galle</option>
              </select>
            </label>
          </div>
          <div className="grid grid-2">
            <label className="label">Phone
              <input className="input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Phone" />
            </label>
            <label className="label">Email
              <input className="input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Email" />
            </label>
          </div>
          <div className="grid grid-2">
            <label className="label">Emergency Contact Name
              <input className="input" value={formData.emergencyName} onChange={(e) => setFormData({...formData, emergencyName: e.target.value})} placeholder="Contact Name" />
            </label>
            <label className="label">Emergency Contact Number
              <input className="input" value={formData.emergencyNumber} onChange={(e) => setFormData({...formData, emergencyNumber: e.target.value})} placeholder="Contact Number" />
            </label>
          </div>
          <div className="grid grid-2">
            <label className="label">Insurance Provider
              <input className="input" value={formData.insuranceProvider} onChange={(e) => setFormData({...formData, insuranceProvider: e.target.value})} placeholder="Insurance Provider" />
            </label>
            <label className="label">Policy Number
              <input className="input" value={formData.policyNumber} onChange={(e) => setFormData({...formData, policyNumber: e.target.value})} placeholder="Policy Number" />
            </label>
          </div>
          {error && <div className="error" style={{padding: '10px', background: '#fee', border: '1px solid red', borderRadius: '4px', marginTop: '10px'}}>{error}</div>}
          {loading && <div style={{padding: '10px', background: '#e3f2fd', borderRadius: '4px', marginTop: '10px'}}>Processing...</div>}
          <div className="grid" style={{gridTemplateColumns:"1fr auto"}}>
            <div></div>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </section>

      {/* Profile View with Tabs */}
      {selectedPatient && (
        <section className="card section">
          <h2>Patient Profile: {selectedPatient.firstName ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : selectedPatient.name}</h2>
          <nav className="section" style={{display:"flex", gap:8}}>
            <button className={"btn" + (activeTab==='Personal'?" primary":"")} onClick={() => setActiveTab('Personal')}>Personal</button>
            <button className={"btn" + (activeTab==='Medical'?" primary":"")} onClick={() => setActiveTab('Medical')}>Medical</button>
            <button className={"btn" + (activeTab==='Insurance'?" primary":"")} onClick={() => setActiveTab('Insurance')}>Insurance</button>
            <button className={"btn" + (activeTab==='History'?" primary":"")} onClick={() => setActiveTab('History')}>History</button>
          </nav>
          <div className="section">
            {activeTab === 'Personal' && <p>Personal Details: Name, DOB, etc. (Edit form here)</p>}
            {activeTab === 'Medical' && <p>Medical History (Mock)</p>}
            {activeTab === 'Insurance' && <p>Insurance Details (Mock)</p>}
            {activeTab === 'History' && <p>Appointment/Treatment History (Chronological)</p>}
          </div>
          <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
            <button className="btn" onClick={handleUpdate}>Update Profile</button>
          </div>
        </section>
      )}
    </div>
  );
};

export default Patients;