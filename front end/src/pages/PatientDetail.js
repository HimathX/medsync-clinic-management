import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import patientDataService from '../services/patientDataService';
import '../styles/patientDetail.css';

const PatientDetail = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data for activities, appointments, and health metrics
  const [recentActivity] = useState([
    {
      id: 1,
      type: 'appointment',
      icon: '✓',
      title: 'Completed Appointment',
      description: 'Annual checkup with Dr. Smith',
      time: '2 hours ago',
      status: 'completed'
    },
    {
      id: 2,
      type: 'lab',
      icon: '🧪',
      title: 'Lab Results Available',
      description: 'Blood work results are ready to view',
      time: '1 day ago',
      status: 'available'
    },
    {
      id: 3,
      type: 'payment',
      icon: '$',
      title: 'Payment Received',
      description: 'Payment of $125.00 processed',
      time: '3 days ago',
      status: 'received'
    },
    {
      id: 4,
      type: 'prescription',
      icon: '💊',
      title: 'Prescription Refilled',
      description: 'Lisinopril 10mg - 30 day supply',
      time: '5 days ago',
      status: 'refilled'
    },
    {
      id: 5,
      type: 'appointment',
      icon: '📅',
      title: 'Appointment Scheduled',
      description: 'Cardiology follow-up with Dr. Smith',
      time: '1 week ago',
      status: 'scheduled'
    }
  ]);

  const [financialSummary] = useState({
    outstandingBalance: 150.00,
    recentPayments: 370.00,
    recentTransactions: [
      {
        id: 1,
        type: 'Office Visit Co-pay',
        date: 'Sep 28, 2025',
        amount: 125.00
      },
      {
        id: 2,
        type: 'Lab Work Co-pay',
        date: 'Sep 15, 2025',
        amount: 45.00
      },
      {
        id: 3,
        type: 'Specialist Consultation',
        date: 'Aug 30, 2025',
        amount: 200.00
      }
    ]
  });

  const [upcomingAppointments] = useState([
    {
      id: 1,
      doctor: 'Dr. Sarah Smith',
      specialty: 'Cardiology',
      date: 'Oct 3, 2025',
      time: '2:00 PM',
      location: 'Downtown Medical Center',
      status: 'Confirmed'
    },
    {
      id: 2,
      doctor: 'Dr. Michael Johnson',
      specialty: 'General Practice',
      date: 'Oct 8, 2025',
      time: '10:30 AM',
      location: 'Virtual Consultation',
      status: 'Scheduled'
    },
    {
      id: 3,
      doctor: 'Dr. Emily Chen',
      specialty: 'Dermatology',
      date: 'Oct 15, 2025',
      time: '3:45 PM',
      location: 'Westside Clinic',
      status: 'Scheduled'
    }
  ]);

  const [healthMetrics] = useState({
    heartRate: {
      value: 72,
      unit: 'bpm',
      trend: 'stable',
      lastUpdated: '2 hours ago',
      icon: '💓'
    },
    bloodPressure: {
      systolic: 120,
      diastolic: 80,
      unit: 'mmHg',
      trend: 'elevated',
      lastUpdated: '1 day ago',
      icon: '🩺'
    },
    bloodSugar: {
      value: 95,
      unit: 'mg/dL',
      trend: 'normal',
      lastUpdated: '3 hours ago',
      icon: '🩸'
    },
    weight: {
      value: 165,
      unit: 'lbs',
      percentage: 100,
      lastUpdated: '1 week ago',
      icon: '⚖️'
    }
  });

  useEffect(() => {
    if (patientId) {
      const patientData = patientDataService.getPatientById(patientId);
      if (patientData) {
        setPatient(patientData);
      } else {
        navigate('/patient-portal');
      }
      setLoading(false);
    }
  }, [patientId, navigate]);

  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getActivityIcon = (type, status) => {
    const iconMap = {
      appointment: status === 'completed' ? '✅' : '📅',
      lab: '🧪',
      payment: '💰',
      prescription: '💊'
    };
    return iconMap[type] || '📋';
  };

  const getStatusColor = (status) => {
    const colorMap = {
      completed: 'success',
      available: 'info',
      received: 'success',
      refilled: 'success',
      scheduled: 'primary',
      Confirmed: 'success',
      Scheduled: 'primary'
    };
    return colorMap[status] || 'secondary';
  };

  const getTrendIcon = (trend) => {
    const trendMap = {
      stable: '→',
      elevated: '↑',
      normal: '✓',
      improving: '↗'
    };
    return trendMap[trend] || '→';
  };

  if (loading) {
    return (
      <div className="patient-detail loading">
        <div className="loading-spinner">Loading patient details...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="patient-detail error">
        <h2>Patient Not Found</h2>
        <Link to="/patient-portal" className="btn primary">Back to Patient Portal</Link>
      </div>
    );
  }

  return (
    <div className="patient-detail">
      {/* Header Section */}
      <div className="patient-header">
        <div className="header-content">
          <div className="patient-info">
            <div className="patient-avatar">
              {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
            </div>
            <div className="patient-basic-info">
              <h1>Welcome back, {patient.firstName}</h1>
              <p className="date">{getCurrentDate()}</p>
              <div className="notification-badge">
                <span className="notification-count">3</span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <Link to="/patient-portal" className="btn secondary">
              ← Back to Portal
            </Link>
          </div>
        </div>
        
        {/* Medical Center Info */}
        <div className="medical-center-info">
          <div className="info-icon">🏥</div>
          <div className="info-text">
            <strong>MedSync Medical Center - {patient.branch}</strong>
            <p>Extended hours this weekend - Saturday & Sunday 9 AM - 5 PM</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="patient-content">
        {/* Left Column */}
        <div className="left-column">
          {/* Quick Actions */}
          <section className="card quick-actions">
            <h3>⚡ Quick Actions</h3>
            <div className="actions-grid">
              <button className="action-btn">
                <div className="action-icon">📅</div>
                <span>Book Appointment</span>
              </button>
              <button className="action-btn">
                <div className="action-icon">📋</div>
                <span>View Records</span>
              </button>
              <button className="action-btn" onClick={() => navigate(`/billing?patientId=${patientId}`)}>
                <div className="action-icon">💰</div>
                <span>Make Payment</span>
              </button>
              <button className="action-btn">
                <div className="action-icon">💬</div>
                <span>Messages</span>
              </button>
              <button className="action-btn">
                <div className="action-icon">💊</div>
                <span>Prescriptions</span>
              </button>
              <button className="action-btn emergency">
                <div className="action-icon">🚨</div>
                <span>Emergency</span>
              </button>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="card recent-activity">
            <h3>⚡ Recent Activity</h3>
            <div className="activity-list">
              {recentActivity.map(activity => (
                <div key={activity.id} className={`activity-item ${activity.type}`}>
                  <div className={`activity-icon ${getStatusColor(activity.status)}`}>
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                  <div className="activity-content">
                    <h4>{activity.title}</h4>
                    <p>{activity.description}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="right-column">
          {/* Financial Summary */}
          <section className="card financial-summary">
            <h3>💰 Financial Summary</h3>
            <div className="financial-cards">
              <div className="financial-card outstanding">
                <div className="card-icon">⚠️</div>
                <div className="card-content">
                  <span className="card-label">Outstanding Balance</span>
                  <span className="card-amount">${financialSummary.outstandingBalance.toFixed(2)}</span>
                </div>
              </div>
              <div className="financial-card payments">
                <div className="card-icon">📈</div>
                <div className="card-content">
                  <span className="card-label">Recent Payments</span>
                  <span className="card-amount">${financialSummary.recentPayments.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="recent-transactions">
              <h4>Recent Transactions</h4>
              {financialSummary.recentTransactions.map(transaction => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-icon">💳</div>
                  <div className="transaction-details">
                    <span className="transaction-type">{transaction.type}</span>
                    <span className="transaction-date">{transaction.date}</span>
                  </div>
                  <span className="transaction-amount">${transaction.amount.toFixed(2)}</span>
                </div>
              ))}
              <button className="btn primary full-width make-payment-btn" onClick={() => navigate(`/billing?patientId=${patientId}`)}>
                💰 Make Payment
              </button>
            </div>
          </section>

          {/* Upcoming Appointments */}
          <section className="card upcoming-appointments">
            <div className="section-header">
              <h3>📅 Upcoming Appointments</h3>
              <button className="btn link">View All</button>
            </div>
            <div className="appointments-list">
              {upcomingAppointments.map(appointment => (
                <div key={appointment.id} className="appointment-item">
                  <div className="appointment-info">
                    <h4>{appointment.doctor}</h4>
                    <span className="specialty">{appointment.specialty}</span>
                    <div className="appointment-details">
                      <span className="date">📅 {appointment.date}</span>
                      <span className="time">🕐 {appointment.time}</span>
                      <span className="location">📍 {appointment.location}</span>
                    </div>
                  </div>
                  <div className={`appointment-status ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Health Metrics Section */}
      <section className="card health-metrics full-width">
        <div className="section-header">
          <h3>📊 Health Metrics</h3>
          <button className="btn link">View Details</button>
        </div>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">{healthMetrics.heartRate.icon}</span>
              <span className="metric-name">Heart Rate</span>
            </div>
            <div className="metric-value">
              <span className="value">{healthMetrics.heartRate.value}</span>
              <span className="unit">{healthMetrics.heartRate.unit}</span>
              <span className="trend">{getTrendIcon(healthMetrics.heartRate.trend)}</span>
            </div>
            <div className="metric-updated">Updated {healthMetrics.heartRate.lastUpdated}</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">{healthMetrics.bloodPressure.icon}</span>
              <span className="metric-name">Blood Pressure</span>
            </div>
            <div className="metric-value">
              <span className="value">{healthMetrics.bloodPressure.systolic}/{healthMetrics.bloodPressure.diastolic}</span>
              <span className="unit">{healthMetrics.bloodPressure.unit}</span>
              <span className="trend elevated">{getTrendIcon(healthMetrics.bloodPressure.trend)}</span>
            </div>
            <div className="metric-updated">Updated {healthMetrics.bloodPressure.lastUpdated}</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">{healthMetrics.bloodSugar.icon}</span>
              <span className="metric-name">Blood Sugar</span>
            </div>
            <div className="metric-value">
              <span className="value">{healthMetrics.bloodSugar.value}</span>
              <span className="unit">{healthMetrics.bloodSugar.unit}</span>
              <span className="trend">{getTrendIcon(healthMetrics.bloodSugar.trend)}</span>
            </div>
            <div className="metric-updated">Updated {healthMetrics.bloodSugar.lastUpdated}</div>
          </div>

          <div className="metric-card weight-card">
            <div className="metric-header">
              <span className="metric-icon">{healthMetrics.weight.icon}</span>
              <span className="metric-name">Weight</span>
            </div>
            <div className="weight-display">
              <div className="weight-circle">
                <div className="weight-percentage">{healthMetrics.weight.percentage}%</div>
              </div>
              <div className="weight-value">
                <span className="value">{healthMetrics.weight.value}</span>
                <span className="unit">{healthMetrics.weight.unit}</span>
              </div>
            </div>
            <div className="metric-updated">Updated {healthMetrics.weight.lastUpdated}</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PatientDetail;