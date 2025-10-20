import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorNavBar from '../../components/DoctorNavBar';
import DoctorPageHeader from '../../components/DoctorPageHeader';
import treatmentCatalogueService from '../../services/treatmentCatalogueService';
import '../../styles/doctor.css';
import '../../styles/patientDashboard.css';

const DoctorTreatmentManagement = () => {
  const navigate = useNavigate();
  
  const [treatments, setTreatments] = useState([]);
  const [filteredTreatments, setFilteredTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Doctor data state
  const [doctorData, setDoctorData] = useState({
    name: 'Doctor',
    specialization: 'Physician'
  });
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'delete'
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    treatment_name: '',
    base_price: '',
    duration: '00:30:00',
    description: ''
  });

  useEffect(() => {
    // Load doctor data from localStorage
    const fullName = localStorage.getItem('full_name') || 'Doctor';
    setDoctorData({
      name: fullName,
      specialization: localStorage.getItem('specialization') || 'Physician'
    });
    
    fetchTreatments();
  }, []);

  useEffect(() => {
    filterTreatments();
  }, [treatments, searchTerm, minPrice, maxPrice]);

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Fetching treatments...');
      const data = await treatmentCatalogueService.getAllTreatments(0, 500);
      console.log('📦 Treatments response:', data);
      
      // Handle different response structures
      let treatmentList = [];
      if (Array.isArray(data)) {
        treatmentList = data;
      } else if (data.treatments && Array.isArray(data.treatments)) {
        treatmentList = data.treatments;
      } else if (data.data && Array.isArray(data.data)) {
        treatmentList = data.data;
      }
      
      console.log(`✅ Loaded ${treatmentList.length} treatments`);
      setTreatments(treatmentList);
    } catch (err) {
      console.error('❌ Failed to load treatments:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(`Failed to load treatments: ${err.response?.data?.detail || err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const filterTreatments = () => {
    let filtered = [...treatments];
    
    // Search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(treatment =>
        treatment.treatment_name?.toLowerCase().includes(lower) ||
        treatment.service_name?.toLowerCase().includes(lower) ||
        treatment.description?.toLowerCase().includes(lower)
      );
    }
    
    // Price filter
    if (minPrice) {
      filtered = filtered.filter(treatment => treatment.base_price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter(treatment => treatment.base_price <= parseFloat(maxPrice));
    }
    
    setFilteredTreatments(filtered);
  };

  const handleAddNew = () => {
    setModalMode('add');
    setFormData({
      treatment_name: '',
      base_price: '',
      duration: '00:30:00',
      description: ''
    });
    setSelectedTreatment(null);
    setShowModal(true);
  };

  const handleEdit = (treatment) => {
    setModalMode('edit');
    setFormData({
      treatment_name: treatment.treatment_name || treatment.service_name,
      base_price: treatment.base_price.toString(),
      duration: treatment.duration || '00:30:00',
      description: treatment.description || ''
    });
    setSelectedTreatment(treatment);
    setShowModal(true);
  };

  const handleDelete = (treatment) => {
    setModalMode('delete');
    setSelectedTreatment(treatment);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (modalMode === 'delete') {
      await handleConfirmDelete();
      return;
    }

    // Validation
    if (!formData.treatment_name.trim() || !formData.base_price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      const submitData = {
        treatment_name: formData.treatment_name.trim(),
        base_price: parseFloat(formData.base_price),
        duration: formData.duration,
        description: formData.description.trim()
      };

      if (modalMode === 'add') {
        await treatmentCatalogueService.createTreatment(submitData);
        alert('✅ Treatment added successfully!');
      } else if (modalMode === 'edit') {
        await treatmentCatalogueService.updateTreatment(
          selectedTreatment.treatment_service_code,
          submitData
        );
        alert('✅ Treatment updated successfully!');
      }
      
      setShowModal(false);
      fetchTreatments();
    } catch (err) {
      console.error('Error saving treatment:', err);
      alert(`❌ Failed to save treatment: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setSaving(true);
      await treatmentCatalogueService.deleteTreatment(selectedTreatment.treatment_service_code);
      alert('✅ Treatment deleted successfully!');
      setShowModal(false);
      fetchTreatments();
    } catch (err) {
      console.error('Error deleting treatment:', err);
      alert(`❌ Failed to delete treatment: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', { 
      style: 'currency', 
      currency: 'LKR' 
    }).format(price || 0);
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    if (typeof duration === 'string') {
      const parts = duration.split(':');
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes} min`;
    }
    return duration;
  };

  if (loading) {
    return (
      <div className="patient-portal">
        <DoctorNavBar />
        <DoctorPageHeader doctorName={doctorData.name} specialization={doctorData.specialization} />
        <div className="patient-container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', paddingTop: '40px' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '500' }}>Loading treatments...</p>
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
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '48px' }}>💊</div>
            <div>
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: '700',
                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '8px'
              }}>
                Treatment Management
              </h1>
              <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
                Add, edit, and manage treatment catalogue
              </p>
            </div>
          </div>
          <button 
            onClick={handleAddNew}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.2)';
            }}
          >
            <i className="fas fa-plus"></i> Add New Treatment
          </button>
        </div>

        {error && (
          <div style={{
            padding: '16px 20px',
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid #fca5a5',
            borderRadius: '12px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <i className="fas fa-exclamation-circle" style={{ fontSize: '20px', color: '#ef4444' }}></i>
              <span style={{ fontWeight: '600' }}>{error}</span>
            </div>
            <button 
              onClick={fetchTreatments}
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#475569'
              }}>
                <i className="fas fa-search" style={{ marginRight: '8px', color: '#10b981' }}></i>
                Search Treatment
              </label>
              <input
                type="text"
                placeholder="Search by name or description..."
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
                <i className="fas fa-dollar-sign" style={{ marginRight: '8px', color: '#10b981' }}></i>
                Min Price (LKR)
              </label>
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
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
                <i className="fas fa-dollar-sign" style={{ marginRight: '8px', color: '#10b981' }}></i>
                Max Price (LKR)
              </label>
              <input
                type="number"
                placeholder="100000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
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
              <label style={{ display: 'block', marginBottom: '8px', opacity: 0 }}>Action</label>
              <button 
                onClick={fetchTreatments}
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
              <div style={{ fontSize: '14px', opacity: '0.9', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Total Treatments</div>
              <div style={{ fontSize: '36px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {treatments.length}
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
                {filteredTreatments.length}
                <i className="fas fa-filter" style={{ fontSize: '20px', opacity: '0.7' }}></i>
              </div>
            </div>
          </div>
        </div>

        {/* Treatments Table */}
        {filteredTreatments.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 40px', 
            background: 'white', 
            borderRadius: '16px',
            border: '2px dashed #e2e8f0'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>💊</div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>No treatments found</h3>
            <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '24px' }}>Try adjusting your search or add a new treatment</p>
            <button onClick={handleAddNew} style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
              Add New Treatment
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
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    <th style={{ 
                      padding: '16px 20px', 
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Treatment Name</th>
                    <th style={{ 
                      padding: '16px 20px', 
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Price</th>
                    <th style={{ 
                      padding: '16px 20px', 
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Duration</th>
                    <th style={{ 
                      padding: '16px 20px', 
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Description</th>
                    <th style={{ 
                      padding: '16px 20px', 
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTreatments.map((treatment) => (
                    <tr 
                      key={treatment.treatment_service_code}
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ 
                        padding: '16px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>💊</span>
                          <span>{treatment.treatment_name || treatment.service_name}</span>
                        </div>
                      </td>
                      <td style={{ 
                        padding: '16px 20px',
                        color: '#10b981',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {formatPrice(treatment.base_price)}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                          color: '#0369a1',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          border: '1px solid #7dd3fc',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <i className="fas fa-clock" style={{ fontSize: '11px' }}></i>
                          {formatDuration(treatment.duration)}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '16px 20px',
                        fontSize: '13px',
                        color: '#64748b',
                        maxWidth: '300px'
                      }}>
                        {treatment.description ? (
                          <div style={{ 
                            maxHeight: '60px', 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {treatment.description}
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>No description</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEdit(treatment)}
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
                            title="Edit treatment details"
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
                            onClick={() => handleDelete(treatment)}
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
                            title="Delete treatment"
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
              {modalMode === 'add' && <><i className="fas fa-plus"></i> Add New Treatment</>}
              {modalMode === 'edit' && <><i className="fas fa-edit"></i> Edit Treatment</>}
              {modalMode === 'delete' && <><i className="fas fa-trash"></i> Delete Treatment</>}
            </h2>

            {modalMode === 'delete' ? (
              <div>
                <p style={{ marginBottom: '20px', color: '#64748b' }}>
                  Are you sure you want to delete <strong>{selectedTreatment?.treatment_name || selectedTreatment?.service_name}</strong>?
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
                  <label>Treatment Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    value={formData.treatment_name}
                    onChange={(e) => setFormData({...formData, treatment_name: e.target.value})}
                    className="form-control"
                    placeholder="e.g., X-Ray Chest"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Base Price (LKR) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                    className="form-control"
                    placeholder="e.g., 1500.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Duration (HH:MM:SS) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="form-control"
                    placeholder="e.g., 00:30:00"
                    pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
                    required
                  />
                  <small style={{ color: '#64748b', fontSize: '12px' }}>Format: HH:MM:SS (e.g., 00:30:00 for 30 minutes)</small>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="form-control"
                    rows="4"
                    placeholder="Describe the treatment..."
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

export default DoctorTreatmentManagement;
