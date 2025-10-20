import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffHeader from '../../components/StaffHeader';
import authService from '../../services/authService';
import '../../styles/staff.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const hasCheckedAuth = useRef(false); // Prevent multiple auth checks
  const [staffInfo, setStaffInfo] = useState(null);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    totalPatients: 0,
    totalRevenue: 0,
    pendingAppointments: 0,
    completedAppointments: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [branch, setBranch] = useState('Colombo');

  const handleLogout = () => {
    authService.logout();
    navigate('/staff-login');
  };

  // Check authentication only ONCE when component mounts
  useEffect(() => {
    // Prevent multiple executions
    if (hasCheckedAuth.current) {
      console.log('Auth already checked, skipping');
      return;
    }
    hasCheckedAuth.current = true;

    // Use authService to read the current user (keeps key naming consistent)
    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.userId || localStorage.getItem('userId') || localStorage.getItem('user_id');
    const userType = currentUser?.userType || localStorage.getItem('userType') || localStorage.getItem('user_type');
    const fullName = currentUser?.fullName || localStorage.getItem('fullName') || localStorage.getItem('full_name');
    const role = currentUser?.role || localStorage.getItem('role');

    console.log('Auth check:', { userId, userType, fullName, role });

    if (!userId || !userType) {
      console.log('No auth found, redirecting to login');
      navigate('/staff-login', { replace: true });
      return;
    }

    // Set user info
    setStaffInfo({
      userId,
      userType,
      fullName,
      role,
    });

    // Fetch dashboard data after auth check
    fetchDashboardData();
    setLoading(false);
  }, [navigate]); // Only navigate as dependency

  const fetchDashboardData = async () => {
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch all data in parallel
      const [appointmentsRes, patientsRes, invoiceStatsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/appointments/`, { headers }),
        fetch(`${API_BASE_URL}/patients/`, { headers }),
        fetch(`${API_BASE_URL}/invoices/statistics/summary`, { headers })
      ]);

      const appointments = appointmentsRes.ok ? await appointmentsRes.json() : [];
      const patients = patientsRes.ok ? await patientsRes.json() : [];
      const invoiceStats = invoiceStatsRes.ok ? await invoiceStatsRes.json() : {};

      // Handle nested response structures
      const appointmentsArray = Array.isArray(appointments) 
        ? appointments 
        : (appointments.appointments || appointments.data || appointments.results || []);
      
      const patientsArray = Array.isArray(patients) 
        ? patients 
        : (patients.patients || patients.data || patients.results || []);

      // Calculate today's appointments
      const today = new Date().toISOString().split('T')[0];
      const todayAppts = appointmentsArray.filter(apt => {
        const aptDate = apt.appointment_date ? new Date(apt.appointment_date).toISOString().split('T')[0] : '';
        return aptDate === today;
      });

      // Calculate statistics
      setStats({
        totalAppointments: appointmentsArray.length,
        todayAppointments: todayAppts.length,
        totalPatients: patientsArray.length,
        totalRevenue: invoiceStats.total_revenue || 0,
        pendingAppointments: appointmentsArray.filter(a => a.status === 'Scheduled' || a.status === 'Pending').length,
        completedAppointments: appointmentsArray.filter(a => a.status === 'Completed').length
      });

      // Get recent appointments
      setRecentAppointments(appointmentsArray.slice(0, 5));

    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load dashboard data');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // If no user info after loading, don't render anything (redirect is happening)
  if (!staffInfo) {
    return null;
  }

  return (
    <div className="staff-container">
      <StaffHeader 
        staffName={staffInfo?.fullName || 'Staff'}
        staffRole={staffInfo?.userType?.charAt(0).toUpperCase() + staffInfo?.userType?.slice(1) || 'Staff'}
        branch={branch}
        setBranch={setBranch}
        onLogout={handleLogout}
      />
      <div className="staff-content">
        <div className="staff-header">
          <h1>Staff Dashboard</h1>
          <p>Welcome back, {staffInfo?.fullName}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon"><i className="fas fa-calendar-check"></i></div>
            <div className="stat-content">
              <h3>{stats.totalAppointments}</h3>
              <p>Total Appointments</p>
            </div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-icon"><i className="fas fa-calendar-day"></i></div>
            <div className="stat-content">
              <h3>{stats.todayAppointments}</h3>
              <p>Today's Appointments</p>
            </div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-icon"><i className="fas fa-users"></i></div>
            <div className="stat-content">
              <h3>{stats.totalPatients}</h3>
              <p>Total Patients</p>
            </div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-icon"><i className="fas fa-money-bill-wave"></i></div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.totalRevenue)}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Appointments</h2>
            <button className="btn-view-all" onClick={() => navigate('/staff/appointments')}>
              View All <i className="fas fa-arrow-right"></i>
            </button>
          </div>
          <div className="table-container">
            {recentAppointments.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-calendar-alt"></i>
                <p>No appointments found</p>
              </div>
            ) : (
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((apt) => (
                    <tr key={apt.appointment_id}>
                      <td>#{apt.appointment_id}</td>
                      <td>Patient #{apt.patient_id}</td>
                      <td>{formatDate(apt.appointment_date)}</td>
                      <td><span className={`status-badge status-${apt.status?.toLowerCase()}`}>{apt.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn btn-primary" onClick={() => navigate('/staff/appointments')}>
              <i className="fas fa-calendar-plus"></i>
              <span>Appointments</span>
            </button>
            <button className="action-btn btn-success" onClick={() => navigate('/staff/patients')}>
              <i className="fas fa-user-plus"></i>
              <span>Patients</span>
            </button>
            <button className="action-btn btn-info" onClick={() => navigate('/staff/billing')}>
              <i className="fas fa-file-invoice-dollar"></i>
              <span>Billing</span>
            </button>
            <button className="action-btn btn-warning" onClick={() => navigate('/staff/reports')}>
              <i className="fas fa-chart-bar"></i>
              <span>Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
