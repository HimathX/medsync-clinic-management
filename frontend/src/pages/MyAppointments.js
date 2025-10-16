// src/pages/MyAppointments.js - Staff Appointment Management
import React, { useState, useEffect } from 'react';
import appointmentService from '../services/appointmentService';
import doctorService from '../services/doctorService';
import branchService from '../services/branchService';

export default function MyAppointments() {
  const [view, setView] = useState('list');
  const [filters, setFilters] = useState({ status:'All', branch:'All', doctor:'All', date:'today' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [statuses, setStatuses] = useState(['All','Scheduled','Checked-in','Waiting','In-Progress','Completed','Cancelled','No-show']);
  const [doctors, setDoctors] = useState(['All']);
  const [branches, setBranches] = useState(['All']);

  useEffect(() => {
    fetchAppointmentsData();
  }, []);

  const fetchAppointmentsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch appointments from backend
      const appointmentsData = await appointmentService.getAppointments({});
      const formattedAppointments = (appointmentsData.appointments || []).map(appt => ({
        id: appt.appointment_id,
        patient: appt.patient_name || `Patient ${appt.patient_id}`,
        patientId: `P-${appt.patient_id}`,
        date: new Date(appt.appointment_date).toISOString().split('T')[0],
        time: new Date(appt.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
        doctor: appt.doctor_name || 'Doctor',
        spec: appt.specialty || 'General',
        branch: appt.branch_name || 'Main',
        status: appt.status || 'Scheduled',
        type: appt.appointment_type || 'Consultation',
        duration: 30,
        room: appt.room_number || 'TBD'
      }));
      setItems(formattedAppointments);

      // Fetch doctors for filter
      const doctorsData = await doctorService.getAllDoctors();
      const doctorNames = ['All', ...(doctorsData || []).map(d => d.name)];
      setDoctors(doctorNames);

      // Fetch branches for filter
      const branchesData = await branchService.getAllBranches();
      const branchNames = ['All', ...(branchesData || []).map(b => b.branch_name)];
      setBranches(branchNames);

    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const filtered = items.filter(i => {
    const matchStatus = filters.status==='All' || i.status===filters.status;
    const matchBranch = filters.branch==='All' || i.branch===filters.branch;
    const matchDoctor = filters.doctor==='All' || i.doctor===filters.doctor;
    let matchDate = true;
    if(filters.date==='today') matchDate = i.date==='2025-10-07';
    else if(filters.date==='tomorrow') matchDate = i.date==='2025-10-08';
    else if(filters.date==='this-week') matchDate = new Date(i.date) >= new Date('2025-10-06') && new Date(i.date) <= new Date('2025-10-12');
    return matchStatus && matchBranch && matchDoctor && matchDate;
  });

  const todayStats = {
    total: items.filter(i=>i.date==='2025-10-07').length,
    checkedIn: items.filter(i=>i.date==='2025-10-07' && i.status==='Checked-in').length,
    waiting: items.filter(i=>i.date==='2025-10-07' && i.status==='Waiting').length,
    scheduled: items.filter(i=>i.date==='2025-10-07' && i.status==='Scheduled').length,
  };

  if (loading) {
    return (
      <div style={{padding: '20px', textAlign: 'center'}}>
        <div style={{fontSize: '48px', marginBottom: '20px'}}>⏳</div>
        <h2>Loading Appointments...</h2>
        <p style={{color: '#64748b'}}>Please wait while we fetch the appointment data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{padding: '20px', textAlign: 'center'}}>
        <div style={{fontSize: '48px', marginBottom: '20px'}}>⚠️</div>
        <h2 style={{color: 'var(--accent-red)'}}>Error Loading Appointments</h2>
        <p style={{color: '#64748b', marginBottom: '20px'}}>{error}</p>
        <button className="btn primary" onClick={fetchAppointmentsData}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
        <div>
          <h1 style={{margin:0}}>Appointment Management</h1>
          <p className="label">Manage all patient appointments across branches</p>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn primary">Schedule New Appointment</button>
          <button className="btn">Walk-in Check-in</button>
          <button className="btn">Print Schedule</button>
        </div>
      </div>

      {/* Today's Quick Stats */}
      <div className="grid grid-4 section" style={{marginBottom:16}}>
        <div className="card" style={{textAlign:'center', padding:16}}>
          <div style={{fontSize:28, fontWeight:'bold', color:'var(--primary-black)'}}>{todayStats.total}</div>
          <div className="label">Total Today</div>
        </div>
        <div className="card" style={{textAlign:'center', padding:16}}>
          <div style={{fontSize:28, fontWeight:'bold', color:'var(--accent-red)'}}>{todayStats.checkedIn}</div>
          <div className="label">Checked-In</div>
        </div>
        <div className="card" style={{textAlign:'center', padding:16}}>
          <div style={{fontSize:28, fontWeight:'bold', color:'#c59030'}}>{todayStats.waiting}</div>
          <div className="label">Waiting</div>
        </div>
        <div className="card" style={{textAlign:'center', padding:16}}>
          <div style={{fontSize:28, fontWeight:'bold', color:'var(--primary-black)'}}>{todayStats.scheduled}</div>
          <div className="label">Scheduled</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{marginBottom:16}}>
        <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
          <strong>View:</strong>
          <button className={'btn'+(view==='list'?' primary':'')} onClick={()=>setView('list')}>List View</button>
          <button className={'btn'+(view==='calendar'?' primary':'')} onClick={()=>setView('calendar')}>Calendar</button>
          <div style={{borderLeft:'1px solid #ccc', height:24, margin:'0 8px'}}></div>
          <strong>Date:</strong>
          <select className="select" value={filters.date} onChange={e=>setFilters({...filters, date:e.target.value})}>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="this-week">This Week</option>
            <option value="all">All Dates</option>
          </select>
          <strong>Status:</strong>
          <select className="select" value={filters.status} onChange={e=>setFilters({...filters, status:e.target.value})}>
            {statuses.map(s=><option key={s}>{s}</option>)}
          </select>
          <strong>Doctor:</strong>
          <select className="select" value={filters.doctor} onChange={e=>setFilters({...filters, doctor:e.target.value})}>
            {doctors.map(d=><option key={d}>{d}</option>)}
          </select>
          <strong>Branch:</strong>
          <select className="select" value={filters.branch} onChange={e=>setFilters({...filters, branch:e.target.value})}>
            {branches.map(b => <option key={b}>{b}</option>)}
          </select>
          <button className="btn" onClick={()=>setFilters({status:'All', branch:'All', doctor:'All', date:'today'})}>Reset</button>
        </div>
      </div>

      {/* Appointment List */}
      {view==='list' ? (
        <section className="section">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <h3 style={{margin:0}}>Appointments ({filtered.length})</h3>
            <div className="label">Showing {filtered.length} of {items.length} total appointments</div>
          </div>
          
          {filtered.length === 0 ? (
            <div className="card" style={{textAlign:'center', padding:40}}>
              <div className="label" style={{fontSize:16}}>No appointments found matching the filters</div>
            </div>
          ) : (
            filtered.map(a => (
              <div key={a.id} className="card" style={{marginBottom:8}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                      <strong style={{fontSize:16}}>{a.time}</strong>
                      <span style={{fontSize:18, color:'#ccc'}}>•</span>
                      <strong>{a.patient}</strong>
                      <span className="label">({a.patientId})</span>
                      <span className={`badge ${
                        a.status==='Checked-in'?'badge-success':
                        a.status==='Waiting'?'badge-warn':
                        a.status==='Completed'?'badge-success':
                        a.status==='Cancelled'?'badge-error':''
                      }`} style={{fontSize:11, padding:'4px 8px'}}>
                        {a.status}
                      </span>
                    </div>
                    <div className="label" style={{marginBottom:2}}>
                      {a.doctor} • {a.spec} • Room {a.room} • {a.branch} Branch
                    </div>
                    <div className="label" style={{fontSize:11}}>
                      {a.type} ({a.duration} mins) • {a.date}
                    </div>
                  </div>
                  <div style={{display:'flex', gap:6, flexShrink:0}}>
                    {a.status==='Scheduled' && <button className="btn primary" style={{padding:'6px 12px', fontSize:12}}>Check-In</button>}
                    {a.status==='Checked-in' && <button className="btn" style={{padding:'6px 12px', fontSize:12, background:'var(--accent-red)', color:'white'}}>Start Consult</button>}
                    {a.status==='Waiting' && <button className="btn primary" style={{padding:'6px 12px', fontSize:12}}>Call Patient</button>}
                    {(a.status==='Scheduled'||a.status==='Checked-in') && <button className="btn" style={{padding:'6px 12px', fontSize:12}}>Reschedule</button>}
                    {(a.status==='Scheduled'||a.status==='Checked-in') && <button className="btn warn" style={{padding:'6px 12px', fontSize:12}}>Cancel</button>}
                    <button className="btn" style={{padding:'6px 12px', fontSize:12}}>View Details</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      ) : (
        <section className="card section">
          <h3>Calendar View</h3>
          <div className="label" style={{marginBottom:12}}>Weekly/Monthly appointment schedule with doctor availability</div>
          <div style={{background:'#f5f5f5', padding:20, borderRadius:8, textAlign:'center'}}>
            <div className="label" style={{fontSize:14}}>📅 Calendar visualization will be implemented here</div>
            <div className="slot" style={{height:400, marginTop:12}} />
          </div>
        </section>
      )}

      {/* Appointment Statistics */}
      <section className="card section">
        <h3>Appointment Analytics</h3>
        <div className="grid grid-3">
          <div className="card" style={{padding:16}}>
            <div className="label">This Week</div>
            <div style={{fontSize:24, fontWeight:'bold', marginTop:4}}>68 appointments</div>
            <div className="label" style={{marginTop:4, fontSize:11}}>↑ 12% from last week</div>
          </div>
          <div className="card" style={{padding:16}}>
            <div className="label">No-Show Rate</div>
            <div style={{fontSize:24, fontWeight:'bold', marginTop:4, color:'var(--accent-red)'}}>4.2%</div>
            <div className="label" style={{marginTop:4, fontSize:11}}>3 patients this week</div>
          </div>
          <div className="card" style={{padding:16}}>
            <div className="label">Average Wait Time</div>
            <div style={{fontSize:24, fontWeight:'bold', marginTop:4}}>18 mins</div>
            <div className="label" style={{marginTop:4, fontSize:11}}>Target: 15 mins</div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="card section">
        <h3>Quick Actions</h3>
        <div className="grid grid-4">
          <button className="btn primary" style={{padding:16}}>
            <div style={{fontSize:14, fontWeight:'bold'}}>📋 Print Today's Schedule</div>
          </button>
          <button className="btn" style={{padding:16}}>
            <div style={{fontSize:14, fontWeight:'bold'}}>📧 Send Reminders</div>
          </button>
          <button className="btn" style={{padding:16}}>
            <div style={{fontSize:14, fontWeight:'bold'}}>📊 Export Report</div>
          </button>
          <button className="btn" style={{padding:16}}>
            <div style={{fontSize:14, fontWeight:'bold'}}>⚙️ Manage Slots</div>
          </button>
        </div>
      </section>
    </div>
  );
}
