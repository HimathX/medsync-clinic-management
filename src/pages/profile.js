// src/pages/Profile.js
import React, { useState } from 'react';

export default function Profile({ user }) {
  const [tab, setTab] = useState('Personal');
  const [photo, setPhoto] = useState(null);
  const [form, setForm] = useState({
    name: user.name, gender:'Male', nationality:'Sri Lankan',
    phone:'+94', phone2:'', email:'you@example.com',
    address:'', mailingSame:true,
    e1:{name:'', relation:'Spouse', phone:'', alt:'', email:'', address:''},
    e2:{name:'', relation:'Parent', phone:'', alt:'', email:'', address:''},
    insurer:'', policy:'', group:'', coverageType:'Individual', effective:{from:'', to:''},
    twoFA:true
  });

  const TabBtn = ({name}) => <button className={'btn'+(tab===name?' primary':'')} onClick={()=>setTab(name)}>{name}</button>;

  return (
    <div>
      <h1>Profile Management</h1>
      <nav className="section" style={{display:'flex', gap:8, flexWrap:'wrap'}}>
        {['Personal','Emergency','Insurance','Medical','Security'].map(t => <TabBtn key={t} name={t} />)}
      </nav>

      {tab==='Personal' && (
        <section className="card section">
          <div className="grid" style={{gridTemplateColumns:'140px 1fr'}}>
            <div>
              <div className="slot" style={{width:120,height:120, borderRadius:8, overflow:'hidden', display:'grid',placeItems:'center'}}>
                {photo ? <img alt="profile" src={URL.createObjectURL(photo)} style={{width:'100%'}}/> : <span className="label">No Photo</span>}
              </div>
              <input type="file" accept="image/png,image/jpeg" onChange={e=>setPhoto(e.target.files[0])} />
            </div>
            <form className="form">
              <label className="label">Full Name<input className="input" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /></label>
              <div className="grid grid-3">
                <label className="label">Gender<select className="select" value={form.gender} onChange={e=>setForm({...form, gender:e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select></label>
                <label className="label">Nationality<input className="input" value={form.nationality} onChange={e=>setForm({...form, nationality:e.target.value})} /></label>
                <label className="label">DOB<input className="input" type="date" disabled value={'1995-01-01'} readOnly /></label>
              </div>
              <div className="grid grid-2">
                <label className="label">Primary Phone<input className="input" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} /></label>
                <label className="label">Secondary Phone<input className="input" value={form.phone2} onChange={e=>setForm({...form, phone2:e.target.value})} /></label>
              </div>
              <label className="label">Email (verified)<input className="input" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></label>
              <label className="label">Current Address<textarea className="textarea" value={form.address} onChange={e=>setForm({...form, address:e.target.value})} /></label>
              <label className="label" style={{display:'flex',alignItems:'center',gap:8}}><input type="checkbox" checked={form.mailingSame} onChange={e=>setForm({...form, mailingSame:e.target.checked})} /> Mailing address same as current</label>
              <div style={{display:'flex', justifyContent:'flex-end'}}><button className="btn primary" type="button">Save</button></div>
            </form>
          </div>
        </section>
      )}

      {tab==='Emergency' && (
        <section className="card section">
          <h3>Primary Emergency Contact</h3>
          <div className="grid grid-3">
            <label className="label">Full name<input className="input" value={form.e1.name} onChange={e=>setForm({...form, e1:{...form.e1, name:e.target.value}})} /></label>
            <label className="label">Relationship<select className="select" value={form.e1.relation} onChange={e=>setForm({...form, e1:{...form.e1, relation:e.target.value}})}><option>Spouse</option><option>Parent</option><option>Sibling</option><option>Friend</option></select></label>
            <label className="label">Phone<input className="input" value={form.e1.phone} onChange={e=>setForm({...form, e1:{...form.e1, phone:e.target.value}})} /></label>
          </div>
          <h3>Secondary Emergency Contact (Optional)</h3>
          <div className="grid grid-3">
            <label className="label">Full name<input className="input" value={form.e2.name} onChange={e=>setForm({...form, e2:{...form.e2, name:e.target.value}})} /></label>
            <label className="label">Relationship<select className="select" value={form.e2.relation} onChange={e=>setForm({...form, e2:{...form.e2, relation:e.target.value}})}><option>Parent</option><option>Sibling</option><option>Friend</option></select></label>
            <label className="label">Phone<input className="input" value={form.e2.phone} onChange={e=>setForm({...form, e2:{...form.e2, phone:e.target.value}})} /></label>
          </div>
          <div style={{display:'flex', justifyContent:'flex-end'}}><button className="btn primary" type="button">Save</button></div>
        </section>
      )}

      {tab==='Insurance' && (
        <section className="card section">
          <div className="grid grid-2">
            <div>
              <h3>Primary Insurance</h3>
              <label className="label">Company<input className="input" value={form.insurer} onChange={e=>setForm({...form, insurer:e.target.value})} /></label>
              <div className="grid grid-3">
                <label className="label">Policy #<input className="input" value={form.policy} onChange={e=>setForm({...form, policy:e.target.value})} /></label>
                <label className="label">Group #<input className="input" value={form.group} onChange={e=>setForm({...form, group:e.target.value})} /></label>
                <label className="label">Coverage Type<select className="select" value={form.coverageType} onChange={e=>setForm({...form, coverageType:e.target.value})}><option>Individual</option><option>Family</option></select></label>
              </div>
              <div className="grid grid-2">
                <label className="label">Effective From<input className="input" type="date" value={form.effective.from} onChange={e=>setForm({...form, effective:{...form.effective, from:e.target.value}})} /></label>
                <label className="label">To<input className="input" type="date" value={form.effective.to} onChange={e=>setForm({...form, effective:{...form.effective, to:e.target.value}})} /></label>
              </div>
              <div style={{display:'flex', justifyContent:'flex-end'}}><button className="btn primary" type="button">Save</button></div>
            </div>
            <div>
              <h3>Insurance Card</h3>
              <div className="slot" style={{height:140}} />
              <button className="btn" style={{marginTop:8}} type="button">Upload Card</button>
            </div>
          </div>
        </section>
      )}

      {tab==='Medical' && (
        <section className="card section">
          <div className="grid grid-2">
            <div><h3>Allergies</h3><div className="slot" style={{height:120}} /></div>
            <div><h3>Chronic Conditions</h3><div className="slot" style={{height:120}} /></div>
          </div>
          <h3>Current Medications</h3>
          <div className="slot" style={{height:140}} />
        </section>
      )}

      {tab==='Security' && (
        <section className="card section">
          <h3>Password Management</h3>
          <div className="grid grid-3">
            <label className="label">New Password<input className="input" type="password" /></label>
            <label className="label">Confirm<input className="input" type="password" /></label>
            <div style={{display:'flex',alignItems:'end'}}><button className="btn" type="button">Change</button></div>
          </div>
          <h3>Two-Factor Authentication</h3>
          <label className="label" style={{display:'flex', alignItems:'center', gap:8}}>
            <input type="checkbox" checked={form.twoFA} onChange={e=>setForm({...form, twoFA:e.target.checked})} /> Enable 2FA
          </label>
          <h3>Login Activity</h3>
          <div className="slot" style={{height:120}} />
        </section>
      )}
    </div>
  );
}
