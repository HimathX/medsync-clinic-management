// src/pages/patient/BookAppointment.js - Patient Appointment Booking
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../styles/patientDashboard.css'

export default function BookAppointment() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [appointmentType, setAppointmentType] = useState('Consultation')
  const [reason, setReason] = useState('')
  const [requirements, setRequirements] = useState([])

  const specialties = [
    { id: 1, name: 'Cardiology', icon: '❤️', doctors: 8 },
    { id: 2, name: 'Dermatology', icon: '🧴', doctors: 5 },
    { id: 3, name: 'Orthopedics', icon: '🦴', doctors: 6 },
    { id: 4, name: 'Neurology', icon: '🧠', doctors: 4 },
    { id: 5, name: 'Pediatrics', icon: '👶', doctors: 7 },
    { id: 6, name: 'General Medicine', icon: '⚕️', doctors: 10 },
  ]

  const doctors = [
    {
      id: 1,
      name: 'Dr. Samantha Perera',
      specialty: 'Cardiology',
      qualifications: 'MBBS, MD (Cardiology)',
      experience: 15,
      rating: 4.8,
      image: '👩‍⚕️',
      nextAvailable: '2025-10-10',
      languages: ['English', 'Sinhala', 'Tamil']
    },
    {
      id: 2,
      name: 'Dr. Rajitha Fernando',
      specialty: 'Cardiology',
      qualifications: 'MBBS, FRCP',
      experience: 12,
      rating: 4.7,
      image: '👨‍⚕️',
      nextAvailable: '2025-10-12',
      languages: ['English', 'Sinhala']
    },
  ]

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'
  ]

  const handleSpecialtySelect = (specialty) => {
    setSelectedSpecialty(specialty)
    setStep(2)
  }

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor)
    setStep(3)
  }

  const handleDateTimeSelect = () => {
    if (selectedDate && selectedTime) {
      setStep(4)
    } else {
      alert('Please select both date and time')
    }
  }

  const handleConfirmBooking = () => {
    const booking = {
      doctor: selectedDoctor.name,
      specialty: selectedSpecialty,
      date: selectedDate,
      time: selectedTime,
      type: appointmentType,
      reason
    }
    console.log('Booking confirmed:', booking)
    alert('Appointment booked successfully!')
    navigate('/patient/dashboard')
  }

  const toggleRequirement = (req) => {
    if (requirements.includes(req)) {
      setRequirements(requirements.filter(r => r !== req))
    } else {
      setRequirements([...requirements, req])
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
              {doctors.filter(d => d.specialty === selectedSpecialty).map(doctor => (
                <div key={doctor.id} className="doctor-card">
                  <div className="doctor-image">{doctor.image}</div>
                  <div className="doctor-info">
                    <h3 className="doctor-name">{doctor.name}</h3>
                    <p className="doctor-qualifications">{doctor.qualifications}</p>
                    <div className="doctor-meta">
                      <span>⭐ {doctor.rating}/5</span>
                      <span>•</span>
                      <span>{doctor.experience} years experience</span>
                    </div>
                    <div className="doctor-languages">
                      Languages: {doctor.languages.join(', ')}
                    </div>
                    <p className="doctor-availability">
                      Next available: {new Date(doctor.nextAvailable).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="btn-primary" onClick={() => handleDoctorSelect(doctor)}>
                    Select Doctor
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Date & Time */}
        {step === 3 && selectedDoctor && (
          <div className="booking-section">
            <button className="btn-secondary" onClick={() => setStep(2)} style={{marginBottom: '20px'}}>
              ← Back to Doctors
            </button>
            
            <h2 className="section-heading">Select Date & Time</h2>
            <p style={{color: '#64748b', marginBottom: '30px'}}>
              Booking with {selectedDoctor.name}
            </p>
            
            <div className="datetime-selection">
              <div className="date-selection">
                <h3>Select Date</h3>
                <input
                  type="date"
                  className="date-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              {selectedDate && (
                <div className="time-selection">
                  <h3>Available Time Slots</h3>
                  <div className="time-slots-grid">
                    {timeSlots.map(slot => (
                      <button
                        key={slot}
                        className={`time-slot ${selectedTime === slot ? 'selected' : ''}`}
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              className="btn-primary"
              style={{marginTop: '30px'}}
              onClick={handleDateTimeSelect}
              disabled={!selectedDate || !selectedTime}
            >
              Continue to Details
            </button>
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
                <span className="summary-label">Date:</span>
                <span className="summary-value">{new Date(selectedDate).toLocaleDateString()}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Time:</span>
                <span className="summary-value">{selectedTime}</span>
              </div>
            </div>
            
            <div className="appointment-details-form">
              <div className="form-group">
                <label className="form-label">Appointment Type</label>
                <select
                  className="form-select"
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                >
                  <option value="Consultation">Consultation</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Procedure">Procedure</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Reason for Visit</label>
                <textarea
                  className="form-textarea"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please describe your symptoms or reason for the visit..."
                  rows={4}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Special Requirements</label>
                <div className="requirements-list">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={requirements.includes('wheelchair')}
                      onChange={() => toggleRequirement('wheelchair')}
                    />
                    Wheelchair access needed
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={requirements.includes('interpreter')}
                      onChange={() => toggleRequirement('interpreter')}
                    />
                    Language interpreter needed
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={requirements.includes('extended')}
                      onChange={() => toggleRequirement('extended')}
                    />
                    Extended appointment time
                  </label>
                </div>
              </div>
            </div>
            
            <button
              className="btn-primary"
              style={{marginTop: '30px', width: '100%'}}
              onClick={handleConfirmBooking}
            >
              Confirm Booking
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
