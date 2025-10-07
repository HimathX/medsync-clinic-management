import React, { useState, useMemo } from 'react';
import './treatment-catalog.css';
import CategorySidebar from './CategorySidebar';
import TreatmentCard from './TreatmentCard';
import TreatmentFilters from './TreatmentFilters';
import TreatmentDetailModal from './TreatmentDetailModal';

const TreatmentCatalog = () => {
  // State management
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [urgencyLevel, setUrgencyLevel] = useState('all');
  const [sortBy, setSortBy] = useState('price-low');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedTreatment, setSelectedTreatment] = useState(null);

  // Sample treatments data
  const treatmentsData = [
    {
      id: 'GC001',
      name: 'General Consultation',
      category: 'Consultations',
      description: 'Comprehensive health assessment with experienced physician',
      specialty: 'General Medicine',
      duration: '30-45 min',
      price: 150,
      maxPrice: 250,
      insuranceCovered: true,
      availableAt: ['Colombo', 'Galle', 'Kandy'],
      image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=300&h=300&fit=crop',
      urgency: 'routine',
      preparation: ['Bring previous medical records', 'List current medications', 'Prepare questions for doctor'],
      recoveryTime: 'None',
      relatedServices: ['Blood Tests', 'X-Ray', 'ECG'],
      details: 'A comprehensive general consultation includes physical examination, medical history review, and diagnosis. Our experienced physicians provide thorough assessment and treatment recommendations.',
      contraindications: 'None',
      successRate: '98%',
      rating: 4.8,
      reviewCount: 245
    },
    {
      id: 'BC001',
      name: 'Complete Blood Count (CBC)',
      category: 'Laboratory Tests',
      description: 'Comprehensive blood analysis including red cells, white cells, platelets',
      specialty: 'Pathology',
      duration: '10-15 min',
      price: 50,
      maxPrice: 75,
      insuranceCovered: true,
      availableAt: ['Colombo', 'Galle', 'Kandy', 'Negombo', 'Jaffna'],
      image: 'https://images.unsplash.com/photo-1579154204845-c6b13926cdbe?w=300&h=300&fit=crop',
      urgency: 'routine',
      preparation: ['8-12 hours fasting recommended', 'Avoid alcohol 24 hours before', 'Stay hydrated'],
      recoveryTime: 'Immediate',
      relatedServices: ['Lipid Profile', 'Liver Function Test', 'Kidney Function Test'],
      details: 'CBC test measures different components of blood including hemoglobin, hematocrit, red blood cells, white blood cells, and platelets. Results available within 24 hours.',
      contraindications: 'None',
      successRate: '99%',
      rating: 4.9,
      reviewCount: 532
    },
    {
      id: 'XR001',
      name: 'Digital X-Ray',
      category: 'Diagnostic Procedures',
      description: 'High-resolution digital radiography for bones and soft tissues',
      specialty: 'Radiology',
      duration: '15-20 min',
      price: 100,
      maxPrice: 150,
      insuranceCovered: true,
      availableAt: ['Colombo', 'Kandy', 'Galle'],
      image: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=300&h=300&fit=crop',
      urgency: 'routine',
      preparation: ['Remove metal objects and jewelry', 'Wear comfortable clothing', 'Inform if pregnant'],
      recoveryTime: 'Immediate',
      relatedServices: ['CT Scan', 'MRI', 'Ultrasound'],
      details: 'Digital X-ray imaging provides high-quality images with lower radiation exposure. Ideal for diagnosing fractures, infections, and other conditions.',
      contraindications: 'Pregnancy (first trimester)',
      successRate: '97%',
      rating: 4.7,
      reviewCount: 389
    },
    {
      id: 'PT001',
      name: 'Physical Therapy Session',
      category: 'Therapeutic Procedures',
      description: 'Personalized rehabilitation and pain management treatment',
      specialty: 'Physiotherapy',
      duration: '45-60 min',
      price: 80,
      maxPrice: 120,
      insuranceCovered: true,
      availableAt: ['Colombo', 'Kandy'],
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300&h=300&fit=crop',
      urgency: 'routine',
      preparation: ['Wear comfortable clothing', 'Bring previous medical reports', 'Arrive 10 minutes early'],
      recoveryTime: '1-2 days',
      relatedServices: ['Sports Medicine', 'Orthopedic Consultation', 'Pain Management'],
      details: 'Physical therapy helps restore movement and function. Our licensed therapists create customized treatment plans for recovery and pain relief.',
      contraindications: 'Severe inflammation, open wounds',
      successRate: '92%',
      rating: 4.8,
      reviewCount: 276
    },
    {
      id: 'EC001',
      name: 'ECG/EKG Test',
      category: 'Diagnostic Procedures',
      description: 'Electrocardiogram to assess heart rhythm and electrical activity',
      specialty: 'Cardiology',
      duration: '10-15 min',
      price: 75,
      maxPrice: 100,
      insuranceCovered: true,
      availableAt: ['Colombo', 'Galle', 'Kandy', 'Negombo'],
      image: 'https://images.unsplash.com/photo-1631815587646-b85a1bb027e1?w=300&h=300&fit=crop',
      urgency: 'urgent',
      preparation: ['Avoid caffeine 4 hours before', 'Wear loose clothing', 'No lotions or oils on chest'],
      recoveryTime: 'Immediate',
      relatedServices: ['Stress Test', 'Echocardiogram', 'Holter Monitor'],
      details: 'ECG records the electrical signals in your heart to detect heart problems and monitor heart health. Quick, painless, and non-invasive.',
      contraindications: 'None',
      successRate: '99%',
      rating: 4.9,
      reviewCount: 412
    },
    {
      id: 'VC001',
      name: 'COVID-19 Vaccination',
      category: 'Preventive Care',
      description: 'Complete vaccination with WHO-approved vaccines',
      specialty: 'Immunology',
      duration: '15-20 min',
      price: 0,
      maxPrice: 50,
      insuranceCovered: true,
      availableAt: ['Colombo', 'Galle', 'Kandy', 'Negombo', 'Jaffna'],
      image: 'https://images.unsplash.com/photo-1631815587646-b85a1bb027e1?w=300&h=300&fit=crop',
      urgency: 'routine',
      preparation: ['Bring ID card', 'Wear short sleeves', 'Stay 15 minutes post-vaccination'],
      recoveryTime: '1-2 days',
      relatedServices: ['Flu Vaccine', 'Health Screening', 'Antibody Test'],
      details: 'Protect yourself and others with COVID-19 vaccination. We offer multiple vaccine types. Side effects are typically mild and temporary.',
      contraindications: 'Severe allergies to vaccine components',
      successRate: '95%',
      rating: 4.7,
      reviewCount: 1245
    },
    {
      id: 'DT001',
      name: 'Dental Cleaning',
      category: 'Specialized Treatments',
      description: 'Professional teeth cleaning and oral hygiene assessment',
      specialty: 'Dentistry',
      duration: '30-45 min',
      price: 100,
      maxPrice: 150,
      insuranceCovered: true,
      availableAt: ['Colombo', 'Kandy'],
      image: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=300&h=300&fit=crop',
      urgency: 'routine',
      preparation: ['Brush before appointment', 'Avoid food 2 hours before', 'Inform of dental sensitivity'],
      recoveryTime: 'Immediate',
      relatedServices: ['Dental X-Ray', 'Tooth Filling', 'Root Canal'],
      details: 'Professional dental cleaning removes plaque and tartar buildup, preventing cavities and gum disease. Includes polishing and fluoride treatment.',
      contraindications: 'Active oral infections',
      successRate: '99%',
      rating: 4.8,
      reviewCount: 356
    },
    {
      id: 'US001',
      name: 'Abdominal Ultrasound',
      category: 'Diagnostic Procedures',
      description: 'Non-invasive imaging of abdominal organs',
      specialty: 'Radiology',
      duration: '20-30 min',
      price: 150,
      maxPrice: 200,
      insuranceCovered: true,
      availableAt: ['Colombo', 'Galle', 'Kandy'],
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&h=300&fit=crop',
      urgency: 'routine',
      preparation: ['8 hours fasting required', 'Drink 4-6 glasses of water', 'Wear loose clothing'],
      recoveryTime: 'Immediate',
      relatedServices: ['CT Scan', 'MRI', 'Endoscopy'],
      details: 'Ultrasound uses sound waves to create images of organs like liver, gallbladder, kidneys, and pancreas. Safe and painless procedure.',
      contraindications: 'None',
      successRate: '96%',
      rating: 4.7,
      reviewCount: 298
    }
  ];

  // Category data with counts
  const categories = [
    { id: 'all', name: 'All Categories', count: treatmentsData.length },
    { id: 'Consultations', name: 'Consultations', count: 15, popular: true },
    { id: 'Diagnostic Procedures', name: 'Diagnostic Procedures', count: 28, popular: true },
    { id: 'Laboratory Tests', name: 'Laboratory Tests', count: 45 },
    { id: 'Therapeutic Procedures', name: 'Therapeutic Procedures', count: 32, popular: true },
    { id: 'Emergency Services', name: 'Emergency Services', count: 8 },
    { id: 'Preventive Care', name: 'Preventive Care', count: 18, popular: true },
    { id: 'Specialized Treatments', name: 'Specialized Treatments', count: 22 }
  ];

  // Filter and sort treatments
  const filteredTreatments = useMemo(() => {
    let filtered = treatmentsData;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.specialty.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }

    // Price range filter
    filtered = filtered.filter(t => 
      t.price >= priceRange[0] && t.price <= priceRange[1]
    );

    // Duration filter
    if (selectedDuration !== 'all') {
      filtered = filtered.filter(t => {
        const duration = parseInt(t.duration);
        switch (selectedDuration) {
          case '0-30': return duration <= 30;
          case '30-60': return duration > 30 && duration <= 60;
          case '60+': return duration > 60;
          default: return true;
        }
      });
    }

    // Branch filter
    if (selectedBranch !== 'all') {
      filtered = filtered.filter(t => t.availableAt.includes(selectedBranch));
    }

    // Urgency filter
    if (urgencyLevel !== 'all') {
      filtered = filtered.filter(t => t.urgency === urgencyLevel);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'duration':
          return parseInt(a.duration) - parseInt(b.duration);
        case 'rating':
          return b.rating - a.rating;
        case 'popular':
          return b.reviewCount - a.reviewCount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [treatmentsData, selectedCategory, searchQuery, priceRange, selectedDuration, selectedBranch, urgencyLevel, sortBy]);

  // Event handlers
  const handleViewDetails = (treatment) => {
    setSelectedTreatment(treatment);
  };

  const handleBookNow = (treatment) => {
    alert(`Booking initiated for: ${treatment.name}\nPrice: $${treatment.price}\n\nThis will be integrated with the appointment booking system.`);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setPriceRange([0, 5000]);
    setSelectedDuration('all');
    setSelectedBranch('all');
    setUrgencyLevel('all');
  };

  return (
    <div className="treatment-catalog">
      <div className="catalog-header">
        <h1>Treatment Catalog</h1>
        <p className="catalog-subtitle">Browse and book medical treatments and procedures</p>
      </div>

      <div className="catalog-layout">
        {/* Left Sidebar - Categories */}
        <CategorySidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Main Content Area */}
        <div className="catalog-main">
          {/* Filters Section */}
          <TreatmentFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            selectedDuration={selectedDuration}
            setSelectedDuration={setSelectedDuration}
            selectedBranch={selectedBranch}
            setSelectedBranch={setSelectedBranch}
            urgencyLevel={urgencyLevel}
            setUrgencyLevel={setUrgencyLevel}
            onClearFilters={handleClearFilters}
          />

          {/* Treatments Grid */}
          <div className="treatments-section">
            {/* Toolbar */}
            <div className="treatments-toolbar">
              <div className="view-controls">
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

              <div className="results-info">
                <span className="results-count">{filteredTreatments.length}</span>
                <span className="results-text">treatments found</span>
              </div>

              <div className="sort-controls">
                <label htmlFor="sortBy">Sort by:</label>
                <select 
                  id="sortBy"
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="duration">Duration</option>
                  <option value="rating">Rating</option>
                  <option value="popular">Popularity</option>
                </select>
              </div>
            </div>

            {/* Treatments Grid/List */}
            <div className={`treatments-grid ${viewMode}`}>
              {filteredTreatments.length > 0 ? (
                filteredTreatments.map(treatment => (
                  <TreatmentCard
                    key={treatment.id}
                    treatment={treatment}
                    viewMode={viewMode}
                    onViewDetails={handleViewDetails}
                    onBookNow={handleBookNow}
                  />
                ))
              ) : (
                <div className="no-results">
                  <h3>No treatments found</h3>
                  <p>Try adjusting your filters or search terms</p>
                  <button onClick={handleClearFilters} className="clear-filters-btn">
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Treatment Detail Modal */}
      {selectedTreatment && (
        <TreatmentDetailModal
          treatment={selectedTreatment}
          onClose={() => setSelectedTreatment(null)}
          onBookNow={handleBookNow}
        />
      )}
    </div>
  );
};

export default TreatmentCatalog;
