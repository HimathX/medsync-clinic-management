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
          <h1>📊 Reports & Analytics</h1>
          <p>Comprehensive clinic reports with PDF export</p>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        {/* Report Type Tabs */}
        <div className="tabs-container" style={{ marginBottom: '20px' }}>
          <button 
            className={`tab-button ${activeTab === 'branch-appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('branch-appointments')}
          >
            <i className="fas fa-calendar-alt"></i> Branch Appointments
          </button>
          <button 
            className={`tab-button ${activeTab === 'doctor-revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('doctor-revenue')}
          >
            <i className="fas fa-user-md"></i> Doctor Revenue
          </button>
          <button 
            className={`tab-button ${activeTab === 'outstanding-balances' ? 'active' : ''}`}
            onClick={() => setActiveTab('outstanding-balances')}
          >
            <i className="fas fa-exclamation-triangle"></i> Outstanding
          </button>
          <button 
            className={`tab-button ${activeTab === 'treatments' ? 'active' : ''}`}
            onClick={() => setActiveTab('treatments')}
          >
            <i className="fas fa-syringe"></i> Treatments
          </button>
          <button 
            className={`tab-button ${activeTab === 'insurance' ? 'active' : ''}`}
            onClick={() => setActiveTab('insurance')}
          >
            <i className="fas fa-shield-alt"></i> Insurance
          </button>
        </div>

        {/* Branch Appointments Report */}
        {activeTab === 'branch-appointments' && (
          <div className="report-content">
            <div className="report-header">
              <h2>📅 Branch Appointments Report</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary" onClick={() => fetchReportData('branch-appointments')}>
                  <i className="fas fa-sync"></i> Load Data
                </button>
                <button className="btn-primary" onClick={() => downloadPDF('branch-appointments')}>
                  <i className="fas fa-file-pdf"></i> Download PDF
                </button>
              </div>
            </div>
            <div className="filter-panel" style={{ display: 'flex', gap: '15px', marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div>
                <label>From Date:</label>
                <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} className="form-input" />
              </div>
              <div>
                <label>To Date:</label>
                <input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} className="form-input" />
              </div>
              <div>
                <label>Branch:</label>
                <input type="text" value={filters.branchName} onChange={(e) => setFilters({...filters, branchName: e.target.value})} placeholder="Branch name" className="form-input" />
              </div>
            </div>
            {loading && <div className="loading-container"><div className="spinner"></div><p>Loading report...</p></div>}
            {branchAppointments && (
              <div className="stats-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card stat-primary">
                  <div className="stat-icon"><i className="fas fa-calendar-check"></i></div>
                  <div className="stat-content"><h3>{formatNumber(branchAppointments.total_records || 0)}</h3><p>Total Records</p></div>
                </div>
              </div>
            )}
            {branchAppointments?.data && branchAppointments.data.length > 0 && (
              <div className="table-container">
                <table className="staff-table">
                  <thead><tr><th>Branch</th><th>Date</th><th>Status</th><th>Count</th></tr></thead>
                  <tbody>
                    {branchAppointments.data.slice(0, 10).map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.branch_name}</td>
                        <td>{new Date(item.available_date).toLocaleDateString()}</td>
                        <td><span className={`status-badge status-${item.status?.toLowerCase()}`}>{item.status}</span></td>
                        <td>{item.appointment_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {branchAppointments.data.length > 10 && <p style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>Showing 10 of {branchAppointments.data.length} records. Download PDF for full report.</p>}
              </div>
            )}
          </div>
        )}

        {/* Doctor Revenue Report */}
        {activeTab === 'doctor-revenue' && (
          <div className="report-content">
            <div className="report-header">
              <h2>💰 Doctor Revenue Report</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary" onClick={() => fetchReportData('doctor-revenue')}>
                  <i className="fas fa-sync"></i> Load Data
                </button>
                <button className="btn-primary" onClick={() => downloadPDF('doctor-revenue')}>
                  <i className="fas fa-file-pdf"></i> Download PDF
                </button>
              </div>
            </div>
            <div className="filter-panel" style={{ display: 'flex', gap: '15px', marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div>
                <label>Year:</label>
                <input type="number" value={filters.year} onChange={(e) => setFilters({...filters, year: e.target.value})} placeholder="2024" className="form-input" />
              </div>
              <div>
                <label>Month (YYYY-MM):</label>
                <input type="text" value={filters.month} onChange={(e) => setFilters({...filters, month: e.target.value})} placeholder="2024-01" className="form-input" />
              </div>
            </div>
            {loading && <div className="loading-container"><div className="spinner"></div><p>Loading report...</p></div>}
            {doctorRevenue && (
              <div className="stats-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card stat-success">
                  <div className="stat-icon"><i className="fas fa-money-bill-wave"></i></div>
                  <div className="stat-content"><h3>{formatCurrency(doctorRevenue.total_revenue || 0)}</h3><p>Total Revenue</p></div>
                </div>
                <div className="stat-card stat-info">
                  <div className="stat-icon"><i className="fas fa-user-md"></i></div>
                  <div className="stat-content"><h3>{doctorRevenue.total_records || 0}</h3><p>Doctor Records</p></div>
                </div>
              </div>
            )}
            {doctorRevenue?.data && doctorRevenue.data.length > 0 && (
              <div className="table-container">
                <table className="staff-table">
                  <thead><tr><th>Doctor</th><th>Month</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {doctorRevenue.data.slice(0, 10).map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.doctor_name}</td>
                        <td>{item.month}</td>
                        <td className="amount-cell">{formatCurrency(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {doctorRevenue.data.length > 10 && <p style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>Showing 10 of {doctorRevenue.data.length} records. Download PDF for full report.</p>}
              </div>
            )}
          </div>
        )}

        {/* Outstanding Balances Report */}
        {activeTab === 'outstanding-balances' && (
          <div className="report-content">
            <div className="report-header">
              <h2>⚠️ Outstanding Balances</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary" onClick={() => fetchReportData('outstanding-balances')}>
                  <i className="fas fa-sync"></i> Load Data
                </button>
                <button className="btn-primary" onClick={() => downloadPDF('outstanding-balances')}>
                  <i className="fas fa-file-pdf"></i> Download PDF
                </button>
              </div>
            </div>
            <div className="filter-panel" style={{ display: 'flex', gap: '15px', marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div>
                <label>Min Balance:</label>
                <input type="number" value={filters.minBalance} onChange={(e) => setFilters({...filters, minBalance: e.target.value})} placeholder="1000" className="form-input" />
              </div>
              <div>
                <label>Max Balance:</label>
                <input type="number" value={filters.maxBalance} onChange={(e) => setFilters({...filters, maxBalance: e.target.value})} placeholder="50000" className="form-input" />
              </div>
            </div>
            {loading && <div className="loading-container"><div className="spinner"></div><p>Loading report...</p></div>}
            {outstandingBalances && (
              <div className="stats-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card stat-warning">
                  <div className="stat-icon"><i className="fas fa-exclamation-circle"></i></div>
                  <div className="stat-content"><h3>{formatCurrency(outstandingBalances.total_outstanding || 0)}</h3><p>Total Outstanding</p></div>
                </div>
                <div className="stat-card stat-info">
                  <div className="stat-icon"><i className="fas fa-users"></i></div>
                  <div className="stat-content"><h3>{outstandingBalances.total_patients || 0}</h3><p>Patients</p></div>
                </div>
              </div>
            )}
            {outstandingBalances?.data && outstandingBalances.data.length > 0 && (
              <div className="table-container">
                <table className="staff-table">
                  <thead><tr><th>Patient ID</th><th>Patient Name</th><th>Balance</th></tr></thead>
                  <tbody>
                    {outstandingBalances.data.slice(0, 10).map((item, idx) => (
                      <tr key={idx}>
                        <td>#{item.patient_id}</td>
                        <td>{item.patient_name}</td>
                        <td className="amount-cell" style={{ color: item.patient_balance > 10000 ? '#dc3545' : '#ffc107' }}>{formatCurrency(item.patient_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {outstandingBalances.data.length > 10 && <p style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>Showing 10 of {outstandingBalances.data.length} records. Download PDF for full report.</p>}
              </div>
            )}
          </div>
        )}

        {/* Treatments by Category Report */}
        {activeTab === 'treatments' && (
          <div className="report-content">
            <div className="report-header">
              <h2>💉 Treatments by Category</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary" onClick={() => fetchReportData('treatments')}>
                  <i className="fas fa-sync"></i> Load Data
                </button>
                <button className="btn-primary" onClick={() => downloadPDF('treatments')}>
                  <i className="fas fa-file-pdf"></i> Download PDF
                </button>
              </div>
            </div>
            <div className="filter-panel" style={{ display: 'flex', gap: '15px', marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div>
                <label>From Date:</label>
                <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} className="form-input" />
              </div>
              <div>
                <label>To Date:</label>
                <input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} className="form-input" />
              </div>
            </div>
            {loading && <div className="loading-container"><div className="spinner"></div><p>Loading report...</p></div>}
            {treatmentsByCategory && (
              <div className="stats-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card stat-primary">
                  <div className="stat-icon"><i className="fas fa-syringe"></i></div>
                  <div className="stat-content"><h3>{formatNumber(treatmentsByCategory.total_treatments || 0)}</h3><p>Total Treatments</p></div>
                </div>
                <div className="stat-card stat-success">
                  <div className="stat-icon"><i className="fas fa-dollar-sign"></i></div>
                  <div className="stat-content"><h3>{formatCurrency(treatmentsByCategory.total_revenue || 0)}</h3><p>Total Revenue</p></div>
                </div>
              </div>
            )}
            {treatmentsByCategory?.data && treatmentsByCategory.data.length > 0 && (
              <div className="table-container">
                <table className="staff-table">
                  <thead><tr><th>Treatment Name</th><th>Count</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {treatmentsByCategory.data.slice(0, 10).map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.treatment_name}</td>
                        <td>{formatNumber(item.treatment_count)}</td>
                        <td className="amount-cell">{formatCurrency(item.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {treatmentsByCategory.data.length > 10 && <p style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>Showing 10 of {treatmentsByCategory.data.length} records. Download PDF for full report.</p>}
              </div>
            )}
          </div>
        )}

        {/* Insurance vs Out-of-Pocket Report */}
        {activeTab === 'insurance' && (
          <div className="report-content">
            <div className="report-header">
              <h2>🛡️ Insurance vs Out-of-Pocket</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary" onClick={() => fetchReportData('insurance')}>
                  <i className="fas fa-sync"></i> Load Data
                </button>
                <button className="btn-primary" onClick={() => downloadPDF('insurance')}>
                  <i className="fas fa-file-pdf"></i> Download PDF
                </button>
              </div>
            </div>
            <div className="filter-panel" style={{ display: 'flex', gap: '15px', marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div>
                <label>From Date:</label>
                <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} className="form-input" />
              </div>
              <div>
                <label>To Date:</label>
                <input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} className="form-input" />
              </div>
            </div>
            {loading && <div className="loading-container"><div className="spinner"></div><p>Loading report...</p></div>}
            {insuranceVsOutOfPocket && (
              <div>
                <div className="stats-grid" style={{ marginBottom: '20px' }}>
                  <div className="stat-card stat-info">
                    <div className="stat-icon"><i className="fas fa-shield-alt"></i></div>
                    <div className="stat-content"><h3>{formatCurrency(insuranceVsOutOfPocket.insurance_total || 0)}</h3><p>Insurance Total</p></div>
                  </div>
                  <div className="stat-card stat-warning">
                    <div className="stat-icon"><i className="fas fa-wallet"></i></div>
                    <div className="stat-content"><h3>{formatCurrency(insuranceVsOutOfPocket.out_of_pocket_total || 0)}</h3><p>Out-of-Pocket Total</p></div>
                  </div>
                  <div className="stat-card stat-success">
                    <div className="stat-icon"><i className="fas fa-percentage"></i></div>
                    <div className="stat-content">
                      <h3>{insuranceVsOutOfPocket.insurance_total && insuranceVsOutOfPocket.out_of_pocket_total ? Math.round((insuranceVsOutOfPocket.insurance_total / (insuranceVsOutOfPocket.insurance_total + insuranceVsOutOfPocket.out_of_pocket_total)) * 100) : 0}%</h3>
                      <p>Insurance Coverage</p>
                    </div>
                  </div>
                </div>
                {insuranceVsOutOfPocket.details && insuranceVsOutOfPocket.details.length > 0 && (
                  <div className="table-container">
                    <table className="staff-table">
                      <thead><tr><th>Payment Method</th><th>Patients</th><th>Avg Payment</th><th>Total</th></tr></thead>
                      <tbody>
                        {insuranceVsOutOfPocket.details.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.payment_method}</td>
                            <td>{formatNumber(item.patient_count)}</td>
                            <td className="amount-cell">{formatCurrency(item.avg_payment)}</td>
                            <td className="amount-cell">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffReports;
