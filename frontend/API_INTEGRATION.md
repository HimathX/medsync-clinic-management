# API Integration Guide

## Overview
This guide explains how to use the FastAPI backend services in your React frontend.

## Setup Instructions

### 1. Install Dependencies
```bash
cd frontend
npm install axios
```

### 2. Environment Configuration
Create a `.env` file in the frontend root directory:
```
REACT_APP_API_URL=http://localhost:8000
```

### 3. Start Backend Server
```bash
cd backend
python main.py
```
Backend should run on http://localhost:8000

### 4. Start Frontend Server
```bash
cd frontend
npm start
```
Frontend should run on http://localhost:3000

---

## Service Files Created

All service files are located in `src/services/`:

- ✅ **api.js** - Base API client with axios configuration
- ✅ **patientService.js** - Patient management API calls
- ✅ **appointmentService.js** - Appointment booking and management
- ✅ **doctorService.js** - Doctor and time slot management
- ✅ **billingService.js** - Invoices and payments
- ✅ **treatmentService.js** - Treatment catalogue and records
- ✅ **consultationService.js** - Consultation records
- ✅ **insuranceService.js** - Insurance packages and claims

---

## Usage Examples

### Example 1: Fetch All Patients

```javascript
import React, { useEffect, useState } from 'react';
import patientService from '../services/patientService';

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await patientService.getAllPatients(0, 100);
      setPatients(data.patients || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error loading patients:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading patients...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div>
      <h2>Patients ({patients.length})</h2>
      {patients.map(patient => (
        <div key={patient.patient_id}>
          {/* Display patient data */}
        </div>
      ))}
    </div>
  );
}

export default PatientList;
```

### Example 2: Book an Appointment

```javascript
import appointmentService from '../services/appointmentService';

const handleBookAppointment = async () => {
  try {
    const appointmentData = {
      patient_id: "123",
      time_slot_id: "456",
      notes: "First visit"
    };

    const result = await appointmentService.bookAppointment(appointmentData);
    
    if (result.success) {
      alert(`Appointment booked successfully! ID: ${result.appointment_id}`);
    }
  } catch (error) {
    alert(`Failed to book appointment: ${error.message}`);
  }
};
```

### Example 3: Process Payment

```javascript
import billingService from '../services/billingService';

const handleProcessPayment = async (invoiceId, patientId, amount, method) => {
  try {
    const paymentData = {
      invoice_id: invoiceId,
      patient_id: patientId,
      payment_method: method, // 'Cash', 'Credit Card', 'Debit Card', 'Online'
      amount: amount
    };

    const result = await billingService.processPayment(paymentData);
    alert('Payment processed successfully!');
    
    // Refresh payments list or redirect
  } catch (error) {
    alert(`Payment failed: ${error.message}`);
  }
};
```

### Example 4: Search Patient by NIC

```javascript
import patientService from '../services/patientService';

const searchPatient = async (nic) => {
  try {
    const patient = await patientService.searchByNIC(nic);
    console.log('Patient found:', patient);
    return patient;
  } catch (error) {
    alert(`Patient not found: ${error.message}`);
    return null;
  }
};
```

### Example 5: Get Doctor Time Slots

```javascript
import doctorService from '../services/doctorService';

const loadTimeSlots = async (doctorId, selectedDate) => {
  try {
    const timeSlots = await doctorService.getDoctorTimeSlots(
      doctorId, 
      selectedDate // Format: 'YYYY-MM-DD'
    );
    
    // Filter available slots
    const availableSlots = timeSlots.filter(slot => !slot.is_booked);
    setTimeSlots(availableSlots);
  } catch (error) {
    console.error('Error loading time slots:', error);
  }
};
```

---

## API Endpoints Reference

### Patient Service
- `getAllPatients(skip, limit)` - GET /patients/
- `getPatientById(patientId)` - GET /patients/{id}
- `registerPatient(patientData)` - POST /patients/register
- `searchByNIC(nic)` - GET /patients/search/by-nic/{nic}
- `getPatientAppointments(patientId)` - GET /patients/{id}/appointments
- `getPatientAllergies(patientId)` - GET /patients/{id}/allergies

### Appointment Service
- `bookAppointment(appointmentData)` - POST /appointments/book
- `getAllAppointments(filters)` - GET /appointments/
- `getAppointmentById(appointmentId)` - GET /appointments/{id}
- `updateAppointment(appointmentId, updateData)` - PUT /appointments/{id}
- `cancelAppointment(appointmentId)` - DELETE /appointments/{id}
- `getAppointmentDetails(appointmentId)` - GET /appointments/{id}/details

### Doctor Service
- `getAllDoctors()` - GET /doctors/
- `getDoctorById(doctorId)` - GET /doctors/{id}
- `getDoctorsByBranch(branchId)` - GET /doctors/branch/{id}
- `getDoctorSpecializations(doctorId)` - GET /doctors/{id}/specializations
- `getDoctorTimeSlots(doctorId, date)` - GET /timeslots/doctor/{id}?date={date}

### Billing Service
- `getAllInvoices(filters)` - GET /invoices/
- `getInvoiceById(invoiceId)` - GET /invoices/{id}
- `createInvoice(invoiceData)` - POST /invoices/
- `getPendingInvoices()` - GET /invoices/pending
- `processPayment(paymentData)` - POST /payments/
- `getAllPayments(patientId)` - GET /payments/ or /payments/patient/{id}
- `getPaymentById(paymentId)` - GET /payments/{id}
- `getPaymentSummary(filters)` - GET /payments/summary

### Treatment Service
- `getAllTreatmentServices()` - GET /treatment-catalogue/
- `getTreatmentServiceByCode(serviceCode)` - GET /treatment-catalogue/{code}
- `addTreatmentService(serviceData)` - POST /treatment-catalogue/
- `createTreatmentRecord(treatmentData)` - POST /treatment-records/
- `getTreatmentsByConsultation(consultationId)` - GET /treatment-records/consultation/{id}
- `getTreatmentById(treatmentId)` - GET /treatment-records/{id}

### Consultation Service
- `createConsultation(consultationData)` - POST /consultations/
- `getConsultationById(consultationId)` - GET /consultations/{id}
- `getConsultationByAppointment(appointmentId)` - GET /consultations/appointment/{id}
- `updateConsultation(consultationId, updateData)` - PUT /consultations/{id}
- `getConsultationDetails(consultationId)` - GET /consultations/{id}/details

### Insurance Service
- `getAllPackages()` - GET /insurance/packages
- `getPackageById(packageId)` - GET /insurance/packages/{id}
- `getPatientInsurance(patientId)` - GET /insurance/patient/{id}
- `enrollPatient(enrollmentData)` - POST /insurance/enroll
- `submitClaim(claimData)` - POST /claims/
- `getAllClaims(patientId)` - GET /claims/ or /claims/patient/{id}
- `getClaimById(claimId)` - GET /claims/{id}
- `updateClaimStatus(claimId, status)` - PUT /claims/{id}/status

---

## Error Handling

All services include built-in error handling. Errors are thrown with descriptive messages:

```javascript
try {
  const data = await patientService.getAllPatients();
  // Handle success
} catch (error) {
  console.error('Error:', error.message);
  // Display error to user
}
```

The API client automatically handles:
- ❌ 401 Unauthorized - Clears auth and redirects
- ❌ 404 Not Found - Logs error message
- ❌ 500 Server Error - Logs error message
- ❌ Network errors - Shows connection error

---

## Integration with Existing Components

### Update Patients.js
Replace mock data calls with:
```javascript
import patientService from '../services/patientService';

// Instead of using patientDataService
const loadPatients = async () => {
  const result = await patientService.getAllPatients();
  setPatients(result.patients);
};
```

### Update Billing.js
Replace mock payment processing with:
```javascript
import billingService from '../services/billingService';

const processPayment = async (paymentData) => {
  const result = await billingService.processPayment(paymentData);
  // Handle success
};
```

### Update AppointmentBooking.js
Replace mock booking with:
```javascript
import appointmentService from '../services/appointmentService';
import doctorService from '../services/doctorService';

// Load doctors
const doctors = await doctorService.getAllDoctors();

// Load time slots
const slots = await doctorService.getDoctorTimeSlots(doctorId, date);

// Book appointment
const result = await appointmentService.bookAppointment({
  patient_id: patientId,
  time_slot_id: timeSlotId,
  notes: notes
});
```

---

## Testing Checklist

- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] Axios installed (`npm install axios`)
- [ ] `.env` file created with API URL
- [ ] Test API health endpoint: http://localhost:8000/health
- [ ] Test fetching patients
- [ ] Test booking appointment
- [ ] Test payment processing
- [ ] Check browser console for any CORS errors

---

## Common Issues

### CORS Error
**Solution:** Backend already has CORS configured. Ensure backend is running.

### Connection Refused
**Solution:** Verify backend is running on port 8000:
```bash
cd backend
python main.py
```

### Module Not Found (axios)
**Solution:** Install axios:
```bash
npm install axios
```

### 404 Not Found
**Solution:** Check that backend routes match service endpoints. Verify in browser:
- http://localhost:8000/docs (FastAPI Swagger UI)

---

## Next Steps

1. ✅ Service files created
2. ⏳ Install axios: `npm install axios`
3. ⏳ Create `.env` file with API URL
4. ⏳ Update components to use services
5. ⏳ Test each endpoint
6. ⏳ Add loading states and error handling to components

---

**Created:** October 16, 2025  
**Status:** Ready for Integration
