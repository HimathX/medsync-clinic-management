import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, ChevronRight, Calendar, Clock, User } from 'lucide-react'
import appointmentService from '@/services/appointmentService'
import doctorService from '@/services/doctorService'
import authService from '@/services/authService'
import '@/index.css'

interface Specialization {
  specialization_id: string
  specialization_title: string
  doctor_count: number
  icon: string
}

interface Doctor {
  doctor_id: string
  full_name: string
  name: string
  qualifications: string
  email: string
  room_no: string
  consultation_fee: number
  medical_licence_no: string
}

interface TimeSlot {
  time_slot_id: string
  available_date: string
  start_time: string | number
  end_time: string | number
  branch_name: string
}

export default function BookAppointment(): React.ReactElement {
  const navigate = useNavigate()
  const [step, setStep] = useState<number>(1)
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialization | null>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const currentUser = authService.getCurrentUser()
  const patientId = currentUser?.patientId || localStorage.getItem('patientId')

  const [specializations, setSpecializations] = useState<Specialization[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])

  useEffect(() => {
    fetchSpecializations()
  }, [])

  const fetchSpecializations = async (): Promise<void> => {
    try {
      setLoading(true)
      const specs = await doctorService.getAllSpecializations(true)

      const mappedSpecs = specs.map((spec) => ({
        ...spec,
        icon: getSpecialtyIcon(spec.specialization_title),
        name: spec.specialization_title,
      }))

      setSpecializations(mappedSpecs)
    } catch (err) {
      console.error('Error fetching specializations:', err)
      setError('Failed to load specializations')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time: string | number): string => {
    if (!time) return ''

    if (typeof time === 'number') {
      const hours = Math.floor(time / 3600)
      const minutes = Math.floor((time % 3600) / 60)
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }

    if (typeof time === 'string') {
      return time.substring(0, 5)
    }

    return time as string
  }

  const getSpecialtyIcon = (specialty: string): string => {
    const iconMap: Record<string, string> = {
      Cardiology: '❤️',
      Dermatology: '🧴',
      Orthopedics: '🦴',
      Neurology: '🧠',
      Pediatrics: '👶',
      'General Medicine': '⚕️',
      ENT: '👂',
    }
    return iconMap[specialty] || '🏥'
  }

  const fetchTimeSlotsForDoctor = async (doctorId: string): Promise<void> => {
    try {
      setLoading(true)
      const response = await doctorService.getDoctorTimeSlots(doctorId)
      setTimeSlots(response.time_slots || [])
    } catch (err) {
      console.error('Error fetching time slots:', err)
      setError('Failed to load available time slots')
      setTimeSlots([])
    } finally {
      setLoading(false)
    }
  }

  const handleSpecialtySelect = async (specialty: Specialization): Promise<void> => {
    setSelectedSpecialty(specialty)

    try {
      setLoading(true)
      const doctorsData = await doctorService.getDoctorsBySpecialization(
        specialty.specialization_id
      )
      setDoctors(doctorsData || [])
      setStep(2)
    } catch (err) {
      console.error('Error fetching doctors:', err)
      setError('Failed to load doctors for this specialization')
    } finally {
      setLoading(false)
    }
  }

  const handleDoctorSelect = async (doctor: Doctor): Promise<void> => {
    setSelectedDoctor(doctor)
    await fetchTimeSlotsForDoctor(doctor.doctor_id)
    setStep(3)
  }

  const handleTimeSlotSelect = (slot: TimeSlot): void => {
    setSelectedTimeSlot(slot)
    setStep(4)
  }

  const handleConfirmBooking = async (): Promise<void> => {
    if (!patientId) {
      setError('Patient ID not found. Please log in again.')
      navigate('/patient-login')
      return
    }

    if (!selectedTimeSlot?.time_slot_id) {
      setError('Please select a valid time slot')
      return
    }

    try {
      setLoading(true)
      setError('')

      const bookingData = {
        patient_id: patientId,
        time_slot_id: selectedTimeSlot.time_slot_id,
        notes: notes || '',
      }

      const response = await appointmentService.bookAppointment(bookingData)

      if (response.success) {
        alert(`Appointment booked successfully!\nAppointment ID: ${response.appointment_id}`)
        navigate('/patient/dashboard')
      } else {
        setError(response.message || 'Failed to book appointment')
      }
    } catch (err) {
      console.error('Booking error:', err)
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border sticky top-0 bg-card z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/patient/dashboard')}>
            ← Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Book an Appointment</h1>
          <div className="text-sm text-muted-foreground">Step {step} of 4</div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Step 1: Select Specialty */}
        {step === 1 && (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Select Specialty</h2>
            <p className="text-muted-foreground mb-8">
              Choose the medical specialty you need
            </p>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading specializations...</p>
              </div>
            ) : specializations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>No specializations available at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {specializations.map((specialty) => (
                  <button
                    key={specialty.specialization_id}
                    onClick={() => handleSpecialtySelect(specialty)}
                    disabled={loading}
                    className="text-left group"
                  >
                    <Card className="h-full hover:shadow-lg hover:border-primary transition-all duration-300 cursor-pointer">
                      <CardContent className="pt-8 pb-6 text-center">
                        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                          {specialty.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {specialty.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {specialty.doctor_count || 0} doctors available
                        </p>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Doctor */}
        {step === 2 && (
          <div>
            <Button variant="outline" onClick={() => setStep(1)} className="mb-6">
              ← Back to Specialties
            </Button>

            <h2 className="text-3xl font-bold text-foreground mb-2">
              {selectedSpecialty?.name} Specialists
            </h2>
            <p className="text-muted-foreground mb-8">Choose your preferred doctor</p>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading doctors...</p>
              </div>
            ) : doctors.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    No doctors available for this specialty at the moment.
                  </p>
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Choose Different Specialty
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {doctors.map((doctor) => (
                  <Card key={doctor.doctor_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex gap-6 items-start">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl flex-shrink-0">
                          👨‍⚕️
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold text-foreground">
                            {doctor.full_name || doctor.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {doctor.qualifications || 'MBBS'}
                          </p>

                          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">📧 Email:</span>
                              <p className="text-foreground truncate">{doctor.email}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">💰 Consultation Fee:</span>
                              <p className="text-foreground">LKR {doctor.consultation_fee || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">🏥 Room:</span>
                              <p className="text-foreground">{doctor.room_no || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">📜 License:</span>
                              <p className="text-foreground">{doctor.medical_licence_no || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleDoctorSelect(doctor)}
                          disabled={loading}
                          className="flex-shrink-0 mt-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              Select
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Select Time Slot */}
        {step === 3 && selectedDoctor && (
          <div>
            <Button variant="outline" onClick={() => setStep(2)} className="mb-6">
              ← Back to Doctors
            </Button>

            <h2 className="text-3xl font-bold text-foreground mb-2">Select Available Time Slot</h2>
            <p className="text-muted-foreground mb-8">
              Booking with <span className="font-semibold">{selectedDoctor.full_name || selectedDoctor.name}</span>
            </p>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading available time slots...</p>
              </div>
            ) : timeSlots.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    No available time slots for this doctor at the moment.
                  </p>
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Choose Another Doctor
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.time_slot_id}
                    onClick={() => handleTimeSlotSelect(slot)}
                    className={`p-4 rounded-lg border-2 transition-all text-center font-medium text-sm ${
                      selectedTimeSlot?.time_slot_id === slot.time_slot_id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(slot.available_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Appointment Details & Confirmation */}
        {step === 4 && (
          <div>
            <Button variant="outline" onClick={() => setStep(3)} className="mb-6">
              ← Back to Date & Time
            </Button>

            <h2 className="text-3xl font-bold text-foreground mb-8">Appointment Details</h2>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Booking Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-border">
                      <User className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Doctor</p>
                        <p className="font-semibold text-foreground">
                          {selectedDoctor?.full_name || selectedDoctor?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pb-4 border-b border-border">
                      <div className="text-2xl flex-shrink-0">
                        {selectedSpecialty?.icon}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Specialty</p>
                        <p className="font-semibold text-foreground">
                          {selectedSpecialty?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pb-4 border-b border-border">
                      <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date & Time</p>
                        <p className="font-semibold text-foreground">
                          {selectedTimeSlot &&
                            `${new Date(selectedTimeSlot.available_date).toLocaleDateString(
                              'en-US',
                              {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            )} at ${formatTime(selectedTimeSlot.start_time)} - ${formatTime(
                              selectedTimeSlot.end_time
                            )}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-2xl flex-shrink-0">🏥</div>
                      <div>
                        <p className="text-sm text-muted-foreground">Branch</p>
                        <p className="font-semibold text-foreground">
                          {selectedTimeSlot?.branch_name || 'Main Branch'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="notes">
                          Notes / Reason for Visit (Optional)
                        </FieldLabel>
                        <textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Please describe your symptoms, reason for visit, or any special requirements..."
                          rows={5}
                          className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <FieldDescription>
                          This helps the doctor prepare for your appointment
                        </FieldDescription>
                      </Field>
                    </FieldGroup>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Confirm Booking</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleConfirmBooking}
                      disabled={loading}
                      className="w-full h-12 text-base"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Booking...
                        </>
                      ) : (
                        'Confirm & Book Appointment'
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      You will receive a confirmation email with appointment details.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}