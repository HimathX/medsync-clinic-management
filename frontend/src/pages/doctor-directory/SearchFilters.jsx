import React from 'react';

const SearchFilters = ({
  searchQuery,
  setSearchQuery,
  selectedSpecialty,
  setSelectedSpecialty,
  selectedLocation,
  setSelectedLocation,
  selectedExperience,
  setSelectedExperience,
  minRating,
  setMinRating,
  onClearFilters
}) => {
  const specialties = [
    'All Specialties',
    'Cardiology',
    'Neurology',
    'Orthopedic Surgery',
    'Pediatrics',
    'Dermatology',
    'General Surgery',
    'Psychiatry',
    'Gynecology',
    'Ophthalmology'
  ];

  const locations = [
    'All Branches',
    'Colombo',
    'Kandy',
    'Galle',
    'Negombo',
    'Jaffna'
  ];

  const experienceLevels = [
    { value: 'all', label: 'All Experience Levels' },
    { value: '0-5', label: '0-5 years' },
    { value: '5-10', label: '5-10 years' },
    { value: '10-15', label: '10-15 years' },
    { value: '15+', label: '15+ years' }
  ];

  const ratings = [
    { value: 0, label: 'Any Rating' },
    { value: 3, label: '3+ Stars' },
    { value: 4, label: '4+ Stars' },
    { value: 4.5, label: '4.5+ Stars' }
  ];

  return (
    <div className="search-filters-card">
      <h3 className="filters-title">Search & Filters</h3>

      <div className="filter-group">
        <label>Search</label>
        <input
          type="text"
          className="search-input"
          placeholder="Search doctors, specialties..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>Specialty</label>
        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="filter-select"
        >
          {specialties.map(specialty => (
            <option key={specialty} value={specialty === 'All Specialties' ? 'all' : specialty}>
              {specialty}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Branch Location</label>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="filter-select"
        >
          {locations.map(location => (
            <option key={location} value={location === 'All Branches' ? 'all' : location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Experience</label>
        <select
          value={selectedExperience}
          onChange={(e) => setSelectedExperience(e.target.value)}
          className="filter-select"
        >
          {experienceLevels.map(level => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Minimum Rating</label>
        <select
          value={minRating}
          onChange={(e) => setMinRating(parseFloat(e.target.value))}
          className="filter-select"
        >
          {ratings.map(rating => (
            <option key={rating.value} value={rating.value}>
              {rating.label}
            </option>
          ))}
        </select>
      </div>

      <button className="clear-all-btn" onClick={onClearFilters}>
        Clear All Filters
      </button>
    </div>
  );
};

export default SearchFilters;
