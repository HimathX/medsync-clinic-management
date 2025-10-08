export default function FilterSidebar({ searchQuery, onSearchChange, filters, onFiltersChange, onClearFilters, stats, doctors }) {
  return (
    <aside className="filter-sidebar">
      <div className="filter-section">
        <div className="filter-header">
          <h3>Search & Filter</h3>
          <button className="link-btn" onClick={onClearFilters}>Clear All</button>
        </div>

        <div className="filter-group">
          <label>Search Records</label>
          <input
            type="text"
            className="input"
            placeholder="Search by doctor, condition, etc."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Date From</label>
          <input
            type="date"
            className="input"
            value={filters.dateFrom}
            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <label>Date To</label>
          <input
            type="date"
            className="input"
            value={filters.dateTo}
            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <label>Record Type</label>
          <select
            className="select"
            value={filters.recordType}
            onChange={(e) => onFiltersChange({ ...filters, recordType: e.target.value })}
          >
            <option value="all">All Types</option>
            <option value="consultation">Consultations</option>
            <option value="treatment">Treatments</option>
            <option value="surgery">Surgery</option>
            <option value="diagnostic">Diagnostics</option>
            <option value="prescription">Prescriptions</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Doctor</label>
          <select
            className="select"
            value={filters.doctor}
            onChange={(e) => onFiltersChange({ ...filters, doctor: e.target.value })}
          >
            <option value="all">All Doctors</option>
            {doctors.map(doctor => (
              <option key={doctor} value={doctor}>{doctor}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-section">
        <h3>Quick Stats</h3>
        <div className="stat-row">
          <span className="muted">Total Records</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-row">
          <span className="muted">Consultations</span>
          <span className="stat-value stat-primary">{stats.consultations}</span>
        </div>
        <div className="stat-row">
          <span className="muted">Treatments</span>
          <span className="stat-value stat-success">{stats.treatments}</span>
        </div>
        <div className="stat-row">
          <span className="muted">Diagnostics</span>
          <span className="stat-value stat-primary">{stats.diagnostics}</span>
        </div>
        <div className="stat-row">
          <span className="muted">Prescriptions</span>
          <span className="stat-value stat-success">{stats.prescriptions}</span>
        </div>
      </div>
    </aside>
  )
}
