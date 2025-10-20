import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffHeader from '../../components/StaffHeader';
import authService from '../../services/authService';
import '../../styles/staff.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const StaffBilling = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalInvoices: 0, totalPayments: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [branch, setBranch] = useState('Colombo');
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/staff-login');
  };

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    const userType = localStorage.getItem('user_type');
    
    if (!userId || !userType) {
      navigate('/staff-login');
      return;
    }
    fetchBillingData();
  }, [navigate]);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      const [invoicesRes, paymentsRes, invoiceStatsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/invoices/`, { headers }),
        fetch(`${API_BASE_URL}/payments/`, { headers }),
        fetch(`${API_BASE_URL}/invoices/statistics/summary`, { headers })
      ]);

      const invoicesData = invoicesRes.ok ? await invoicesRes.json() : [];
      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : [];
      const invoiceStats = invoiceStatsRes.ok ? await invoiceStatsRes.json() : {};

      // Ensure data is always an array
      const invoicesArray = Array.isArray(invoicesData) ? invoicesData : (invoicesData.invoices || invoicesData.data || []);
      const paymentsArray = Array.isArray(paymentsData) ? paymentsData : (paymentsData.payments || paymentsData.data || []);

      console.log(`💰 Loaded ${invoicesArray.length} invoices, ${paymentsArray.length} payments`);
      
      setInvoices(invoicesArray);
      setPayments(paymentsArray);
      setStats({
        totalRevenue: invoiceStats.total_revenue || 0,
        totalInvoices: invoicesArray.length,
        totalPayments: paymentsArray.length
      });
    } catch (err) {
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
          <h1>Billing Management</h1>
          <p>Manage invoices and payments</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card stat-success">
            <div className="stat-icon"><i className="fas fa-money-bill-wave"></i></div>
            <div className="stat-content"><h3>{formatCurrency(stats.totalRevenue)}</h3><p>Total Revenue</p></div>
          </div>
          <div className="stat-card stat-primary">
            <div className="stat-icon"><i className="fas fa-file-invoice"></i></div>
            <div className="stat-content"><h3>{stats.totalInvoices}</h3><p>Total Invoices</p></div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-icon"><i className="fas fa-credit-card"></i></div>
            <div className="stat-content"><h3>{stats.totalPayments}</h3><p>Total Payments</p></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button className={`tab-button ${activeTab === 'invoices' ? 'active' : ''}`} onClick={() => setActiveTab('invoices')}>
            <i className="fas fa-file-invoice"></i> Invoices ({invoices.length})
          </button>
          <button className={`tab-button ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
            <i className="fas fa-credit-card"></i> Payments ({payments.length})
          </button>
        </div>

        {/* Tables */}
        <div className="table-container">
          {activeTab === 'invoices' ? (
            invoices.length === 0 ? (
              <div className="empty-state"><i className="fas fa-file-invoice"></i><p>No invoices found</p></div>
            ) : (
              <table className="staff-table">
                <thead>
                  <tr><th>Invoice ID</th><th>Patient ID</th><th>Amount</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.invoice_id}>
                      <td>#{inv.invoice_id}</td>
                      <td>#{inv.patient_id}</td>
                      <td className="amount-cell">{formatCurrency(inv.total_amount)}</td>
                      <td>{formatDate(inv.date_issued)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            payments.length === 0 ? (
              <div className="empty-state"><i className="fas fa-credit-card"></i><p>No payments found</p></div>
            ) : (
              <table className="staff-table">
                <thead>
                  <tr><th>Payment ID</th><th>Invoice ID</th><th>Amount</th><th>Method</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {payments.map((pay) => (
                    <tr key={pay.payment_id}>
                      <td>#{pay.payment_id}</td>
                      <td>#{pay.invoice_id}</td>
                      <td className="amount-cell">{formatCurrency(pay.amount)}</td>
                      <td>{pay.payment_method || 'N/A'}</td>
                      <td>{formatDate(pay.payment_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffBilling;
