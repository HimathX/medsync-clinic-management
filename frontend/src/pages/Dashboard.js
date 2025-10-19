// src/pages/Dashboard.js - Staff/Admin Dashboard
import React, { useState, useEffect } from 'react';
import dashboardService from '../services/dashboardService';
import branchService from '../services/branchService';
import doctorService from '../services/doctorService';

export default function Dashboard({ user }) {
  const today = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    checkedIn: 0,
    completed: 0,
    cancelled: 0,
    newPatients: 0,
    pendingBills: 0,
    totalRevenue: '0',
    outstandingBalance: '0'
  });
  const [branches, setBranches] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true); // Start loading
    setError(null);   // Clear previous errors
    
    try {
      const res = await dashboardService.getStaffDashboardStats();
      const stats = res?.stats || {};
      const todayAppointments = res?.todayAppointments || [];

      // NORMALIZE doctors response
      const doctorsData = res?.doctors ?? [];
      const doctorsList = Array.isArray(doctorsData)
        ? doctorsData
        : (doctorsData?.doctors || []);

      setStats(stats);
      setTodayAppointments(todayAppointments);
      setDoctors(doctorsList.slice(0, 10));
      
      // Fetch additional data
      const activities = await dashboardService.getRecentActivity(5).catch(() => []);
      const notifs = await dashboardService.getNotifications().catch(() => []);
      
      setRecentActivity(activities);
      setNotifications(notifs);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false); // Always stop loading, success or failure
    }
  }

  if (loading) {
    return (
      <div style={{padding: '20px', textAlign: 'center'}}>
        <div style={{fontSize: '48px', marginBottom: '20px'}}>⏳</div>
        <h2>Loading Dashboard...</h2>
        <p style={{color: '#64748b'}}>Please wait while we fetch your data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{padding: '20px', textAlign: 'center'}}>
        <div style={{fontSize: '48px', marginBottom: '20px'}}>⚠️</div>
        <h2 style={{color: 'var(--accent-red)'}}>Error Loading Dashboard</h2>
        <p style={{color: '#64748b', marginBottom: '20px'}}>{error}</p>
        <button className="btn primary" onClick={fetchDashboardData}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header Section */}
      <section className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <h1 style={{marginTop:0}}>Staff Dashboard - {user.branch}</h1>
            <p className="label">{today} • {currentTime} • {user.role || 'Staff Member'}</p>
          </div>
          <div style={{display:'flex', gap:8}}>
            <a href="#/patients" className="btn primary">Register New Patient</a>
            <a href="#/book" className="btn">Schedule Appointment</a>
            <button className="btn warn">Emergency Check-in</button>
          </div>
        </div>
      </section>

      {/* Quick Stats Overview */}
      <div className="grid grid-4 section">
        <div className="card" style={{textAlign:'center', padding:'20px'}}>
          <div style={{fontSize:'32px', fontWeight:'bold', color:'var(--accent-red)'}}>{stats.totalAppointments}</div>
          <div className="label">Today's Appointments</div>
        </div>
        <div className="card" style={{textAlign:'center', padding:'20px'}}>
          <div style={{fontSize:'32px', fontWeight:'bold', color:'var(--primary-black)'}}>{stats.checkedIn}</div>
          <div className="label">Patients Checked-In</div>
        </div>
        <div className="card" style={{textAlign:'center', padding:'20px'}}>
          <div style={{fontSize:'32px', fontWeight:'bold', color:'var(--primary-black)'}}>{stats.newPatients}</div>
          <div className="label">New Registrations</div>
        </div>
        <div className="card" style={{textAlign:'center', padding:'20px'}}>
          <div style={{fontSize:'32px', fontWeight:'bold', color:'var(--accent-red)'}}>LKR {stats.totalRevenue}</div>
          <div className="label">Today's Revenue</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-3 section" style={{gridTemplateColumns:'2fr 1fr 1fr'}}>
        {/* Today's Appointments */}
        <section className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <h3 style={{margin:0}}>Today's Appointments</h3>
            <span className="label">{stats.totalAppointments} total • {stats.checkedIn} checked-in</span>
          </div>
          {todayAppointments.map(a => (
            <div key={a.id} className="slot" style={{marginBottom:8}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div><strong>{a.time}</strong> — {a.patient} ({a.patientId})</div>
                  <div className="label">{a.doctor} • {a.specialty}</div>
                </div>
                <div style={{display:'flex', gap:6, alignItems:'center'}}>
                  <span className={`badge ${a.status === 'Checked-in' ? 'badge-success' : a.status === 'Waiting' ? 'badge-warn' : ''}`} style={{fontSize:11, padding:'4px 8px'}}>
                    {a.status}
                  </span>
                  <button className="btn" style={{padding:'4px 12px', fontSize:12}}>View</button>
                </div>
              </div>
            </div>
          ))}
          <div style={{display:'flex', gap:8, marginTop:12}}>
            <a href="#/appointments" className="btn link">View All Appointments</a>
            <a href="#/patients" className="btn link">Search Patients</a>
          </div>
        </section>

        {/* Pending Tasks */}
        <section className="card">
          <h3>Pending Tasks</h3>
          <ul className="label" style={{marginTop:8, lineHeight:1.8}}>
            <li><strong>3</strong> Insurance claims to process</li>
            <li><strong>5</strong> Lab results to upload</li>
            <li><strong>12</strong> Pending bill payments</li>
            <li><strong>2</strong> Treatment plans awaiting approval</li>
            <li><strong>4</strong> Prescription refills needed</li>
          </ul>
          <button className="btn primary" style={{marginTop:12, width:'100%'}}>View All Tasks</button>
        </section>

        {/* Financial Summary */}
        <section className="card">
          <h3>Financial Summary</h3>
          <div style={{marginTop:12}}>
            <div className="card" style={{marginBottom:8, padding:12}}>
              <div className="label">Today's Revenue</div>
              <div style={{fontWeight:800, fontSize:18, color:'var(--accent-red)'}}>LKR {stats.totalRevenue}</div>
            </div>
            <div className="card" style={{marginBottom:8, padding:12}}>
              <div className="label">Pending Collections</div>
              <div style={{fontWeight:800, fontSize:18}}>LKR {stats.outstandingBalance}</div>
            </div>
            <div className="card" style={{padding:12}}>
              <div className="label">Unpaid Bills</div>
              <div style={{fontWeight:800, fontSize:18}}>{stats.pendingBills} patients</div>
            </div>
          </div>
          <a href="#/billing" className="btn" style={{marginTop:12, width:'100%'}}>Billing Management</a>
        </section>
      </div>

      {/* Recent Activity and Notifications */}
      <div className="grid grid-2 section">
        <section className="card">
          <h3>Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="label">No recent activity</p>
          ) : (
            <ul className="label" style={{lineHeight:1.8}}>
              {recentActivity.map((activity, idx) => (
                <li key={idx}>
                  <strong>{new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> — {activity.description}
                </li>
              ))}
            </ul>
          )}
          <button className="btn link" style={{marginTop:8}} onClick={fetchDashboardData}>Refresh Activity</button>
        </section>

        <section className="card">
          <h3>Staff Notifications</h3>
          {notifications.map(n => (
            <div key={n.id} className="slot" style={{marginBottom:8, borderLeft: n.priority === 'high' ? '3px solid var(--accent-red)' : '3px solid transparent', paddingLeft:8}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex', alignItems:'center', gap:6}}>
                    <strong style={{color: n.priority === 'high' ? 'var(--accent-red)' : 'inherit'}}>{n.type}</strong>
                    {n.priority === 'high' && <span style={{color:'var(--accent-red)', fontSize:16}}>⚠</span>}
                  </div>
                  <div className="label" style={{marginTop:2}}>{n.text}</div>
                </div>
                <span className="label" style={{fontSize:11, whiteSpace:'nowrap'}}>{n.when}</span>
              </div>
            </div>
          ))}
          <button className="btn link" style={{marginTop:8}}>View All Notifications</button>
        </section>
      </div>

      {/* Doctor Availability & Branch Status */}
      <div className="grid grid-2 section">
        <section className="card">
          <h3>Doctor Availability Today</h3>
          <div style={{marginTop:12}}>
            {doctors.length === 0 ? (
              <p className="label">No doctors available</p>
            ) : (
              doctors.map(doc => (
                <div key={doc.id} className="slot" style={{marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div>
                    <strong>{doc.name}</strong>
                    <div className="label">{doc.specialty} • Room {doc.room}</div>
                  </div>
                  <span className="badge badge-success" style={{fontSize:11}}>{doc.status}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="card">
          <h3>Branch Status</h3>
          <div className="grid grid-3" style={{marginTop:12}}>
            {branches.length === 0 ? (
              <p className="label">No branch data available</p>
            ) : (
              branches.slice(0, 3).map(branch => (
                <div key={branch.branch_id} className="card" style={{textAlign:'center'}}>
                  <strong>{branch.branch_name || 'Branch'}</strong>
                  <p className="label" style={{margin:'4px 0'}}>{branch.contact_num || 'N/A'}</p>
                  <span className="badge badge-success" style={{fontSize:10}}>Open</span>
                </div>
              ))
            )}
          </div>
          <div style={{marginTop:16, padding:12, background:'#f5f5f5', borderRadius:8}}>
            <div className="label" style={{marginBottom:4}}>Quick Stats Across All Branches</div>
            <div style={{fontSize:12}}>
              <strong>{stats.totalAppointments}</strong> total appointments • <strong>{stats.newPatients}</strong> new patients • <strong>LKR {stats.totalRevenue}</strong> total revenue
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
