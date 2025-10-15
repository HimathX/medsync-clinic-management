import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import patientDataService from '../services/patientDataService';
import '../styles/patientPortal.css';

const PatientPortal = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterGender, setFilterGender] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(10);
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  // Load patient data from service
  useEffect(() => {
    const patientData = patientDataService.getAllPatients();
    setPatients(patientData);
    setFilteredPatients(patientData);
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = patients.filter(patient => {
      const matchesSearch = 
        patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase());
      
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
    return patientDataService.calculateAge(dob);
  };

  return (
    <div className="patient-portal">
      <div className="portal-header">
        <div className="header-content">
          <h1>Patient Database Portal</h1>
          <Link to="/patients" className="btn secondary">
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
                <option>All</option>
                <option>Colombo</option>
                <option>Kandy</option>
                <option>Galle</option>
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
                <th onClick={() => handleSort('firstName')} className="sortable">
                  Name {sortField === 'firstName' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                  <td className="patient-id">{patient.id}</td>
                  <td className="patient-name">
                    <div>
                      <strong>{patient.firstName} {patient.lastName}</strong>
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
                      <Link to={`/patient/${patient.id}`} className="btn small primary" title="View Details">
                        👁️
                      </Link>
                      <button className="btn small secondary" title="Edit">
                        ✏️
                      </button>
                      <button className="btn small" title="Medical History">
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
      <section className="card section">
        <h3>Database Statistics</h3>
        <div className="grid grid-4">
          <div className="stat-card">
            <div className="stat-number">{patients.length}</div>
            <div className="stat-label">Total Patients</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {patients.filter(p => p.branch === 'Colombo').length}
            </div>
            <div className="stat-label">Colombo Branch</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {patients.filter(p => p.branch === 'Kandy').length}
            </div>
            <div className="stat-label">Kandy Branch</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {patients.filter(p => p.branch === 'Galle').length}
            </div>
            <div className="stat-label">Galle Branch</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PatientPortal;