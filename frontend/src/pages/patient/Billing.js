// src/pages/patient/Billing.js - Patient Billing & Payments with Real Data
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import billingService from '../../services/billingService';
import authService from '../../services/authService';
import '../../styles/patientDashboard.css';

export default function PatientBilling() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('outstanding');
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  
  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [claims, setClaims] = useState([]);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Get patient ID from auth
  const currentUser = authService.getCurrentUser();
  const patientId = currentUser?.patientId || localStorage.getItem('patientId');

  useEffect(() => {
    if (!patientId) {
      navigate('/patient-login');
      return;
    }
    fetchBillingData();
  }, [patientId]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('💰 Fetching billing data for patient:', patientId);

      // Fetch invoices, payments, and claims in parallel
      const [invoicesData, paymentsData, claimsData] = await Promise.all([
        billingService.getInvoicesByPatient(patientId),
        billingService.getPaymentsByPatient(patientId),
        billingService.getClaimsByPatient(patientId)
      ]);

      console.log('✅ Billing data fetched:', { invoicesData, paymentsData, claimsData });

      setInvoices(invoicesData || []);
      setPayments(paymentsData.payments || []);
      setClaims(claimsData.claims || []);
    } catch (err) {
      console.error('❌ Error fetching billing data:', err);
      setError(err.message || 'Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  // Calculate outstanding invoices (unpaid)
  const outstandingBills = invoices.filter(inv => {
    const totalPaid = payments
      .filter(p => p.status === 'Completed')
      .reduce((sum, p) => sum + parseFloat(p.amount_paid), 0);
    const totalAmount = parseFloat(inv.total_amount);
    return totalAmount > totalPaid;
  });

  const totalOutstanding = outstandingBills.reduce((sum, bill) => sum + parseFloat(bill.total_amount || 0), 0);
  const totalPaidThisMonth = payments
    .filter(p => {
      const paymentDate = new Date(p.payment_date);
      const now = new Date();
      return p.status === 'Completed' && 
             paymentDate.getMonth() === now.getMonth() &&
             paymentDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + parseFloat(p.amount_paid), 0);

  const handlePayNow = (bill) => {
    setSelectedBill(bill);
  };

  const handleConfirmPayment = async () => {
    if (paymentMethod === 'Credit Card' && (!cardNumber || !cardExpiry || !cardCVV)) {
      alert('Please fill in all card details');
      return;
    }

    try {
      setProcessingPayment(true);

      const paymentData = {
        patient_id: patientId,
        amount_paid: parseFloat(selectedBill.total_amount),
        payment_method: paymentMethod,
        payment_date: new Date().toISOString().split('T')[0],
        notes: `Payment for invoice ${selectedBill.invoice_id}`
      };

      console.log('💳 Processing payment:', paymentData);

      await billingService.createPayment(paymentData);
      
      alert(`Payment of LKR ${selectedBill.total_amount.toLocaleString()} processed successfully!`);
      
      // Refresh billing data
      await fetchBillingData();
      
      // Reset form
      setSelectedBill(null);
      setCardNumber('');
      setCardExpiry('');
      setCardCVV('');
    } catch (err) {
      console.error('❌ Payment error:', err);
      alert('Payment failed: ' + err.message);
    } finally {
      setProcessingPayment(false);
    }
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
        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="spinner">⏳</div>
            <p>Loading billing information...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Billing Data</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={fetchBillingData}>
              🔄 Try Again
            </button>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <>
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
                  <div className="summary-card-value">LKR {totalPaidThisMonth.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="billing-summary-card insurance">
                <div className="summary-card-icon">🏥</div>
                <div className="summary-card-content">
                  <div className="summary-card-label">Insurance Claims</div>
                  <div className="summary-card-value">{claims.length} Claims</div>
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
                      <div key={bill.invoice_id} className="bill-card">
                        <div className="bill-header">
                          <div>
                            <h4 className="bill-id">Invoice #{bill.invoice_id.slice(0, 8)}</h4>
                            <p className="bill-date">{new Date(bill.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="bill-status-badge pending">Outstanding</div>
                        </div>
                        
                        <div className="bill-description">
                          {bill.doctor_name ? `Consultation with ${bill.doctor_name}` : 'Medical Services'}
                        </div>
                        
                        <div className="bill-footer">
                          <div className="bill-amount">LKR {parseFloat(bill.total_amount).toLocaleString()}</div>
                          <div className="bill-actions">
                            <button className="btn-outline">Download PDF</button>
                            <button className="btn-primary" onClick={() => handlePayNow(bill)}>
                              Pay Now
                            </button>
                          </div>
                        </div>
                        
                        {bill.due_date && (
                          <div className="bill-due">
                            Due date: {new Date(bill.due_date).toLocaleDateString()}
                          </div>
                        )}
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
                {payments.length === 0 ? (
                  <div className="empty-state-card">
                    <span className="empty-icon">📋</span>
                    <p>No payment history</p>
                  </div>
                ) : (
                  <div className="bills-list">
                    {payments.map(payment => (
                      <div key={payment.payment_id} className="bill-card paid-bill">
                        <div className="bill-header">
                          <div>
                            <h4 className="bill-id">Payment #{payment.payment_id.slice(0, 8)}</h4>
                            <p className="bill-date">{new Date(payment.payment_date).toLocaleDateString()}</p>
                          </div>
                          <div className={`bill-status-badge ${payment.status.toLowerCase()}`}>{payment.status}</div>
                        </div>
                        
                        <div className="bill-description">
                          {payment.notes || 'Payment processed'}
                        </div>
                        
                        <div className="bill-footer">
                          <div>
                            <div className="bill-amount">LKR {parseFloat(payment.amount_paid).toLocaleString()}</div>
                            <div className="payment-method">via {payment.payment_method}</div>
                          </div>
                          <button className="btn-outline">Download Receipt</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Insurance Claims Tab */}
            {activeTab === 'insurance' && (
              <div className="billing-content">
                <h3 className="section-heading">Insurance Claims</h3>
                {claims.length === 0 ? (
                  <div className="empty-state-card">
                    <span className="empty-icon">🏥</span>
                    <p>No insurance claims</p>
                  </div>
                ) : (
                  <div className="bills-list">
                    {claims.map(claim => (
                      <div key={claim.claim_id} className="bill-card insurance-claim">
                        <div className="bill-header">
                          <div>
                            <h4 className="bill-id">Claim #{claim.claim_id.slice(0, 8)}</h4>
                            <p className="bill-date">{new Date(claim.claim_date).toLocaleDateString()}</p>
                          </div>
                          <div className="bill-status-badge processing">Processing</div>
                        </div>
                        
                        <div className="bill-description">Insurance Claim</div>
                        <div className="insurance-provider">Package: {claim.package_name}</div>
                        
                        <div className="bill-footer">
                          <div className="bill-amount">LKR {parseFloat(claim.claim_amount).toLocaleString()}</div>
                          <button className="btn-outline">View Details</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
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
