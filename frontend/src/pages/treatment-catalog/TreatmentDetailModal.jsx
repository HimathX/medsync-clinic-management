import React, { useState } from 'react';

const TreatmentDetailModal = ({ treatment, onClose, onBookNow }) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="treatment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        {/* Modal Header */}
        <div className="modal-header">
          <img 
            src={treatment.image} 
            alt={treatment.name}
            className="modal-treatment-image"
          />
          <div className="modal-header-content">
            <div className="modal-name-row">
              <h2 className="modal-treatment-name">{treatment.name}</h2>
              <span className="modal-treatment-code">{treatment.id}</span>
            </div>
            <p className="modal-category">{treatment.category} • {treatment.specialty}</p>
            <div className="modal-rating">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <span 
                    key={i} 
                    className={`star ${i < Math.floor(treatment.rating) ? 'filled' : ''}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="rating-text">
                {treatment.rating} ({treatment.reviewCount} reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'preparation' ? 'active' : ''}`}
            onClick={() => setActiveTab('preparation')}
          >
            Preparation
          </button>
          <button 
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
        </div>

        {/* Tab Content */}
        <div className="modal-body">
          {activeTab === 'overview' && (
            <div className="tab-content">
              <div className="overview-section">
                <h3>Description</h3>
                <p>{treatment.details}</p>
              </div>

              <div className="info-grid">
                <div className="info-card">
                  <h4>Duration</h4>
                  <p>{treatment.duration}</p>
                </div>
                <div className="info-card">
                  <h4>Price</h4>
                  <p>${treatment.price}{treatment.maxPrice && ` - $${treatment.maxPrice}`}</p>
                </div>
                <div className="info-card">
                  <h4>Recovery Time</h4>
                  <p>{treatment.recoveryTime}</p>
                </div>
                <div className="info-card">
                  <h4>Success Rate</h4>
                  <p>{treatment.successRate}</p>
                </div>
              </div>

              <div className="overview-section">
                <h3>Available Locations</h3>
                <div className="locations-tags">
                  {treatment.availableAt.map(location => (
                    <span key={location} className="location-tag">{location}</span>
                  ))}
                </div>
              </div>

              {treatment.insuranceCovered && (
                <div className="insurance-info">
                  <span className="insurance-icon">✓</span>
                  <span>This treatment is covered by most insurance plans</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preparation' && (
            <div className="tab-content">
              <div className="preparation-section">
                <h3>Before Your Appointment</h3>
                <ul className="preparation-checklist">
                  {treatment.preparation.map((item, index) => (
                    <li key={index}>
                      <span className="checklist-icon">☑</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {treatment.contraindications !== 'None' && (
                <div className="contraindications-section">
                  <h3>Contraindications</h3>
                  <div className="warning-box">
                    <span className="warning-icon">⚠</span>
                    <p>{treatment.contraindications}</p>
                  </div>
                </div>
              )}

              <div className="preparation-section">
                <h3>Recovery Information</h3>
                <p>Expected recovery time: <strong>{treatment.recoveryTime}</strong></p>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="tab-content">
              <div className="details-section">
                <h3>Medical Terminology</h3>
                <p>{treatment.details}</p>
              </div>

              <div className="details-section">
                <h3>Related Services</h3>
                <div className="related-services">
                  {treatment.relatedServices.map(service => (
                    <span key={service} className="related-service-tag">{service}</span>
                  ))}
                </div>
              </div>

              <div className="details-section">
                <h3>Urgency Level</h3>
                <span className={`urgency-badge ${treatment.urgency}`}>
                  {treatment.urgency.charAt(0).toUpperCase() + treatment.urgency.slice(1)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="modal-price-info">
            <span className="modal-price-label">Starting from</span>
            <span className="modal-price-amount">${treatment.price}</span>
          </div>
          <button 
            className="modal-book-btn"
            onClick={() => onBookNow(treatment)}
          >
            Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default TreatmentDetailModal;
