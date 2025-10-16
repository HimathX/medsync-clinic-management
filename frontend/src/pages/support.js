// src/pages/SupportHelp.js
import React from 'react';

export default function SupportHelp() {
  return (
    <div>
      <h1>Support & Help</h1>
      <section className="card section">
        <div className="grid grid-3">
          <button className="btn">How to book</button>
          <button className="btn">Payments & Billing</button>
          <button className="btn">Insurance Claims</button>
        </div>
      </section>
      <section className="card section">
        <h3>FAQs</h3>
        <div className="slot" style={{height:200}} />
      </section>
      <section className="card section">
        <h3>Contact Support</h3>
        <div className="grid grid-2">
          <div><button className="btn">Live Chat</button></div>
          <div><button className="btn">Submit Ticket</button></div>
        </div>
      </section>
    </div>
  );
}
