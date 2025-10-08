import React from 'react';

const ViewToggle = ({ viewMode, setViewMode }) => {
  return (
    <div className="view-toggle">
      <button
        className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
        onClick={() => setViewMode('grid')}
      >
        Grid View
      </button>
      <button
        className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
        onClick={() => setViewMode('list')}
      >
        List View
      </button>
    </div>
  );
};

export default ViewToggle;
