// src/pages/patient/Billing.js - Patient Billing & Payments
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../styles/patientDashboard.css'

export default function PatientBilling() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('outstanding')
  const [selectedBill, setSelectedBill] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('credit-card')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCVV, setCardCVV] = useState('')

  const outstandingBills = [
    {
      id: 'INV-2025-001',
      date: '2025-09-20',
      description: 'Cardiology Consultation - Dr. Perera',
      amount: 8500,
      dueDate: '2025-10-20',
      status: 'Pending'
    },
    {
      id: 'INV-2025-002',
      date: '2025-09-22',
      description: 'Blood Test - Full Panel',
      amount: 6500,
      dueDate: '2025-10-22',
      status: 'Pending'
    },
  ]

  const paymentHistory = [
    {
      id: 'PAY-2025-015',
      date: '2025-08-15',
      description: 'General Consultation',
      amount: 3500,
      method: 'Credit Card',
      status: 'Paid'
    },
    {
      id: 'PAY-2025-012',
      date: '2025-07-10',
      description: 'Lab Tests',
      amount: 5200,
      method: 'Insurance Claim',
      status: 'Paid'
    },
  ]

  const insuranceClaims = [
    {
      id: 'CLM-2025-008',
      date: '2025-09-18',
      description: 'Cardiology Consultation',
      amount: 8500,
      status: 'Processing',
      provider: 'National Insurance'
    },
    {
      id: 'CLM-2025-005',
      date: '2025-08-05',
      description: 'Laboratory Tests',
      amount: 6200,
      status: 'Approved',
      provider: 'National Insurance'
    },
  ]

  const totalOutstanding = outstandingBills.reduce((sum, bill) => sum + bill.amount, 0)

  const handlePayNow = (bill) => {
    setSelectedBill(bill)
  }

  const handleConfirmPayment = () => {
    if (!cardNumber || !cardExpiry || !cardCVV) {
      alert('Please fill in all card details')
      return
    }
    alert(`Payment of LKR ${selectedBill.amount.toLocaleString()} processed successfully!`)
    setSelectedBill(null)
    setCardNumber('')
    setCardExpiry('')
    setCardCVV('')
  }

  return (
    <div className="patient-portal">
      {/* Top Navigation */}
      <nav className="patient-top-nav">
        <div className="patient-top-nav-content">
          <button className="btn-secondary" onClick={() => navigate('/patient/dashboard')}>
            ← Back to Dashboard
          </button>
          <h2 style={{color: 'white', margin: 0}}>Billing & Payments</h2>
          <div style={{color: 'white', fontWeight: 700}}>
            Outstanding: LKR {totalOutstanding.toLocaleString()}
          </div>
        </div>
      </nav>

      <div className="patient-container" style={{paddingTop: '40px', paddingBottom: '60px'}}>
        {/* Summary Cards */}
        <div className="billing-summary-grid">
          <div className="billing-summary-card outstanding">
            <div className="summary-card-icon">💳</div>
            <div className="summary-card-content">
              <div className="summary-card-label">Total Outstanding</div>
              <div className="summary-card-value">LKR {totalOutstanding.toLocaleString()}</div>
            </div>
          </div>
          
          <div className="billing-summary-card paid">
            <div className="summary-card-icon">✓</div>
            <div className="summary-card-content">
              <div className="summary-card-label">Paid This Month</div>
              <div className="summary-card-value">LKR 8,700</div>
            </div>
          </div>
          
          <div className="billing-summary-card insurance">
            <div className="summary-card-icon">🏥</div>
            <div className="summary-card-content">
              <div className="summary-card-label">Insurance Claims</div>
              <div className="summary-card-value">2 Active</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="billing-tabs">
          <button
            className={`billing-tab ${activeTab === 'outstanding' ? 'active' : ''}`}
            onClick={() => setActiveTab('outstanding')}
          >
            Outstanding Bills ({outstandingBills.length})
          </button>
          <button
            className={`billing-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Payment History
          </button>
          <button
            className={`billing-tab ${activeTab === 'insurance' ? 'active' : ''}`}
            onClick={() => setActiveTab('insurance')}
          >
            Insurance Claims
          </button>
        </div>

        {/* Outstanding Bills Tab */}
        {activeTab === 'outstanding' && (
          <div className="billing-content">
            <h3 className="section-heading">Outstanding Bills</h3>
            {outstandingBills.length === 0 ? (
              <div className="empty-state-card">
                <span className="empty-icon">✓</span>
                <p>No outstanding bills</p>
              </div>
            ) : (
              <div className="bills-list">
                {outstandingBills.map(bill => (
                  <div key={bill.id} className="bill-card">
                    <div className="bill-header">
                      <div>
                        <h4 className="bill-id">{bill.id}</h4>
                        <p className="bill-date">{new Date(bill.date).toLocaleDateString()}</p>
                      </div>
                      <div className="bill-status-badge pending">{bill.status}</div>
                    </div>
                    
                    <div className="bill-description">{bill.description}</div>
                    
                    <div className="bill-footer">
                      <div className="bill-amount">LKR {bill.amount.toLocaleString()}</div>
                      <div className="bill-actions">
                        <button className="btn-outline">Download PDF</button>
                        <button className="btn-primary" onClick={() => handlePayNow(bill)}>
                          Pay Now
                        </button>
                      </div>
                    </div>
                    
                    <div className="bill-due">
                      Due date: {new Date(bill.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment History Tab */}
        {activeTab === 'history' && (
          <div className="billing-content">
            <h3 className="section-heading">Payment History</h3>
            <div className="bills-list">
              {paymentHistory.map(payment => (
                <div key={payment.id} className="bill-card paid-bill">
                  <div className="bill-header">
                    <div>
                      <h4 className="bill-id">{payment.id}</h4>
                      <p className="bill-date">{new Date(payment.date).toLocaleDateString()}</p>
                    </div>
                    <div className="bill-status-badge paid">{payment.status}</div>
                  </div>
                  
                  <div className="bill-description">{payment.description}</div>
                  
                  <div className="bill-footer">
                    <div>
                      <div className="bill-amount">LKR {payment.amount.toLocaleString()}</div>
                      <div className="payment-method">via {payment.method}</div>
                    </div>
                    <button className="btn-outline">Download Receipt</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insurance Claims Tab */}
        {activeTab === 'insurance' && (
          <div className="billing-content">
            <h3 className="section-heading">Insurance Claims</h3>
            <div className="bills-list">
              {insuranceClaims.map(claim => (
                <div key={claim.id} className="bill-card insurance-claim">
                  <div className="bill-header">
                    <div>
                      <h4 className="bill-id">{claim.id}</h4>
                      <p className="bill-date">{new Date(claim.date).toLocaleDateString()}</p>
                    </div>
                    <div className={`bill-status-badge ${claim.status.toLowerCase()}`}>
                      {claim.status}
                    </div>
                  </div>
                  
                  <div className="bill-description">{claim.description}</div>
                  <div className="insurance-provider">Provider: {claim.provider}</div>
                  
                  <div className="bill-footer">
                    <div className="bill-amount">LKR {claim.amount.toLocaleString()}</div>
                    <button className="btn-outline">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedBill && (
        <div className="modal-overlay" onClick={() => setSelectedBill(null)}>
          <div className="modal-content payment-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Make Payment</h3>
              <button className="modal-close" onClick={() => setSelectedBill(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="payment-summary">
                <h4>Bill Summary</h4>
                <div className="summary-item">
                  <span>Invoice:</span>
                  <span>{selectedBill.id}</span>
                </div>
                <div className="summary-item">
                  <span>Description:</span>
                  <span>{selectedBill.description}</span>
                </div>
                <div className="summary-item total">
                  <span>Total Amount:</span>
                  <span>LKR {selectedBill.amount.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="payment-method-selector">
                <h4>Payment Method</h4>
                <div className="payment-methods">
                  <button
                    className={`payment-method-btn ${paymentMethod === 'credit-card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('credit-card')}
                  >
                    💳 Credit/Debit Card
                  </button>
                  <button
                    className={`payment-method-btn ${paymentMethod === 'bank' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('bank')}
                  >
                    🏦 Bank Transfer
                  </button>
                  <button
                    className={`payment-method-btn ${paymentMethod === 'mobile' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('mobile')}
                  >
                    📱 Mobile Payment
                  </button>
                </div>
              </div>
              
              {paymentMethod === 'credit-card' && (
                <div className="card-details-form">
                  <div className="form-group">
                    <label className="form-label">Card Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxLength={19}
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Expiry Date</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        maxLength={5}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">CVV</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="123"
                        value={cardCVV}
                        onChange={(e) => setCardCVV(e.target.value)}
                        maxLength={3}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {paymentMethod === 'bank' && (
                <div className="bank-transfer-info">
                  <p><strong>Bank:</strong> Commercial Bank</p>
                  <p><strong>Account Name:</strong> MedSync Medical Center</p>
                  <p><strong>Account Number:</strong> 1234567890</p>
                  <p><strong>Reference:</strong> {selectedBill.id}</p>
                </div>
              )}
              
              {paymentMethod === 'mobile' && (
                <div className="mobile-payment-info">
                  <p>Scan the QR code or use mobile payment app</p>
                  <div className="qr-placeholder">📱 QR Code</div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedBill(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleConfirmPayment}>
                Pay LKR {selectedBill.amount.toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .billing-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 25px;
          margin-bottom: 40px;
        }
        
        .billing-summary-card {
          background: white;
          padding: 30px;
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .summary-card-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
        }
        
        .billing-summary-card.outstanding .summary-card-icon {
          background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
        }
        
        .billing-summary-card.paid .summary-card-icon {
          background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
        }
        
        .billing-summary-card.insurance .summary-card-icon {
          background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
        }
        
        .summary-card-label {
          font-size: 14px;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 5px;
        }
        
        .summary-card-value {
          font-size: 24px;
          font-weight: 800;
          color: #1a2332;
        }
        
        .billing-tabs {
          display: flex;
          gap: 15px;
          margin-bottom: 30px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .billing-tab {
          padding: 15px 25px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          font-weight: 700;
          font-size: 16px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: -2px;
        }
        
        .billing-tab.active {
          color: #7c3aed;
          border-bottom-color: #7c3aed;
        }
        
        .billing-content {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .bills-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .bill-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 25px;
          border-radius: 16px;
          border: 2px solid #e2e8f0;
          transition: all 0.3s;
        }
        
        .bill-card:hover {
          border-color: #7c3aed;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.1);
        }
        
        .bill-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }
        
        .bill-id {
          font-size: 18px;
          font-weight: 700;
          color: #1a2332;
          margin-bottom: 5px;
        }
        
        .bill-date {
          font-size: 14px;
          color: #64748b;
        }
        
        .bill-status-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
        }
        
        .bill-status-badge.pending {
          background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
          color: white;
        }
        
        .bill-status-badge.paid {
          background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
          color: white;
        }
        
        .bill-status-badge.processing {
          background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
          color: white;
        }
        
        .bill-status-badge.approved {
          background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
          color: white;
        }
        
        .bill-description {
          font-size: 16px;
          color: #475569;
          margin-bottom: 15px;
          font-weight: 600;
        }
        
        .bill-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 15px;
        }
        
        .bill-amount {
          font-size: 28px;
          font-weight: 800;
          color: #1a2332;
        }
        
        .bill-actions {
          display: flex;
          gap: 10px;
        }
        
        .bill-due {
          margin-top: 12px;
          font-size: 14px;
          color: #EF4444;
          font-weight: 600;
        }
        
        .payment-method {
          font-size: 14px;
          color: #64748b;
          margin-top: 5px;
        }
        
        .insurance-provider {
          font-size: 14px;
          color: #0EA5E9;
          font-weight: 600;
          margin-top: 8px;
        }
        
        .payment-modal {
          max-width: 600px;
        }
        
        .payment-summary {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 25px;
        }
        
        .payment-summary h4 {
          font-size: 18px;
          font-weight: 700;
          color: #1a2332;
          margin-bottom: 15px;
        }
        
        .payment-summary .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .payment-summary .summary-item.total {
          border-bottom: none;
          font-weight: 700;
          font-size: 18px;
          color: #1a2332;
          margin-top: 10px;
        }
        
        .payment-method-selector {
          margin-bottom: 25px;
        }
        
        .payment-method-selector h4 {
          font-size: 18px;
          font-weight: 700;
          color: #1a2332;
          margin-bottom: 15px;
        }
        
        .payment-methods {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        
        .payment-method-btn {
          padding: 15px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .payment-method-btn.active {
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          color: white;
          border-color: #7c3aed;
        }
        
        .card-details-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 15px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .form-label {
          font-weight: 700;
          color: #1a2332;
          font-size: 14px;
        }
        
        .form-input {
          padding: 12px 15px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 15px;
          transition: all 0.3s;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #7c3aed;
        }
        
        .bank-transfer-info,
        .mobile-payment-info {
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
        }
        
        .bank-transfer-info p {
          margin: 10px 0;
          font-size: 15px;
          color: #475569;
        }
        
        .mobile-payment-info {
          text-align: center;
        }
        
        .qr-placeholder {
          width: 200px;
          height: 200px;
          margin: 20px auto;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
        }
        
        @media (max-width: 968px) {
          .billing-summary-grid {
            grid-template-columns: 1fr;
          }
          
          .payment-methods {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 640px) {
          .bill-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .bill-actions {
            width: 100%;
            flex-direction: column;
          }
          
          .billing-tabs {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}
