import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffHeader from '../../components/StaffHeader';
import authService from '../../services/authService';
import '../../styles/staff.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const StaffDoctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [branch, setBranch] = useState('Colombo');
  
  // Modal states
  const [showPerformanceReport, setShowPerformanceReport] = useState(false);
  const [showAvailabilityReport, setShowAvailabilityReport] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Data states
  const [performanceData, setPerformanceData] = useState([]);
  const [availabilityData, setAvailabilityData] = useState([]);
  const [selectedDoctorMetrics, setSelectedDoctorMetrics] = useState(null);
  const [selectedDoctorAnalytics, setSelectedDoctorAnalytics] = useState(null);
  const [selectedDoctorSchedule, setSelectedDoctorSchedule] = useState([]);
  const [selectedDoctorName, setSelectedDoctorName] = useState('');
  
  const currentUser = authService.getCurrentUser();

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
    fetchDoctors();
    fetchPerformanceReport();
    fetchAvailabilityReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      console.log('👨‍⚕️ Fetching doctors from API...');
      
      const response = await fetch(`${API_BASE_URL}/doctors/`, {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Doctors response:', data);
        
        // Handle different response formats
        let doctorsArray = [];
        if (Array.isArray(data)) {
          doctorsArray = data;
        } else if (data.doctors && Array.isArray(data.doctors)) {
          doctorsArray = data.doctors;
        } else if (data.data && Array.isArray(data.data)) {
          doctorsArray = data.data;
        }
        
        console.log(`✅ Loaded ${doctorsArray.length} doctors`);
        setDoctors(doctorsArray);
      } else {
        throw new Error('Failed to fetch doctors');
      }
    } catch (err) {
      console.error('❌ Error fetching doctors:', err);
      setError('Failed to load doctors');
      setDoctors([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  // Fetch performance report for all doctors
  const fetchPerformanceReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/doctors/performance-report`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Performance Report:', data);
        // Handle different response formats
        if (Array.isArray(data)) {
          setPerformanceData(data);
        } else if (data.doctors && Array.isArray(data.doctors)) {
          setPerformanceData(data.doctors);
        } else if (data.performance_data && Array.isArray(data.performance_data)) {
          setPerformanceData(data.performance_data);
        } else {
          console.warn('Unexpected performance data format:', data);
          setPerformanceData([]);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching performance report:', err);
    }
  };

  // Fetch availability report
  const fetchAvailabilityReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/doctors/availability-report`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Availability Report:', data);
        // Handle different response formats
        if (Array.isArray(data)) {
          setAvailabilityData(data);
        } else if (data.doctors && Array.isArray(data.doctors)) {
          setAvailabilityData(data.doctors);
        } else if (data.availability_data && Array.isArray(data.availability_data)) {
          setAvailabilityData(data.availability_data);
        } else {
          console.warn('Unexpected availability data format:', data);
          setAvailabilityData([]);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching availability report:', err);
    }
  };

  // Fetch individual doctor metrics
  const fetchDoctorMetrics = async (doctorId, doctorName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/metrics`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Doctor Metrics:', data);
        setSelectedDoctorMetrics(data);
        setSelectedDoctorName(doctorName);
        setShowMetricsModal(true);
      }
    } catch (err) {
      console.error('❌ Error fetching doctor metrics:', err);
      alert('Failed to load doctor metrics');
    }
  };

  // Fetch doctor consultation analytics
  const fetchDoctorAnalytics = async (doctorId, doctorName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/consultation-analytics`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Doctor Analytics:', data);
        setSelectedDoctorAnalytics(data);
        setSelectedDoctorName(doctorName);
        setShowAnalyticsModal(true);
      }
    } catch (err) {
      console.error('❌ Error fetching doctor analytics:', err);
      alert('Failed to load consultation analytics');
    }
  };

  // Fetch doctor schedule
  const fetchDoctorSchedule = async (doctorId, doctorName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/schedule`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Doctor Schedule:', data);
        setSelectedDoctorSchedule(Array.isArray(data) ? data : data.schedule || []);
        setSelectedDoctorName(doctorName);
        setShowScheduleModal(true);
      }
    } catch (err) {
      console.error('❌ Error fetching doctor schedule:', err);
      alert('Failed to load doctor schedule');
    }
  };

  if (loading) {
    return (
      <div className="staff-container">
        <StaffHeader 
          staffName={currentUser?.fullName || 'Staff'}
          staffRole={currentUser?.userType?.charAt(0).toUpperCase() + currentUser?.userType?.slice(1) || 'Staff'}
          branch={branch}
          setBranch={setBranch}
          onLogout={handleLogout}
        />
        <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>
      </div>
    );
  }

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
          <div>
            <h1>Doctor Directory</h1>
            <p>Manage doctors and view performance • {doctors.length} doctors</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn-primary" 
              onClick={() => setShowPerformanceReport(true)}
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <i className="fas fa-chart-line"></i> Performance Report
            </button>
            <button 
              className="btn-primary" 
              onClick={() => setShowAvailabilityReport(true)}
              style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}
            >
              <i className="fas fa-calendar-check"></i> Availability Report
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="doctors-grid">
          {doctors.length === 0 ? (
            <div className="empty-state"><i className="fas fa-user-md"></i><p>No doctors found</p></div>
          ) : (
            doctors.map((doctor) => (
              <div key={doctor.doctor_id} className="doctor-card" style={{ position: 'relative' }}>
                <div className="doctor-info">
                  <h3>Dr. {doctor.full_name || `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim()}</h3>
                  <p className="specialization">
                    <i className="fas fa-stethoscope"></i> {doctor.specialization || 'General'}
                  </p>
                  <p><i className="fas fa-envelope"></i> {doctor.email || 'N/A'}</p>
                  <p><i className="fas fa-phone"></i> {doctor.contact_num1 || doctor.phone_no || 'N/A'}</p>
                  
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                    <button 
                      onClick={() => fetchDoctorMetrics(doctor.doctor_id, `Dr. ${doctor.full_name || `${doctor.first_name} ${doctor.last_name}`}`)}
                      style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white', 
                        padding: '8px 12px', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <i className="fas fa-chart-bar"></i> Performance Metrics
                    </button>
                    <button 
                      onClick={() => fetchDoctorAnalytics(doctor.doctor_id, `Dr. ${doctor.full_name || `${doctor.first_name} ${doctor.last_name}`}`)}
                      style={{ 
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white', 
                        padding: '8px 12px', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <i className="fas fa-stethoscope"></i> Consultation Analytics
                    </button>
                    <button 
                      onClick={() => fetchDoctorSchedule(doctor.doctor_id, `Dr. ${doctor.full_name || `${doctor.first_name} ${doctor.last_name}`}`)}
                      style={{ 
                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                        color: 'white', 
                        padding: '8px 12px', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <i className="fas fa-calendar-alt"></i> View Schedule
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Performance Report Modal */}
        {showPerformanceReport && (
          <div className="modal-overlay" onClick={() => setShowPerformanceReport(false)}>
            <div className="modal-content" style={{ maxWidth: '1200px', maxHeight: '85vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <h2><i className="fas fa-chart-line"></i> All Doctors Performance Report</h2>
                <button className="btn-close" onClick={() => setShowPerformanceReport(false)} style={{ color: 'white' }}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                {performanceData.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="staff-table">
                      <thead>
                        <tr>
                          <th>Doctor</th>
                          <th>Specialization</th>
                          <th>Total Patients</th>
                          <th>Consultations</th>
                          <th>Avg Rating</th>
                          <th>Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {performanceData.map((doc, idx) => (
                          <tr key={idx}>
                            <td><strong>Dr. {doc.doctor_name || doc.full_name}</strong></td>
                            <td>{doc.specialization || 'General'}</td>
                            {/* <td>{doc.total_patients || 0}</td>
                            <td>{doc.total_consultations || 0}</td> */}
                            <td>
                              <span style={{ color: '#f59e0b' }}>
                                <i className="fas fa-star"></i> {doc.avg_rating?.toFixed(1) || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <span style={{ 
                                padding: '4px 12px', 
                                borderRadius: '12px',
                                background: (doc.total_consultations || 0) > 50 ? '#d1fae5' : '#fef3c7',
                                color: (doc.total_consultations || 0) > 50 ? '#065f46' : '#92400e',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                {(doc.total_consultations || 0) > 50 ? 'Excellent' : 'Good'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <i className="fas fa-chart-line" style={{ fontSize: '48px', marginBottom: '16px', color: '#d1d5db' }}></i>
                    <p style={{ fontSize: '18px', fontWeight: '500' }}>No performance data available</p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-primary" onClick={() => setShowPerformanceReport(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Availability Report Modal */}
        {showAvailabilityReport && (
          <div className="modal-overlay" onClick={() => setShowAvailabilityReport(false)}>
            <div className="modal-content" style={{ maxWidth: '1100px', maxHeight: '85vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}>
                <h2><i className="fas fa-calendar-check"></i> Doctor Availability Report</h2>
                <button className="btn-close" onClick={() => setShowAvailabilityReport(false)} style={{ color: 'white' }}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                {availabilityData.length > 0 ? (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {availabilityData.map((doc, idx) => (
                      <div key={idx} style={{ 
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div>
                            <h3 style={{ margin: 0, color: '#1f2937' }}>Dr. {doc.doctor_name || doc.full_name}</h3>
                            <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                              <i className="fas fa-stethoscope"></i> {doc.specialization || 'General'}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                              {doc.available_slots || 0}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Available Slots</div>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
                          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>{doc.total_slots || 0}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Slots</div>
                          </div>
                          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>{doc.booked_slots || 0}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Booked</div>
                          </div>
                          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>
                              {doc.total_slots > 0 ? ((doc.booked_slots / doc.total_slots) * 100).toFixed(0) : 0}%
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Utilization</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <i className="fas fa-calendar-times" style={{ fontSize: '48px', marginBottom: '16px', color: '#d1d5db' }}></i>
                    <p style={{ fontSize: '18px', fontWeight: '500' }}>No availability data found</p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-primary" onClick={() => setShowAvailabilityReport(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Doctor Metrics Modal */}
        {showMetricsModal && selectedDoctorMetrics && (
          <div className="modal-overlay" onClick={() => setShowMetricsModal(false)}>
            <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '85vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <h2><i className="fas fa-chart-bar"></i> Performance Metrics - {selectedDoctorName}</h2>
                <button className="btn-close" onClick={() => setShowMetricsModal(false)} style={{ color: 'white' }}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', padding: '20px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{selectedDoctorMetrics.unique_patients || 0}</div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Unique Patients</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', padding: '20px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{selectedDoctorMetrics.total_consultations || 0}</div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Consultations</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white', padding: '20px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{selectedDoctorMetrics.completed_consultations || 0}</div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Completed</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', padding: '20px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{selectedDoctorMetrics.cancelled_appointments || 0}</div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>Cancelled</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', padding: '20px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{selectedDoctorMetrics.no_shows || 0}</div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>No Shows</div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '2px solid #10b981' }}>
                    <div style={{ fontSize: '14px', color: '#065f46', marginBottom: '8px', fontWeight: '600' }}>Completion Rate</div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981' }}>
                      {selectedDoctorMetrics.completion_rate || 0}%
                    </div>
                  </div>
                  <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px', border: '2px solid #f59e0b' }}>
                    <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '8px', fontWeight: '600' }}>No Show Rate</div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f59e0b' }}>
                      {selectedDoctorMetrics.no_show_rate || 0}%
                    </div>
                  </div>
                </div>

                {/* Revenue Information */}
                <div style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}><i className="fas fa-dollar-sign"></i> Revenue Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Consultation Fee</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        LKR {selectedDoctorMetrics.consultation_fee?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Total Revenue</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        LKR {selectedDoctorMetrics.total_revenue?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Avg Per Consultation</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        LKR {selectedDoctorMetrics.avg_revenue_per_consultation?.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Availability Status */}
                <div style={{ 
                  background: selectedDoctorMetrics.is_available ? '#d1fae5' : '#fee2e2',
                  padding: '16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: selectedDoctorMetrics.is_available ? '#065f46' : '#991b1b'
                  }}>
                    <i className={`fas fa-${selectedDoctorMetrics.is_available ? 'check-circle' : 'times-circle'}`}></i>
                    {' '}{selectedDoctorMetrics.is_available ? 'Currently Available' : 'Currently Unavailable'}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-primary" onClick={() => setShowMetricsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Consultation Analytics Modal */}
        {showAnalyticsModal && selectedDoctorAnalytics && (
          <div className="modal-overlay" onClick={() => setShowAnalyticsModal(false)}>
            <div className="modal-content" style={{ maxWidth: '1000px', maxHeight: '85vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <h2><i className="fas fa-stethoscope"></i> Consultation Analytics - {selectedDoctorName}</h2>
                <button className="btn-close" onClick={() => setShowAnalyticsModal(false)} style={{ color: 'white' }}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>
                      {selectedDoctorAnalytics.total_consultations || 0}
                    </div>
                    <div style={{ fontSize: '14px', color: '#1e40af', marginTop: '4px' }}>Total Consultations</div>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>
                      {selectedDoctorAnalytics.avg_consultations_per_day?.toFixed(1) || 0}
                    </div>
                    <div style={{ fontSize: '14px', color: '#065f46', marginTop: '4px' }}>Avg/Day</div>
                  </div>
                  <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>
                      {selectedDoctorAnalytics.unique_patients || 0}
                    </div>
                    <div style={{ fontSize: '14px', color: '#92400e', marginTop: '4px' }}>Unique Patients</div>
                  </div>
                </div>

                {selectedDoctorAnalytics.common_diagnoses && selectedDoctorAnalytics.common_diagnoses.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '16px' }}>Common Diagnoses</h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {selectedDoctorAnalytics.common_diagnoses.map((diag, idx) => (
                        <div key={idx} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          background: '#f9fafb', 
                          padding: '12px 16px', 
                          borderRadius: '8px' 
                        }}>
                          <span style={{ fontWeight: '500' }}>{diag.diagnosis}</span>
                          <span style={{ 
                            background: '#3b82f6', 
                            color: 'white', 
                            padding: '4px 12px', 
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}>
                            {diag.count} cases
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDoctorAnalytics.monthly_trend && selectedDoctorAnalytics.monthly_trend.length > 0 && (
                  <div>
                    <h3 style={{ marginBottom: '16px' }}>Monthly Consultation Trend</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '200px' }}>
                      {selectedDoctorAnalytics.monthly_trend.map((month, idx) => (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#667eea' }}>{month.count}</div>
                          <div style={{ 
                            width: '100%', 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '4px 4px 0 0',
                            height: `${(month.count / Math.max(...selectedDoctorAnalytics.monthly_trend.map(m => m.count))) * 150}px`,
                            minHeight: '20px'
                          }}></div>
                          <div style={{ fontSize: '10px', color: '#6b7280' }}>{month.month}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-primary" onClick={() => setShowAnalyticsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Doctor Schedule Modal */}
        {showScheduleModal && (
          <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
            <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '85vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}>
                <h2><i className="fas fa-calendar-alt"></i> Schedule - {selectedDoctorName}</h2>
                <button className="btn-close" onClick={() => setShowScheduleModal(false)} style={{ color: 'white' }}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                {selectedDoctorSchedule.length > 0 ? (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {selectedDoctorSchedule.map((slot, idx) => (
                      <div key={idx} style={{ 
                        background: 'white',
                        border: '2px solid #d1fae5',
                        borderRadius: '12px',
                        padding: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                            <i className="fas fa-calendar"></i> {new Date(slot.date || slot.available_date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div style={{ fontSize: '16px', color: '#6b7280' }}>
                            <i className="fas fa-clock"></i> {slot.start_time} - {slot.end_time}
                          </div>
                          {slot.branch_name && (
                            <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>
                              <i className="fas fa-map-marker-alt"></i> {slot.branch_name}
                            </div>
                          )}
                        </div>
                        <div>
                          <span style={{ 
                            padding: '8px 20px', 
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: '600',
                            background: slot.is_available !== false ? '#d1fae5' : '#fee2e2',
                            color: slot.is_available !== false ? '#065f46' : '#991b1b'
                          }}>
                            {slot.is_available !== false ? 'Available' : 'Booked'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <i className="fas fa-calendar-times" style={{ fontSize: '48px', marginBottom: '16px', color: '#d1d5db' }}></i>
                    <p style={{ fontSize: '18px', fontWeight: '500' }}>No schedule found</p>
                    <p style={{ fontSize: '14px' }}>This doctor hasn't set up their schedule yet.</p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-primary" onClick={() => setShowScheduleModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDoctors;
