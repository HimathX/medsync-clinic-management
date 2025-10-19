// src/pages/LandingPage.js - MedSync Landing Page
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/landing.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Top Navigation Bar */}
      <div className="top-nav">
        <div className="top-nav-content">
          <div className="top-nav-links">
            <a href="#about">About Us</a>
            <a href="#services">Services</a>
            <a href="#facilities">Facilities</a>
            <a href="#careers">Careers</a>
            <a href="#news">News & Events</a>
          </div>
          <div className="top-nav-actions">
            <a href="tel:+94115430000" className="top-nav-contact">
              📞 +94 11 543 0000
            </a>
            <button className="emergency-btn">
              🚨 Emergency: 1566
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="main-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-wrapper">
              <div className="logo-cross">✚</div>
              <h1 className="brand-name">MedSync</h1>
            </div>
            <p className="brand-tagline">Medical Center</p>
          </div>
          <nav className="main-nav">
            <a href="#home" className="nav-link active">Home</a>
            <a href="#medical-services" className="nav-link">Medical & Surgical Services</a>
            <a href="#general-services" className="nav-link">General Services</a>
            <a href="#contact" className="nav-link">Contact Us</a>
          </nav>
        </div>
      </header>

      {/* Hero Section with Background Image */}
      <section className="hero-banner">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-text">
            <h2 className="hero-title">Channelling a Doctor</h2>
            <div className="breadcrumb">
              <span>HOME</span>
              <span className="separator">/</span>
              <span>GENERAL SERVICES</span>
              <span className="separator">/</span>
              <span className="active">CHANNEL A DOCTOR</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Headline Section */}
      <section className="headline-section" style={{padding: '80px 0', background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)'}}>
        <div className="container" style={{textAlign: 'center'}}>
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '8px 20px',
            borderRadius: '30px',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '20px'
          }}>
            ✨ Welcome to MedSync Healthcare
          </div>
          <h2 style={{
            fontSize: '48px',
            fontWeight: '800',
            color: '#1a2332',
            marginBottom: '20px',
            lineHeight: '1.2'
          }}>
            Your Health, <span style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Our Priority</span>
          </h2>
          <p style={{
            fontSize: '20px',
            color: '#64748b',
            maxWidth: '700px',
            margin: '0 auto 40px',
            lineHeight: '1.6'
          }}>
            Experience world-class healthcare with cutting-edge technology, expert medical professionals, and compassionate care. Your journey to better health starts here.
          </p>
          <div style={{display: 'flex', gap: '40px', justifyContent: 'center', marginTop: '50px'}}>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: '42px', fontWeight: '800', color: '#667eea'}}>50K+</div>
              <div style={{fontSize: '14px', color: '#64748b'}}>Patients Served</div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: '42px', fontWeight: '800', color: '#10b981'}}>200+</div>
              <div style={{fontSize: '14px', color: '#64748b'}}>Medical Experts</div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: '42px', fontWeight: '800', color: '#f59e0b'}}>15+</div>
              <div style={{fontSize: '14px', color: '#64748b'}}>Years Excellence</div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: '42px', fontWeight: '800', color: '#ef4444'}}>24/7</div>
              <div style={{fontSize: '14px', color: '#64748b'}}>Emergency Care</div>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Selection Section */}
      <section className="portal-selection-section" style={{padding: '100px 0', background: 'white'}}>
        <div className="container">
          <div className="section-header" style={{textAlign: 'center', marginBottom: '60px'}}>
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              SELECT YOUR PORTAL
            </div>
            <h2 style={{fontSize: '42px', fontWeight: '800', color: '#1a2332', marginBottom: '16px'}}>
              Access Your Dashboard
            </h2>
            <p style={{fontSize: '18px', color: '#64748b', maxWidth: '600px', margin: '0 auto'}}>
              Choose the portal that matches your role to access personalized features and services
            </p>
          </div>
          
          <div className="portal-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '30px',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            
            {/* Patient Portal Card */}
            <div className="portal-card-modern patient-portal-card" style={{
              background: 'white',
              borderRadius: '24px',
              padding: '40px 30px',
              border: '2px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(102, 126, 234, 0.2)';
              e.currentTarget.style.borderColor = '#667eea';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '150px',
                height: '150px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                opacity: 0.05,
                borderRadius: '0 24px 0 100%'
              }}></div>
              <div style={{position: 'relative', zIndex: 1}}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  marginBottom: '24px'
                }}>
                  👨‍👩‍👧‍👦
                </div>
                <h3 style={{fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: '#1a2332'}}>
                  Patient Portal
                </h3>
                <p style={{fontSize: '15px', color: '#64748b', marginBottom: '24px'}}>
                  For Patients & Families
                </p>
                <ul style={{listStyle: 'none', padding: 0, marginBottom: '30px'}}>
                  {['Book & Manage Appointments', 'View Medical Records', 'Online Bill Payment', 'Prescription Management', 'Lab Results Access'].map((item, idx) => (
                    <li key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px',
                      color: '#475569',
                      fontSize: '15px'
                    }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        flexShrink: 0
                      }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button 
                  onClick={() => navigate('/patient-login')}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate('/patient-signup')}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: 'white',
                    color: '#667eea',
                    border: '2px solid #667eea',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#667eea';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.color = '#667eea';
                  }}
                >
                  Register
                </button>
                </div>
              </div>
            </div>
            
            {/* Doctor Portal Card */}
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '40px 30px',
              border: '2px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(16, 185, 129, 0.2)';
              e.currentTarget.style.borderColor = '#10b981';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '150px',
                height: '150px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                opacity: 0.05,
                borderRadius: '0 24px 0 100%'
              }}></div>
              <div style={{position: 'relative', zIndex: 1}}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  marginBottom: '24px'
                }}>
                  👨‍⚕️
                </div>
                <h3 style={{fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: '#1a2332'}}>
                  Doctor Portal
                </h3>
                <p style={{fontSize: '15px', color: '#64748b', marginBottom: '24px'}}>
                  For Medical Professionals
                </p>
                <ul style={{listStyle: 'none', padding: 0, marginBottom: '30px'}}>
                  {['Patient Consultation Records', 'Appointment Schedule', 'Prescription Management', 'Treatment History', 'Lab Results Review'].map((item, idx) => (
                    <li key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px',
                      color: '#475569',
                      fontSize: '15px'
                    }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        flexShrink: 0
                      }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button 
                    onClick={() => navigate('/doctor-login')}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => navigate('/doctor-signup')}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      background: 'white',
                      color: '#10b981',
                      border: '2px solid #10b981',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#10b981';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'white';
                      e.target.style.color = '#10b981';
                    }}
                  >
                    Register
                  </button>
                </div>
              </div>
            </div>
            
            {/* Staff Portal Card */}
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '40px 30px',
              border: '2px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(59, 130, 246, 0.2)';
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '150px',
                height: '150px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                opacity: 0.05,
                borderRadius: '0 24px 0 100%'
              }}></div>
              <div style={{position: 'relative', zIndex: 1}}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  marginBottom: '24px'
                }}>
                  🏥
                </div>
                <h3 style={{fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: '#1a2332'}}>
                  Staff Portal
                </h3>
                <p style={{fontSize: '15px', color: '#64748b', marginBottom: '24px'}}>
                  For Admin & Support Staff
                </p>
                <ul style={{listStyle: 'none', padding: 0, marginBottom: '30px'}}>
                  {['Patient Database Management', 'Appointment Scheduling', 'Billing & Insurance', 'Inventory Management', 'Reports & Analytics'].map((item, idx) => (
                    <li key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px',
                      color: '#475569',
                      fontSize: '15px'
                    }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        flexShrink: 0
                      }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => navigate('/staff-login')}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  Staff Login →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Sets Us Apart Section */}
      <section className="features-section">
        <div className="features-bg"></div>
        <div className="container">
          <div className="features-content">
            <div className="features-text">
              <h2 className="features-title">
                What Sets <span className="highlight-white">Our Care</span>
                <br />Apart from the Rest?
              </h2>
              <div className="features-list">
                <div className="feature-point">
                  <div className="feature-icon">✓</div>
                  <div className="feature-text">
                    <h4>24/7 Emergency Services</h4>
                    <p>Round-the-clock medical care when you need it most</p>
                  </div>
                </div>
                <div className="feature-point">
                  <div className="feature-icon">✓</div>
                  <div className="feature-text">
                    <h4>State-of-the-Art Technology</h4>
                    <p>Advanced medical equipment and modern facilities</p>
                  </div>
                </div>
                <div className="feature-point">
                  <div className="feature-icon">✓</div>
                  <div className="feature-text">
                    <h4>Expert Medical Team</h4>
                    <p>Highly qualified doctors and healthcare professionals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Branch Information */}
      <section className="branches-section">
        <div className="container">
          <h2 className="section-title">Our Branches</h2>
          <div className="branches-grid">
            <div className="branch-card-modern">
              <div className="branch-header">
                <div className="branch-icon-wrapper">
                  <span className="branch-icon">📍</span>
                </div>
                <h3 className="branch-name">Colombo</h3>
              </div>
              <div className="branch-details">
                <p className="branch-address">123 Main Street, Colombo 03</p>
                <p className="branch-phone">
                  <span className="phone-icon">☎</span>
                  <a href="tel:+94111234567">011-1234567</a>
                </p>
                <p className="branch-hours">
                  <span className="hours-icon">🕐</span>
                  Mon-Sat: 9 AM - 5 PM
                </p>
                <button className="branch-btn">Get Directions</button>
              </div>
            </div>

            <div className="branch-card-modern">
              <div className="branch-header">
                <div className="branch-icon-wrapper">
                  <span className="branch-icon">📍</span>
                </div>
                <h3 className="branch-name">Kandy</h3>
              </div>
              <div className="branch-details">
                <p className="branch-address">456 Hill Road, Kandy</p>
                <p className="branch-phone">
                  <span className="phone-icon">☎</span>
                  <a href="tel:+94817654321">081-7654321</a>
                </p>
                <p className="branch-hours">
                  <span className="hours-icon">🕐</span>
                  Mon-Sat: 9 AM - 5 PM
                </p>
                <button className="branch-btn">Get Directions</button>
              </div>
            </div>

            <div className="branch-card-modern">
              <div className="branch-header">
                <div className="branch-icon-wrapper">
                  <span className="branch-icon">📍</span>
                </div>
                <h3 className="branch-name">Galle</h3>
              </div>
              <div className="branch-details">
                <p className="branch-address">789 Beach Road, Galle</p>
                <p className="branch-phone">
                  <span className="phone-icon">☎</span>
                  <a href="tel:+94915551234">091-5551234</a>
                </p>
                <p className="branch-hours">
                  <span className="hours-icon">🕐</span>
                  Mon-Sat: 9 AM - 5 PM
                </p>
                <button className="branch-btn">Get Directions</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="container">
          <h2 className="section-title-white">Contact Details</h2>
          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon emergency-icon">
                <span>🚨</span>
              </div>
              <h4 className="contact-label">Emergency Hotline</h4>
              <a href="tel:+94115431088" className="contact-number">+94 11 543 1088</a>
            </div>
            <div className="contact-card">
              <div className="contact-icon general-icon">
                <span>📞</span>
              </div>
              <h4 className="contact-label">General Line</h4>
              <a href="tel:+94115430000" className="contact-number">+94 11 543 0000</a>
            </div>
            <div className="contact-card">
              <div className="contact-icon doctor-icon">
                <span>👨‍⚕️</span>
              </div>
              <h4 className="contact-label">Doctor Channeling</h4>
              <a href="tel:+94702371591" className="contact-number">+94 70 237 1591</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <div className="footer-logo">
                <div className="logo-cross">✚</div>
                <h3>MedSync</h3>
              </div>
              <div className="footer-info">
                <h4>ADDRESS</h4>
                <p>No. 578, Elvitigala Mawatha,<br />Narahenpita, Colombo 00500,<br />Sri Lanka</p>
              </div>
              <div className="footer-info">
                <h4>CONTACT NUMBER</h4>
                <p>1566<br />+94 11 543 0000</p>
              </div>
              <div className="footer-info">
                <h4>EMAIL ADDRESS</h4>
                <p>info@medsync.com</p>
              </div>
            </div>

            <div className="footer-column">
              <h4>QUICK LINKS</h4>
              <ul className="footer-links">
                <li><a href="#home">Home Page</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#media">Media</a></li>
                <li><a href="#about">About Us</a></li>
                <li><a href="#facilities">Facilities</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>GENERAL SERVICES</h4>
              <ul className="footer-links">
                <li><a href="#blood-bank">Blood Bank</a></li>
                <li><a href="#channel">Channel Your Doctor</a></li>
                <li><a href="#vaccinations">Vaccinations</a></li>
                <li><a href="#physiotherapy">Physiotherapy</a></li>
                <li><a href="#pharmacy">Pharmacy</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>MEDICAL SERVICES</h4>
              <ul className="footer-links">
                <li><a href="#cardiology">Cardiology Centre</a></li>
                <li><a href="#neurology">Neurology Centre</a></li>
                <li><a href="#oncology">Cancer Care Centre</a></li>
                <li><a href="#orthopaedic">Orthopaedic Centre</a></li>
                <li><a href="#emergency">Emergency Services</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-social">
              <a href="#facebook" className="social-link">f</a>
              <a href="#instagram" className="social-link">📷</a>
              <a href="#youtube" className="social-link">▶</a>
              <a href="#twitter" className="social-link">𝕏</a>
              <a href="#linkedin" className="social-link">in</a>
            </div>
            <div className="footer-legal">
              <a href="#terms">Terms & Conditions</a>
              <span className="separator">|</span>
              <a href="#cookie">Cookie Policy</a>
              <span className="separator">|</span>
              <a href="#privacy">Privacy Policy</a>
            </div>
            <p className="footer-copyright">
              © 2025 MedSync Medical Center @ All right Reserved
            </p>
          </div>
        </div>
      </footer>

      {/* Fixed Action Buttons */}
      <div className="fixed-actions">
        <a href="tel:+94117145145" className="dochelp-btn">
          <span className="dochelp-icon">📞</span>
          <span className="dochelp-text">DOCHELP<br />0117 145 145</span>
        </a>
        <a href="tel:1566" className="emergency-fixed-btn">
          <span className="emergency-icon">🚨</span>
          <span className="emergency-text">Emergency<br />1566</span>
        </a>
      </div>
    </div>
  );
}
