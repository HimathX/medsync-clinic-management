# MedSync Frontend Dynamic Data Refactoring

## Overview
The MedSync frontend has been completely refactored to **dynamically fetch all data from the FastAPI backend** instead of using hardcoded mock data. This ensures that all information displayed in the application is real-time and comes directly from the MySQL database.

## Changes Summary

### 🆕 New Service Files Created

#### 1. **branchService.js** (`frontend/src/services/`)
- `getAllBranches()` - Fetch all clinic branches
- `getBranchById(branchId)` - Get specific branch details
- `getBranchByName(branchName)` - Search branch by name
- `createBranch(branchData)` - Create new branch
- `updateBranch(branchId, branchData)` - Update branch info
- `deleteBranch(branchId)` - Delete branch

#### 2. **staffService.js** (`frontend/src/services/`)
- `getAllStaff()` - Fetch all staff members
- `getStaffById(staffId)` - Get specific staff details
- `getStaffByBranch(branchId)` - Get staff at specific branch
- `createStaff(staffData)` - Create new staff member
- `updateStaff(staffId, staffData)` - Update staff info
- `deleteStaff(staffId)` - Delete staff member

#### 3. **dashboardService.js** (`frontend/src/services/`)
- `getStaffDashboardStats(branchName)` - Aggregate dashboard statistics for staff portal
- `getPatientDashboardData(patientId)` - Fetch complete patient dashboard data
- `getRecentActivity(limit)` - Get recent system activities
- `getNotifications()` - Fetch staff notifications

---

## 📄 Updated Pages

### 1. **Dashboard.js** (Staff/Admin Dashboard)
**Previous:** Used hardcoded appointment, notification, and statistics data  
**Now:** 
- Fetches real-time appointments from backend via `appointmentService`
- Gets actual statistics (total appointments, checked-in patients, revenue) via `dashboardService`
- Loads doctor availability from `doctorService`
- Displays actual branch information from `branchService`
- Shows real notifications and recent activity

**Key Features:**
- ⏳ Loading state with spinner
- ⚠️ Error handling with retry button
- 🔄 Auto-refresh capability
- Real-time stats: appointments, revenue, patient counts

---

### 2. **Billing.js** (Billing & Payments)
**Previous:** Hardcoded service types, invoices, payment history, and patient list  
**Now:**
- Fetches service types from treatment catalogue via `treatmentService`
- Gets pending invoices from `billingService.getPendingInvoices()`
- Loads payment history from `billingService.getRecentPayments()`
- Fetches all patients from `patientService.getAllPatients()`
- Processes payments via `billingService.processPayment()`

**Key Features:**
- Dynamic service selection with real prices from database
- Real invoice management
- Actual payment processing integrated with backend
- Patient search with real data
- Context-aware billing (patient-specific or general mode)

---

### 3. **Treatments.js** (Treatment Catalog)
**Previous:** Hardcoded treatment list with 3 sample treatments  
**Now:**
- Fetches complete treatment catalog from `treatmentService.getAllTreatments()`
- Dynamically generates category filters from actual data
- Loads branch availability from `branchService`
- Real pricing, duration, and treatment details

**Key Features:**
- Search by treatment name or code
- Filter by category and branch
- Shows actual treatment count
- Real-time price display
- 🔄 Refresh button to reload catalog

---

### 4. **doctor.js** (Doctor Directory)
**Previous:** Hardcoded list of 2 doctors  
**Now:**
- Fetches all doctors from `doctorService.getAllDoctors()`
- Dynamically generates specialization filters
- Shows real experience, ratings, qualifications
- Displays actual branch assignments and languages

**Key Features:**
- Search by doctor name or specialty
- Filter by specialization and branch
- Real doctor profiles with qualifications and license numbers
- Shows actual branch availability
- Dynamic doctor count in header

---

### 5. **PatientDashboard.js** (Patient Portal)
**Previous:** Hardcoded patient info, appointments, and prescriptions  
**Now:**
- Fetches patient-specific data via `dashboardService.getPatientDashboardData()`
- Gets real appointments from `appointmentService`
- Loads actual prescriptions and medications
- Shows real outstanding balance from billing system
- Displays actual health metrics

**Key Features:**
- Patient ID from localStorage/sessionStorage
- Real appointment scheduling
- Actual prescription refill tracking
- Live financial information
- Health metrics from patient records

---

## 🔧 Technical Implementation

### Loading States
All pages now include:
```jsx
if (loading) {
  return (
    <div style={{padding: '20px', textAlign: 'center'}}>
      <div style={{fontSize: '48px', marginBottom: '20px'}}>⏳</div>
      <h2>Loading...</h2>
      <p>Please wait while we fetch your data</p>
    </div>
  );
}
```

### Error Handling
All pages include error boundaries:
```jsx
if (error) {
  return (
    <div style={{padding: '20px', textAlign: 'center'}}>
      <div style={{fontSize: '48px', marginBottom: '20px'}}>⚠️</div>
      <h2 style={{color: 'var(--accent-red)'}}>Error Loading Data</h2>
      <p>{error}</p>
      <button className="btn primary" onClick={retryFunction}>Retry</button>
    </div>
  );
}
```

### Data Fetching Pattern
```jsx
const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const data = await service.fetchMethod();
    const formatted = data.map(item => ({
      // Transform backend data to frontend format
    }));
    setState(formatted);
    
  } catch (err) {
    console.error('Error:', err);
    setError('Failed to load data');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchData();
}, []);
```

---

## 🔌 Backend Integration

### API Endpoints Used

**Appointments:**
- `GET /appointment/all` - Get all appointments
- `GET /appointment/patient/{patient_id}` - Get patient appointments

**Billing:**
- `GET /invoice/pending` - Get pending invoices
- `GET /payment/recent` - Get recent payments
- `POST /payment/process` - Process new payment

**Treatments:**
- `GET /treatment_catalogue/all` - Get all treatments

**Doctors:**
- `GET /doctor/all` - Get all doctors
- `GET /doctor/{doctor_id}` - Get specific doctor

**Patients:**
- `GET /patient/all` - Get all patients
- `GET /patient/{patient_id}` - Get specific patient

**Branches:**
- `GET /branch/all` - Get all branches

---

## ✅ Benefits

1. **Real-Time Data:** All information is always current and synced with database
2. **No Mock Data:** Eliminated all hardcoded sample data
3. **Scalability:** Easy to add new data sources or modify existing ones
4. **Consistency:** Centralized data fetching through service layer
5. **Error Handling:** Robust error management on all pages
6. **User Experience:** Loading states and retry mechanisms improve UX
7. **Maintainability:** Single source of truth (backend database)

---

## 🚀 How to Run

1. **Start Backend:**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Environment Setup:**
   Ensure `.env` file has correct backend URL:
   ```
   REACT_APP_API_URL=http://localhost:8000
   ```

4. **Database:**
   Ensure MySQL database `medsync_db` is running with populated data

---

## 🔍 Testing Checklist

- [ ] Staff Dashboard loads with real appointments
- [ ] Billing page shows actual invoices and processes payments
- [ ] Treatment catalog displays all treatments from database
- [ ] Doctor directory shows all doctors with correct info
- [ ] Patient portal loads patient-specific data
- [ ] All pages handle loading states correctly
- [ ] Error handling works when backend is offline
- [ ] Refresh/retry buttons work on all pages
- [ ] Search and filter functions work with real data

---

## 📝 Notes

- **Patient ID:** PatientDashboard uses `localStorage.getItem('patientId')` - ensure this is set during login
- **Authentication:** Services use auth tokens automatically via axios interceptors
- **Error Messages:** All errors are logged to console for debugging
- **Data Transformation:** Backend data is transformed to match frontend display requirements
- **Fallbacks:** Empty states and "N/A" values handle missing data gracefully

---

## 🐛 Troubleshooting

### Issue: Pages show loading spinner indefinitely
**Solution:** Check backend is running and REACT_APP_API_URL is correct

### Issue: "Failed to load data" errors
**Solution:** Verify MySQL database is running and has data

### Issue: Empty lists on pages
**Solution:** Populate database tables with sample data

### Issue: CORS errors
**Solution:** Ensure backend CORS settings allow frontend origin

---

## 📧 Support

For issues or questions, check:
1. Backend logs: Look for API endpoint errors
2. Browser console: Check for network errors
3. Database: Verify tables have data
4. Service files: Ensure correct API endpoint paths

---

**Last Updated:** October 16, 2025  
**Version:** 2.0.0 - Full Dynamic Data Integration
