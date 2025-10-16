// src/pages/patient/BookAppointment.js - Patient Appointment Booking
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import appointmentService from '../../services/appointmentService'
import doctorService from '../../services/doctorService'
import authService from '../../services/authService'
import '../../styles/patientDashboard.css'

export default function BookAppointment() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Get patient ID from auth
  const currentUser = authService.getCurrentUser();
  const patientId = currentUser.patientId || localStorage.getItem('patientId');
  
  // Dynamic data from backend
  const [specialties, setSpecialties] = useState([])
  const [doctors, setDoctors] = useState([])
  const [timeSlots, setTimeSlots] = useState([])

  useEffect(() => {
    fetchSpecialtiesAndDoctors();
  }, []);

  const fetchSpecialtiesAndDoctors = async () => {
    try {
      setLoading(true);
      // Fetch all doctors
      const doctorsData = await doctorService.getAllDoctors();
      setDoctors(doctorsData || []);
      
      // Extract unique specialties
      const uniqueSpecs = [...new Set(doctorsData.map(d => d.specialization))].map((spec, idx) => ({
        id: idx + 1,
        name: spec,
        icon: getSpecialtyIcon(spec),
        doctors: doctorsData.filter(d => d.specialization === spec).length
      }));
      setSpecialties(uniqueSpecs);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load doctors and specialties');
    } finally {
      setLoading(false);
    }
  };

  const getSpecialtyIcon = (specialty) => {
    const iconMap = {
      'Cardiology': '❤️',
      'Dermatology': '🧴',
      'Orthopedics': '🦴',
      'Neurology': '🧠',
      'Pediatrics': '👶',
      'General Medicine': '⚕️',
      'ENT': '👂'
    };
    return iconMap[specialty] || '🏥';
  };

  const fetchTimeSlotsForDoctor = async (doctorId) => {
    try {
      setLoading(true);
      // Fetch available time slots for the doctor
      const slots = await doctorService.getDoctorTimeSlots(doctorId);
      setTimeSlots(slots || []);
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setError('Failed to load available time slots');
      // Fallback to empty array
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialtySelect = (specialty) => {
    setSelectedSpecialty(specialty)
    setStep(2)
  }

  const handleDoctorSelect = async (doctor) => {
    setSelectedDoctor(doctor)
    await fetchTimeSlotsForDoctor(doctor.doctor_id)
    setStep(3)
  }

  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot)
    setStep(4)
  }

  const handleConfirmBooking = async () => {
    if (!patientId) {
      alert('Patient ID not found. Please log in again.');
      navigate('/patient-login');
      return;
    }

    if (!selectedTimeSlot || !selectedTimeSlot.time_slot_id) {
      alert('Please select a valid time slot');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare booking data according to backend schema
      const bookingData = {
        patient_id: patientId,
        time_slot_id: selectedTimeSlot.time_slot_id,
        notes: notes || ''
      };

      // Call backend API to book appointment
      const response = await appointmentService.bookAppointment(bookingData);

      if (response.success) {
        alert(`Appointment booked successfully!\nAppointment ID: ${response.appointment_id}`);
        navigate('/patient/dashboard');
      } else {
        alert('Failed to book appointment: ' + response.message);
      }
    } catch (err) {
      console.error('Booking error:', err);
      alert('Failed to book appointment. Please try again.');
      setError(err.response?.data?.detail || 'Booking failed');
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="patient-portal">
      {/* Top Navigation */}
      <nav className="patient-top-nav">
        <div className="patient-top-nav-content">
          <button className="btn-secondary" onClick={() => navigate('/patient/dashboard')}>
            ← Back to Dashboard
          </button>
          <h2 style={{color: 'white', margin: 0}}>Book an Appointment</h2>
          <div>Step {step} of 4</div>
        </div>
      </nav>

      <div className="patient-container" style={{paddingTop: '40px', paddingBottom: '60px'}}>
        {/* Step 1: Select Specialty */}
        {step === 1 && (
          <div className="booking-section">
            <h2 className="section-heading">Select Specialty</h2>
            <p style={{color: '#64748b', marginBottom: '30px'}}>Choose the medical specialty you need</p>
            
            <div className="specialties-grid">
              {specialties.map(specialty => (
                <button
                  key={specialty.id}
                  className="specialty-card"
                  onClick={() => handleSpecialtySelect(specialty.name)}
                >
                  <div className="specialty-icon">{specialty.icon}</div>
                  <h3 className="specialty-name">{specialty.name}</h3>
                  <p className="specialty-doctors">{specialty.doctors} doctors available</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Doctor */}
        {step === 2 && (
          <div className="booking-section">
            <button className="btn-secondary" onClick={() => setStep(1)} style={{marginBottom: '20px'}}>
              ← Back to Specialties
            </button>
            
            <h2 className="section-heading">{selectedSpecialty} Specialists</h2>
            <p style={{color: '#64748b', marginBottom: '30px'}}>Choose your preferred doctor</p>
            
            <div className="doctors-list">
              {doctors.filter(d => d.specialization === selectedSpecialty).length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
                  <p>No doctors available for this specialty at the moment.</p>
                  <button className="btn-secondary" onClick={() => setStep(1)}>Choose Different Specialty</button>
                </div>
              ) : (
                doctors.filter(d => d.specialization === selectedSpecialty).map(doctor => (
                  <div key={doctor.doctor_id} className="doctor-card">
                    <div className="doctor-image">👨‍⚕️</div>
                    <div className="doctor-info">
                      <h3 className="doctor-name">{doctor.name}</h3>
                      <p className="doctor-qualifications">{doctor.qualifications || 'MBBS'}</p>
                      <div className="doctor-meta">
                        <span>⭐ {doctor.rating || '4.5'}/5</span>
                        <span>•</span>
                        <span>{doctor.years_experience || 5} years experience</span>
                      </div>
                      <div className="doctor-languages">
                        Languages: {doctor.languages?.join(', ') || 'English, Sinhala'}
                      </div>
                      <p className="doctor-availability">
                        License: {doctor.license_number || 'N/A'}
                      </p>
                    </div>
                    <button className="btn-primary" onClick={() => handleDoctorSelect(doctor)} disabled={loading}>
                      {loading ? 'Loading...' : 'Select Doctor'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 3: Select Time Slot */}
        {step === 3 && selectedDoctor && (
          <div className="booking-section">
            <button className="btn-secondary" onClick={() => setStep(2)} style={{marginBottom: '20px'}}>
              ← Back to Doctors
            </button>
            
            <h2 className="section-heading">Select Available Time Slot</h2>
            <p style={{color: '#64748b', marginBottom: '30px'}}>
              Booking with {selectedDoctor.name}
            </p>
            
            {loading ? (
              <div style={{textAlign: 'center', padding: '40px'}}>
                <div style={{fontSize: '48px', marginBottom: '20px'}}>⏳</div>
                <p>Loading available time slots...</p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
                <p>No available time slots for this doctor at the moment.</p>
                <button className="btn-secondary" onClick={() => setStep(2)}>Choose Another Doctor</button>
              </div>
            ) : (
              <div className="time-selection">
                <h3>Available Time Slots</h3>
                <div className="time-slots-grid">
                  {timeSlots.map(slot => (
                    <button
                      key={slot.time_slot_id}
                      className={`time-slot ${selectedTimeSlot?.time_slot_id === slot.time_slot_id ? 'selected' : ''}`}
                      onClick={() => handleTimeSlotSelect(slot)}
                    >
                      {new Date(slot.appointment_date).toLocaleDateString()}<br/>
                      {new Date(slot.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Appointment Details & Confirmation */}
        {step === 4 && (
          <div className="booking-section">
            <button className="btn-secondary" onClick={() => setStep(3)} style={{marginBottom: '20px'}}>
              ← Back to Date & Time
            </button>
            
            <h2 className="section-heading">Appointment Details</h2>
            
            <div className="booking-summary">
              <h3>Booking Summary</h3>
              <div className="summary-item">
                <span className="summary-label">Doctor:</span>
                <span className="summary-value">{selectedDoctor.name}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Specialty:</span>
                <span className="summary-value">{selectedSpecialty}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Date & Time:</span>
                <span className="summary-value">
                  {selectedTimeSlot && new Date(selectedTimeSlot.appointment_date).toLocaleString()}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Branch:</span>
                <span className="summary-value">{selectedTimeSlot?.branch_name || 'Main Branch'}</span>
              </div>
            </div>
            
            <div className="appointment-details-form">
              <div className="form-group">
                <label className="form-label">Notes / Reason for Visit</label>
                <textarea
                  className="form-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Please describe your symptoms, reason for visit, or any special requirements..."
                  rows={6}
                />
              </div>
            </div>
            
            {error && (
              <div style={{
                padding: '12px',
                background: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                color: '#c33',
                marginTop: '15px'
              }}>
                ⚠️ {error}
              </div>
            )}
            
            <button
              className="btn-primary"
              style={{marginTop: '30px', width: '100%'}}
              onClick={handleConfirmBooking}
              disabled={loading}
            >
              {loading ? '⏳ Booking...' : 'Confirm Booking'}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .booking-section {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .specialties-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 25px;
        }
        
        .specialty-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 2px solid transparent;
          border-radius: 16px;
          padding: 30px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .specialty-card:hover {
          transform: translateY(-5px);
          border-color: #7c3aed;
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.15);
        }
        
        .specialty-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }
        
        .specialty-name {
          font-size: 20px;
          font-weight: 700;
          color: #1a2332;
          margin-bottom: 8px;
        }
        
        .specialty-doctors {
          font-size: 14px;
          color: #64748b;
        }
        
        .doctors-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .doctor-card {
          display: flex;
          align-items: center;
          gap: 25px;
          padding: 25px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          border: 2px solid #e2e8f0;
          transition: all 0.3s;
        }
        
        .doctor-card:hover {
          border-color: #7c3aed;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.1);
        }
        
        .doctor-image {
          font-size: 64px;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 50%;
        }
        
        .doctor-info {
          flex-grow: 1;
        }
        
        .doctor-name {
          font-size: 22px;
          font-weight: 700;
          color: #1a2332;
          margin-bottom: 5px;
        }
        
        .doctor-qualifications {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 8px;
        }
        
        .doctor-meta {
          display: flex;
          gap: 8px;
          font-size: 14px;
          color: #475569;
          margin-bottom: 8px;
        }
        
        .doctor-languages {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 8px;
        }
        
        .doctor-availability {
          font-size: 14px;
          color: #10B981;
          font-weight: 600;
        }
        
        .datetime-selection {
          display: grid;
          gap: 30px;
        }
        
        .date-selection h3,
        .time-selection h3 {
          font-size: 20px;
          font-weight: 700;
          color: #1a2332;
          margin-bottom: 15px;
        }
        
        .date-input {
          width: 100%;
          padding: 15px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.3s;
        }
        
        .date-input:focus {
          outline: none;
          border-color: #7c3aed;
        }
        
        .time-slots-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }
        
        .time-slot {
          padding: 15px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .time-slot:hover {
          border-color: #7c3aed;
          background: #faf5ff;
        }
        
        .time-slot.selected {
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          color: white;
          border-color: #7c3aed;
        }
        
        .booking-summary {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 25px;
          border-radius: 12px;
          margin-bottom: 30px;
        }
        
        .booking-summary h3 {
          font-size: 20px;
          font-weight: 700;
          color: #1a2332;
          margin-bottom: 20px;
        }
        
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .summary-label {
          font-weight: 600;
          color: #64748b;
        }
        
        .summary-value {
          font-weight: 700;
          color: #1a2332;
        }
        
        .appointment-details-form {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .form-label {
          font-weight: 700;
          color: #1a2332;
          font-size: 16px;
        }
        
        .form-select,
        .form-textarea {
          padding: 15px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.3s;
        }
        
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #7c3aed;
        }
        
        .requirements-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          color: #475569;
          cursor: pointer;
        }
        
        .checkbox-label input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }
        
        @media (max-width: 968px) {
          .specialties-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .time-slots-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        @media (max-width: 640px) {
          .specialties-grid {
            grid-template-columns: 1fr;
          }
          
          .doctor-card {
            flex-direction: column;
            text-align: center;
          }
          
          .time-slots-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  )
}
