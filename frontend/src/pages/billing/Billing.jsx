import { useState } from 'react';
import './billing.css';

const Billing = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Sample data
  const financialSummary = {
    outstandingBalance: 730.00,
    recentPayment: { amount: 320.00, date: '2024-01-19' },
    nextPaymentDue: '2024-01-25',
    yearToDate: 2450.00,
    averageMonthly: 245.00
  };

  const paymentStatus = [
    { status: 'Paid', count: 1, color: '#10BA81' },
    { status: 'Partially Paid', count: 1, color: '#F59E0B' },
    { status: 'Overdue', count: 1, color: '#DC2626' },
    { status: 'Processing', count: 1, color: '#4318D1' }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'Payment Received',
      invoice: 'INV-2024-002',
      amount: 320.00,
      date: 'Jan 19',
      status: 'paid'
    },
    {
      id: 2,
      type: 'Partial Payment',
      invoice: 'INV-2024-003',
      amount: 175.00,
      date: 'Jan 16',
      status: 'partial'
    },
    {
      id: 3,
      type: 'Invoice Generated',
      invoice: 'INV-2024-001',
      amount: 450.00,
      date: 'Jan 20',
      status: 'overdue'
    }
  ];

  const invoices = [
    {
      id: 'INV-2024-001',
      date: '2024-01-20',
      dueDate: '2024-01-25',
      amount: 450.00,
      status: 'overdue',
      items: [
        { description: 'Consultation - Dr. Smith', amount: 150.00 },
        { description: 'Laboratory Tests', amount: 200.00 },
        { description: 'Prescription Medication', amount: 100.00 }
      ]
    },
    {
      id: 'INV-2024-002',
      date: '2024-01-15',
      dueDate: '2024-01-20',
      amount: 320.00,
      status: 'paid',
      paidDate: '2024-01-19',
      items: [
        { description: 'Follow-up Consultation', amount: 120.00 },
        { description: 'X-Ray Imaging', amount: 200.00 }
      ]
    },
    {
      id: 'INV-2024-003',
      date: '2024-01-10',
      dueDate: '2024-01-15',
      amount: 350.00,
      status: 'partial',
      paidAmount: 175.00,
      items: [
        { description: 'Physical Therapy Session', amount: 150.00 },
        { description: 'Medical Equipment', amount: 200.00 }
      ]
    }
  ];

  const paymentHistory = [
    {
      id: 'PAY-2024-005',
      date: '2024-01-19',
      invoice: 'INV-2024-002',
      amount: 320.00,
      method: 'Credit Card',
      status: 'completed'
    },
    {
      id: 'PAY-2024-004',
      date: '2024-01-16',
      invoice: 'INV-2024-003',
      amount: 175.00,
      method: 'Debit Card',
      status: 'completed'
    },
    {
      id: 'PAY-2024-003',
      date: '2024-01-10',
      invoice: 'INV-2024-004',
      amount: 280.00,
      method: 'Bank Transfer',
      status: 'completed'
    }
  ];

  const paymentPlans = [
    {
      id: 'PLAN-001',
      startDate: '2024-01-01',
      totalAmount: 1200.00,
      paidAmount: 400.00,
      monthlyPayment: 200.00,
      nextPayment: '2024-02-01',
      status: 'active'
    }
  ];

  const handleMakePayment = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const handleDownloadInvoice = (invoiceId) => {
    console.log('Downloading invoice:', invoiceId);
    // Implement download logic
  };

  const handleDownloadReceipt = (paymentId) => {
    console.log('Downloading receipt:', paymentId);
    // Implement download logic
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      paid: 'status-badge-paid',
      partial: 'status-badge-partial',
      overdue: 'status-badge-overdue',
      processing: 'status-badge-processing',
      pending: 'status-badge-pending',
      completed: 'status-badge-completed',
      active: 'status-badge-active'
    };
    return statusClasses[status] || 'status-badge-default';
  };

  return (
    <div className="billing-container">
      <div className="billing-header">
        <div>
          <h1 className="billing-title">Billing & Payments</h1>
          <p className="billing-subtitle">Manage your medical bills and payment history</p>
        </div>
      </div>

      <div className="billing-layout">
        {/* Left Sidebar */}
        <aside className="billing-sidebar">
          {/* Financial Summary Card */}
          <div className="summary-card">
            <h2 className="card-title">Financial Summary</h2>
            
            <div className="outstanding-balance-card">
              <p className="balance-label">Outstanding Balance</p>
              <p className="balance-amount">${financialSummary.outstandingBalance.toFixed(2)}</p>
            </div>

            <div className="summary-item">
              <span className="summary-label">Recent Payment</span>
              <div className="summary-value-group">
                <span className="summary-value">${financialSummary.recentPayment.amount.toFixed(2)}</span>
                <span className="summary-date">{financialSummary.recentPayment.date}</span>
              </div>
            </div>

            <div className="summary-item">
              <span className="summary-label">Next Payment Due</span>
              <span className="summary-value-danger">{financialSummary.nextPaymentDue}</span>
            </div>

            <div className="summary-item">
              <span className="summary-label">Year-to-Date</span>
              <span className="summary-value">${financialSummary.yearToDate.toFixed(2)}</span>
            </div>

            <div className="summary-item">
              <span className="summary-label">Average Monthly</span>
              <span className="summary-value">${financialSummary.averageMonthly.toFixed(2)}</span>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="quick-actions-card">
            <h2 className="card-title">Quick Actions</h2>
            
            <button className="action-btn action-btn-primary">
              Make Payment
            </button>
            
            <button className="action-btn action-btn-secondary">
              Set Up Payment Plan
            </button>
            
            <button className="action-btn action-btn-secondary">
              View Payment History
            </button>
            
            <button className="action-btn action-btn-secondary">
              Download Tax Summary
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="billing-main">
          <div className="billing-card">
            {/* Tabs */}
            <div className="billing-tabs">
              <button
                className={`tab-btn ${activeTab === 'overview' ? 'tab-btn-active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`tab-btn ${activeTab === 'invoices' ? 'tab-btn-active' : ''}`}
                onClick={() => setActiveTab('invoices')}
              >
                Invoices
              </button>
              <button
                className={`tab-btn ${activeTab === 'history' ? 'tab-btn-active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                Payment History
              </button>
              <button
                className={`tab-btn ${activeTab === 'plans' ? 'tab-btn-active' : ''}`}
                onClick={() => setActiveTab('plans')}
              >
                Payment Plans
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'overview' && (
                <div className="overview-grid">
                  {/* Payment Status Overview */}
                  <div className="overview-card">
                    <h3 className="overview-card-title">Payment Status Overview</h3>
                    <div className="status-list">
                      {paymentStatus.map((item, index) => (
                        <div key={index} className="status-item">
                          <div className="status-info">
                            <div
                              className="status-indicator"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="status-label">{item.status}</span>
                          </div>
                          <span className="status-count">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="overview-card">
                    <h3 className="overview-card-title">Recent Activity</h3>
                    <div className="activity-list">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="activity-item">
                          <div className="activity-info">
                            <p className="activity-type">{activity.type}</p>
                            <p className="activity-invoice">{activity.invoice}</p>
                          </div>
                          <div className="activity-details">
                            <span className={`activity-amount activity-amount-${activity.status}`}>
                              {activity.status === 'paid' ? '+' : ''}${activity.amount.toFixed(2)}
                            </span>
                            <span className="activity-date">{activity.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Overdue Balances Alert */}
                  <div className="overdue-alert">
                    <h3 className="overdue-title">Overdue Balances</h3>
                    <div className="overdue-content">
                      <div>
                        <p className="overdue-invoice">INV-2024-001</p>
                        <p className="overdue-due">Due: Jan 25, 2024</p>
                      </div>
                      <span className="overdue-amount">$450.00</span>
                    </div>
                    <button className="overdue-btn" onClick={() => handleMakePayment(invoices[0])}>
                      Pay Now
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'invoices' && (
                <div className="invoices-section">
                  <div className="invoices-header">
                    <h3 className="section-title">All Invoices</h3>
                    <div className="invoices-filters">
                      <select className="filter-select">
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="partial">Partially Paid</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Search invoices..."
                        className="search-input"
                      />
                    </div>
                  </div>

                  <div className="invoices-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Invoice ID</th>
                          <th>Date</th>
                          <th>Due Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td className="invoice-id">{invoice.id}</td>
                            <td>{invoice.date}</td>
                            <td>{invoice.dueDate}</td>
                            <td className="invoice-amount">${invoice.amount.toFixed(2)}</td>
                            <td>
                              <span className={`status-badge ${getStatusBadgeClass(invoice.status)}`}>
                                {invoice.status}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn-view"
                                  onClick={() => setSelectedInvoice(invoice)}
                                >
                                  View
                                </button>
                                <button
                                  className="btn-download"
                                  onClick={() => handleDownloadInvoice(invoice.id)}
                                >
                                  Download
                                </button>
                                {invoice.status !== 'paid' && (
                                  <button
                                    className="btn-pay"
                                    onClick={() => handleMakePayment(invoice)}
                                  >
                                    Pay
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="history-section">
                  <div className="history-header">
                    <h3 className="section-title">Payment History</h3>
                    <button className="btn-export">Export to PDF</button>
                  </div>

                  <div className="history-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Payment ID</th>
                          <th>Date</th>
                          <th>Invoice</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((payment) => (
                          <tr key={payment.id}>
                            <td className="payment-id">{payment.id}</td>
                            <td>{payment.date}</td>
                            <td>{payment.invoice}</td>
                            <td className="payment-amount">${payment.amount.toFixed(2)}</td>
                            <td>{payment.method}</td>
                            <td>
                              <span className={`status-badge ${getStatusBadgeClass(payment.status)}`}>
                                {payment.status}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn-download"
                                onClick={() => handleDownloadReceipt(payment.id)}
                              >
                                Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'plans' && (
                <div className="plans-section">
                  <div className="plans-header">
                    <h3 className="section-title">Payment Plans</h3>
                    <button className="btn-primary">Create New Plan</button>
                  </div>

                  <div className="plans-list">
                    {paymentPlans.map((plan) => (
                      <div key={plan.id} className="plan-card">
                        <div className="plan-header">
                          <h4 className="plan-id">{plan.id}</h4>
                          <span className={`status-badge ${getStatusBadgeClass(plan.status)}`}>
                            {plan.status}
                          </span>
                        </div>
                        <div className="plan-details">
                          <div className="plan-detail-item">
                            <span className="detail-label">Total Amount:</span>
                            <span className="detail-value">${plan.totalAmount.toFixed(2)}</span>
                          </div>
                          <div className="plan-detail-item">
                            <span className="detail-label">Paid Amount:</span>
                            <span className="detail-value">${plan.paidAmount.toFixed(2)}</span>
                          </div>
                          <div className="plan-detail-item">
                            <span className="detail-label">Monthly Payment:</span>
                            <span className="detail-value">${plan.monthlyPayment.toFixed(2)}</span>
                          </div>
                          <div className="plan-detail-item">
                            <span className="detail-label">Next Payment:</span>
                            <span className="detail-value">{plan.nextPayment}</span>
                          </div>
                        </div>
                        <div className="plan-progress">
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${(plan.paidAmount / plan.totalAmount) * 100}%`
                              }}
                            />
                          </div>
                          <span className="progress-text">
                            {((plan.paidAmount / plan.totalAmount) * 100).toFixed(0)}% Complete
                          </span>
                        </div>
                        <div className="plan-actions">
                          <button className="btn-secondary">View Details</button>
                          <button className="btn-primary">Make Payment</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Make Payment</h2>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="payment-summary">
                <h3>Payment Summary</h3>
                <div className="summary-row">
                  <span>Invoice:</span>
                  <span>{selectedInvoice.id}</span>
                </div>
                <div className="summary-row">
                  <span>Amount Due:</span>
                  <span className="amount-due">${selectedInvoice.amount.toFixed(2)}</span>
                </div>
              </div>

              <form className="payment-form">
                <div className="form-group">
                  <label>Payment Method</label>
                  <select className="form-control">
                    <option>Credit Card</option>
                    <option>Debit Card</option>
                    <option>Bank Transfer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="1234 5678 9012 3456"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Cardholder Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="John Doe"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Pay ${selectedInvoice.amount.toFixed(2)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
