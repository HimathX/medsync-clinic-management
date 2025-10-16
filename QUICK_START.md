# MedSync Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- MySQL Database running
- Git

---

## Backend Setup

### 1. Navigate to Backend
```bash
cd backend
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Database
Update `.env` file with your database credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=medsync_db
```

### 4. Start Backend Server
```bash
python main.py
```

✅ Backend should be running on http://localhost:8000  
✅ Check API docs at http://localhost:8000/docs

---

## Frontend Setup

### 1. Navigate to Frontend
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

This will install all dependencies including axios for API integration.

### 3. Verify Environment Configuration
Check that `.env` file exists with:
```
REACT_APP_API_URL=http://localhost:8000
```

### 4. Start Frontend Server
```bash
npm start
```

✅ Frontend should be running on http://localhost:3000  
✅ Browser should open automatically

---

## Testing the Integration

### 1. Check Backend Health
Open browser and visit:
```
http://localhost:8000/health
```

You should see:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 2. Check API Documentation
Visit:
```
http://localhost:8000/docs
```

This shows all available API endpoints.

### 3. Test Frontend Connection
Open browser console (F12) and run:
```javascript
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(console.log)
```

---

## API Services Available

All service files are located in `frontend/src/services/`:

### Core Services
- ✅ **api.js** - Base API configuration with axios
- ✅ **patientService.js** - Patient management (register, search, get details)
- ✅ **appointmentService.js** - Book and manage appointments
- ✅ **doctorService.js** - Doctor info and time slots
- ✅ **billingService.js** - Invoices and payments
- ✅ **treatmentService.js** - Treatment catalogue and records
- ✅ **consultationService.js** - Consultation records
- ✅ **insuranceService.js** - Insurance packages and claims

### Using Services in Components

**Example: Fetch Patients**
```javascript
import patientService from '../services/patientService';

const loadPatients = async () => {
  try {
    const data = await patientService.getAllPatients();
    console.log('Patients:', data.patients);
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

**Example: Book Appointment**
```javascript
import appointmentService from '../services/appointmentService';

const bookAppointment = async () => {
  try {
    const result = await appointmentService.bookAppointment({
      patient_id: "123",
      time_slot_id: "456",
      notes: "Follow-up visit"
    });
    alert('Appointment booked!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
};
```

---

## Project Structure

```
medsync-clinic-management/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── requirements.txt           # Python dependencies
│   ├── routers/                   # API endpoints
│   │   ├── patient.py
│   │   ├── appointment.py
│   │   ├── doctor.py
│   │   ├── billing.py
│   │   └── ... (13 routers total)
│   ├── schemas/                   # Pydantic models
│   ├── core/                      # Database & config
│   └── services/                  # Business logic
│
└── frontend/
    ├── package.json               # Dependencies (includes axios)
    ├── .env                       # API URL configuration
    ├── src/
    │   ├── services/              # ✨ NEW: API integration layer
    │   │   ├── api.js
    │   │   ├── patientService.js
    │   │   ├── appointmentService.js
    │   │   ├── doctorService.js
    │   │   ├── billingService.js
    │   │   ├── treatmentService.js
    │   │   ├── consultationService.js
    │   │   └── insuranceService.js
    │   ├── pages/                 # React components
    │   ├── components/            # Reusable components
    │   └── App.js                 # Main app component
    └── API_INTEGRATION.md         # Detailed API documentation
```

---

## Common Commands

### Backend
```bash
# Start server
python main.py

# Run with auto-reload
uvicorn main:app --reload

# Check database connection
python -c "from core.database import test_database_connection; test_database_connection()"
```

### Frontend
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

---

## Troubleshooting

### Backend won't start
- ✅ Check MySQL is running
- ✅ Verify database credentials in `.env`
- ✅ Ensure all dependencies installed: `pip install -r requirements.txt`

### Frontend can't connect to backend
- ✅ Verify backend is running on port 8000
- ✅ Check `.env` file has correct API URL
- ✅ Look for CORS errors in browser console

### CORS errors
- ✅ Backend already configured for CORS
- ✅ Make sure backend is running
- ✅ Clear browser cache

### Module not found errors
- ✅ Run `npm install` in frontend directory
- ✅ Check axios is in package.json dependencies

---

## Next Steps

1. ✅ Both servers running
2. ⏳ Update existing components to use API services
3. ⏳ Test each feature (patients, appointments, billing)
4. ⏳ Add loading states and error handling
5. ⏳ Implement authentication if needed

---

## Documentation

- **API Integration Guide**: `frontend/API_INTEGRATION.md`
- **Backend API Docs**: http://localhost:8000/docs (when running)
- **Database Schema**: `backend/sql.txt`
- **Billing System**: `frontend/BILLING_IMPROVEMENTS.md`
- **Service-Based Billing**: `frontend/SERVICE_BASED_BILLING.md`

---

## Support

For detailed API usage examples and endpoint reference, see:
- `frontend/API_INTEGRATION.md`

---

**Status:** ✅ API Integration Complete  
**Date:** October 16, 2025  
**Version:** 1.0.0
