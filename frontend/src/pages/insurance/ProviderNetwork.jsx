import { useState } from 'react';

function ProviderNetwork() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedDistance, setSelectedDistance] = useState('25');

  const providers = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      specialty: 'Primary Care',
      address: '123 Medical Plaza, Suite 100',
      city: 'New York, NY 10001',
      phone: '(555) 123-4567',
      distance: '2.5 miles',
      rating: 4.8,
      accepting: true
    },
    {
      id: 2,
      name: 'City General Hospital',
      specialty: 'Hospital',
      address: '456 Healthcare Drive',
      city: 'New York, NY 10002',
      phone: '(555) 234-5678',
      distance: '3.2 miles',
      rating: 4.6,
      accepting: true
    },
    {
      id: 3,
      name: 'Dr. Michael Chen',
      specialty: 'Cardiology',
      address: '789 Wellness Center',
      city: 'New York, NY 10003',
      phone: '(555) 345-6789',
      distance: '5.1 miles',
      rating: 4.9,
      accepting: true
    },
    {
      id: 4,
      name: 'Advanced Imaging Center',
      specialty: 'Diagnostic',
      address: '321 Technology Parkway',
      city: 'New York, NY 10004',
      phone: '(555) 456-7890',
      distance: '6.8 miles',
      rating: 4.7,
      accepting: true
    },
    {
      id: 5,
      name: 'Dr. Emily Rodriguez',
      specialty: 'Pediatrics',
      address: '654 Family Health Lane',
      city: 'New York, NY 10005',
      phone: '(555) 567-8901',
      distance: '8.3 miles',
      rating: 4.9,
      accepting: false
    }
  ];

  const specialties = ['all', 'Primary Care', 'Cardiology', 'Pediatrics', 'Hospital', 'Diagnostic'];

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         provider.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'all' || provider.specialty === selectedSpecialty;
    const distanceValue = parseFloat(provider.distance);
    const matchesDistance = distanceValue <= parseFloat(selectedDistance);
    
    return matchesSearch && matchesSpecialty && matchesDistance;
  });

  return (
    <div className="provider-network">
      <div className="provider-search">
        <h2>Find In-Network Providers</h2>
        
        <div className="search-filters">
          <div className="filter-group">
            <label>Search Providers</label>
            <input
              type="text"
              placeholder="Search by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Specialty</label>
              <select 
                value={selectedSpecialty} 
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="filter-select"
              >
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>
                    {specialty === 'all' ? 'All Specialties' : specialty}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Distance</label>
              <select 
                value={selectedDistance} 
                onChange={(e) => setSelectedDistance(e.target.value)}
                className="filter-select"
              >
                <option value="5">Within 5 miles</option>
                <option value="10">Within 10 miles</option>
                <option value="25">Within 25 miles</option>
                <option value="50">Within 50 miles</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="providers-results">
        <div className="results-header">
          <h3>Results ({filteredProviders.length})</h3>
        </div>

        <div className="providers-list">
          {filteredProviders.map(provider => (
            <div key={provider.id} className="provider-card">
              <div className="provider-main">
                <div className="provider-icon">
                  {provider.specialty === 'Hospital' ? '🏥' : '👨‍⚕️'}
                </div>
                <div className="provider-info">
                  <h4>{provider.name}</h4>
                  <span className="provider-specialty">{provider.specialty}</span>
                  
                  <div className="provider-rating">
                    <span className="stars">{'⭐'.repeat(Math.floor(provider.rating))}</span>
                    <span className="rating-value">{provider.rating}</span>
                  </div>
                </div>
                
                {provider.accepting ? (
                  <span className="accepting-badge accepting">
                    ✓ Accepting New Patients
                  </span>
                ) : (
                  <span className="accepting-badge not-accepting">
                    Not Accepting
                  </span>
                )}
              </div>

              <div className="provider-details">
                <div className="detail-item">
                  <span className="detail-icon">📍</span>
                  <div className="detail-text">
                    <div>{provider.address}</div>
                    <div className="text-muted">{provider.city}</div>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-icon">📞</span>
                  <div className="detail-text">{provider.phone}</div>
                </div>

                <div className="detail-item">
                  <span className="detail-icon">🚗</span>
                  <div className="detail-text">{provider.distance}</div>
                </div>
              </div>

              <div className="provider-actions">
                <button className="provider-btn primary">View Profile</button>
                <button className="provider-btn secondary">Get Directions</button>
                <button className="provider-btn secondary">Schedule Appointment</button>
              </div>
            </div>
          ))}
        </div>

        {filteredProviders.length === 0 && (
          <div className="empty-state">
            <p>No providers found matching your criteria</p>
            <button 
              className="reset-btn"
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecialty('all');
                setSelectedDistance('25');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProviderNetwork;
