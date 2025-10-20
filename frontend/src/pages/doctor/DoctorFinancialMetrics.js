// src/pages/doctor/DoctorFinancialMetrics.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorHeader from '../../components/DoctorHeader';
import authService from '../../services/authService';
import '../../styles/doctor.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DoctorFinancialMetrics = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const doctorId = currentUser?.userId || currentUser?.doctor_id;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all'); // all, month, week

  useEffect(() => {
    if (!currentUser) {
      navigate('/doctor-login', { replace: true });
      return;
    }
    if (doctorId) {
      fetchFinancialMetrics();
    }
  }, []); // Empty dependency array - fetch only on mount

  const fetchFinancialMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/invoices/doctor/${doctorId}/financial-stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch financial metrics');
      
      const data = await response.json();
      setMetrics(data);
      console.log('📊 Financial metrics loaded:', data);
    } catch (err) {
      console.error('Error fetching financial metrics:', err);
      setError('Failed to load financial data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const calculatePercentage = (part, total) => {
    if (!total || total === 0) return 0;
    return ((part / total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="doctor-container">
        <DoctorHeader />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading financial metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="doctor-container">
        <DoctorHeader />
        <div className="doctor-content">
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            {error || 'No financial data available'}
            <button onClick={fetchFinancialMetrics}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const { financial_summary, consultation_metrics, treatment_metrics, invoice_metrics } = metrics;

  return (
    <div className="doctor-container">
      <DoctorHeader />
      <div className="doctor-content">
        {/* Header Section */}
        <div className="doctor-header" style={{ marginBottom: '32px' }}>
          <div>
            <h1>💰 Financial Metrics</h1>
            <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px' }}>
              Comprehensive overview of your revenue and financial performance
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              className="btn-secondary"
              onClick={fetchFinancialMetrics}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fas fa-sync-alt"></i>
              Refresh
            </button>
          </div>
        </div>

        {/* Total Revenue Hero Card */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '32px',
          color: 'white',
          boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            fontSize: '200px',
            opacity: '0.1',
            lineHeight: '1'
          }}>💰</div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '16px', opacity: '0.9', marginBottom: '12px', fontWeight: '500' }}>
              Total Revenue Generated
            </div>
            <div style={{ fontSize: '56px', fontWeight: '800', marginBottom: '16px', letterSpacing: '-2px' }}>
              {formatCurrency(financial_summary.total_revenue)}
            </div>
            <div style={{ display: 'flex', gap: '32px', fontSize: '14px', opacity: '0.95' }}>
              <div>
                <div style={{ marginBottom: '4px' }}>Consultation Revenue</div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>
                  {formatCurrency(financial_summary.consultation_revenue)}
                </div>
              </div>
              <div>
                <div style={{ marginBottom: '4px' }}>Treatment Revenue</div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>
                  {formatCurrency(financial_summary.treatment_revenue)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Consultation Revenue Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '2px solid #e2e8f0',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                  💼 Consultation Revenue
                </div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a2332' }}>
                  {formatCurrency(financial_summary.consultation_revenue)}
                </div>
              </div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
              }}>
                💼
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Total Consultations</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1a2332' }}>
                  {consultation_metrics.total_consultations}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Average Fee</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#667eea' }}>
                  {formatCurrency(consultation_metrics.average_fee)}
                </span>
              </div>
            </div>

            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#64748b'
            }}>
              <strong style={{ color: '#667eea' }}>
                {calculatePercentage(financial_summary.consultation_revenue, financial_summary.total_revenue)}%
              </strong> of total revenue
            </div>
          </div>

          {/* Treatment Revenue Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '2px solid #e2e8f0',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                  🏥 Treatment Revenue
                </div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a2332' }}>
                  {formatCurrency(financial_summary.treatment_revenue)}
                </div>
              </div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
              }}>
                🏥
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Total Treatments</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1a2332' }}>
                  {treatment_metrics.total_treatments}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Average per Treatment</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#43e97b' }}>
                  {formatCurrency(
                    treatment_metrics.total_treatments > 0
                      ? treatment_metrics.treatment_revenue / treatment_metrics.total_treatments
                      : 0
                  )}
                </span>
              </div>
            </div>

            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#f0fdf4',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#64748b'
            }}>
              <strong style={{ color: '#43e97b' }}>
                {calculatePercentage(financial_summary.treatment_revenue, financial_summary.total_revenue)}%
              </strong> of total revenue
            </div>
          </div>

          {/* Invoice Metrics Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '2px solid #e2e8f0',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                  📄 Invoice Summary
                </div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a2332' }}>
                  {formatCurrency(invoice_metrics.total_invoice_amount)}
                </div>
              </div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
              }}>
                📄
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Total Invoices</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1a2332' }}>
                  {invoice_metrics.total_invoices}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Average Invoice</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#4facfe' }}>
                  {formatCurrency(
                    invoice_metrics.total_invoices > 0
                      ? invoice_metrics.total_invoice_amount / invoice_metrics.total_invoices
                      : 0
                  )}
                </span>
              </div>
            </div>

            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#eff6ff',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#64748b'
            }}>
              Total invoiced amount including taxes
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: '#1a2332' }}>
            📊 Performance Indicators
          </h2>

          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Revenue per Consultation */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Average Revenue per Consultation</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1a2332' }}>
                  {formatCurrency(
                    consultation_metrics.total_consultations > 0
                      ? financial_summary.total_revenue / consultation_metrics.total_consultations
                      : 0
                  )}
                </span>
              </div>
              <div style={{ 
                height: '8px', 
                background: '#e2e8f0', 
                borderRadius: '4px', 
                overflow: 'hidden' 
              }}>
                <div style={{
                  height: '100%',
                  width: '75%',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  transition: 'width 0.5s'
                }}></div>
              </div>
            </div>

            {/* Treatment Rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Treatments per Consultation</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1a2332' }}>
                  {consultation_metrics.total_consultations > 0
                    ? (treatment_metrics.total_treatments / consultation_metrics.total_consultations).toFixed(2)
                    : '0'}
                </span>
              </div>
              <div style={{ 
                height: '8px', 
                background: '#e2e8f0', 
                borderRadius: '4px', 
                overflow: 'hidden' 
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(
                    consultation_metrics.total_consultations > 0
                      ? (treatment_metrics.total_treatments / consultation_metrics.total_consultations) * 20
                      : 0,
                    100
                  )}%`,
                  background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                  transition: 'width 0.5s'
                }}></div>
              </div>
            </div>

            {/* Consultation Success Rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Invoicing Rate</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1a2332' }}>
                  {consultation_metrics.total_consultations > 0
                    ? calculatePercentage(invoice_metrics.total_invoices, consultation_metrics.total_consultations)
                    : 0}%
                </span>
              </div>
              <div style={{ 
                height: '8px', 
                background: '#e2e8f0', 
                borderRadius: '4px', 
                overflow: 'hidden' 
              }}>
                <div style={{
                  height: '100%',
                  width: `${consultation_metrics.total_consultations > 0
                    ? calculatePercentage(invoice_metrics.total_invoices, consultation_metrics.total_consultations)
                    : 0}%`,
                  background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                  transition: 'width 0.5s'
                }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f093fb20 0%, #f5576c20 100%)',
            borderLeft: '4px solid #f093fb',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Total Patients Served</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a2332' }}>
              {consultation_metrics.total_consultations}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #fa709a20 0%, #fee14020 100%)',
            borderLeft: '4px solid #fa709a',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Services Provided</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a2332' }}>
              {treatment_metrics.total_treatments}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #30cfd020 0%, #33086720 100%)',
            borderLeft: '4px solid #30cfd0',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Revenue/Patient</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a2332' }}>
              {formatCurrency(
                consultation_metrics.total_consultations > 0
                  ? financial_summary.total_revenue / consultation_metrics.total_consultations
                  : 0
              )}
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div style={{
          marginTop: '32px',
          padding: '20px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <i className="fas fa-info-circle" style={{ fontSize: '20px', color: '#667eea' }}></i>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            <strong style={{ color: '#1a2332' }}>Note:</strong> Financial metrics are calculated based on all consultations, treatments, and invoices generated. Data is updated in real-time.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorFinancialMetrics;
