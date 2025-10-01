import React, { useState, useMemo } from 'react';
import SearchFilters from '../components/doctor-directory/SearchFilters';
import DoctorCard from '../components/doctor-directory/DoctorCard';
import DoctorProfileModal from '../components/doctor-directory/DoctorProfileModal';
import ViewToggle from '../components/doctor-directory/ViewToggle';
import '../doctorDirectory.css';

const DoctorDirectory = () => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('rating'); // 'rating', 'experience', 'price', 'availability'
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [favorites, setFavorites] = useState([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('all');
  const [minRating, setMinRating] = useState(0);

  // Sample doctors data
  const doctorsData = [
    {
      id: 1,
      name: 'Dr. Michael Chen',
      specialty: 'Neurology',
      image: '/api/placeholder/120/120',
      rating: 4.9,
      reviewCount: 89,
      experience: 12,
      languages: ['English', 'Tamil', 'Mandarin'],
      locations: ['Colombo', 'Galle'],
      nextAvailable: 'Tomorrow 10:00 AM',
      price: 250,
      education: 'MBBS, MD Neurology - Harvard Medical School',
      about: 'Specialized in treating neurological disorders with over 12 years of experience. Expert in migraine treatment, epilepsy management, and stroke care.',
      availability: {
        monday: ['9:00 AM', '2:00 PM'],
        tuesday: ['10:00 AM', '3:00 PM'],
        wednesday: ['9:00 AM', '2:00 PM'],
        thursday: ['10:00 AM', '3:00 PM'],
        friday: ['9:00 AM', '1:00 PM'],
      },
      reviews: [
        { patient: 'John D.', rating: 5, comment: 'Excellent doctor, very thorough and caring.', date: '2024-09-15' },
        { patient: 'Sarah M.', rating: 5, comment: 'Best neurologist I have ever visited.', date: '2024-09-10' },
      ]
    },
    {
      id: 2,
      name: 'Dr. Sarah Johnson',
      specialty: 'Cardiology',
      image: '/api/placeholder/120/120',
      rating: 4.8,
      reviewCount: 127,
      experience: 15,
      languages: ['English', 'Sinhala'],
      locations: ['Colombo', 'Kandy'],
      nextAvailable: 'Today 2:30 PM',
      price: 200,
      education: 'MBBS, MD Cardiology - Stanford University',
      about: 'Leading cardiologist specializing in interventional cardiology, heart failure management, and preventive cardiology.',
      availability: {
        monday: ['8:00 AM', '1:00 PM', '4:00 PM'],
        tuesday: ['8:00 AM', '1:00 PM'],
        wednesday: ['8:00 AM', '1:00 PM', '4:00 PM'],
        thursday: ['8:00 AM', '1:00 PM'],
        friday: ['8:00 AM', '12:00 PM'],
      },
      reviews: [
        { patient: 'Michael R.', rating: 5, comment: 'Very professional and knowledgeable.', date: '2024-09-20' },
        { patient: 'Emily K.', rating: 4, comment: 'Great experience, highly recommend.', date: '2024-09-18' },
      ]
    },
    {
      id: 3,
      name: 'Dr. Priya Patel',
      specialty: 'Orthopedic Surgery',
      image: '/api/placeholder/120/120',
      rating: 4.7,
      reviewCount: 156,
      experience: 18,
      languages: ['English', 'Hindi', 'Gujarati'],
      locations: ['Kandy', 'Galle'],
      nextAvailable: 'Friday 3:00 PM',
      price: 300,
      education: 'MBBS, MS Orthopedics - Johns Hopkins University',
      about: 'Expert orthopedic surgeon specializing in joint replacement, sports injuries, and spine surgery with 18 years of experience.',
      availability: {
        monday: ['9:00 AM', '3:00 PM'],
        wednesday: ['9:00 AM', '3:00 PM'],
        friday: ['9:00 AM', '2:00 PM'],
      },
      reviews: [
        { patient: 'David L.', rating: 5, comment: 'Excellent surgeon, my knee surgery was a success.', date: '2024-09-12' },
        { patient: 'Lisa W.', rating: 5, comment: 'Very skilled and compassionate.', date: '2024-09-08' },
      ]
    },
    {
      id: 4,
      name: 'Dr. Ahmed Hassan',
      specialty: 'Pediatrics',
      image: '/api/placeholder/120/120',
      rating: 4.9,
      reviewCount: 203,
      experience: 10,
      languages: ['English', 'Tamil', 'Arabic'],
      locations: ['Colombo'],
      nextAvailable: 'Tomorrow 9:00 AM',
      price: 150,
      education: 'MBBS, MD Pediatrics - Yale University',
      about: 'Caring pediatrician dedicated to providing comprehensive healthcare for children from infancy through adolescence.',
      availability: {
        monday: ['9:00 AM', '2:00 PM', '5:00 PM'],
        tuesday: ['9:00 AM', '2:00 PM', '5:00 PM'],
        wednesday: ['9:00 AM', '2:00 PM'],
        thursday: ['9:00 AM', '2:00 PM', '5:00 PM'],
        friday: ['9:00 AM', '1:00 PM'],
      },
      reviews: [
        { patient: 'Anna P.', rating: 5, comment: 'Wonderful with children, very patient.', date: '2024-09-22' },
        { patient: 'Tom S.', rating: 5, comment: 'Our family pediatrician, highly trusted.', date: '2024-09-19' },
      ]
    },
    {
      id: 5,
      name: 'Dr. Emily Rodriguez',
      specialty: 'Dermatology',
      image: '/api/placeholder/120/120',
      rating: 4.6,
      reviewCount: 94,
      experience: 8,
      languages: ['English', 'Spanish'],
      locations: ['Galle'],
      nextAvailable: 'Monday 11:00 AM',
      price: 180,
      education: 'MBBS, MD Dermatology - Columbia University',
      about: 'Skilled dermatologist specializing in medical and cosmetic dermatology, acne treatment, and skin cancer screening.',
      availability: {
        monday: ['10:00 AM', '3:00 PM'],
        tuesday: ['10:00 AM', '3:00 PM'],
        thursday: ['10:00 AM', '3:00 PM'],
        friday: ['10:00 AM', '2:00 PM'],
      },
      reviews: [
        { patient: 'Rachel B.', rating: 5, comment: 'Very knowledgeable about skin conditions.', date: '2024-09-14' },
        { patient: 'Mark T.', rating: 4, comment: 'Good results with my acne treatment.', date: '2024-09-11' },
      ]
    },
    {
      id: 6,
      name: 'Dr. Rajesh Kumar',
      specialty: 'General Surgery',
      image: '/api/placeholder/120/120',
      rating: 4.8,
      reviewCount: 178,
      experience: 20,
      languages: ['English', 'Hindi', 'Tamil'],
      locations: ['Colombo', 'Kandy', 'Galle'],
      nextAvailable: 'Today 4:00 PM',
      price: 280,
      education: 'MBBS, MS General Surgery - AIIMS Delhi',
      about: 'Experienced general surgeon with expertise in laparoscopic surgery, hernia repair, and emergency surgical procedures.',
      availability: {
        monday: ['9:00 AM', '2:00 PM'],
        tuesday: ['9:00 AM', '2:00 PM'],
        wednesday: ['9:00 AM', '2:00 PM'],
        thursday: ['9:00 AM', '2:00 PM'],
        friday: ['9:00 AM', '1:00 PM'],
      },
      reviews: [
        { patient: 'James H.', rating: 5, comment: 'Skilled surgeon, excellent care.', date: '2024-09-16' },
        { patient: 'Nina V.', rating: 5, comment: 'Very professional and reassuring.', date: '2024-09-13' },
      ]
    }
  ];

  // Filter and sort doctors
  const filteredDoctors = useMemo(() => {
    let filtered = doctorsData.filter(doctor => {
      const matchesSearch = searchQuery === '' || 
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSpecialty = selectedSpecialty === 'all' || doctor.specialty === selectedSpecialty;
      const matchesLocation = selectedLocation === 'all' || doctor.locations.includes(selectedLocation);
      const matchesExperience = selectedExperience === 'all' || 
        (selectedExperience === '0-5' && doctor.experience <= 5) ||
        (selectedExperience === '5-10' && doctor.experience > 5 && doctor.experience <= 10) ||
        (selectedExperience === '10-15' && doctor.experience > 10 && doctor.experience <= 15) ||
        (selectedExperience === '15+' && doctor.experience > 15);
      const matchesRating = doctor.rating >= minRating;

      return matchesSearch && matchesSpecialty && matchesLocation && matchesExperience && matchesRating;
    });

    // Sort doctors
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'experience':
          return b.experience - a.experience;
        case 'price':
          return a.price - b.price;
        case 'availability':
          return a.nextAvailable.localeCompare(b.nextAvailable);
        default:
          return 0;
      }
    });

    return filtered;
  }, [doctorsData, searchQuery, selectedSpecialty, selectedLocation, selectedExperience, minRating, sortBy]);

  // Handle favorite toggle
  const toggleFavorite = (doctorId) => {
    setFavorites(prev => 
      prev.includes(doctorId) 
        ? prev.filter(id => id !== doctorId)
        : [...prev, doctorId]
    );
  };

  // Handle booking
  const handleBookAppointment = (doctor) => {
    alert(`Booking appointment with ${doctor.name}. This will open the appointment booking flow.`);
  };

  // Handle view profile
  const handleViewProfile = (doctor) => {
    setSelectedDoctor(doctor);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedSpecialty('all');
    setSelectedLocation('all');
    setSelectedExperience('all');
    setMinRating(0);
  };

  return (
    <div className="doctor-directory-page">
      <div className="doctor-directory-header">
        <div className="header-content">
          <h1>Doctor Directory</h1>
          <p>Find and book appointments with our medical specialists</p>
        </div>
      </div>

      <div className="doctor-directory-layout">
        <aside className="filters-sidebar">
          <SearchFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedSpecialty={selectedSpecialty}
            setSelectedSpecialty={setSelectedSpecialty}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            selectedExperience={selectedExperience}
            setSelectedExperience={setSelectedExperience}
            minRating={minRating}
            setMinRating={setMinRating}
            onClearFilters={handleClearFilters}
          />
        </aside>

        <main className="doctors-main-content">
          <div className="doctors-toolbar">
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
            
            <div className="doctors-sort">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="price">Lowest Price</option>
                <option value="availability">Earliest Available</option>
              </select>
            </div>
          </div>

          <div className="doctors-results-info">
            <span className="results-count">{filteredDoctors.length}</span> doctors found
          </div>

          <div className={`doctors-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
            {filteredDoctors.map(doctor => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                isFavorite={favorites.includes(doctor.id)}
                onToggleFavorite={toggleFavorite}
                onViewProfile={handleViewProfile}
                onBookAppointment={handleBookAppointment}
                viewMode={viewMode}
              />
            ))}
          </div>

          {filteredDoctors.length === 0 && (
            <div className="no-results">
              <p>No doctors found matching your criteria.</p>
              <button onClick={handleClearFilters} className="clear-filters-btn">
                Clear All Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {selectedDoctor && (
        <DoctorProfileModal
          doctor={selectedDoctor}
          isFavorite={favorites.includes(selectedDoctor.id)}
          onToggleFavorite={toggleFavorite}
          onBookAppointment={handleBookAppointment}
          onClose={() => setSelectedDoctor(null)}
        />
      )}
    </div>
  );
};

export default DoctorDirectory;
