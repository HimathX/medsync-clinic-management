import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorNavBar from '../../components/DoctorNavBar';
import DoctorPageHeader from '../../components/DoctorPageHeader';
import medicationService from '../../services/medicationService';
import '../../styles/doctor.css';
import '../../styles/patientDashboard.css';

const DoctorMedications = () => {
  const navigate = useNavigate();
  
  const [medications, setMedications] = useState([]);
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterForm, setFilterForm] = useState('all');
  
  // Doctor data state
  const [doctorData, setDoctorData] = useState({
    name: 'Doctor',
    specialization: 'Physician'
  });
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'delete'
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    generic_name: '',
    manufacturer: '',
    form: 'Tablet',
    contraindications: '',
    side_effects: ''
  });

  useEffect(() => {
    // Load doctor data from localStorage
    const fullName = localStorage.getItem('full_name') || 'Doctor';
    setDoctorData({
      name: fullName,
      specialization: localStorage.getItem('specialization') || 'Physician'
    });
    
    fetchMedications();
  }, []);

  useEffect(() => {
    filterMedications();
  }, [medications, searchTerm, filterForm]);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Fetching medications...');
      const data = await medicationService.getAllMedications(0, 500);
      console.log('📦 Medications response:', data);
      
      // Handle different response structures
      let medList = [];
      if (Array.isArray(data)) {
        medList = data;
      } else if (data.medications && Array.isArray(data.medications)) {
        medList = data.medications;
      } else if (data.data && Array.isArray(data.data)) {
        medList = data.data;
      }
      
      console.log(`✅ Loaded ${medList.length} medications`);
      setMedications(medList);
    } catch (err) {
      console.error('❌ Failed to load medications:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(`Failed to load medications: ${err.response?.data?.detail || err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const filterMedications = () => {
    let filtered = [...medications];
    
    // Search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(med =>
        med.generic_name?.toLowerCase().includes(lower) ||
        med.manufacturer?.toLowerCase().includes(lower)
      );
    }
    
    // Form filter
    if (filterForm !== 'all') {
      filtered = filtered.filter(med => med.form === filterForm);
    }
    
    setFilteredMedications(filtered);
  };

  const handleAddNew = () => {
    setModalMode('add');
    setFormData({
      generic_name: '',
      manufacturer: '',
      form: 'Tablet',
      contraindications: '',
      side_effects: ''
    });
    setSelectedMedication(null);
    setShowModal(true);
  };

  const handleEdit = (medication) => {
    setModalMode('edit');
    setFormData({
      generic_name: medication.generic_name,
      manufacturer: medication.manufacturer,
      form: medication.form,
      contraindications: medication.contraindications || '',
      side_effects: medication.side_effects || ''
    });
    setSelectedMedication(medication);
    setShowModal(true);
  };

  const handleDelete = (medication) => {
    setModalMode('delete');
    setSelectedMedication(medication);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (modalMode === 'delete') {
      await handleConfirmDelete();
      return;
    }

    // Validation
    if (!formData.generic_name.trim() || !formData.manufacturer.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      if (modalMode === 'add') {
        await medicationService.createMedication(formData);
        alert('✅ Medication added successfully!');
      } else if (modalMode === 'edit') {
        await medicationService.updateMedication(selectedMedication.medication_id, formData);
        alert('✅ Medication updated successfully!');
      }
      
      setShowModal(false);
      fetchMedications();
    } catch (err) {
      console.error('Error saving medication:', err);
      alert(`❌ Failed to save medication: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setSaving(true);
      await medicationService.deleteMedication(selectedMedication.medication_id);
      alert('✅ Medication deleted successfully!');
      setShowModal(false);
      fetchMedications();
    } catch (err) {
      console.error('Error deleting medication:', err);
      alert(`❌ Failed to delete medication: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="patient-portal">
        <DoctorNavBar />
        <DoctorPageHeader doctorName={doctorData.name} specialization={doctorData.specialization} />
        <div className="patient-container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', paddingTop: '40px' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '500' }}>Loading medications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-portal">
      <DoctorNavBar />
      <DoctorPageHeader doctorName={doctorData.name} specialization={doctorData.specialization} />
      <main className="patient-container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        {/* Header */}
        <div style={{ 
          marginBottom: '32px', 
          background: 'rgba(255, 255, 255, 0.6)', 
          backdropFilter: 'blur(10px)', 
          padding: '32px', 
          borderRadius: '20px', 
          border: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '36px', 
              fontWeight: '800', 
              background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '32px' }}>💊</span>
              Medication Management
            </h1>
            <p style={{ fontSize: '16px', color: '#059669', fontWeight: '500' }}>Add, edit, and manage medication database</p>
          </div>
          <button onClick={handleAddNew} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            padding: '14px 28px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.3)';
          }}>
            <i className="fas fa-plus"></i>
            Add New Medication
          </button>
        </div>

        {error && (
          <div style={{ 
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '1px solid #fca5a5',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <i className="fas fa-exclamation-circle" style={{ fontSize: '20px', color: '#dc2626' }}></i>
              <span style={{ color: '#991b1b', fontWeight: '500' }}>{error}</span>
            </div>
            <button onClick={fetchMedications} style={{
              background: 'white',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>
              <i className="fas fa-redo" style={{ marginRight: '6px' }}></i>
              Retry
            </button>
          </div>
        )}

        {/* Filters */}
        <div style={{ 
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#475569'
              }}>
                <i className="fas fa-search" style={{ marginRight: '8px', color: '#10b981' }}></i>
                Search Medication
              </label>
              <input
                type="text"
                placeholder="Search by name or manufacturer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#475569'
              }}>
                <i className="fas fa-filter" style={{ marginRight: '8px', color: '#10b981' }}></i>
                Form Type
              </label>
              <select
                value={filterForm}
                onChange={(e) => setFilterForm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  cursor: 'pointer',
                  background: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              >
                <option value="all">All Forms</option>
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Injection">Injection</option>
                <option value="Syrup">Syrup</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', opacity: 0 }}>Action</label>
              <button 
                onClick={fetchMedications} 
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(99, 102, 241, 0.2)';
                }}
              >
                <i className="fas fa-sync-alt" style={{ marginRight: '8px' }}></i> 
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div style={{ 
            padding: '24px', 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
            color: 'white', 
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ 
              position: 'absolute', 
              top: '-20px', 
              right: '-20px', 
              fontSize: '100px', 
              opacity: '0.1' 
            }}>💊</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '14px', opacity: '0.9', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Total Medications</div>
              <div style={{ fontSize: '36px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {medications.length}
                <i className="fas fa-database" style={{ fontSize: '20px', opacity: '0.7' }}></i>
              </div>
            </div>
          </div>
          <div style={{ 
            padding: '24px', 
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
            color: 'white', 
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ 
              position: 'absolute', 
              top: '-20px', 
              right: '-20px', 
              fontSize: '100px', 
              opacity: '0.1' 
            }}>🔍</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '14px', opacity: '0.9', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Filtered Results</div>
              <div style={{ fontSize: '36px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {filteredMedications.length}
                <i className="fas fa-filter" style={{ fontSize: '20px', opacity: '0.7' }}></i>
              </div>
            </div>
          </div>
        </div>

        {/* Medications Table */}
        {filteredMedications.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 40px', 
            background: 'white', 
            borderRadius: '16px',
            border: '2px dashed #e2e8f0'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>💊</div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>No medications found</h3>
            <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '24px' }}>Try adjusting your search or add a new medication</p>
            <button onClick={handleAddNew} style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
              Add First Medication
            </button>
          </div>
        ) : (
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    <th style={{ 
                      padding: '16px 20px', 
                      textAlign: 'left', 
                      fontWeight: '700',
                      fontSize: '13px',
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Generic Name</th>
                    <th style={{ 
                      padding: '16px 20px', 
                      textAlign: 'left', 
                      fontWeight: '700',
                      fontSize: '13px',
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Manufacturer</th>
                    <th style={{ 
                      padding: '16px 20px', 
                      textAlign: 'left', 
                      fontWeight: '700',
                      fontSize: '13px',
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Form</th>
                    <th style={{ 
                      padding: '16px 20px', 
                      textAlign: 'left', 
                      fontWeight: '700',
                      fontSize: '13px',
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      width: '25%'
                    }}>Contraindications</th>
                    <th style={{ 
                      padding: '16px 20px', 
                      textAlign: 'left', 
                      fontWeight: '700',
                      fontSize: '13px',
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      width: '25%'
                    }}>Side Effects</th>
                    <th style={{ 
                      padding: '16px 20px', 
                      textAlign: 'center', 
                      fontWeight: '700',
                      fontSize: '13px',
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      width: '140px'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedications.map((med, index) => (
                    <tr key={med.medication_id} style={{ 
                      borderBottom: index < filteredMedications.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                      <td style={{ 
                        padding: '16px 20px',
                        fontWeight: '600',
                        color: '#1e293b',
                        fontSize: '15px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            width: '32px',
                            height: '32px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '16px'
                          }}>💊</span>
                          {med.generic_name}
                        </div>
                      </td>
                      <td style={{ 
                        padding: '16px 20px',
                        color: '#475569',
                        fontSize: '14px'
                      }}>{med.manufacturer}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                          color: '#0369a1',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          border: '1px solid #7dd3fc'
                        }}>{med.form}</span>
                      </td>
                      <td style={{ 
                        padding: '16px 20px',
                        fontSize: '13px', 
                        color: '#64748b',
                        lineHeight: '1.6'
                      }}>
                        {med.contraindications ? (
                          <div style={{ 
                            maxHeight: '60px', 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {med.contraindications}
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>No data</span>
                        )}
                      </td>
                      <td style={{ 
                        padding: '16px 20px',
                        fontSize: '13px', 
                        color: '#64748b',
                        lineHeight: '1.6'
                      }}>
                        {med.side_effects ? (
                          <div style={{ 
                            maxHeight: '60px', 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {med.side_effects}
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>No data</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEdit(med)}
                            style={{
                              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            title="Edit medication details"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
                            }}
                          >
                            <i className="fas fa-edit"></i>
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(med)}
                            style={{
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            title="Delete medication"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
                            }}
                          >
                            <i className="fas fa-trash-alt"></i>
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#1e293b' }}>
              {modalMode === 'add' && <><i className="fas fa-plus"></i> Add New Medication</>}
              {modalMode === 'edit' && <><i className="fas fa-edit"></i> Edit Medication</>}
              {modalMode === 'delete' && <><i className="fas fa-trash"></i> Delete Medication</>}
            </h2>

            {modalMode === 'delete' ? (
              <div>
                <p style={{ marginBottom: '20px', color: '#64748b' }}>
                  Are you sure you want to delete <strong>{selectedMedication?.generic_name}</strong>?
                  This action cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowModal(false)} className="btn-secondary" disabled={saving}>
                    Cancel
                  </button>
                  <button onClick={handleConfirmDelete} className="btn-danger" disabled={saving}>
                    {saving ? <><i className="fas fa-spinner fa-spin"></i> Deleting...</> : 'Delete'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Generic Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    value={formData.generic_name}
                    onChange={(e) => setFormData({...formData, generic_name: e.target.value})}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Manufacturer <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Form <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    value={formData.form}
                    onChange={(e) => setFormData({...formData, form: e.target.value})}
                    className="form-control"
                    required
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Injection">Injection</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Contraindications</label>
                  <textarea
                    value={formData.contraindications}
                    onChange={(e) => setFormData({...formData, contraindications: e.target.value})}
                    className="form-control"
                    rows="3"
                    placeholder="e.g., Severe liver disease, chronic alcoholism"
                  />
                </div>

                <div className="form-group">
                  <label>Side Effects</label>
                  <textarea
                    value={formData.side_effects}
                    onChange={(e) => setFormData({...formData, side_effects: e.target.value})}
                    className="form-control"
                    rows="3"
                    placeholder="e.g., Nausea, rash, dizziness"
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? (
                      <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                    ) : (
                      <><i className="fas fa-save"></i> {modalMode === 'add' ? 'Add' : 'Update'}</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      </main>
    </div>
  );
};

export default DoctorMedications;
