# 🔐 Staff Login - Separate Endpoint

## ✅ What Was Implemented

Created a **dedicated staff login endpoint** at `/staff/login` that uses bcrypt password verification to match the database.

### 📍 Endpoint Details

**URL:** `POST /staff/login`  
**Location:** `backend/routers/staff.py`  
**Authentication:** bcrypt password hashing

---

## 🧪 Test Credentials

### Managers (password: `manager123`)
- `samantha.perera@medsync.lk`
- `nimal.silva@medsync.lk`
- `chamari.fernando@medsync.lk`

### Doctors (password: `doctor123`)
- `kasun.rajapaksha@medsync.lk`
- `priya.jayawardena@medsync.lk`
- `rohan.wickramasinghe@medsync.lk`
- `dilini.gunasekara@medsync.lk`

### Nurses/Admin (password: `nurse123`)
- `nimali.wijesinghe@medsync.lk`
- `sanduni.amarasinghe@medsync.lk`
- `kavinda.dissanayake@medsync.lk`

---

## 🚀 How to Use

### API Call Example

```bash
curl -X POST http://localhost:8000/staff/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kasun.rajapaksha@medsync.lk",
    "password": "doctor123"
  }'
```

### Expected Response

```json
{
  "success": true,
  "message": "Login successful",
  "user_id": "296351fe-aad4-11f0-afdd-005056c00001",
  "user_type": "doctor",
  "full_name": "Dr. Kasun Rajapaksha",
  "email": "kasun.rajapaksha@medsync.lk",
  "role": "doctor"
}
```

---

## 🔧 Frontend Integration

Update your frontend `authService.js` to use the staff endpoint:

```javascript
// For staff login
async staffLogin(email, password) {
  const response = await api.post('/staff/login', {
    email,
    password
  });
  
  // Store user data
  if (response.data.success) {
    localStorage.setItem('userId', response.data.user_id);
    localStorage.setItem('userType', response.data.user_type);
    localStorage.setItem('fullName', response.data.full_name);
    localStorage.setItem('role', response.data.role);
    localStorage.setItem('isAuthenticated', 'true');
  }
  
  return response.data;
}
```

Or update `Login.js` to change the endpoint for staff:

```javascript
// In Login.js, when loginType === 'staff'
const response = await api.post('/staff/login', { email, password });
```

---

## ✅ What's Different

### Staff Login (`/staff/login`)
- ✅ Uses **bcrypt** password verification
- ✅ Only authenticates employees (user_type = 'employee')
- ✅ Returns employee **role** (doctor, nurse, admin, etc.)
- ✅ Matches database password hashes

### Patient Login (`/auth/login`) - UNCHANGED
- 🔒 Still uses existing authentication
- 🔒 Patients continue to use this endpoint
- 🔒 No changes to patient login flow

---

## 🎯 Role Mapping

| Database Role | Returned user_type | Frontend Access |
|--------------|-------------------|-----------------|
| `doctor` | `doctor` | Staff Dashboard |
| `manager` | `manager` | Staff Dashboard |
| `admin` | `admin` | Staff Dashboard |
| `nurse` | `nurse` | Staff Dashboard |
| `receptionist` | `receptionist` | Staff Dashboard |

---

## 🧪 Quick Test (PowerShell)

```powershell
# Test staff login
$response = Invoke-RestMethod -Uri "http://localhost:8000/staff/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"kasun.rajapaksha@medsync.lk","password":"doctor123"}'

Write-Host "Login successful: $($response.full_name) - $($response.role)"
```

---

## 📊 API Documentation

View the Swagger docs at: `http://localhost:8000/docs`

Look for the **staff** tag and find the `POST /staff/login` endpoint.

---

## 🔒 Security Features

1. **bcrypt hashing** - Industry standard for password security
2. **Employee verification** - Only allows user_type = 'employee'
3. **Active status check** - Only active employees can login
4. **Role validation** - Verifies employee/doctor records exist
5. **Email normalization** - Case-insensitive email matching

---

## ⚠️ Important Notes

- **Patient login unchanged** - Patients still use `/auth/login`
- **Separate endpoint** - Staff uses `/staff/login`
- **Backward compatible** - Existing patient functionality not affected
- **Database unchanged** - No database modifications required

---

**Status:** ✅ Ready to Use  
**Endpoint:** `POST /staff/login`  
**Last Updated:** October 18, 2025
