// src/pages/Billing.js
import React, { useState } from 'react';

export default function Billing() {
  const [invoice] = useState({ number:'INV-1023', date:'2025-09-12', due:'2025-09-28', total:15000, covered:9000, status:'Overdue' });
  const [method, setMethod] = useState('Card');
  const outPocket = invoice.total - invoice.covered;
  const [amount, setAmount] = useState(outPocket);
  const [autoPay, setAutoPay] = useState(false);
  const pay = () => alert(`Paid LKR ${amount} via ${method} (mock)`);

  return (
    <div>
      <h1>Billing & Payments</h1>

      <section className="card section">
        <h3>Financial Summary</h3>
        <div className="grid grid-5">
          <div className="card"><div className="label">Outstanding</div><div style={{fontWeight:800}}>LKR 8,500</div></div>
          <div className="card"><div className="label">Recent Payment</div><div style={{fontWeight:800}}>LKR 5,000</div></div>
          <div className="card"><div className="label">Next Due</div><div style={{fontWeight:800}}>{invoice.due}</div></div>
          <div className="card"><div className="label">YTD Spending</div><div style={{fontWeight:800}}>LKR 122,000</div></div>
          <div className="card"><div className="label">Avg Monthly</div><div style={{fontWeight:800}}>LKR 10,200</div></div>
        </div>
      </section>

      <section className="card section">
        <h3>Invoices</h3>
        <table className="table">
          <thead><tr><th>#</th><th>Date</th><th>Amount</th><th>Covered</th><th>Due</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr>
              <td>{invoice.number}</td>
              <td>{invoice.date}</td>
              <td>LKR {invoice.total}</td>
              <td>LKR {invoice.covered}</td>
              <td>LKR {outPocket}</td>
              <td><span className="status">{invoice.status}</span></td>
              <td style={{textAlign:'right'}}><button className="btn">View</button> <button className="btn">PDF</button></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="card section">
        <h3>Make a Payment</h3>
        <div className="grid grid-3">
          <label className="label">Amount<input className="input" type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} /></label>
          <label className="label">Method
            <select className="select" value={method} onChange={e=>setMethod(e.target.value)}>
              <option>Card</option><option>Bank Transfer</option><option>PayHere</option><option>Insurance</option>
            </select>
          </label>
          <div style={{display:'flex',alignItems:'end', justifyContent:'flex-end'}}>
            <button className="btn primary" onClick={pay}>Pay</button>
          </div>
        </div>
        <label className="label" style={{display:'flex', alignItems:'center', gap:8, marginTop:8}}>
          <input type="checkbox" checked={autoPay} onChange={e=>setAutoPay(e.target.checked)} /> Enable Auto-Pay
        </label>
      </section>

      <section className="card section">
        <h3>Payment History</h3>
        <div className="slot" style={{height:160}} />
        <button className="btn" style={{marginTop:8}}>Export CSV</button>
      </section>
    </div>
  );
}
