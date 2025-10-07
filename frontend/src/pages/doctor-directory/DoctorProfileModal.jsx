import React, { useState } from 'react';

const DoctorProfileModal = ({ 
  doctor, 
  isFavorite, 
  onToggleFavorite, 
  onBookAppointment, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'reviews', 'availability'
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

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

  const handleSubmitReview = (e) => {
    e.preventDefault();
    alert(`Review submitted: ${newReview.rating} stars - ${newReview.comment}`);
    setNewReview({ rating: 5, comment: '' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="doctor-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>

        <div className="modal-header">
          <div className="doctor-profile-header">
            <img src={doctor.image} alt={doctor.name} className="doctor-profile-image" />
            <div className="doctor-profile-info">
              <div className="profile-name-row">
                <h2>{doctor.name}</h2>
                <button 
                  className={`favorite-btn-large ${isFavorite ? 'active' : ''}`}
                  onClick={() => onToggleFavorite(doctor.id)}
                >
                  ♥
                </button>
              </div>
              <p className="profile-specialty">{doctor.specialty}</p>
              <div className="profile-rating">
                <span className="rating-number">{doctor.rating}</span>
                <div className="stars">{renderStars(doctor.rating)}</div>
                <span className="review-count">({doctor.reviewCount} reviews)</span>
              </div>
              <p className="profile-experience">{doctor.experience} years experience</p>
            </div>
          </div>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </button>
          <button
            className={`tab-btn ${activeTab === 'availability' ? 'active' : ''}`}
            onClick={() => setActiveTab('availability')}
          >
            Availability
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="info-section">
                <h3>About</h3>
                <p>{doctor.about}</p>
              </div>

              <div className="info-section">
                <h3>Education</h3>
                <p>{doctor.education}</p>
              </div>

              <div className="info-grid">
                <div className="info-card">
                  <h4>Languages</h4>
                  <p>{doctor.languages.join(', ')}</p>
                </div>
                <div className="info-card">
                  <h4>Locations</h4>
                  <p>{doctor.locations.join(', ')}</p>
                </div>
                <div className="info-card">
                  <h4>Consultation Fee</h4>
                  <p className="price-highlight">${doctor.price}</p>
                </div>
                <div className="info-card">
                  <h4>Next Available</h4>
                  <p>{doctor.nextAvailable}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-tab">
              <div className="reviews-summary">
                <div className="summary-rating">
                  <div className="big-rating">{doctor.rating}</div>
                  <div className="stars-large">{renderStars(doctor.rating)}</div>
                  <p>{doctor.reviewCount} reviews</p>
                </div>
              </div>

              <div className="reviews-list">
                <h3>Patient Reviews</h3>
                {doctor.reviews.map((review, index) => (
                  <div key={index} className="review-item">
                    <div className="review-header">
                      <span className="patient-name">{review.patient}</span>
                      <span className="review-date">{review.date}</span>
                    </div>
                    <div className="review-rating">{renderStars(review.rating)}</div>
                    <p className="review-comment">{review.comment}</p>
                  </div>
                ))}
              </div>

              <div className="review-form">
                <h3>Write a Review</h3>
                <form onSubmit={handleSubmitReview}>
                  <div className="form-group">
                    <label>Rating</label>
                    <select
                      value={newReview.rating}
                      onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                    >
                      <option value={5}>5 Stars - Excellent</option>
                      <option value={4}>4 Stars - Good</option>
                      <option value={3}>3 Stars - Average</option>
                      <option value={2}>2 Stars - Poor</option>
                      <option value={1}>1 Star - Terrible</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Your Review</label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder="Share your experience with this doctor..."
                      rows="4"
                      required
                    />
                  </div>
                  <button type="submit" className="submit-review-btn">Submit Review</button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="availability-tab">
              <h3>Weekly Schedule</h3>
              <div className="availability-calendar">
                {Object.entries(doctor.availability).map(([day, slots]) => (
                  <div key={day} className="day-schedule">
                    <div className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</div>
                    <div className="time-slots">
                      {slots.map((slot, index) => (
                        <div key={index} className="time-slot">
                          {slot}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="book-appointment-btn" onClick={() => onBookAppointment(doctor)}>
            Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfileModal;
