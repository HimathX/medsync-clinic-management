import React from 'react';

const TreatmentCard = ({ treatment, viewMode, onViewDetails, onBookNow }) => {
  return (
    <div className={`treatment-card ${viewMode}`}>
      <div className="treatment-card-header">
        <img 
          src={treatment.image} 
          alt={treatment.name}
          className="treatment-image"
        />
        <div className="treatment-title-section">
          <div className="treatment-name-row">
            <h3 className="treatment-name">{treatment.name}</h3>
            <span className="treatment-code">{treatment.id}</span>
          </div>
          <p className="treatment-description">{treatment.description}</p>
        </div>
      </div>

      <div className="treatment-card-body">
        <div className="treatment-meta">
          <span className="treatment-specialty">{treatment.specialty}</span>
          <span className="treatment-duration">{treatment.duration}</span>
        </div>

        <div className="treatment-pricing">
          <div className="price-section">
            <span className="price-amount">
              ${treatment.price}
              {treatment.maxPrice && treatment.maxPrice !== treatment.price && (
                <> - ${treatment.maxPrice}</>
              )}
            </span>
            {treatment.insuranceCovered && (
              <span className="insurance-badge">Insurance</span>
            )}
          </div>
          
          <div className="treatment-locations">
            <span className="locations-label">Available at:</span>
            <span className="locations-list">{treatment.availableAt.join(', ')}</span>
          </div>
        </div>
      </div>

      <div className="treatment-card-footer">
        <button 
          className="btn-view-details"
          onClick={() => onViewDetails(treatment)}
        >
          View Details
        </button>
        <button 
          className="btn-book-now"
          onClick={() => onBookNow(treatment)}
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

export default TreatmentCard;
