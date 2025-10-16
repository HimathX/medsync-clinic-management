# MedSync Frontend - Quick Reference Guide

## 🎯 What Changed?

**Before:** Frontend used hardcoded mock data  
**After:** Frontend dynamically fetches ALL data from FastAPI backend

---

## 📁 New Service Files

Located in `frontend/src/services/`:

| Service | Purpose |
|---------|---------|
| `branchService.js` | Branch management and info |
| `staffService.js` | Staff member operations |
| `dashboardService.js` | Dashboard statistics aggregation |

---

## 📄 Updated Pages

### Staff Portal

| Page | File | Key Changes |
|------|------|-------------|
| **Dashboard** | `pages/Dashboard.js` | ✅ Real appointments, stats, doctors, branches |
| **Billing** | `pages/Billing.js` | ✅ Dynamic services, invoices, payments |
| **Treatments** | `pages/Treatments.js` | ✅ Treatment catalog from DB |
| **Doctors** | `pages/doctor.js` | ✅ Doctor directory from DB |
| **Patients** | `pages/Patients.js` | ⚠️ Already integrated |

### Patient Portal

| Page | File | Key Changes |
|------|------|-------------|
| **Dashboard** | `pages/patient/PatientDashboard.js` | ✅ Patient-specific appointments, prescriptions, billing |

---

## 🔌 API Integration Summary

### Dashboard Data Flow
```
Dashboard.js
  └─> dashboardService.getStaffDashboardStats()
      ├─> appointmentService.getAppointments()
      ├─> billingService.getPendingInvoices()
      ├─> doctorService.getAllDoctors()
      └─> branchService.getAllBranches()
```

### Billing Data Flow
```
Billing.js
  ├─> treatmentService.getAllTreatments() → Services
  ├─> billingService.getPendingInvoices() → Invoices
  ├─> billingService.getRecentPayments() → History
  ├─> patientService.getAllPatients() → Patient list
  └─> billingService.processPayment() → Process payment
```

### Treatment Catalog Flow
```
Treatments.js
  ├─> treatmentService.getAllTreatments() → All treatments
  └─> branchService.getAllBranches() → Branch filters
```

### Doctor Directory Flow
```
doctor.js
  ├─> doctorService.getAllDoctors() → All doctors
  └─> branchService.getAllBranches() → Branch filters
```

### Patient Dashboard Flow
```
PatientDashboard.js
  └─> dashboardService.getPatientDashboardData(patientId)
      ├─> patientService.getPatientById()
      ├─> appointmentService.getPatientAppointments()
      ├─> Prescription API (via api.get)
      └─> billingService.getInvoicesByPatient()
```

---

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend
uvicorn main:app --reload
```
Backend runs on: `http://localhost:8000`

### 2. Start Frontend
```bash
cd frontend
npm start
```
Frontend runs on: `http://localhost:3000`

### 3. Verify Environment
Check `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:8000
```

---

## 🧪 Testing Each Page

### Test Dashboard
1. Navigate to Staff Dashboard
2. ✅ Check: Real appointment list loads
3. ✅ Check: Statistics show (appointments, revenue)
4. ✅ Check: Doctor availability displays
5. ✅ Check: Branch status shows

### Test Billing
1. Go to Billing & Payments
2. ✅ Check: Services load from treatment catalog
3. ✅ Check: Pending invoices display
4. ✅ Check: Payment history shows
5. ✅ Check: Can select patient and process payment

### Test Treatments
1. Open Treatment Catalog
2. ✅ Check: All treatments display with prices
3. ✅ Check: Category filter works
4. ✅ Check: Branch filter works
5. ✅ Check: Search functionality

### Test Doctors
1. Open Doctor Directory
2. ✅ Check: All doctors display
3. ✅ Check: Specialization filter works
4. ✅ Check: Branch filter works
5. ✅ Check: Search by name/specialty

### Test Patient Dashboard
1. Login as patient (set patientId in localStorage)
2. ✅ Check: Patient info loads
3. ✅ Check: Appointments display
4. ✅ Check: Prescriptions show
5. ✅ Check: Outstanding balance displays

---

## 🐛 Common Issues & Fixes

### Issue: "Loading..." never stops

**Cause:** Backend not running or wrong URL  
**Fix:** 
```bash
# Check backend is running
curl http://localhost:8000/docs

# Verify .env file
cat frontend/.env
```

### Issue: Empty pages / No data

**Cause:** Database tables are empty  
**Fix:** Populate database with sample data
```sql
-- Check if data exists
SELECT COUNT(*) FROM appointment;
SELECT COUNT(*) FROM doctor;
SELECT COUNT(*) FROM treatment_catalogue;
```

### Issue: CORS errors in console

**Cause:** Backend CORS not configured  
**Fix:** Check `backend/main.py` has:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: 401 Unauthorized errors

**Cause:** Missing or invalid auth token  
**Fix:** Ensure user is logged in and token is set in localStorage

---

## 📊 Data Flow Architecture

```
┌─────────────────┐
│  React Pages    │
│  (Components)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Service Layer  │
│  (API calls)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Axios Client   │
│  (api.js)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  FastAPI        │
│  Backend        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MySQL DB       │
│  (medsync_db)   │
└─────────────────┘
```

---

## 🔍 Debugging Tips

### 1. Check Network Requests
Open Browser DevTools → Network tab:
- Look for failed requests (red)
- Check response data
- Verify status codes (200 = OK)

### 2. Check Console Logs
All errors are logged:
```javascript
console.error('Error fetching data:', err)
```

### 3. Check Backend Logs
Watch FastAPI terminal for:
- Incoming requests
- Database queries
- Error messages

### 4. Test API Directly
Visit: `http://localhost:8000/docs`
- Test endpoints manually
- Check response format
- Verify data structure

---

## 📝 Key Points

1. **All pages use loading states** - Shows spinner while fetching
2. **Error handling on all pages** - Retry buttons when errors occur
3. **No hardcoded data** - Everything from database
4. **Real-time updates** - Data always current
5. **Service layer pattern** - Centralized API calls
6. **Consistent formatting** - Backend data transformed for display

---

## 🎓 For Developers

### Adding New Dynamic Data

1. **Create/Update Service Method**
```javascript
// In appropriate service file
async getNewData() {
  const response = await api.get('/endpoint');
  return response.data;
}
```

2. **Add to Page Component**
```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await service.getNewData();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

3. **Handle Loading & Errors**
```javascript
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage />;
```

---

## 📞 Need Help?

1. Check `DYNAMIC_DATA_REFACTOR.md` for detailed info
2. Review service file JSDoc comments
3. Test API endpoints at `/docs`
4. Check backend logs for errors
5. Verify database has data

---

**Status:** ✅ All major pages refactored  
**Next Steps:** Test with real backend + populated database
