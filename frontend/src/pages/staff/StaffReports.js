import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorHeader from '../../components/DoctorHeader';
import '../../styles/staff.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const StaffReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reports, setReports] = useState({ invoiceStats: null, paymentStats: null });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    fetchReports();
  }, [navigate]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      const [invoiceStatsRes, paymentStatsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/invoices/statistics/summary`, { headers }),
        fetch(`${API_BASE_URL}/payments/statistics/summary`, { headers })
      ]);

      const invoiceStats = invoiceStatsRes.ok ? await invoiceStatsRes.json() : null;
      const paymentStats = paymentStatsRes.ok ? await paymentStatsRes.json() : null;

      setReports({ invoiceStats, paymentStats });
    } catch (err) {
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="staff-container">
        <DoctorHeader />
        <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>
      </div>
    );
  }

  const { invoiceStats, paymentStats } = reports;

  return (
    <div className="staff-container">
      <DoctorHeader />
      <div className="staff-content">
        <div className="staff-header">
          <h1>Reports & Analytics</h1>
          <p>View clinic statistics</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Financial Summary */}
        <div className="report-section">
          <h2><i className="fas fa-dollar-sign"></i> Financial Summary</h2>
          <div className="stats-grid">
            <div className="stat-card stat-success">
              <div className="stat-icon"><i className="fas fa-money-bill-wave"></i></div>
              <div className="stat-content">
                <h3>{formatCurrency(paymentStats?.total_amount || 0)}</h3>
                <p>Total Revenue</p>
              </div>
            </div>
            <div className="stat-card stat-primary">
              <div className="stat-icon"><i className="fas fa-file-invoice-dollar"></i></div>
              <div className="stat-content">
                <h3>{formatCurrency(invoiceStats?.total_revenue || 0)}</h3>
                <p>Total Invoiced</p>
              </div>
            </div>
            <div className="stat-card stat-info">
              <div className="stat-icon"><i className="fas fa-percentage"></i></div>
              <div className="stat-content">
                <h3>
                  {invoiceStats?.total_revenue > 0 
                    ? Math.round((paymentStats?.total_amount / invoiceStats.total_revenue) * 100)
                    : 0}%
                </h3>
                <p>Collection Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Statistics */}
        {invoiceStats && (
          <div className="report-section">
            <h2><i className="fas fa-file-invoice"></i> Invoice Statistics</h2>
            <div className="report-grid">
              <div className="report-card">
                <i className="fas fa-hashtag"></i>
                <div>
                  <h4>Total Invoices</h4>
                  <p className="report-value">{invoiceStats.total_invoices || 0}</p>
                </div>
              </div>
              <div className="report-card">
                <i className="fas fa-chart-line"></i>
                <div>
                  <h4>Average Invoice</h4>
                  <p className="report-value">{formatCurrency(invoiceStats.average_invoice_amount || 0)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Statistics */}
        {paymentStats && (
          <div className="report-section">
            <h2><i className="fas fa-credit-card"></i> Payment Statistics</h2>
            <div className="report-grid">
              <div className="report-card">
                <i className="fas fa-hashtag"></i>
                <div>
                  <h4>Total Payments</h4>
                  <p className="report-value">{paymentStats.total_payments || 0}</p>
                </div>
              </div>
              <div className="report-card">
                <i className="fas fa-chart-line"></i>
                <div>
                  <h4>Average Payment</h4>
                  <p className="report-value">{formatCurrency(paymentStats.average_payment_amount || 0)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffReports;
