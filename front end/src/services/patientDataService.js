// Patient data management service
class PatientDataService {
  constructor() {
    this.patients = [];
    this.nextId = 1;
    this.loadMockData();
  }

  loadMockData() {
    const mockPatients = [
      {
        id: 'P001',
        firstName: 'John',
        lastName: 'Doe',
        dob: '1985-06-15',
        gender: 'Male',
        phone: '+94771234567',
        email: 'john.doe@email.com',
        branch: 'Colombo',
        emergencyName: 'Jane Doe',
        emergencyNumber: '+94777654321',
        insuranceProvider: 'AIA Insurance',
        policyNumber: 'AIA123456',
        registrationDate: '2024-01-15',
        lastVisit: '2024-09-20',
        address: '123 Main Street, Colombo 03',
        medicalHistory: ['Hypertension', 'Diabetes Type 2'],
        allergies: ['Penicillin'],
        bloodType: 'O+'
      },
      {
        id: 'P002',
        firstName: 'Sarah',
        lastName: 'Smith',
        dob: '1990-03-22',
        gender: 'Female',
        phone: '+94712345678',
        email: 'sarah.smith@email.com',
        branch: 'Kandy',
        emergencyName: 'David Smith',
        emergencyNumber: '+94718765432',
        insuranceProvider: 'Ceylinco Insurance',
        policyNumber: 'CEY789012',
        registrationDate: '2024-02-10',
        lastVisit: '2024-09-18',
        address: '456 Hill Road, Kandy',
        medicalHistory: ['Asthma'],
        allergies: ['Dust mites'],
        bloodType: 'A+'
      },
      {
        id: 'P003',
        firstName: 'Michael',
        lastName: 'Johnson',
        dob: '1978-11-08',
        gender: 'Male',
        phone: '+94723456789',
        email: 'michael.johnson@email.com',
        branch: 'Galle',
        emergencyName: 'Lisa Johnson',
        emergencyNumber: '+94729876543',
        insuranceProvider: 'HNB Assurance',
        policyNumber: 'HNB345678',
        registrationDate: '2024-01-20',
        lastVisit: '2024-09-15',
        address: '789 Beach Road, Galle',
        medicalHistory: ['High Cholesterol'],
        allergies: [],
        bloodType: 'B+'
      },
      {
        id: 'P004',
        firstName: 'Emily',
        lastName: 'Brown',
        dob: '1995-07-12',
        gender: 'Female',
        phone: '+94734567890',
        email: 'emily.brown@email.com',
        branch: 'Colombo',
        emergencyName: 'Robert Brown',
        emergencyNumber: '+94730987654',
        insuranceProvider: 'SLIC Insurance',
        policyNumber: 'SLIC901234',
        registrationDate: '2024-03-05',
        lastVisit: '2024-09-22',
        address: '321 Park Avenue, Colombo 07',
        medicalHistory: [],
        allergies: ['Shellfish'],
        bloodType: 'AB+'
      },
      {
        id: 'P005',
        firstName: 'David',
        lastName: 'Wilson',
        dob: '1982-12-03',
        gender: 'Male',
        phone: '+94745678901',
        email: 'david.wilson@email.com',
        branch: 'Kandy',
        emergencyName: 'Mary Wilson',
        emergencyNumber: '+94741098765',
        insuranceProvider: 'AIA Insurance',
        policyNumber: 'AIA567890',
        registrationDate: '2024-02-28',
        lastVisit: '2024-09-19',
        address: '654 Temple Road, Kandy',
        medicalHistory: ['Migraine'],
        allergies: ['Latex'],
        bloodType: 'O-'
      }
    ];

    this.patients = mockPatients;
    this.nextId = 6;
  }

  // Get all patients
  getAllPatients() {
    return [...this.patients];
  }

  // Get patient by ID
  getPatientById(id) {
    return this.patients.find(patient => patient.id === id);
  }

  // Add new patient
  addPatient(patientData) {
    const newPatient = {
      ...patientData,
      id: `P${this.nextId.toString().padStart(3, '0')}`,
      registrationDate: new Date().toISOString().split('T')[0],
      lastVisit: new Date().toISOString().split('T')[0],
      medicalHistory: [],
      allergies: [],
      bloodType: ''
    };
    
    this.patients.push(newPatient);
    this.nextId++;
    return newPatient;
  }

  // Update patient
  updatePatient(id, updatedData) {
    const index = this.patients.findIndex(patient => patient.id === id);
    if (index !== -1) {
      this.patients[index] = { ...this.patients[index], ...updatedData };
      return this.patients[index];
    }
    return null;
  }

  // Delete patient
  deletePatient(id) {
    const index = this.patients.findIndex(patient => patient.id === id);
    if (index !== -1) {
      const deletedPatient = this.patients.splice(index, 1)[0];
      return deletedPatient;
    }
    return null;
  }

  // Search patients
  searchPatients(searchTerm) {
    const term = searchTerm.toLowerCase();
    return this.patients.filter(patient =>
      patient.firstName.toLowerCase().includes(term) ||
      patient.lastName.toLowerCase().includes(term) ||
      patient.id.toLowerCase().includes(term) ||
      patient.phone.includes(term) ||
      patient.email.toLowerCase().includes(term)
    );
  }

  // Get patients by branch
  getPatientsByBranch(branch) {
    return this.patients.filter(patient => patient.branch === branch);
  }

  // Get statistics
  getStatistics() {
    const stats = {
      total: this.patients.length,
      byBranch: {
        Colombo: this.patients.filter(p => p.branch === 'Colombo').length,
        Kandy: this.patients.filter(p => p.branch === 'Kandy').length,
        Galle: this.patients.filter(p => p.branch === 'Galle').length
      },
      byGender: {
        Male: this.patients.filter(p => p.gender === 'Male').length,
        Female: this.patients.filter(p => p.gender === 'Female').length,
        Other: this.patients.filter(p => p.gender === 'Other').length
      },
      recentRegistrations: this.patients.filter(p => {
        const regDate = new Date(p.registrationDate);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return regDate >= thirtyDaysAgo;
      }).length
    };
    return stats;
  }

  // Calculate age
  calculateAge(dob) {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}

// Create singleton instance
const patientDataService = new PatientDataService();

export default patientDataService;