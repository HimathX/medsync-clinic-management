import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import patientDataService from '../services/patientDataService';
import '../styles/patientPortal.css';

const Patients = ({ role }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patientData, setPatientData] = useState([]); // Mock patients
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', dob: '', gender: '', phone: '', email: '',
    emergencyName: '', emergencyNumber: '', branch: 'Colombo', insuranceProvider: '', policyNumber: ''
  });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Personal');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const results = patientDataService.searchPatients(searchQuery);
      setPatientData(results.map(p => ({ 
        id: p.id, 
        name: `${p.firstName} ${p.lastName}`, 
        phone: p.phone,
        patient: p 
      })));
    } else {
      setPatientData([]);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.dob) {
      setError('First Name, Last Name, and Date of Birth are required');
      return;
    }
    
    try {
      const newPatient = patientDataService.addPatient(formData);
      alert(`Patient Registered Successfully! Patient ID: ${newPatient.id}`);
      
      // Reset form
      setFormData({
        firstName: '', lastName: '', dob: '', gender: 'Male', phone: '', email: '',
        emergencyName: '', emergencyNumber: '', branch: 'Colombo', 
        insuranceProvider: '', policyNumber: ''
      });
      setError('');
    } catch (err) {
      setError('Failed to register patient. Please try again.');
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
          {error && <div className="error">{error}</div>}
          <div className="grid" style={{gridTemplateColumns:"1fr auto"}}>
            <div></div>
            <button type="submit" className="btn primary">Register</button>
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