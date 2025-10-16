// src/pages/Billing.js - Staff Billing & Payment Processing
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import patientDataService from '../services/patientDataService';
import patientService from '../services/patientService';
import billingService from '../services/billingService';
import treatmentService from '../services/treatmentService';
import '../styles/billing.css';

export default function Billing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const patientId = searchParams.get('patientId');
  
  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState(patientId ? 'process' : 'pending');
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Service/Appointment Types - Fetched from backend
  const [serviceTypes, setServiceTypes] = useState([]);
  
  // Invoices data - Fetched from backend
  const [invoices, setInvoices] = useState([]);

  // Payment history - Fetched from backend
  const [paymentHistory, setPaymentHistory] = useState([]);

  // All patients for search - Fetched from backend
  const [allPatients, setAllPatients] = useState([]);

  const filteredPatients = allPatients.filter(p => 
    p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
    p.phone.includes(patientSearchQuery)
  );

  useEffect(() => {
    fetchBillingData();
  }, [patientId]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch service types from treatment catalogue
      const treatments = await treatmentService.getAllTreatments();
      const formattedServices = (treatments || []).map(t => ({
        id: t.treatment_id,
        name: t.treatment_name || 'Service',
        category: t.category || 'General',
        price: parseFloat(t.cost) || 0,
        icon: getCategoryIcon(t.category)
      }));
      setServiceTypes(formattedServices);

      // Fetch invoices
      const invoicesData = await billingService.getPendingInvoices();
      const formattedInvoices = (invoicesData || []).map(inv => ({
        id: `INV-${inv.invoice_id}`,
        patientId: `P${inv.patient_id}`,
        patientName: inv.patient_name || 'Patient',
        date: new Date(inv.invoice_date).toLocaleDateString(),
        dueDate: inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A',
        description: inv.description || 'Medical Services',
        total: parseFloat(inv.total_amount) || 0,
        paid: parseFloat(inv.paid_amount) || 0,
        status: inv.status || 'Pending'
      }));
      setInvoices(formattedInvoices);

      // Fetch payment history
      const paymentsData = await billingService.getRecentPayments(50);
      const formattedPayments = (paymentsData || []).map(pay => ({
        id: `PAY-${pay.payment_id}`,
        date: new Date(pay.payment_date).toLocaleDateString(),
        invoice: `INV-${pay.invoice_id}`,
        patientId: `P${pay.patient_id}`,
        patientName: pay.patient_name || 'Patient',
        amount: parseFloat(pay.amount) || 0,
        method: pay.payment_method || 'Cash',
        processedBy: pay.processed_by || 'Staff'
      }));
      setPaymentHistory(formattedPayments);

      // Fetch all patients
      const patientsData = await patientService.getAllPatients(0, 100);
      const formattedPatients = (patientsData.patients || []).map(p => ({
        id: `P${p.patient_id}`,
        name: p.full_name || `Patient ${p.patient_id}`,
        phone: p.contact_num || 'N/A',
        email: p.email || 'N/A'
      }));
      setAllPatients(formattedPatients);

      // If patientId is provided, fetch patient data
      if (patientId) {
        const fetchedPatient = patientDataService.getPatientById(patientId);
        setPatient(fetchedPatient);
      }

    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError('Failed to load billing data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get icon based on category
  const getCategoryIcon = (category) => {
    const iconMap = {
      'Consultation': '👨‍⚕️',
      'Lab Tests': '💉',
      'Imaging': '📷',
      'Diagnostic': '📊',
      'Treatment': '💊',
      'Surgery': '⚕️',
      'Emergency': '🚑'
    };
    return iconMap[category] || '🏥';
  };

  const handleSelectPatient = (selectedPatient) => {
    setPatient(selectedPatient);
    navigate(`/billing?patientId=${selectedPatient.id}`);
    setShowPatientSelector(false);
    setPatientSearchQuery('');
  };

  // Service Selection Functions
  const handleAddService = (service) => {
    setSelectedServices(prev => [...prev, { ...service, quantity: 1 }]);
  };

  const handleRemoveService = (index) => {
    setSelectedServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index, quantity) => {
    if (quantity < 1) return;
    setSelectedServices(prev => 
      prev.map((service, i) => i === index ? { ...service, quantity } : service)
    );
  };

  const calculateTotal = () => {
    return selectedServices.reduce((sum, service) => sum + (service.price * service.quantity), 0);
  };

  const outstandingInvoices = invoices.filter(inv => 
    (!patientId || inv.patientId === patientId) && inv.status === 'Pending'
  );
  
  const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + (inv.total - inv.paid), 0);

  const handleProcessPayment = async () => {
    const totalAmount = calculateTotal();
    
    if (selectedServices.length === 0 || totalAmount <= 0) {
      alert('Please add services before processing payment');
      return;
    }
    
    try {
      const paymentData = {
        patient_id: parseInt(patient?.id.replace('P', '')) || parseInt(patientId),
        amount: totalAmount,
        payment_method: paymentMethod,
        description: selectedServices.map(s => `${s.name} (x${s.quantity})`).join(', '),
        payment_date: new Date().toISOString()
      };
      
      // Process payment through backend
      await billingService.processPayment(paymentData);
      
      alert(`Payment of LKR ${totalAmount.toLocaleString()} processed successfully!\n\nServices: ${paymentData.description}`);
      
      // Reset form and refresh data
      setSelectedServices([]);
      setDescription('');
      setShowPaymentModal(false);
      fetchBillingData();
    } catch (err) {
      console.error('Error processing payment:', err);
      alert('Failed to process payment. Please try again.');
    }
  };

  const handlePayInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setAmount((invoice.total - invoice.paid).toString());
    setDescription(`Payment for ${invoice.description}`);
    setShowPaymentModal(true);
  };

  if (loading) {
    return (
      <div style={{padding: '20px', textAlign: 'center'}}>
        <div style={{fontSize: '48px', marginBottom: '20px'}}>⏳</div>
        <h2>Loading Billing Data...</h2>
        <p style={{color: '#64748b'}}>Please wait while we fetch the information</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{padding: '20px', textAlign: 'center'}}>
        <div style={{fontSize: '48px', marginBottom: '20px'}}>⚠️</div>
        <h2 style={{color: 'var(--accent-red)'}}>Error Loading Billing Data</h2>
        <p style={{color: '#64748b', marginBottom: '20px'}}>{error}</p>
        <button className="btn primary" onClick={fetchBillingData}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{padding: '20px', maxWidth: '1400px', margin: '0 auto', background: 'var(--surface-secondary)', minHeight: '100vh'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
        <div>
          <h1 style={{margin: 0, fontSize: '32px', fontWeight: 700, color: 'var(--primary-black)'}}>💳 Billing & Payments</h1>
          {patient && (
            <p style={{color: 'var(--text-secondary)', marginTop: '8px', fontSize: '16px'}}>
              Processing payments for: <strong style={{color: 'var(--primary-black)'}}>{patient.name}</strong> (ID: {patient.id})
            </p>
          )}
        </div>
        {patientId && (
          <button 
            className="btn" 
            onClick={() => navigate(`/patient/${patientId}`)}
            style={{padding: '10px 20px', border: '2px solid var(--border-default)', background: 'var(--primary-white)', color: 'var(--primary-black)'}}
          >
            ← Back to Patient
          </button>
        )}
      </div>

      {/* Patient Information Card (if patient is selected) */}
      {patient && (
        <section className="card" style={{marginBottom: '30px', padding: '25px', background: 'var(--primary-white)', border: '2px solid var(--border-default)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <div style={{
              width: '70px',
              height: '70px',
              background: 'var(--accent-red)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--primary-white)',
              boxShadow: '0 4px 12px rgba(197, 48, 48, 0.3)'
            }}>
              {patient?.name ? patient.name.split(' ').map(n => n[0]).join('') : 'P'}
            </div>
            <div style={{flex: 1}}>
              <h2 style={{margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--primary-black)'}}>{patient?.name || 'Loading...'}</h2>
              <div style={{display: 'flex', gap: '20px', marginTop: '8px', color: '#64748b', fontSize: '14px'}}>
                <span>📋 ID: {patient?.id || patientId}</span>
                <span>📧 {patient?.email || 'N/A'}</span>
                <span>📞 {patient?.phone || 'N/A'}</span>
                <span>🩸 Blood Type: {patient?.bloodType || 'N/A'}</span>
              </div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{color: '#64748b', fontSize: '13px', fontWeight: 600, marginBottom: '5px'}}>TOTAL OUTSTANDING</div>
              <div style={{fontSize: '32px', fontWeight: 800, color: totalOutstanding > 0 ? '#EF4444' : '#10B981'}}>
                LKR {totalOutstanding.toLocaleString()}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Financial Summary Cards */}
      <section className="card section">
        <h3 style={{color: 'var(--primary-black)'}}>📊 Financial Summary</h3>
        <div className="grid grid-5">
          <div className="card billing-card-accent" style={{padding: '20px'}}>
            <div className="label" style={{color: 'var(--text-secondary)'}}>Outstanding Balance</div>
            <div style={{fontWeight:800, fontSize: '24px', color: 'var(--accent-red)'}}>LKR {totalOutstanding.toLocaleString()}</div>
            <div style={{fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '5px'}}>{outstandingInvoices.length} pending invoices</div>
          </div>
          <div className="card billing-card" style={{padding: '20px'}}>
            <div className="label" style={{color: 'var(--text-secondary)'}}>Total Paid (Last 30 days)</div>
            <div style={{fontWeight:800, fontSize: '24px', color: 'var(--primary-black)'}}>LKR 12,000</div>
            <div style={{fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '5px'}}>1 transaction</div>
          </div>
          <div className="card billing-card" style={{padding: '20px'}}>
            <div className="label" style={{color: 'var(--text-secondary)'}}>Next Due Date</div>
            <div style={{fontWeight:800, fontSize: '18px', color: 'var(--primary-black)'}}>
              {outstandingInvoices.length > 0 ? outstandingInvoices[0].dueDate : 'None'}
            </div>
            <div style={{fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '5px'}}>Upcoming payment</div>
          </div>
          <div className="card billing-card" style={{padding: '20px'}}>
            <div className="label" style={{color: 'var(--text-secondary)'}}>YTD Total</div>
            <div style={{fontWeight:800, fontSize: '24px', color: 'var(--primary-black)'}}>LKR 2.7M</div>
            <div style={{fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '5px'}}>This year</div>
          </div>
          <div className="card billing-card" style={{padding: '20px'}}>
            <div className="label" style={{color: 'var(--text-secondary)'}}>Avg Transaction</div>
            <div style={{fontWeight:800, fontSize: '24px', color: 'var(--primary-black)'}}>LKR 6,250</div>
            <div style={{fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '5px'}}>Average amount</div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div style={{display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid var(--border-subtle)'}}>
        <button 
          onClick={() => setActiveTab('process')}
          className={activeTab === 'process' ? 'billing-tab-active' : 'billing-tab-inactive'}
          style={{
            padding: '12px 24px',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '15px'
          }}
        >
          Process Payment
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          className={activeTab === 'pending' ? 'billing-tab-active' : 'billing-tab-inactive'}
          style={{
            padding: '12px 24px',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '15px'
          }}
        >
          Pending Invoices ({outstandingInvoices.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={activeTab === 'history' ? 'billing-tab-active' : 'billing-tab-inactive'}
          style={{
            padding: '12px 24px',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '15px'
          }}
        >
          Payment History
        </button>
      </div>

      {/* Process Payment Tab */}
      {activeTab === 'process' && (
        <section className="card section">
          <h3>💳 Process New Payment</h3>
          
          {/* Patient Selection Area */}
          {!patient && !patientId ? (
            <div>
              {!showPatientSelector ? (
                <div style={{padding: '40px', textAlign: 'center', background: '#f0f9ff', border: '2px dashed #0EA5E9', borderRadius: '12px'}}>
                  <div style={{fontSize: '64px', marginBottom: '20px'}}>�</div>
                  <h3 style={{color: '#0c4a6e', marginBottom: '10px'}}>No Patient Selected</h3>
                  <p style={{color: '#0369a1', marginBottom: '20px'}}>
                    Select a patient to process payment
                  </p>
                  <button 
                    className="btn primary"
                    onClick={() => setShowPatientSelector(true)}
                    style={{
                      background: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
                      padding: '14px 28px',
                      fontSize: '16px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <span style={{fontSize: '20px'}}>+</span> Add Patient
                  </button>
                </div>
              ) : (
                <div style={{padding: '20px', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '12px', marginBottom: '20px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                    <h4 style={{margin: 0, color: '#1e293b'}}>🔍 Search & Select Patient</h4>
                    <button 
                      className="btn"
                      onClick={() => {
                        setShowPatientSelector(false);
                        setPatientSearchQuery('');
                      }}
                      style={{padding: '8px 16px'}}
                    >
                      Cancel
                    </button>
                  </div>
                  <input 
                    type="text"
                    className="input"
                    placeholder="Search by name, ID, or phone..."
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      marginBottom: '15px',
                      border: '2px solid #cbd5e1',
                      borderRadius: '8px'
                    }}
                    autoFocus
                  />
                  <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                    {filteredPatients.length === 0 ? (
                      <div style={{padding: '20px', textAlign: 'center', color: '#64748b'}}>
                        No patients found
                      </div>
                    ) : (
                      filteredPatients.map(p => (
                        <div 
                          key={p.id}
                          onClick={() => handleSelectPatient(p)}
                          style={{
                            padding: '15px',
                            background: 'white',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            marginBottom: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#0EA5E9';
                            e.currentTarget.style.background = '#f0f9ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.background = 'white';
                          }}
                        >
                          <div>
                            <div style={{fontWeight: 700, fontSize: '16px', color: '#1e293b'}}>{p.name}</div>
                            <div style={{fontSize: '13px', color: '#64748b', marginTop: '4px'}}>
                              ID: {p.id} • 📞 {p.phone}
                            </div>
                          </div>
                          <button 
                            className="btn primary"
                            style={{
                              background: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
                              padding: '8px 16px'
                            }}
                          >
                            Select
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="billing-success-banner" style={{
                padding: '15px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong style={{color: 'var(--primary-black)'}}>✓ Patient Selected:</strong> {patient?.name || patientId}
                  <span style={{marginLeft: '10px', color: 'var(--text-secondary)'}}>ID: {patient?.id || patientId}</span>
                </div>
                <button 
                  className="btn billing-change-patient-btn"
                  onClick={() => {
                    setPatient(null);
                    navigate('/billing');
                  }}
                  style={{padding: '8px 16px'}}
                >
                  Change Patient
                </button>
              </div>

              {/* Services Section */}
              <div style={{marginBottom: '20px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                  <h4 style={{margin: 0, color: 'var(--primary-black)'}}>📋 Services & Treatments</h4>
                  <button 
                    className="btn primary billing-btn-primary"
                    onClick={() => setShowServiceSelector(!showServiceSelector)}
                    style={{
                      padding: '10px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{fontSize: '18px'}}>+</span> Add Service
                  </button>
                </div>

                {/* Service Selector Dropdown */}
                {showServiceSelector && (
                  <div style={{
                    padding: '20px',
                    background: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    marginBottom: '15px',
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}>
                    <h5 style={{marginTop: 0, marginBottom: '15px', color: '#1e293b'}}>Select Service Type</h5>
                    {Object.entries(
                      serviceTypes.reduce((acc, service) => {
                        if (!acc[service.category]) acc[service.category] = [];
                        acc[service.category].push(service);
                        return acc;
                      }, {})
                    ).map(([category, services]) => (
                      <div key={category} style={{marginBottom: '20px'}}>
                        <div style={{
                          fontWeight: 700,
                          fontSize: '14px',
                          color: '#64748b',
                          marginBottom: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {category}
                        </div>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px'}}>
                          {services.map(service => (
                            <div
                              key={service.id}
                              onClick={() => {
                                handleAddService(service);
                                setShowServiceSelector(false);
                              }}
                              style={{
                                padding: '15px',
                                background: 'white',
                                border: '2px solid #e2e8f0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#0EA5E9';
                                e.currentTarget.style.background = '#f0f9ff';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              <div style={{display: 'flex', alignItems: 'center', gap: '10px', flex: 1}}>
                                <span style={{fontSize: '24px'}}>{service.icon}</span>
                                <div>
                                  <div style={{fontWeight: 600, color: '#1e293b'}}>{service.name}</div>
                                  <div style={{fontSize: '12px', color: '#64748b', marginTop: '2px'}}>{service.category}</div>
                                </div>
                              </div>
                              <div style={{fontWeight: 700, fontSize: '16px', color: '#0EA5E9'}}>
                                LKR {service.price.toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Services List */}
                {selectedServices.length > 0 ? (
                  <div style={{
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    <table style={{width: '100%', borderCollapse: 'collapse'}}>
                      <thead>
                        <tr style={{background: '#f8fafc'}}>
                          <th style={{padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0'}}>Service</th>
                          <th style={{padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0'}}>Price</th>
                          <th style={{padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', width: '150px'}}>Quantity</th>
                          <th style={{padding: '12px', textAlign: 'right', borderBottom: '2px solid #e2e8f0'}}>Total</th>
                          <th style={{padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', width: '80px'}}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedServices.map((service, index) => (
                          <tr key={index} style={{borderBottom: '1px solid #f1f5f9'}}>
                            <td style={{padding: '12px'}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <span style={{fontSize: '20px'}}>{service.icon}</span>
                                <div>
                                  <div style={{fontWeight: 600}}>{service.name}</div>
                                  <div style={{fontSize: '12px', color: '#64748b'}}>{service.category}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{padding: '12px', textAlign: 'center', color: '#64748b'}}>
                              LKR {service.price.toLocaleString()}
                            </td>
                            <td style={{padding: '12px', textAlign: 'center'}}>
                              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                                <button
                                  onClick={() => handleUpdateQuantity(index, service.quantity - 1)}
                                  style={{
                                    width: '30px',
                                    height: '30px',
                                    border: '2px solid #e2e8f0',
                                    background: 'white',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '16px',
                                    color: '#64748b'
                                  }}
                                >
                                  -
                                </button>
                                <span style={{fontWeight: 700, fontSize: '16px', minWidth: '30px', textAlign: 'center'}}>
                                  {service.quantity}
                                </span>
                                <button
                                  onClick={() => handleUpdateQuantity(index, service.quantity + 1)}
                                  style={{
                                    width: '30px',
                                    height: '30px',
                                    border: '2px solid #0EA5E9',
                                    background: '#0EA5E9',
                                    color: 'white',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '16px'
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td style={{padding: '12px', textAlign: 'right', fontWeight: 700, fontSize: '16px', color: 'var(--primary-black)'}}>
                              LKR {(service.price * service.quantity).toLocaleString()}
                            </td>
                            <td style={{padding: '12px', textAlign: 'center'}}>
                              <button
                                onClick={() => handleRemoveService(index)}
                                className="billing-remove-btn"
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  fontSize: '12px'
                                }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{background: 'var(--surface-secondary)', borderTop: '3px solid var(--border-strong)'}}>
                          <td colSpan="3" style={{padding: '15px', fontWeight: 700, fontSize: '18px', color: 'var(--primary-black)'}}>
                            TOTAL AMOUNT
                          </td>
                          <td style={{padding: '15px', textAlign: 'right', fontWeight: 800, fontSize: '24px', color: 'var(--accent-red)'}}>
                            LKR {calculateTotal().toLocaleString()}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '12px',
                    color: '#64748b'
                  }}>
                    <div style={{fontSize: '48px', marginBottom: '10px'}}>📋</div>
                    <p>No services added yet. Click "+ Add Service" to begin.</p>
                  </div>
                )}
              </div>

              {/* Payment Method and Notes */}
              <div className="grid grid-3">
                <label className="label">
                  Payment Method
                  <select className="select" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}>
                    <option>Card</option>
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>PayHere</option>
                    <option>Insurance</option>
                    <option>Cheque</option>
                  </select>
                </label>
                <label className="label" style={{gridColumn: 'span 2'}}>
                  Additional Notes (Optional)
                  <input 
                    className="input" 
                    type="text" 
                    value={description} 
                    onChange={e=>setDescription(e.target.value)}
                    placeholder="Add any additional notes..."
                  />
                </label>
              </div>
              
              <div style={{marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                <button className="btn billing-btn-secondary" onClick={() => setSelectedServices([])} style={{padding: '12px 24px'}}>
                  Clear All
                </button>
                <button 
                  className="btn primary billing-btn-primary" 
                  onClick={handleProcessPayment}
                  disabled={selectedServices.length === 0}
                  style={{
                    padding: '12px 32px',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: selectedServices.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: selectedServices.length === 0 ? 0.6 : 1
                  }}
                >
                  Process Payment {selectedServices.length > 0 && `(LKR ${calculateTotal().toLocaleString()})`}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {/* Pending Invoices Tab */}
      {activeTab === 'pending' && (
        <section className="card section">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h3>📋 {patientId ? 'Patient' : 'All'} Pending Invoices</h3>
            {!patientId && (
              <div style={{color: '#64748b', fontSize: '14px'}}>
                Showing invoices from all patients
              </div>
            )}
          </div>
          {outstandingInvoices.length === 0 ? (
            <div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>
              <div style={{fontSize: '48px', marginBottom: '10px'}}>✓</div>
              <p>No pending invoices</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  {!patientId && <th>Patient</th>}
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {outstandingInvoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td style={{fontWeight: 700, color: 'var(--accent-red)'}}>{invoice.id}</td>
                    {!patientId && (
                      <td>
                        <div style={{fontWeight: 600, color: 'var(--primary-black)'}}>{invoice.patientName}</div>
                        <div style={{fontSize: '12px', color: 'var(--text-secondary)'}}>ID: {invoice.patientId}</div>
                      </td>
                    )}
                    <td style={{color: 'var(--text-primary)'}}>{invoice.date}</td>
                    <td style={{color: 'var(--text-primary)'}}>{invoice.description}</td>
                    <td style={{fontWeight: 700, fontSize: '16px', color: 'var(--primary-black)'}}>LKR {(invoice.total - invoice.paid).toLocaleString()}</td>
                    <td style={{color: 'var(--text-primary)'}}>{invoice.dueDate}</td>
                    <td>
                      <span className="billing-status-pending">
                        {invoice.status}
                      </span>
                    </td>
                    <td style={{textAlign:'right'}}>
                      <button 
                        className="btn" 
                        onClick={() => navigate(`/patient/${invoice.patientId}`)}
                        style={{marginRight: '8px', border: '2px solid var(--border-default)', background: 'var(--primary-white)', color: 'var(--primary-black)'}}
                      >
                        View Patient
                      </button>
                      <button 
                        className="btn primary billing-btn-primary" 
                        onClick={() => {
                          // Navigate to billing with patient context to enable payment
                          navigate(`/billing?patientId=${invoice.patientId}`);
                          // Optionally pre-fill the payment form
                          setTimeout(() => {
                            setActiveTab('process');
                            handlePayInvoice(invoice);
                          }, 100);
                        }}
                      >
                        Pay Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* Payment History Tab */}
      {activeTab === 'history' && (
        <section className="card section">
          <h3>📜 Payment History</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Payment ID</th>
                {!patientId && <th>Patient</th>}
                <th>Date</th>
                <th>Invoice</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Processed By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory
                .filter(payment => !patientId || payment.patientId === patientId)
                .map(payment => (
                <tr key={payment.id}>
                  <td style={{fontWeight: 700, color: 'var(--primary-black)'}}>{payment.id}</td>
                  {!patientId && (
                    <td>
                      <div style={{fontWeight: 600, color: 'var(--primary-black)'}}>{payment.patientName}</div>
                      <div style={{fontSize: '12px', color: 'var(--text-secondary)'}}>ID: {payment.patientId}</div>
                    </td>
                  )}
                  <td style={{color: 'var(--text-primary)'}}>{payment.date}</td>
                  <td style={{color: 'var(--text-primary)'}}>{payment.invoice}</td>
                  <td style={{fontWeight: 700, fontSize: '16px', color: 'var(--primary-black)'}}>LKR {payment.amount.toLocaleString()}</td>
                  <td style={{color: 'var(--text-primary)'}}>{payment.method}</td>
                  <td style={{fontSize: '13px', color: 'var(--text-secondary)'}}>{payment.processedBy}</td>
                  <td style={{textAlign:'right'}}>
                    <button className="btn billing-btn-secondary" onClick={() => alert(`View receipt ${payment.id}`)} style={{padding: '8px 16px'}}>
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn billing-btn-secondary" style={{marginTop: '16px', padding: '10px 20px'}}>
            📥 Export to CSV
          </button>
        </section>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{marginBottom: '20px'}}>Process Payment</h3>
            {selectedInvoice && (
              <div style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
                <div><strong>Invoice:</strong> {selectedInvoice.id}</div>
                <div style={{marginTop: '5px'}}><strong>Description:</strong> {selectedInvoice.description}</div>
                <div style={{marginTop: '5px', fontSize: '20px', fontWeight: 800, color: '#EF4444'}}>
                  Amount: LKR {(selectedInvoice.total - selectedInvoice.paid).toLocaleString()}
                </div>
              </div>
            )}
            <div style={{marginBottom: '15px'}}>
              <label className="label">
                Amount (LKR)
                <input 
                  className="input" 
                  type="number" 
                  value={amount} 
                  onChange={e=>setAmount(e.target.value)}
                  style={{fontSize: '18px', fontWeight: 600}}
                />
              </label>
            </div>
            <div style={{marginBottom: '15px'}}>
              <label className="label">
                Payment Method
                <select className="select" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}>
                  <option>Card</option>
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>PayHere</option>
                  <option>Insurance</option>
                  <option>Cheque</option>
                </select>
              </label>
            </div>
            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px'}}>
              <button className="btn billing-btn-secondary" onClick={() => setShowPaymentModal(false)} style={{padding: '10px 20px'}}>
                Cancel
              </button>
              <button 
                className="btn primary billing-btn-primary" 
                onClick={handleProcessPayment}
                style={{padding: '10px 20px'}}
              >
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
