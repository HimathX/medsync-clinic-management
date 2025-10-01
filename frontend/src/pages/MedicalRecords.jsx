import { useState, useMemo } from 'react'
import '../medicalRecords.css'
import FilterSidebar from '../components/medical/FilterSidebar.jsx'
import MedicalTimeline from '../components/medical/MedicalTimeline.jsx'
import RecordTabs from '../components/medical/RecordTabs.jsx'

export default function MedicalRecords() {
  const [activeTab, setActiveTab] = useState('timeline')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    recordType: 'all',
    doctor: 'all'
  })

  // Sample medical records data
  const [records] = useState([
    {
      id: 'rec1',
      type: 'consultation',
      doctor: 'Dr. Priya Patel',
      specialty: 'Orthopedics',
      date: new Date(2024, 0, 20, 11, 30),
      status: 'completed',
      chiefComplaint: 'Knee pain and stiffness',
      clinicalFindings: 'Mild swelling in right knee, reduced range of motion',
      diagnosis: 'Osteoarthritis - mild',
      treatment: 'Physical therapy, anti-inflammatory medication',
      documents: ['consultation-report.pdf']
    },
    {
      id: 'rec2',
      type: 'surgery',
      doctor: 'Dr. James Wilson',
      specialty: 'Surgery',
      date: new Date(2024, 0, 18, 10, 0),
      status: 'completed',
      procedure: 'Arthroscopic knee procedure',
      documents: ['surgery-report.pdf', 'anesthesia-notes.pdf']
    },
    {
      id: 'rec3',
      type: 'diagnostic',
      doctor: 'Dr. Michael Chen',
      specialty: 'Radiology',
      date: new Date(2024, 0, 15, 14, 0),
      status: 'completed',
      test: 'MRI Knee Joint',
      results: 'Cartilage thinning observed, no major structural damage',
      documents: ['mri-images.zip', 'radiology-report.pdf']
    },
    {
      id: 'rec4',
      type: 'prescription',
      doctor: 'Dr. Sarah Johnson',
      specialty: 'Cardiology',
      date: new Date(2024, 0, 12, 9, 0),
      status: 'completed',
      medication: 'Ibuprofen 400mg - Twice daily with food',
      duration: '14 days',
      documents: ['prescription.pdf']
    },
    {
      id: 'rec5',
      type: 'consultation',
      doctor: 'Dr. Emily Brown',
      specialty: 'General Medicine',
      date: new Date(2024, 0, 8, 15, 30),
      status: 'completed',
      chiefComplaint: 'Annual health checkup',
      clinicalFindings: 'All vitals normal, general health good',
      diagnosis: 'Healthy',
      treatment: 'Continue current lifestyle',
      documents: ['checkup-report.pdf']
    },
    {
      id: 'rec6',
      type: 'diagnostic',
      doctor: 'Dr. Robert Lee',
      specialty: 'Laboratory',
      date: new Date(2024, 0, 5, 10, 15),
      status: 'completed',
      test: 'Complete Blood Count',
      results: 'All values within normal range',
      documents: ['lab-results.pdf']
    },
    {
      id: 'rec7',
      type: 'treatment',
      doctor: 'Dr. Lisa Martinez',
      specialty: 'Physical Therapy',
      date: new Date(2023, 11, 28, 11, 0),
      status: 'completed',
      treatment: 'Physical therapy session - knee rehabilitation',
      outcome: 'Improved range of motion, reduced pain',
      documents: ['therapy-notes.pdf']
    },
    {
      id: 'rec8',
      type: 'prescription',
      doctor: 'Dr. David Kim',
      specialty: 'Orthopedics',
      date: new Date(2023, 11, 20, 13, 45),
      status: 'completed',
      medication: 'Glucosamine Sulfate 1500mg - Once daily',
      duration: '90 days',
      documents: ['prescription.pdf']
    }
  ])

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const searchableText = `${record.doctor} ${record.specialty} ${record.chiefComplaint || ''} ${record.diagnosis || ''} ${record.test || ''} ${record.medication || ''}`.toLowerCase()
        if (!searchableText.includes(query)) return false
      }

      // Date filters
      if (filters.dateFrom && record.date < new Date(filters.dateFrom)) return false
      if (filters.dateTo && record.date > new Date(filters.dateTo)) return false

      // Record type filter
      if (filters.recordType !== 'all' && record.type !== filters.recordType) return false

      // Doctor filter
      if (filters.doctor !== 'all' && record.doctor !== filters.doctor) return false

      return true
    })
  }, [records, searchQuery, filters])

  // Calculate stats
  const stats = useMemo(() => {
    const typeCount = records.reduce((acc, rec) => {
      acc[rec.type] = (acc[rec.type] || 0) + 1
      return acc
    }, {})

    return {
      total: records.length,
      consultations: typeCount.consultation || 0,
      treatments: typeCount.treatment || 0,
      diagnostics: typeCount.diagnostic || 0,
      prescriptions: typeCount.prescription || 0
    }
  }, [records])

  const handleClearFilters = () => {
    setSearchQuery('')
    setFilters({
      dateFrom: '',
      dateTo: '',
      recordType: 'all',
      doctor: 'all'
    })
  }

  const handleDownloadRecord = (recordId) => {
    alert(`Downloading record ${recordId}`)
  }

  const handleViewDetails = (recordId) => {
    alert(`Viewing details for record ${recordId}`)
  }

  return (
    <div className="medical-records-root">
      <header className="records-header">
        <div>
          <h1>Medical Records</h1>
          <p className="muted">Complete history of your medical care and health information</p>
        </div>
      </header>

      <div className="records-layout">
        <FilterSidebar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
          stats={stats}
          doctors={[...new Set(records.map(r => r.doctor))]}
        />

        <main className="records-main">
          <RecordTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'timeline' && (
            <MedicalTimeline
              records={filteredRecords}
              onDownload={handleDownloadRecord}
              onViewDetails={handleViewDetails}
            />
          )}

          {activeTab === 'consultations' && (
            <MedicalTimeline
              records={filteredRecords.filter(r => r.type === 'consultation')}
              onDownload={handleDownloadRecord}
              onViewDetails={handleViewDetails}
            />
          )}

          {activeTab === 'treatments' && (
            <MedicalTimeline
              records={filteredRecords.filter(r => r.type === 'treatment' || r.type === 'surgery')}
              onDownload={handleDownloadRecord}
              onViewDetails={handleViewDetails}
            />
          )}

          {activeTab === 'diagnostics' && (
            <MedicalTimeline
              records={filteredRecords.filter(r => r.type === 'diagnostic')}
              onDownload={handleDownloadRecord}
              onViewDetails={handleViewDetails}
            />
          )}

          {activeTab === 'prescriptions' && (
            <MedicalTimeline
              records={filteredRecords.filter(r => r.type === 'prescription')}
              onDownload={handleDownloadRecord}
              onViewDetails={handleViewDetails}
            />
          )}

          {activeTab === 'documents' && (
            <div className="documents-grid">
              {filteredRecords.flatMap(record =>
                record.documents.map((doc, idx) => (
                  <div key={`${record.id}-${idx}`} className="document-card">
                    <div className="document-icon">📄</div>
                    <div className="document-info">
                      <div className="document-name">{doc}</div>
                      <div className="muted">{record.doctor}</div>
                      <div className="muted">{record.date.toLocaleDateString()}</div>
                    </div>
                    <button className="btn-outline btn-sm" onClick={() => handleDownloadRecord(record.id)}>
                      Download
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
