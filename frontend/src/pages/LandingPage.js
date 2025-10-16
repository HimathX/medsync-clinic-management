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
      <section className="headline-section">
        <div className="container">
          <h2 className="main-headline">
            Channelling the <span className="highlight-blue">Best Doctor</span> Has Never Been This Easy!
          </h2>
          <p className="headline-subtitle">
            Book appointments with our highly qualified specialists through our easy-to-use patient portal
          </p>
        </div>
      </section>

      {/* Portal Selection Section */}
      <section className="portal-selection-section">
        <div className="container">
          <div className="portal-grid">
            {/* Staff Portal Card */}
            <div className="portal-card-modern staff-portal-card" onClick={() => navigate('/staff-login')}>
              <div className="portal-image-wrapper">
                <div className="portal-image staff-image">
                  <div className="image-placeholder">
                    <span className="placeholder-icon">👨‍⚕️</span>
                    <p className="placeholder-text">Medical Professional</p>
                  </div>
                </div>
                <div className="portal-badge">
                  <span className="badge-icon">🏥</span>
                  <span className="badge-text">Staff Portal</span>
                </div>
              </div>
              <div className="portal-content">
                <h3 className="portal-heading">Staff & Admin Access</h3>
                <div className="quote-mark">"</div>
                <p className="portal-quote">
                  Our highly skilled and compassionate medical team is committed to providing excellence in healthcare management and patient care.
                </p>
                <ul className="portal-features-list">
                  <li>✓ Patient Database Management</li>
                  <li>✓ Appointment Scheduling System</li>
                  <li>✓ Billing & Insurance Processing</li>
                  <li>✓ Medical Records Management</li>
                  <li>✓ Analytics & Reporting</li>
                </ul>
                <button className="portal-cta-btn staff-cta">
                  <span>Enter Staff Portal</span>
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            </div>

            {/* Patient Portal Card */}
            <div className="portal-card-modern patient-portal-card" onClick={() => navigate('/patient-login')}>
              <div className="portal-image-wrapper">
                <div className="portal-image patient-image">
                  <div className="image-placeholder">
                    <span className="placeholder-icon">🧑‍🤝‍🧑</span>
                    <p className="placeholder-text">Patient Care</p>
                  </div>
                </div>
                <div className="portal-badge patient-badge">
                  <span className="badge-icon">❤️</span>
                  <span className="badge-text">Patient Portal</span>
                </div>
              </div>
              <div className="portal-content">
                <h3 className="portal-heading">Patient Access</h3>
                <div className="quote-mark">"</div>
                <p className="portal-quote">
                  Enjoy personalized consultations in our spacious and comfortable consultation rooms, designed for your privacy and comfort.
                </p>
                <ul className="portal-features-list">
                  <li>✓ Book & Manage Appointments</li>
                  <li>✓ View Medical Records & Results</li>
                  <li>✓ Online Bill Payment</li>
                  <li>✓ Prescription Management</li>
                  <li>✓ Direct Doctor Communication</li>
                </ul>
                <button className="portal-cta-btn patient-cta">
                  <span>Enter Patient Portal</span>
                  <span className="btn-arrow">→</span>
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
