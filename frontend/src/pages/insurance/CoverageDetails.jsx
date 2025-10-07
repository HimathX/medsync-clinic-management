function CoverageDetails({ policy }) {
  const coverageCategories = [
    {
      title: 'Medical Services',
      items: [
        { service: 'Primary Care Visits', coverage: '100% after copay', copay: `$${policy.copays?.primaryCare || 25}` },
        { service: 'Specialist Visits', coverage: '100% after copay', copay: `$${policy.copays?.specialist || 50}` },
        { service: 'Preventive Care', coverage: '100% covered', copay: '$0' },
        { service: 'Urgent Care', coverage: '100% after copay', copay: '$75' }
      ]
    },
    {
      title: 'Hospital Services',
      items: [
        { service: 'Emergency Room', coverage: '80% after copay', copay: `$${policy.copays?.emergencyRoom || 250}` },
        { service: 'Inpatient Hospital Stay', coverage: '80% after deductible', copay: 'Deductible applies' },
        { service: 'Outpatient Surgery', coverage: '80% after deductible', copay: 'Deductible applies' }
      ]
    },
    {
      title: 'Diagnostic Services',
      items: [
        { service: 'Lab Tests', coverage: '100% after copay', copay: '$10' },
        { service: 'X-rays', coverage: '100% after copay', copay: '$25' },
        { service: 'MRI/CT Scans', coverage: '80% after deductible', copay: 'Deductible applies' },
        { service: 'Ultrasound', coverage: '100% after copay', copay: '$50' }
      ]
    },
    {
      title: 'Prescription Drugs',
      items: [
        { service: 'Generic Drugs', coverage: '100% after copay', copay: '$10' },
        { service: 'Preferred Brand', coverage: '100% after copay', copay: '$40' },
        { service: 'Non-Preferred Brand', coverage: '80% after copay', copay: '$80' },
        { service: 'Specialty Drugs', coverage: '70% after deductible', copay: 'Varies' }
      ]
    },
    {
      title: 'Mental Health',
      items: [
        { service: 'Therapy Sessions', coverage: '100% after copay', copay: '$30' },
        { service: 'Psychiatrist Visits', coverage: '100% after copay', copay: '$50' },
        { service: 'Inpatient Mental Health', coverage: '80% after deductible', copay: 'Deductible applies' }
      ]
    }
  ];

  return (
    <div className="coverage-details">
      <div className="coverage-intro">
        <h2>Coverage Breakdown</h2>
        <p>Detailed information about what your insurance covers</p>
      </div>

      {coverageCategories.map((category, index) => (
        <div key={index} className="coverage-category">
          <h3 className="category-title">{category.title}</h3>
          <div className="coverage-table">
            <div className="coverage-table-header">
              <div className="coverage-col">Service</div>
              <div className="coverage-col">Coverage</div>
              <div className="coverage-col">Your Cost</div>
            </div>
            {category.items.map((item, idx) => (
              <div key={idx} className="coverage-table-row">
                <div className="coverage-col">{item.service}</div>
                <div className="coverage-col coverage-percentage">{item.coverage}</div>
                <div className="coverage-col coverage-cost">{item.copay}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="coverage-notes">
        <h4>Important Notes</h4>
        <ul>
          <li>Deductible must be met before coverage applies to certain services</li>
          <li>Out-of-network services may have different coverage rates</li>
          <li>Pre-authorization may be required for certain procedures</li>
          <li>Annual maximums may apply to some services</li>
        </ul>
      </div>
    </div>
  );
}

export default CoverageDetails;
