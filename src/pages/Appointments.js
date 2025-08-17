import React, { useState } from 'react';

const Appointments = ({ role, branch }) => {
  const [appointments, setAppointments] = useState([]); // Mock
  const [formData, setFormData] = useState({ patientId: '', doctorId: '', time: '', emergency: false });
  const [error, setError] = useState('');

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('appointmentId', id);
  };

  const handleDrop = (e, newTime) => {
    const id = e.dataTransfer.getData('appointmentId');
    // Mock reschedule
    alert(`Rescheduled appointment ${id} to ${newTime}`);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.time) {
      setError('Required fields missing');
      return;
    }
    // Mock create, check conflicts
    if (appointments.some(ap => ap.time === formData.time)) {
      setError('Conflict: Overlapping appointment');
      return;
    }
    setAppointments([...appointments, { ...formData, status: 'Scheduled', branch }]);
  };

  const markCompleted = (id) => {
    // Prompt for treatments
    alert('Enter treatments and notes');
    // Update status
  };

  return (
    <div>
      <h1>Appointment Management ({branch})</h1>
      {/* Simple Calendar View (Grid) */}
      <div className="calendar" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {/* Mock days */}
        <div>Mon</div><div>Tue</div> {/* etc. */}
        {appointments.map((appt, index) => (
          <div key={index} draggable onDragStart={(e) => handleDragStart(e, index)} onDrop={(e) => handleDrop(e, 'New Time')} onDragOver={(e) => e.preventDefault()}>
            {appt.time} - {appt.status}
            <button onClick={() => markCompleted(index)}>Complete</button>
            <button onClick={() => alert('Cancel')}>Cancel</button>
          </div>
        ))}
      </div>

      {/* Appointment Form */}
      <form onSubmit={handleCreate}>
        <input value={formData.patientId} onChange={(e) => setFormData({...formData, patientId: e.target.value})} placeholder="Patient ID" />
        <input value={formData.doctorId} onChange={(e) => setFormData({...formData, doctorId: e.target.value})} placeholder="Doctor ID" />
        <input type="datetime-local" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
        <label>
          <input type="checkbox" checked={formData.emergency} onChange={(e) => setFormData({...formData, emergency: e.target.checked})} /> Emergency Walk-in
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit">Schedule</button>
      </form>
    </div>
  );
};

export default Appointments;