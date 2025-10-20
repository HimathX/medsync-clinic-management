// src/pages/staff/StaffPayments.js - Staff Patient Payments Management
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import billingService from '../../services/billingService';
import patientService from '../../services/patientService';
import StaffHeader from '../../components/StaffHeader';
import authService from '../../services/authService';

export default function StaffPayments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Payment history
  const [recentPayments, setRecentPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({ total: 0, today: 0, count: 0 });

  // Auth
  const currentUser = authService.getCurrentUser();
  const staffName = currentUser?.fullName || 'Staff';
  const staffRole = currentUser?.userType || 'staff';

  useEffect(() => {
    fetchRecentPayments();
  }, []);

  const fetchRecentPayments = async () => {
    try {
      setLoading(true);
      const data = await billingService.getAllPayments(0, 50);
      setRecentPayments(data.payments || []);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const completedPayments = (data.payments || []).filter(p => p.status === 'Completed');
      const todayPayments = completedPayments.filter(p => p.payment_date === today);
      
      setPaymentStats({
        total: completedPayments.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0),
        today: todayPayments.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0),
        count: completedPayments.length
      });
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPatients = async (searchTerm) => {
    setPatientSearch(searchTerm);
    
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const patients = await patientService.getAllPatients(0, 20);
      const filtered = patients.filter(p => 
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.NIC?.includes(searchTerm) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 10));
    } catch (err) {
      console.error('Error searching patients:', err);
    }
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.full_name);
    setSearchResults([]);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setProcessingPayment(true);
      setError(null);

      const paymentData = {
        patient_id: selectedPatient.patient_id,
        amount_paid: parseFloat(amount),
        payment_method: paymentMethod,
        payment_date: paymentDate,
        notes: notes || `Payment recorded by ${staffName}`
      };

      console.log('💳 Recording payment:', paymentData);
      const response = await billingService.createPayment(paymentData);

      if (response.success) {
        setSuccess(`✅ Payment of LKR ${parseFloat(amount).toLocaleString()} recorded successfully!`);
        
        // Reset form
        setSelectedPatient(null);
        setPatientSearch('');
        setAmount('');
        setNotes('');
        setPaymentMethod('Cash');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        
        // Refresh payment history
        fetchRecentPayments();

        // Auto-hide success message
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      setError(err.message || 'Failed to record payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/staff-login');
  };

  return (
    <div className="staff-layout">
      <StaffHeader 
        staffName={staffName}
        staffRole={staffRole}
        onLogout={handleLogout}
      />

      <div className="staff-container" style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: '#1f2937', fontSize: '2rem' }}>💳 Patient Payments</h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>Record and manage patient payments</p>
        </div>

        {/* Success Message */}
        {success && (
          <div style={{
            background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
            border: '2px solid #28a745',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            color: '#155724',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '24px' }}>✅</span>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
            border: '2px solid #dc3545',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            color: '#721c24',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>Total Payments</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>LKR {paymentStats.total.toLocaleString()}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '4px' }}>{paymentStats.count} completed</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 15px rgba(245, 87, 108, 0.3)'
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>Today's Collection</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>LKR {paymentStats.today.toLocaleString()}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '4px' }}>As of {new Date().toLocaleDateString()}</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)'
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>Recent Payments</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{recentPayments.length}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '4px' }}>Last 50 transactions</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Record Payment Form */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
          }}>
            <h2 style={{ margin: '0 0 24px 0', color: '#1f2937', fontSize: '1.5rem' }}>
              📝 Record New Payment
            </h2>

            <form onSubmit={handleSubmitPayment}>
              {/* Patient Search */}
              <div style={{ marginBottom: '20px', position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  Patient *
                </label>
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => handleSearchPatients(e.target.value)}
                  placeholder="Search by name, NIC, or email..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => setTimeout(() => e.target.style.borderColor = '#e5e7eb', 200)}
                />
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    marginTop: '4px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 10,
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }}>
                    {searchResults.map(patient => (
                      <div
                        key={patient.patient_id}
                        onClick={() => selectPatient(patient)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f3f4f6',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.target.style.background = 'white'}
                      >
                        <div style={{ fontWeight: 600, color: '#1f2937' }}>{patient.full_name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                          NIC: {patient.NIC} • {patient.email}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedPatient && (
                <div style={{
                  background: '#f0f9ff',
                  border: '2px solid #3b82f6',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: '4px' }}>
                    ✓ Selected: {selectedPatient.full_name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#3b82f6' }}>
                    ID: {selectedPatient.patient_id.slice(0, 8)}... • NIC: {selectedPatient.NIC}
                  </div>
                </div>
              )}

              {/* Amount */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  Amount (LKR) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Payment Method */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: 'white'
                  }}
                >
                  <option value="Cash">💵 Cash</option>
                  <option value="Credit Card">💳 Credit Card</option>
                  <option value="Debit Card">💳 Debit Card</option>
                  <option value="Online">📱 Online Payment</option>
                  <option value="Insurance">🏥 Insurance</option>
                  <option value="Other">📋 Other</option>
                </select>
              </div>

              {/* Payment Date */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processingPayment || !selectedPatient}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: processingPayment || !selectedPatient 
                    ? '#9ca3af' 
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: processingPayment || !selectedPatient ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!processingPayment && selectedPatient) {
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {processingPayment ? '⏳ Processing...' : '💳 Record Payment'}
              </button>
            </form>
          </div>

          {/* Recent Payments List */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
            maxHeight: '800px',
            overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 24px 0', color: '#1f2937', fontSize: '1.5rem' }}>
              📋 Recent Payments
            </h2>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
                Loading payments...
              </div>
            ) : recentPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
                No payments recorded yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentPayments.map(payment => (
                  <div
                    key={payment.payment_id}
                    style={{
                      padding: '16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '1.1rem' }}>
                          LKR {parseFloat(payment.amount_paid).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>
                          {payment.payment_method}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: payment.status === 'Completed' ? '#d4edda' : '#fff3cd',
                        color: payment.status === 'Completed' ? '#155724' : '#856404'
                      }}>
                        {payment.status}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      📅 {new Date(payment.payment_date).toLocaleDateString()} • 
                      ID: {payment.payment_id.slice(0, 8)}...
                    </div>
                    {payment.notes && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        background: '#f9fafb',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        color: '#4b5563'
                      }}>
                        {payment.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
