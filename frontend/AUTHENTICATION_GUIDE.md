# MedSync Authentication System

## 🔐 Overview

The MedSync authentication system has been fully integrated with the FastAPI backend. Users can now login with their email and password, and the system will authenticate against the MySQL database using the `AuthenticateUser` stored procedure.

---

## 📁 New Files Created

### **authService.js** (`frontend/src/services/`)
Authentication service that handles:
- User login via backend API
- Session management (localStorage)
- User data storage
- Logout functionality
- Authentication status checking

---

## 🔄 Login Flow

```
User enters credentials
    ↓
Frontend validates email format
    ↓
authService.login(email, password)
    ↓
POST /auth/login to backend
    ↓
Backend calls AuthenticateUser stored procedure
    ↓
Password hash verified in database
    ↓
Backend returns:
  - success: true/false
  - user_id
  - user_type
  - full_name
    ↓
Frontend stores in localStorage:
  - userId
  - userType
  - fullName
  - isAuthenticated
  - patientId (if user is patient)
    ↓
Redirect based on user_type:
  - patient → /patient-dashboard
  - staff/doctor/admin → /dashboard
```

---

## 🔑 Backend API Endpoint

### **POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user_id": "123",
  "user_type": "patient",
  "full_name": "John Doe"
}
```

**Error Response (401):**
```json
{
  "detail": "Invalid credentials"
}
```

---

## 💾 Data Storage (localStorage)

After successful login, the following data is stored:

| Key | Value | Purpose |
|-----|-------|---------|
| `userId` | User's ID from database | Identify current user |
| `userType` | patient/staff/doctor/admin | Role-based access control |
| `fullName` | User's full name | Display in UI |
| `isAuthenticated` | "true" | Check if user is logged in |
| `patientId` | Patient ID (if patient) | For patient portal features |

---

## 🎯 User Types

The system supports multiple user types:

| user_type | Portal | Dashboard Route |
|-----------|--------|-----------------|
| `patient` | Patient Portal | `/patient-dashboard` |
| `staff` | Staff Portal | `/dashboard` |
| `doctor` | Staff Portal | `/dashboard` |
| `admin` | Staff Portal | `/dashboard` |

---

## 🔒 Password Security

- Passwords are hashed using **SHA-256** on the backend
- Plain text passwords are **never stored** in the database
- Password validation is done server-side via stored procedure
- Minimum password length: **8 characters** (enforced in registration)

---

## 📝 Updated Login.js Component

### **Key Changes:**

1. ✅ **Removed hardcoded login** - No more mock authentication
2. ✅ **Email-based login** - Uses email instead of username
3. ✅ **Backend integration** - Calls `/auth/login` endpoint
4. ✅ **Loading states** - Shows spinner during authentication
5. ✅ **Error handling** - Displays specific error messages
6. ✅ **Role-based redirect** - Routes users to correct portal
7. ✅ **Session management** - Stores user data in localStorage

### **Features:**

- **Email validation** - Ensures valid email format before submission
- **Loading indicator** - Shows "⏳ Signing in..." during request
- **Error messages** - User-friendly error display
- **Disabled inputs** - Prevents multiple submissions
- **Auto-redirect** - Sends users to appropriate dashboard

---

## 🧪 Testing Login

### Test User Credentials

Create test users in the database first using the registration endpoint or directly in MySQL.

**Example Patient:**
```json
{
  "email": "patient@test.com",
  "password": "password123"
}
```

**Example Staff:**
```json
{
  "email": "staff@medsync.com",
  "password": "staffpass123"
}
```

### Testing Steps:

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

3. **Navigate to Login:**
   - Patient: `http://localhost:3000/patient-login`
   - Staff: `http://localhost:3000/staff-login`

4. **Enter Credentials:**
   - Email: User's registered email
   - Password: User's password

5. **Verify:**
   - ✅ Loading spinner appears
   - ✅ Redirects to correct dashboard
   - ✅ User data stored in localStorage
   - ✅ Error shown if credentials invalid

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to server"

**Cause:** Backend not running or wrong URL  
**Fix:**
```bash
# Check backend is running
curl http://localhost:8000/docs

# Verify .env
cat frontend/.env
# Should have: REACT_APP_API_URL=http://localhost:8000
```

### Issue: "Invalid email or password"

**Cause:** Credentials don't match database  
**Fix:**
```sql
-- Check if user exists
SELECT * FROM user WHERE email = 'user@email.com';

-- Check password hash
SELECT password_hash FROM user WHERE email = 'user@email.com';
```

### Issue: Login succeeds but redirects to wrong page

**Cause:** user_type in database doesn't match expected values  
**Fix:**
```sql
-- Update user type
UPDATE user SET user_type = 'patient' WHERE user_id = 123;

-- Valid values: 'patient', 'staff', 'doctor', 'admin'
```

### Issue: "Server error. Please try again later."

**Cause:** Backend error (likely database connection)  
**Fix:**
- Check backend logs for errors
- Verify MySQL is running
- Check stored procedure exists: `AuthenticateUser`

---

## 🔓 Logout Functionality

### Usage:
```javascript
import authService from '../services/authService';

// Logout user
authService.logout();

// Redirect to login
navigate('/staff-login');
```

### What it does:
- Clears all localStorage data
- Removes userId, userType, fullName
- Removes patientId (if exists)
- Clears sessionStorage
- User must login again to access protected routes

---

## 🛡️ Protected Routes (Future Enhancement)

To protect routes and require authentication:

```javascript
import authService from '../services/authService';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requiredType }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/staff-login" />;
  }
  
  const userType = authService.getUserType();
  if (requiredType && userType !== requiredType) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
}

// Usage
<Route path="/dashboard" element={
  <ProtectedRoute requiredType="staff">
    <Dashboard />
  </ProtectedRoute>
} />
```

---

## 📊 Database Schema

### **user table:**
```sql
- user_id (VARCHAR) - Primary key
- email (VARCHAR) - Unique, used for login
- password_hash (VARCHAR) - SHA-256 hash
- user_type (ENUM) - 'patient', 'staff', 'doctor', 'admin'
- full_name (VARCHAR)
- NIC (VARCHAR)
- gender (ENUM)
- DOB (DATE)
```

---

## 🎓 For Developers

### Adding Logout Button

```javascript
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  
  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };
  
  return (
    <header>
      <span>Welcome, {user.fullName}</span>
      <button onClick={handleLogout}>Logout</button>
    </header>
  );
}
```

### Checking Authentication Status

```javascript
import authService from '../services/authService';

// Check if authenticated
if (authService.isAuthenticated()) {
  console.log('User is logged in');
}

// Get user type
const userType = authService.getUserType();
if (userType === 'patient') {
  // Show patient features
}

// Get current user data
const user = authService.getCurrentUser();
console.log(user.fullName, user.userId);
```

---

## ✅ Summary

**Before:**
- ❌ Mock login with hardcoded credentials
- ❌ No backend integration
- ❌ No real authentication
- ❌ No session management

**After:**
- ✅ Real authentication via backend API
- ✅ Password verification using SHA-256
- ✅ Session management with localStorage
- ✅ Role-based routing
- ✅ Error handling and validation
- ✅ Loading states and UX improvements
- ✅ Proper logout functionality

---

**Last Updated:** October 16, 2025  
**Version:** 1.0.0 - Full Authentication Integration
