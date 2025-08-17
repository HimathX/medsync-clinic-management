import React from 'react';

const Dashboard = ({ role }) => {
  // Mock KPIs
  const kpis = {
    appointmentsToday: 15,
    revenue: 50000,
    outstanding: 10000,
  };

  return (
    <div>
      <h1>Welcome, {role}</h1>
      <div className="dashboard">
        <h2>Key Metrics</h2>
        <p>Appointments Today: {kpis.appointmentsToday}</p>
        <p>Revenue: LKR {kpis.revenue}</p>
        <p>Outstanding Balances: LKR {kpis.outstanding}</p>
        {/* Simple chart simulation with CSS */}
        <div style={{ background: '#007bff', width: `${kpis.appointmentsToday * 5}px`, height: '20px' }} title="Appointments Chart"></div>
      </div>
    </div>
  );
};

export default Dashboard;