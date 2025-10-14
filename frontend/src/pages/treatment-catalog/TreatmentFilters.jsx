import React from 'react';

const TreatmentFilters = ({
  searchQuery,
  setSearchQuery,
  priceRange,
  setPriceRange,
  selectedDuration,
  setSelectedDuration,
  selectedBranch,
  setSelectedBranch,
  urgencyLevel,
  setUrgencyLevel,
  onClearFilters
}) => {
  const durations = [
    { value: 'all', label: 'All Durations' },
    { value: '0-30', label: 'Under 30 min' },
    { value: '30-60', label: '30-60 min' },
    { value: '60+', label: 'Over 60 min' }
  ];

  const branches = [
    { value: 'all', label: 'All Branches' },
    { value: 'Colombo', label: 'Colombo' },
    { value: 'Kandy', label: 'Kandy' },
    { value: 'Galle', label: 'Galle' },
    { value: 'Negombo', label: 'Negombo' },
    { value: 'Jaffna', label: 'Jaffna' }
  ];

  const urgencyLevels = [
    { value: 'all', label: 'All Levels' },
    { value: 'routine', label: 'Routine' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'emergency', label: 'Emergency' }
  ];

  return (
    <div className="treatment-filters">
      <div className="filters-card">
        <h2 className="filters-title">Filters</h2>

        {/* Search */}
        <div className="filter-group">
          <label className="filter-label">Search</label>
          <input
            type="text"
            className="filter-search"
            placeholder="Search treatments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Price Range */}
        <div className="filter-group">
          <label className="filter-label">Price Range</label>
          <div className="price-range-container">
            <input
              type="range"
              min="0"
              max="5000"
              step="50"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
              className="price-slider"
            />
            <div className="price-labels">
              <span className="price-min">${priceRange[0]}</span>
              <span className="price-max">${priceRange[1]}</span>
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="filter-group">
          <label className="filter-label">Duration</label>
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(e.target.value)}
            className="filter-select"
          >
            {durations.map(duration => (
              <option key={duration.value} value={duration.value}>
                {duration.label}
              </option>
            ))}
          </select>
        </div>

        {/* Branch */}
        <div className="filter-group">
          <label className="filter-label">Branch</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="filter-select"
          >
            {branches.map(branch => (
              <option key={branch.value} value={branch.value}>
                {branch.label}
              </option>
            ))}
          </select>
        </div>

        {/* Urgency Level */}
        <div className="filter-group">
          <label className="filter-label">Urgency Level</label>
          <select
            value={urgencyLevel}
            onChange={(e) => setUrgencyLevel(e.target.value)}
            className="filter-select"
          >
            {urgencyLevels.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        <button className="clear-all-btn" onClick={onClearFilters}>
          Clear All Filters
        </button>
      </div>
    </div>
  );
};

export default TreatmentFilters;
