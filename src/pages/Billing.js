import React, { useState } from 'react';

const Billing = ({ role }) => {
  const [invoiceData, setInvoiceData] = useState({ appointmentId: '', total: 0, insuranceCovered: 0, outPocket: 0 });
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [error, setError] = useState('');

  const handleGenerateInvoice = () => {
    // Mock auto-generate
    setInvoiceData({ ...invoiceData, total: 10000, insuranceCovered: 5000, outPocket: 5000 });
  };

  const handlePayment = () => {
    if (paymentAmount > invoiceData.outPocket) {
      setError('Overpayment');
      return;
    }
    // Mock process
    alert(`Paid ${paymentAmount} via ${paymentMethod}. Outstanding: ${invoiceData.outPocket - paymentAmount}`);
  };

  const handleClaim = () => {
    // Mock submit claim
    alert('Insurance Claim Submitted');
  };

  return (
    <div>
      <h1>Billing Management</h1>
      <input value={invoiceData.appointmentId} onChange={(e) => setInvoiceData({...invoiceData, appointmentId: e.target.value})} placeholder="Appointment ID" />
      <button onClick={handleGenerateInvoice}>Generate Invoice</button>
      {invoiceData.total > 0 && (
        <div>
          <p>Total: LKR {invoiceData.total}</p>
          <p>Insurance Covered: LKR {invoiceData.insuranceCovered}</p>
          <p>Out-of-Pocket: LKR {invoiceData.outPocket}</p>
        </div>
      )}

      {/* Payment Processing */}
      <h2>Make Payment</h2>
      <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Amount" />
      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
        <option>Cash</option>
        <option>Card</option>
        <option>Insurance</option>
      </select>
      {error && <div className="error">{error}</div>}
      <button onClick={handlePayment}>Pay</button>

      {/* Claim Submission */}
      <button onClick={handleClaim}>Submit Insurance Claim</button>

      {/* Balance Management */}
      <h2>Outstanding Balances</h2>
      <p>Mock List of Patients with Dues</p>
    </div>
  );
};

export default Billing;