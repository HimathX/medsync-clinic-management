import { useMemo, useState } from 'react'
import StepIndicator from './StepIndicator.jsx'
import DoctorSearch from './DoctorSearch.jsx'
import CalendarView from './CalendarView.jsx'
import TimeSlotGrid from './TimeSlotGrid.jsx'
import AppointmentTypeSelector from './AppointmentTypeSelector.jsx'
import BookingConfirmation from './BookingConfirmation.jsx'
import BookingSummaryModal from './BookingSummaryModal.jsx'

export default function Booking() {
  const steps = useMemo(() => [
    { key: 'doctor', label: 'Select Doctor' },
    { key: 'datetime', label: 'Date & Time' },
    { key: 'confirm', label: 'Confirmation' },
  ], [])

  const [active, setActive] = useState('doctor')
  const [form, setForm] = useState({
    doctor: null,
    date: null,
    time: null,
    type: 'consultation',
    reason: '',
    requirements: [],
  })
  const [slotsState, setSlotsState] = useState({ loading: false, slots: [] })
  const [isSummaryOpen, setSummaryOpen] = useState(false)

  function goNext() {
    if (active === 'doctor') setActive('datetime')
    else if (active === 'datetime') setActive('confirm')
  }
  function goBack() {
    if (active === 'confirm') setActive('datetime')
    else if (active === 'datetime') setActive('doctor')
  }

  // Fetch availability when doctor/date changes
  function fetchAvailability(doctor, date) {
    if (!doctor || !date) {
      setSlotsState({ loading: false, slots: [] })
      return
    }
    setSlotsState({ loading: true, slots: [] })
    // Simulate API
    setTimeout(() => {
      const base = ['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00']
      const occupied = new Set(['10:00'])
      const slots = base.map(t => ({ t, available: !occupied.has(t) }))
      setSlotsState({ loading: false, slots })
      // Clear previously selected time if it became unavailable
      setForm((f) => ({ ...f, time: slots.find(s => s.t === f.time && s.available) ? f.time : null }))
    }, 500)
  }

  // Trigger availability on changes
  const doctorId = form.doctor?.id
  const dateKey = form.date
  if (doctorId || dateKey) {
    // lightweight guard to avoid effect; simple call each render when inputs change
    // In real app, use useEffect
    // eslint-disable-next-line no-unused-expressions
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div>
          <h2>Book Your Appointment</h2>
          <p className="muted">Schedule your consultation with our medical professionals</p>
        </div>
      </div>

      <div className="profile-main" style={{ padding: 20 }}>
        <StepIndicator steps={steps} activeKey={active} />

        {active === 'doctor' && (
          <DoctorSearch
            value={form}
            onSelectDoctor={(doctor) => setForm((f) => ({ ...f, doctor }))}
            onNext={goNext}
          />
        )}

        {active === 'datetime' && (
          <div style={{ display: 'grid', gap: 16 }}>
            <AppointmentTypeSelector
              type={form.type}
              reason={form.reason}
              requirements={form.requirements}
              onChange={(partial) => setForm((f) => ({ ...f, ...partial }))}
            />
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
              <CalendarView
                doctor={form.doctor}
                date={form.date}
                onSelectDate={(date) => { setForm((f) => ({ ...f, date })); fetchAvailability(form.doctor, date) }}
              />
              <TimeSlotGrid
                doctor={form.doctor}
                date={form.date}
                time={form.time}
                loading={slotsState.loading}
                slots={slotsState.slots}
                onSelectTime={(time) => setForm((f) => ({ ...f, time }))}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="primary" onClick={goBack} style={{ background: '#e2e8f0', color: '#0f172a' }}>Back</button>
              <button className="primary" onClick={goNext} disabled={!form.date || !form.time}>Next</button>
            </div>
          </div>
        )}

        {active === 'confirm' && (
          <BookingConfirmation
            data={form}
            onBack={goBack}
            onConfirm={() => setSummaryOpen(true)}
          />
        )}
        <BookingSummaryModal
          open={isSummaryOpen}
          data={form}
          onClose={() => setSummaryOpen(false)}
          onConfirm={() => { setSummaryOpen(false); alert('Appointment booked!') }}
        />
      </div>
    </div>
  )
}


