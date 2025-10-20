import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffHeader from '../../components/StaffHeader';
import authService from '../../services/authService';
import patientService from '../../services/patientService';
import doctorService from '../../services/doctorService';
import appointmentService from '../../services/appointmentService';
import '../../styles/staff.css';

const StaffSchedule = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [branch, setBranch] = useState('Colombo');
  const currentUser = authService.getCurrentUser();

  // Step 1: Patient selection
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Step 2: Doctor selection
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Step 3: Time slot selection
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');

  const handleLogout = () => {
    authService.logout();
    navigate('/staff-login');
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || !user.userId) {
      navigate('/staff-login');
      return;
    }
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await patientService.getAllPatients(0, 1000);
      setPatients(data.patients || []);
    } catch (err) {
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await doctorService.getAllDoctors();
      setDoctors(data.doctors || []);
    } catch (err) {
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async (doctorId) => {
    setLoading(true);
    setError('');
    try {
      const data = await doctorService.getDoctorTimeSlots(doctorId, true);
      setTimeSlots(data.time_slots || []);
    } catch (err) {
      setError('No available time slots');
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setStep(2);
    fetchDoctors();
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setStep(3);
    fetchTimeSlots(doctor.doctor_id);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBookAppointment = async () => {
    if (!selectedPatient || !selectedSlot) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const bookingData = {
        patient_id: selectedPatient.patient_id,
        time_slot_id: selectedSlot.time_slot_id,
        notes: notes || 'Booked by staff'
      };
      
      const result = await appointmentService.bookAppointment(bookingData);
      setSuccess(`Appointment booked successfully! ID: ${result.appointment_id}`);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setStep(1);
        setSelectedPatient(null);
        setSelectedDoctor(null);
        setSelectedSlot(null);
        setNotes('');
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.NIC?.includes(searchTerm) ||
    p.patient_id?.includes(searchTerm)
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5);
  };


  return (
    <div className="staff-container">
      <StaffHeader 
        staffName={currentUser?.fullName || 'Staff'}
        staffRole={currentUser?.userType?.charAt(0).toUpperCase() + currentUser?.userType?.slice(1) || 'Staff'}
        branch={branch}
        setBranch={setBranch}
        onLogout={handleLogout}
      />
      <div className="staff-content">
        <div className="staff-header">
          <h1>Book Appointment</h1>
          <p>Step {step} of 3</p>
        </div>

        {error && <div className="error-message"><i className="fas fa-exclamation-circle"></i> {error}</div>}
        {success && <div className="success-message"><i className="fas fa-check-circle"></i> {success}</div>}

        {/* Step 1: Select Patient */}
        {step === 1 && (
          <div className="booking-section">
            <h3><i className="fas fa-user"></i> Select Patient</h3>
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Search by name, NIC, or ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="patient-list">
              {loading ? (
                <div className="loading-container"><div className="spinner"></div><p>Loading patients...</p></div>
              ) : filteredPatients.length === 0 ? (
                <div className="empty-state"><i className="fas fa-user-slash"></i><p>No patients found</p></div>
              ) : (
                filteredPatients.slice(0, 10).map((patient) => (
                  <div key={patient.patient_id} className="patient-card" onClick={() => handlePatientSelect(patient)}>
                    <div className="patient-info">
                      <strong>{patient.full_name}</strong>
                      <span className="label">NIC: {patient.NIC}</span>
                      <span className="label">Contact: {patient.contact_num1}</span>
                    </div>
                    <button className="btn-select">Select <i className="fas fa-arrow-right"></i></button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select Doctor */}
        {step === 2 && selectedPatient && (
          <div className="booking-section">
            <div className="selected-info">
              <strong>Patient:</strong> {selectedPatient.full_name}
              <button className="btn-change" onClick={() => setStep(1)}><i className="fas fa-edit"></i> Change</button>
            </div>
            
            <h3><i className="fas fa-user-md"></i> Select Doctor</h3>
            
            <div className="doctor-grid">
              {loading ? (
                <div className="loading-container"><div className="spinner"></div><p>Loading doctors...</p></div>
              ) : doctors.length === 0 ? (
                <div className="empty-state"><i className="fas fa-user-md-times"></i><p>No doctors available</p></div>
              ) : (
                doctors.map((doctor) => (
                  <div key={doctor.doctor_id} className="doctor-card" onClick={() => handleDoctorSelect(doctor)}>
                    <div className="doctor-avatar">👨‍⚕️</div>
                    <div className="doctor-details">
                      <strong>{doctor.full_name}</strong>
                      <span className="label">{doctor.specializations?.[0] || 'General'}</span>
                      <span className="label">License: {doctor.medical_licence_no}</span>
                    </div>
                    <button className="btn-select-small">Select</button>
                  </div>
                ))
              )}
            </div>
            
            <button className="btn-back" onClick={() => setStep(1)}><i className="fas fa-arrow-left"></i> Back</button>
          </div>
        )}

        {/* Step 3: Select Time Slot & Book */}
        {step === 3 && selectedDoctor && (
          <div className="booking-section">
            <div className="selected-info">
              <strong>Patient:</strong> {selectedPatient.full_name} | 
              <strong>Doctor:</strong> {selectedDoctor.full_name}
              <button className="btn-change" onClick={() => setStep(2)}><i className="fas fa-edit"></i> Change</button>
            </div>
            
            <h3><i className="fas fa-clock"></i> Select Time Slot</h3>
            
            <div className="timeslot-grid">
              {loading ? (
                <div className="loading-container"><div className="spinner"></div><p>Loading time slots...</p></div>
              ) : timeSlots.length === 0 ? (
                <div className="empty-state"><i className="fas fa-calendar-times"></i><p>No available time slots</p></div>
              ) : (
                timeSlots.map((slot) => (
                  <div 
                    key={slot.time_slot_id} 
                    className={`timeslot-card ${selectedSlot?.time_slot_id === slot.time_slot_id ? 'selected' : ''}`}
                    onClick={() => handleSlotSelect(slot)}
                  >
                    <div className="slot-date"><i className="fas fa-calendar"></i> {formatDate(slot.available_date)}</div>
                    <div className="slot-time"><i className="fas fa-clock"></i> {formatTime(slot.start_time)} - {formatTime(slot.end_time)}</div>
                    <div className="slot-branch"><i className="fas fa-map-marker-alt"></i> {slot.branch_name}</div>
                  </div>
                ))
              )}
            </div>
            
            {selectedSlot && (
              <div className="notes-section">
                <label><i className="fas fa-sticky-note"></i> Notes (Optional)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows="3"
                />
              </div>
            )}
            
            <div className="action-buttons">
              <button className="btn-back" onClick={() => setStep(2)}><i className="fas fa-arrow-left"></i> Back</button>
              <button 
                className="btn-book" 
                onClick={handleBookAppointment}
                disabled={!selectedSlot || loading}
              >
                {loading ? 'Booking...' : 'Book Appointment'} <i className="fas fa-check"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffSchedule;
