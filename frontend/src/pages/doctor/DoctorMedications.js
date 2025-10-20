import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorHeader from '../../components/DoctorHeader';
import medicationService from '../../services/medicationService';
import '../../styles/doctor.css';

const DoctorMedications = () => {
  const navigate = useNavigate();
  
  const [medications, setMedications] = useState([]);
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterForm, setFilterForm] = useState('all');
  
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
      <div className="doctor-container">
        <DoctorHeader />
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '500' }}>Loading medications...</p>
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
            <h1><i className="fas fa-pills"></i> Medication Management</h1>
            <p>Add, edit, and manage medication database</p>
          </div>
          <button onClick={handleAddNew} className="btn-primary">
            <i className="fas fa-plus"></i> Add New Medication
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '24px' }}>
            <i className="fas fa-exclamation-circle"></i>
            {error}
            <button onClick={fetchMedications} className="btn-secondary">Retry</button>
          </div>
        )}

        {/* Filters */}
        <div className="filters-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label><i className="fas fa-search"></i> Search</label>
              <input
                type="text"
                placeholder="Search by name or manufacturer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label><i className="fas fa-filter"></i> Form Type</label>
              <select
                value={filterForm}
                onChange={(e) => setFilterForm(e.target.value)}
                className="form-control"
              >
                <option value="all">All Forms</option>
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Injection">Injection</option>
                <option value="Syrup">Syrup</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ opacity: 0 }}>Action</label>
              <button onClick={fetchMedications} className="btn-secondary" style={{ width: '100%' }}>
                <i className="fas fa-sync-alt"></i> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', borderRadius: '12px' }}>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>{medications.length}</div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>Total Medications</div>
          </div>
          <div style={{ padding: '16px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', borderRadius: '12px' }}>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>{filteredMedications.length}</div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>Filtered Results</div>
          </div>
        </div>

        {/* Medications Table */}
        {filteredMedications.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-pills" style={{ fontSize: '64px', color: '#cbd5e1', marginBottom: '16px' }}></i>
            <h3>No medications found</h3>
            <p>Try adjusting your search or add a new medication</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Generic Name</th>
                  <th>Manufacturer</th>
                  <th>Form</th>
                  <th>Contraindications</th>
                  <th>Side Effects</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedications.map((med) => (
                  <tr key={med.medication_id}>
                    <td><strong>{med.generic_name}</strong></td>
                    <td>{med.manufacturer}</td>
                    <td><span className="badge">{med.form}</span></td>
                    <td style={{ maxWidth: '200px', fontSize: '13px', color: '#64748b' }}>
                      {med.contraindications || '-'}
                    </td>
                    <td style={{ maxWidth: '200px', fontSize: '13px', color: '#64748b' }}>
                      {med.side_effects || '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(med)}
                          className="btn-small btn-primary"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(med)}
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
    </div>
  );
};

export default DoctorMedications;
