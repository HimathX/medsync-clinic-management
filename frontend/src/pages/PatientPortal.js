// src/pages/PatientPortal.js - Patient Database Portal (Staff/Admin)
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import patientService from '../services/patientService';
import branchService from '../services/branchService';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorMessage from '../components/shared/ErrorMessage';
import StatCard from '../components/shared/StatCard';
import '../styles/patientPortal.css';

const PatientPortal = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [branches, setBranches] = useState(['All']);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterGender, setFilterGender] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(10);
  const [sortField, setSortField] = useState('full_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load patient data from backend
  useEffect(() => {
    fetchPatientsData();
  }, []);

  const fetchPatientsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch patients from backend
      const patientsData = await patientService.getAllPatients(0, 1000);
      const formattedPatients = (patientsData.patients || []).map(p => ({
        id: p.patient_id,
        firstName: p.full_name?.split(' ')[0] || 'Patient',
        lastName: p.full_name?.split(' ').slice(1).join(' ') || '',
        full_name: p.full_name || `Patient ${p.patient_id}`,
        email: p.email || 'N/A',
        phone: p.contact_num || 'N/A',
        dob: p.DOB || '1990-01-01',
        gender: p.gender || 'Other',
        branch: p.registered_branch || 'Main',
        insuranceProvider: p.insurance_provider || 'None',
        policyNumber: p.policy_number || 'N/A',
        registrationDate: p.registration_date || new Date().toISOString(),
        lastVisit: p.last_visit || new Date().toISOString(),
        emergencyName: p.emergency_contact_name || 'N/A'
      }));
      setPatients(formattedPatients);
      setFilteredPatients(formattedPatients);

      // Fetch branches
      const branchesData = await branchService.getAllBranches();
      setBranches(['All', ...(branchesData || []).map(b => b.branch_name)]);

    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search functionality
  useEffect(() => {
    let filtered = patients.filter(patient => {
      const matchesSearch = 
        patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm) ||
        patient.id.toString().includes(searchTerm);

      const matchesBranch = filterBranch === 'All' || patient.branch === filterBranch;
      const matchesGender = filterGender === 'All' || patient.gender === filterGender;
      
      return matchesSearch && matchesBranch && matchesGender;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a[sortField] > b[sortField] ? 1 : -1;
      } else {
        return a[sortField] < b[sortField] ? 1 : -1;
      }
    });

    setFilteredPatients(filtered);
    setCurrentPage(1);
  }, [patients, searchTerm, filterBranch, filterGender, sortField, sortOrder]);

  // Pagination
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return <LoadingSpinner message="Loading patient database..." />;
  }

  if (error) {
    return <ErrorMessage title="Error Loading Patients" message={error} onRetry={fetchPatientsData} />;
  }

  return (
    <div className="patient-portal">
      <div className="portal-header">
        <div className="header-content">
          <h1>Patient Database Portal</h1>
          <Link to="/staff/patients" className="btn secondary">
            ← Back to Patient Management
          </Link>
        </div>
      </div>

      {/* Search and Filter Section */}
      <section className="card section">
        <h3>Search & Filter Patients</h3>
        <div className="filter-controls">
          <div className="grid grid-4">
            <label className="label">
              Search
              <input
                className="input"
                type="text"
                placeholder="Search by name, ID, phone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </label>
            <label className="label">
              Branch
              <select
                className="select"
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
              >
                {branches.map(b => <option key={b}>{b}</option>)}
              </select>
            </label>
            <label className="label">
              Gender
              <select
                className="select"
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
              >
                <option>All</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </label>
            <div className="stats">
              <span className="stat-item">
                <strong>{filteredPatients.length}</strong> patients found
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Table */}
      <section className="card section">
        <div className="table-container">
          <table className="patient-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} className="sortable">
                  Patient ID {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('full_name')} className="sortable">
                  Name {sortField === 'full_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Age</th>
                <th onClick={() => handleSort('gender')} className="sortable">
                  Gender {sortField === 'gender' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Contact</th>
                <th onClick={() => handleSort('branch')} className="sortable">
                  Branch {sortField === 'branch' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Insurance</th>
                <th onClick={() => handleSort('registrationDate')} className="sortable">
                  Registered {sortField === 'registrationDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('lastVisit')} className="sortable">
                  Last Visit {sortField === 'lastVisit' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPatients.map((patient) => (
                <tr key={patient.id}>
                  <td className="patient-id">P-{patient.id}</td>
                  <td className="patient-name">
                    <div>
                      <strong>{patient.full_name}</strong>
                      <div className="email">{patient.email}</div>
                    </div>
                  </td>
                  <td>{calculateAge(patient.dob)}</td>
                  <td>
                    <span className={`gender-badge ${patient.gender.toLowerCase()}`}>
                      {patient.gender}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div>{patient.phone}</div>
                      <div className="emergency-contact">
                        Emergency: {patient.emergencyName}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`branch-badge ${patient.branch.toLowerCase()}`}>
                      {patient.branch}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div>{patient.insuranceProvider}</div>
                      <div className="policy-number">{patient.policyNumber}</div>
                    </div>
                  </td>
                  <td>{new Date(patient.registrationDate).toLocaleDateString()}</td>
                  <td>{new Date(patient.lastVisit).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn small primary" 
                        title="View Details"
                        onClick={() => navigate(`/staff/patients/${patient.id}`)}
                      >
                        👁️
                      </button>
                      <button 
                        className="btn small secondary" 
                        title="Edit"
                        onClick={() => navigate(`/staff/patients/${patient.id}/edit`)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn small" 
                        title="Medical History"
                        onClick={() => navigate(`/staff/patients/${patient.id}/records`)}
                      >
                        📋
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {indexOfFirstPatient + 1} to {Math.min(indexOfLastPatient, filteredPatients.length)} of {filteredPatients.length} patients
            </div>
            <div className="pagination-controls">
              <button
                className="btn small"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    className={`btn small ${currentPage === page ? 'primary' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                );
              })}
              {totalPages > 5 && <span>...</span>}
              <button
                className="btn small"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Summary Statistics */}
      <section className="section">
        <h3 style={{marginBottom: '20px'}}>Database Statistics</h3>
        <div className="grid grid-4">
          <StatCard 
            icon="👥"
            title="Total Patients"
            value={patients.length}
            color="var(--primary-black)"
          />
          <StatCard 
            icon="👨‍⚕️"
            title="Male"
            value={patients.filter(p => p.gender === 'Male').length}
            color="#3b82f6"
          />
          <StatCard 
            icon="👩‍⚕️"
            title="Female"
            value={patients.filter(p => p.gender === 'Female').length}
            color="#ec4899"
          />
          <StatCard 
            icon="🏥"
            title="Active Today"
            value={patients.filter(p => new Date(p.lastVisit).toDateString() === new Date().toDateString()).length}
            color="#10b981"
          />
        </div>
      </section>
    </div>
  );
};

export default PatientPortal;