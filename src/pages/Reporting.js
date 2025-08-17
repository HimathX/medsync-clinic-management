import React, { useState } from 'react';

const Reporting = ({ role }) => {
  const [reportType, setReportType] = useState('Appointment Summary');
  const [period, setPeriod] = useState('Daily');
  const [reportData, setReportData] = useState(null);

  const handleGenerate = () => {
    // Mock data based on type
    if (reportType === 'Appointment Summary') {
      setReportData({ scheduled: 10, completed: 8, cancelled: 2 });
    } else if (reportType === 'Doctor Revenue') {
      setReportData({ doctor1: 20000, doctor2: 30000 });
    } // Add more for outstanding, treatments, insurance
  };

  const handleExport = () => {
    // Mock export
    alert('Exported to PDF/CSV');
  };

  return (
    <div>
      <h1>Reporting and Analytics</h1>
      <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
        <option>Appointment Summary</option>
        <option>Doctor Revenue</option>
        <option>Outstanding Balances</option>
        <option>Treatment Categories</option>
        <option>Insurance vs Out-of-Pocket</option>
      </select>
      <select value={period} onChange={(e) => setPeriod(e.target.value)}>
        <option>Daily</option>
        <option>Weekly</option>
        <option>Monthly</option>
      </select>
      <button onClick={handleGenerate}>Generate Report</button>
      {reportData && (
        <div>
          <h2>Report: {reportType} ({period})</h2>
          {/* Simple Table Visualization */}
          <table>
            <tbody>
              {Object.entries(reportData).map(([key, value]) => (
                <tr key={key}><td>{key}</td><td>{value}</td></tr>
              ))}
            </tbody>
          </table>
          {/* Mock Chart */}
          <div style={{ background: '#007bff', width: '200px', height: '100px' }} title="Report Chart"></div>
          <button onClick={handleExport}>Export (PDF/Excel/CSV)</button>
        </div>
      )}
    </div>
  );
};

export default Reporting;