import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffHeader from '../../components/StaffHeader';
import authService from '../../services/authService';
import '../../styles/staff.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const StaffReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [branch, setBranch] = useState('Colombo');
  const [activeTab, setActiveTab] = useState('branch-appointments');
  const currentUser = authService.getCurrentUser();

  // Report data states
  const [branchAppointments, setBranchAppointments] = useState(null);
  const [doctorRevenue, setDoctorRevenue] = useState(null);
  const [outstandingBalances, setOutstandingBalances] = useState(null);
  const [treatmentsByCategory, setTreatmentsByCategory] = useState(null);
  const [insuranceVsOutOfPocket, setInsuranceVsOutOfPocket] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    branchName: '',
    year: new Date().getFullYear(),
    month: '',
    doctorId: '',
    minBalance: '',
    maxBalance: ''
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch data based on active tab
  const fetchReportData = async (reportType) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      let url = '';

      switch(reportType) {
        case 'branch-appointments':
          url = `${API_BASE_URL}/reports/branch-appointments/data?`;
          if (filters.dateFrom) url += `date_from=${filters.dateFrom}&`;
          if (filters.dateTo) url += `date_to=${filters.dateTo}&`;
          if (filters.branchName) url += `branch_name=${filters.branchName}`;
          break;
        case 'doctor-revenue':
          url = `${API_BASE_URL}/reports/doctor-revenue/data?`;
          if (filters.year) url += `year=${filters.year}&`;
          if (filters.month) url += `month=${filters.month}&`;
          if (filters.doctorId) url += `doctor_id=${filters.doctorId}`;
          break;
        case 'outstanding-balances':
          url = `${API_BASE_URL}/reports/outstanding-balances/data?`;
          if (filters.minBalance) url += `min_balance=${filters.minBalance}&`;
          if (filters.maxBalance) url += `max_balance=${filters.maxBalance}`;
          break;
        case 'treatments':
          url = `${API_BASE_URL}/reports/treatments-by-category/data?`;
          if (filters.dateFrom) url += `date_from=${filters.dateFrom}&`;
          if (filters.dateTo) url += `date_to=${filters.dateTo}`;
          break;
        case 'insurance':
          url = `${API_BASE_URL}/reports/insurance-vs-outofpocket/data?`;
          if (filters.dateFrom) url += `date_from=${filters.dateFrom}&`;
          if (filters.dateTo) url += `date_to=${filters.dateTo}`;
          break;
        default:
          return;
      }

      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        
        switch(reportType) {
          case 'branch-appointments':
            setBranchAppointments(data);
            break;
          case 'doctor-revenue':
            setDoctorRevenue(data);
            break;
          case 'outstanding-balances':
            setOutstandingBalances(data);
            break;
          case 'treatments':
            setTreatmentsByCategory(data);
            break;
          case 'insurance':
            setInsuranceVsOutOfPocket(data);
            break;
        }
      } else {
        throw new Error('Failed to fetch report data');
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(`Failed to load ${reportType} report`);
    } finally {
      setLoading(false);
    }
  };

  // Download PDF report
  const downloadPDF = async (reportType) => {
    try {
      const token = localStorage.getItem('token');
      let url = '';

      switch(reportType) {
        case 'branch-appointments':
          url = `${API_BASE_URL}/reports/branch-appointments/pdf?`;
          if (filters.dateFrom) url += `date_from=${filters.dateFrom}&`;
          if (filters.dateTo) url += `date_to=${filters.dateTo}&`;
          if (filters.branchName) url += `branch_name=${filters.branchName}`;
          break;
        case 'doctor-revenue':
          url = `${API_BASE_URL}/reports/doctor-revenue/pdf?`;
          if (filters.year) url += `year=${filters.year}&`;
          if (filters.month) url += `month=${filters.month}&`;
          if (filters.doctorId) url += `doctor_id=${filters.doctorId}`;
          break;
        case 'outstanding-balances':
          url = `${API_BASE_URL}/reports/outstanding-balances/pdf?`;
          if (filters.minBalance) url += `min_balance=${filters.minBalance}&`;
          if (filters.maxBalance) url += `max_balance=${filters.maxBalance}`;
          break;
        case 'treatments':
          url = `${API_BASE_URL}/reports/treatments-by-category/pdf?`;
          if (filters.dateFrom) url += `date_from=${filters.dateFrom}&`;
          if (filters.dateTo) url += `date_to=${filters.dateTo}`;
          break;
        case 'insurance':
          url = `${API_BASE_URL}/reports/insurance-vs-outofpocket/pdf?`;
          if (filters.dateFrom) url += `date_from=${filters.dateFrom}&`;
          if (filters.dateTo) url += `date_to=${filters.dateTo}`;
          break;
        default:
          return;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        alert('Failed to download PDF report');
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Error downloading PDF report');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const { invoiceStats, paymentStats } = reports;

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
