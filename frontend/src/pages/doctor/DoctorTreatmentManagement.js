import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorHeader from '../../components/DoctorHeader';
import treatmentCatalogueService from '../../services/treatmentCatalogueService';
import '../../styles/doctor.css';

const DoctorTreatmentManagement = () => {
  const navigate = useNavigate();
  
  const [treatments, setTreatments] = useState([]);
  const [filteredTreatments, setFilteredTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
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
      <div className="doctor-container">
        <DoctorHeader />
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '500' }}>Loading treatments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-container">
      <DoctorHeader />
      <div className="doctor-content">
        {/* Header */}
        <div className="doctor-header" style={{ marginBottom: '24px' }}>
          <div>
            <h1><i className="fas fa-heartbeat"></i> Treatment Management</h1>
            <p>Add, edit, and manage treatment catalogue</p>
          </div>
          <button onClick={handleAddNew} className="btn-primary">
            <i className="fas fa-plus"></i> Add New Treatment
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '24px' }}>
            <i className="fas fa-exclamation-circle"></i>
            {error}
            <button onClick={fetchTreatments} className="btn-secondary">Retry</button>
          </div>
        )}

        {/* Filters */}
        <div className="filters-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label><i className="fas fa-search"></i> Search</label>
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label><i className="fas fa-dollar-sign"></i> Min Price (LKR)</label>
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label><i className="fas fa-dollar-sign"></i> Max Price (LKR)</label>
              <input
                type="number"
                placeholder="100000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label style={{ opacity: 0 }}>Action</label>
              <button onClick={fetchTreatments} className="btn-secondary" style={{ width: '100%' }}>
                <i className="fas fa-sync-alt"></i> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', borderRadius: '12px' }}>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>{treatments.length}</div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>Total Treatments</div>
          </div>
          <div style={{ padding: '16px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', borderRadius: '12px' }}>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>{filteredTreatments.length}</div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>Filtered Results</div>
          </div>
        </div>

        {/* Treatments Table */}
        {filteredTreatments.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-heartbeat" style={{ fontSize: '64px', color: '#cbd5e1', marginBottom: '16px' }}></i>
            <h3>No treatments found</h3>
            <p>Try adjusting your search or add a new treatment</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Treatment Name</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTreatments.map((treatment) => (
                  <tr key={treatment.treatment_service_code}>
                    <td><strong>{treatment.treatment_name || treatment.service_name}</strong></td>
                    <td style={{ color: '#10b981', fontWeight: '600' }}>{formatPrice(treatment.base_price)}</td>
                    <td><span className="badge">{formatDuration(treatment.duration)}</span></td>
                    <td style={{ maxWidth: '300px', fontSize: '13px', color: '#64748b' }}>
                      {treatment.description || '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(treatment)}
                          className="btn-small btn-primary"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(treatment)}
                          className="btn-small btn-danger"
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
    </div>
  );
};

export default DoctorTreatmentManagement;
