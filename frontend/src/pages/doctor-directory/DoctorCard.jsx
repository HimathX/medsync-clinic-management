import React from 'react';

const DoctorCard = ({ 
  doctor, 
  isFavorite, 
  onToggleFavorite, 
  onViewProfile, 
  onBookAppointment,
  viewMode 
}) => {
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }
    while (stars.length < 5) {
      stars.push(<span key={`empty-${stars.length}`} className="star empty">★</span>);
    }

    return stars;
  };

  return (
    <div className="doctor-card">
      <div className="doctor-card-header">
        <div className="doctor-image-wrapper">
          <img src={doctor.image} alt={doctor.name} className="doctor-image" />
        </div>
        <div className="doctor-basic-info">
          <div className="doctor-name-row">
            <h3 className="doctor-name">{doctor.name}</h3>
            <button 
              className={`favorite-btn ${isFavorite ? 'active' : ''}`}
              onClick={() => onToggleFavorite(doctor.id)}
              aria-label="Add to favorites"
            >
              ♥
            </button>
          </div>
          <p className="doctor-specialty">{doctor.specialty}</p>
        </div>
      </div>

      <div className="doctor-rating">
        <span className="rating-number">{doctor.rating}</span>
        <div className="stars">{renderStars(doctor.rating)}</div>
        <span className="review-count">({doctor.reviewCount} reviews)</span>
      </div>

      <div className="doctor-experience">
        {doctor.experience} years experience
      </div>

      <div className="doctor-details">
        <div className="detail-row">
          <span className="detail-label">Languages:</span>
          <span className="detail-value">{doctor.languages.join(', ')}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Available at:</span>
          <span className="detail-value">{doctor.locations.join(', ')}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Next available:</span>
          <span className="detail-value">{doctor.nextAvailable}</span>
        </div>
      </div>

      <div className="doctor-price">
        ${doctor.price}
      </div>

      <div className="doctor-actions">
        <button 
          className="view-profile-btn"
          onClick={() => onViewProfile(doctor)}
        >
          View Profile
        </button>
        <button 
          className="book-now-btn"
          onClick={() => onBookAppointment(doctor)}
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

export default DoctorCard;
