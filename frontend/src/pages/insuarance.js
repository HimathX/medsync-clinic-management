// src/pages/Insurance.js
import React from 'react';

export default function Insurance() {
  return (
    <div>
      <h1>Insurance Management</h1>
      <section className="card section">
        <div className="grid grid-3">
          <div className="card">
            <strong>Primary Insurance</strong>
            <p className="label">AIA Sri Lanka • Policy #PL-88231</p>
            <p className="label">Effective: 2025-01-01 to 2025-12-31 • Individual</p>
          </div>
          <div className="card">
            <strong>Benefits</strong>
            <ul className="label">
              <li>Deductible: LKR 5,000 (remaining 3,000)</li>
              <li>OPD: 80% up to 50,000</li>
              <li>Rx: 70% coverage</li>
            </ul>
          </div>
          <div className="card">
            <strong>Pre-Authorizations</strong>
            <p className="label">No pending requests</p>
          </div>
        </div>
      </section>
      <section className="card section">
        <h3>Claims</h3>
        <table className="table">
          <thead><tr><th>#</th><th>Date</th><th>Status</th><th>Submitted</th><th>Approved</th><th></th></tr></thead>
          <tbody>
            <tr><td>CLM-221</td><td>2025-09-10</td><td>Approved</td><td>LKR 12,000</td><td>LKR 10,000</td><td style={{textAlign:'right'}}><button className="btn">EOB</button></td></tr>
            <tr><td>CLM-229</td><td>2025-09-15</td><td>Under Review</td><td>LKR 8,500</td><td>-</td><td style={{textAlign:'right'}}><button className="btn">Details</button></td></tr>
          </tbody>
        </table>
        <button className="btn" style={{marginTop:8}}>Submit New Claim</button>
      </section>
    </div>
  );
}
