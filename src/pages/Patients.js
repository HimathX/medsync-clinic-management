import React, { useState } from 'react';

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
    // Mock search
    setPatientData([{ id: 1, name: 'John Doe', phone: '123456' }]);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.dob) {
      setError('Required fields missing');
      return;
    }
    // Mock register
    alert('Patient Registered');
    setFormData({ ...formData, firstName: '' }); // Reset
  };

  const handleUpdate = () => {
    // Mock update
    alert('Patient Updated');
  };

  const viewPatient = (patient) => {
    setSelectedPatient(patient);
  };

  return (
    <div>
      <h1>Patient Management</h1>
      {/* Universal Search */}
      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by ID, Name, Phone, Insurance" aria-label="Patient Search" />
      <button onClick={handleSearch}>Search</button>
      {patientData.map((p) => (
        <div key={p.id} onClick={() => viewPatient(p)}>{p.name}</div>
      ))}

      {/* Registration Form */}
      <form onSubmit={handleRegister}>
        <h2>Register New Patient</h2>
        <input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} placeholder="First Name" required />
        <input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} placeholder="Last Name" required />
        <input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} placeholder="DOB" required />
        <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
        <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Phone" />
        <input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Email" />
        <input value={formData.emergencyName} onChange={(e) => setFormData({...formData, emergencyName: e.target.value})} placeholder="Emergency Contact Name" />
        <input value={formData.emergencyNumber} onChange={(e) => setFormData({...formData, emergencyNumber: e.target.value})} placeholder="Emergency Contact Number" />
        <select value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})}>
          <option>Colombo</option>
          <option>Kandy</option>
          <option>Galle</option>
        </select>
        <input value={formData.insuranceProvider} onChange={(e) => setFormData({...formData, insuranceProvider: e.target.value})} placeholder="Insurance Provider" />
        <input value={formData.policyNumber} onChange={(e) => setFormData({...formData, policyNumber: e.target.value})} placeholder="Policy Number" />
        {error && <div className="error">{error}</div>}
        <button type="submit">Register</button>
      </form>

      {/* Profile View with Tabs */}
      {selectedPatient && (
        <div>
          <h2>Patient Profile: {selectedPatient.name}</h2>
          <nav>
            <button onClick={() => setActiveTab('Personal')}>Personal</button>
            <button onClick={() => setActiveTab('Medical')}>Medical</button>
            <button onClick={() => setActiveTab('Insurance')}>Insurance</button>
            <button onClick={() => setActiveTab('History')}>History</button>
          </nav>
          <div className="tab-content">
            {activeTab === 'Personal' && <p>Personal Details: Name, DOB, etc. (Edit form here)</p>}
            {activeTab === 'Medical' && <p>Medical History (Mock)</p>}
            {activeTab === 'Insurance' && <p>Insurance Details (Mock)</p>}
            {activeTab === 'History' && <p>Appointment/Treatment History (Chronological)</p>}
          </div>
          <button onClick={handleUpdate}>Update Profile</button>
        </div>
      )}
    </div>
  );
};

export default Patients;