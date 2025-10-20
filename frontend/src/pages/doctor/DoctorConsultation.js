import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DoctorHeader from '../../components/DoctorHeader';
import appointmentService from '../../services/appointmentService';
import consultationService from '../../services/consultationService';
import medicationService from '../../services/medicationService';
import treatmentCatalogueService from '../../services/treatmentCatalogueService';
import '../../styles/doctor.css';

const DoctorConsultation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointment');

  // State for appointment details
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Consultation form state
  const [symptoms, setSymptoms] = useState('');
  const [diagnoses, setDiagnoses] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  // Prescription state
  const [medications, setMedications] = useState([]);
  const [medicationSearch, setMedicationSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  // Treatment state
  const [treatments, setTreatments] = useState([]);
  const [treatmentSearch, setTreatmentSearch] = useState('');
  const [treatmentResults, setTreatmentResults] = useState([]);
  const [selectedTreatments, setSelectedTreatments] = useState([]);

  // Load appointment details
  useEffect(() => {
    if (!appointmentId) {
      setError('No appointment ID provided');
      setLoading(false);
      return;
    }
    fetchAppointmentDetails();
    loadMedications();
    loadTreatments();
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAppointmentById(appointmentId);
      console.log('Appointment data:', data);
      
      // Handle nested response structure
      const appointmentData = data.appointment || data;
      setAppointment(appointmentData);
      
      // Check if consultation already exists
      try {
        const existing = await consultationService.getConsultationByAppointment(appointmentId);
        if (existing) {
          alert('A consultation record already exists for this appointment.');
          navigate('/doctor/appointments');
        }
      } catch (err) {
        // No existing consultation, proceed
        console.log('No existing consultation found, can proceed');
      }
    } catch (err) {
      setError('Failed to load appointment details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMedications = async () => {
    try {
      const data = await medicationService.getAllMedications(0, 500);
      setMedications(data.medications || data);
    } catch (err) {
      console.error('Failed to load medications:', err);
    }
  };

  const loadTreatments = async () => {
    try {
      const data = await treatmentCatalogueService.getAllTreatments(0, 500);
      setTreatments(data.treatments || data);
    } catch (err) {
      console.error('Failed to load treatments:', err);
    }
  };

  // Medication search
  const handleMedicationSearch = (query) => {
    setMedicationSearch(query);
    if (!query) {
      setSearchResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = medications.filter(med =>
      med.generic_name?.toLowerCase().includes(lowerQuery) ||
      med.manufacturer?.toLowerCase().includes(lowerQuery)
    );
    setSearchResults(results);
  };

  // Add medication to prescription
  const addMedicationToPrescription = (medication) => {
    setPrescriptions([...prescriptions, {
      medication_id: medication.medication_id,
      medication_name: medication.generic_name,
      manufacturer: medication.manufacturer,
      form: medication.form,
      dosage: '',
      frequency: 'Twice daily',
      duration_days: 7,
      instructions: ''
    }]);
    setMedicationSearch('');
    setSearchResults([]);
  };

  // Update prescription item
  const updatePrescription = (index, field, value) => {
    const updated = [...prescriptions];
    updated[index][field] = value;
    setPrescriptions(updated);
  };

  // Remove prescription item
  const removePrescription = (index) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  // Treatment search
  const handleTreatmentSearch = (query) => {
    setTreatmentSearch(query);
    if (!query) {
      setTreatmentResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = treatments.filter(treatment =>
      treatment.service_name?.toLowerCase().includes(lowerQuery) ||
      treatment.description?.toLowerCase().includes(lowerQuery)
    );
    setTreatmentResults(results);
  };

  // Add treatment to selection
  const addTreatment = (treatment) => {
    if (selectedTreatments.find(t => t.treatment_service_code === treatment.treatment_service_code)) {
      alert('Treatment already added');
      return;
    }

    setSelectedTreatments([...selectedTreatments, {
      treatment_service_code: treatment.treatment_service_code,
      service_name: treatment.service_name,
      price: treatment.price,
      notes: ''
    }]);
    setTreatmentSearch('');
    setTreatmentResults([]);
  };

  // Update treatment notes
  const updateTreatmentNotes = (index, notes) => {
    const updated = [...selectedTreatments];
    updated[index].notes = notes;
    setSelectedTreatments(updated);
  };

  // Remove treatment
  const removeTreatment = (index) => {
    setSelectedTreatments(selectedTreatments.filter((_, i) => i !== index));
  };

  // Save consultation
  const handleSaveConsultation = async () => {
    // Validation
    if (!symptoms.trim()) {
      alert('Please enter patient symptoms');
      return;
    }

    if (!diagnoses.trim()) {
      alert('Please enter diagnoses');
      return;
    }

    if (followUpRequired && !followUpDate) {
      alert('Please select a follow-up date');
      return;
    }

    // Validate prescriptions
    for (const prescription of prescriptions) {
      if (!prescription.dosage.trim()) {
        alert('Please fill in dosage for all medications');
        return;
      }
    }

    try {
      setSaving(true);

      const consultationData = {
        appointment_id: appointmentId,
        symptoms: symptoms.trim(),
        diagnoses: diagnoses.trim(),
        follow_up_required: followUpRequired,
        follow_up_date: followUpRequired ? followUpDate : null,
        prescription_items: prescriptions.map(p => ({
          medication_id: p.medication_id,
          dosage: p.dosage,
          frequency: p.frequency,
          duration_days: parseInt(p.duration_days),
          instructions: p.instructions || null
        })),
        treatments: selectedTreatments.map(t => ({
          treatment_service_code: t.treatment_service_code,
          notes: t.notes || null
        }))
      };

      console.log('Saving consultation:', consultationData);
      const result = await consultationService.createConsultation(consultationData);
      
      alert('✅ Consultation saved successfully!');
      navigate('/doctor/appointments');
    } catch (err) {
      console.error('Failed to save consultation:', err);
      alert(`❌ Failed to save consultation: ${err.message}`);
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
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '500' }}>Loading appointment...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="doctor-container">
        <DoctorHeader />
        <div className="doctor-content">
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            {error || 'Appointment not found'}
            <button onClick={() => navigate('/doctor/appointments')} className="btn-primary">
              Back to Appointments
            </button>
          </div>
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
            <h1>New Consultation</h1>
            <p>Record consultation details, prescriptions, and treatments</p>
          </div>
          <button onClick={() => navigate('/doctor/appointments')} className="btn-secondary">
            <i className="fas fa-arrow-left"></i> Back
          </button>
        </div>

        {/* Patient Info Card */}
        <div className="info-card" style={{ marginBottom: '24px', padding: '20px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>
            <i className="fas fa-user-circle"></i> Patient Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <strong>Name:</strong> {appointment?.patient_name || appointment?.full_name || 'N/A'}
            </div>
            <div>
              <strong>ID:</strong> {appointment?.patient_id || 'N/A'}
            </div>
            <div>
              <strong>Email:</strong> {appointment?.patient_email || appointment?.email || 'N/A'}
            </div>
            <div>
              <strong>Blood Group:</strong> {appointment?.blood_group || 'N/A'}
            </div>
            <div>
              <strong>Date:</strong> {appointment?.available_date ? new Date(appointment.available_date).toLocaleDateString() : 'N/A'}
            </div>
            <div>
              <strong>Time:</strong> {appointment?.start_time && appointment?.end_time ? `${appointment.start_time} - ${appointment.end_time}` : 'N/A'}
            </div>
            <div>
              <strong>Doctor:</strong> {appointment?.doctor_name || 'N/A'}
            </div>
            <div>
              <strong>Branch:</strong> {appointment?.branch_name || 'N/A'}
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Symptoms & Diagnoses */}
          <div className="form-card">
            <h3><i className="fas fa-clipboard-list"></i> Consultation Details</h3>
            <div className="form-group">
              <label>Symptoms <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe patient's symptoms..."
                className="form-control"
                rows="4"
                required
              />
            </div>
            <div className="form-group">
              <label>Diagnoses <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                value={diagnoses}
                onChange={(e) => setDiagnoses(e.target.value)}
                placeholder="Enter your diagnoses..."
                className="form-control"
                rows="4"
                required
              />
            </div>
          </div>

          {/* Prescriptions */}
          <div className="form-card">
            <h3><i className="fas fa-pills"></i> Prescriptions</h3>
            
            {/* Medication Search */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Search Medication</label>
              <input
                type="text"
                value={medicationSearch}
                onChange={(e) => handleMedicationSearch(e.target.value)}
                placeholder="Search by name or manufacturer..."
                className="form-control"
              />
              
              {searchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {searchResults.map((med) => (
                    <div
                      key={med.medication_id}
                      onClick={() => addMedicationToPrescription(med)}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.target.style.background = 'white'}
                    >
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{med.generic_name}</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        {med.manufacturer} • {med.form}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prescription List */}
            {prescriptions.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '16px', color: '#1e293b' }}>
                  Added Medications ({prescriptions.length})
                </h4>
                {prescriptions.map((prescription, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <strong>{prescription.medication_name}</strong>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                          {prescription.manufacturer} • {prescription.form}
                        </div>
                      </div>
                      <button
                        onClick={() => removePrescription(index)}
                        className="btn-danger"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '13px' }}>Dosage *</label>
                        <input
                          type="text"
                          value={prescription.dosage}
                          onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                          placeholder="e.g., 500mg"
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '13px' }}>Frequency</label>
                        <select
                          value={prescription.frequency}
                          onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                          className="form-control"
                        >
                          <option value="Once daily">Once daily</option>
                          <option value="Twice daily">Twice daily</option>
                          <option value="Three times daily">Three times daily</option>
                          <option value="As needed">As needed</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '13px' }}>Duration (days)</label>
                        <input
                          type="number"
                          value={prescription.duration_days}
                          onChange={(e) => updatePrescription(index, 'duration_days', e.target.value)}
                          min="1"
                          max="365"
                          className="form-control"
                        />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                      <label style={{ fontSize: '13px' }}>Instructions</label>
                      <input
                        type="text"
                        value={prescription.instructions}
                        onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                        placeholder="e.g., Take with food"
                        className="form-control"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Treatments */}
          <div className="form-card">
            <h3><i className="fas fa-heartbeat"></i> Treatments & Procedures</h3>
            
            {/* Treatment Search */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Search Treatment</label>
              <input
                type="text"
                value={treatmentSearch}
                onChange={(e) => handleTreatmentSearch(e.target.value)}
                placeholder="Search by service name..."
                className="form-control"
              />
              
              {treatmentResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {treatmentResults.map((treatment) => (
                    <div
                      key={treatment.treatment_service_code}
                      onClick={() => addTreatment(treatment)}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.target.style.background = 'white'}
                    >
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{treatment.service_name}</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        LKR {treatment.price} • {treatment.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Treatment List */}
            {selectedTreatments.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '16px', color: '#1e293b' }}>
                  Added Treatments ({selectedTreatments.length})
                </h4>
                {selectedTreatments.map((treatment, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <strong>{treatment.service_name}</strong>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                          Price: LKR {treatment.price}
                        </div>
                      </div>
                      <button
                        onClick={() => removeTreatment(index)}
                        className="btn-danger"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '13px' }}>Notes</label>
                      <input
                        type="text"
                        value={treatment.notes}
                        onChange={(e) => updateTreatmentNotes(index, e.target.value)}
                        placeholder="Add treatment notes..."
                        className="form-control"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow-up */}
          <div className="form-card">
            <h3><i className="fas fa-calendar-check"></i> Follow-up</h3>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span>Follow-up appointment required</span>
              </label>
            </div>
            {followUpRequired && (
              <div className="form-group">
                <label>Follow-up Date <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-control"
                  required={followUpRequired}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '12px' }}>
            <button
              onClick={() => navigate('/doctor/appointments')}
              className="btn-secondary"
              disabled={saving}
            >
              <i className="fas fa-times"></i> Cancel
            </button>
            <button
              onClick={handleSaveConsultation}
              className="btn-primary"
              disabled={saving}
              style={{ minWidth: '200px' }}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> Save Consultation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorConsultation;
