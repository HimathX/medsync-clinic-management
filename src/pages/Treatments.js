import React, { useState } from 'react';

const Treatments = ({ role }) => {
  const [catalogue, setCatalogue] = useState([
    { id: 1, name: 'ECG', code: 'ECG001', category: 'Diagnostic', price: 5000 },
    // Mock more
  ]);
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTreatments, setSelectedTreatments] = useState([]);
  const [dosage, setDosage] = useState('');

  const filteredCatalogue = catalogue.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  const handlePrescribe = () => {
    // Mock prescribe
    alert(`Prescribed: ${selectedTreatments}, Notes: ${notes}, Dosage: ${dosage}`);
  };

  return (
    <div>
      <h1>Treatment Management</h1>
      {/* Catalogue Browser */}
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Treatments" aria-label="Treatment Search" />
      <ul>
        {filteredCatalogue.map(t => (
          <li key={t.id} onClick={() => setSelectedTreatments([...selectedTreatments, t.name])}>{t.name} - {t.category} - LKR {t.price}</li>
        ))}
      </ul>

      {/* Prescription Interface */}
      <h2>Prescribe Treatments</h2>
      <select multiple value={selectedTreatments} onChange={(e) => setSelectedTreatments(Array.from(e.target.selectedOptions, option => option.value))}>
        {catalogue.map(t => <option key={t.id}>{t.name}</option>)}
      </select>
      <input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="Dosage/Instructions" />
      {/* Notes Editor */}
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Consultation Notes (Templates: Use voice-to-text placeholder)" />
      <button onClick={handlePrescribe}>Prescribe</button>

      {/* History View */}
      <h2>Treatment History</h2>
      <p>Chronological list (Mock)</p>
    </div>
  );
};

export default Treatments;