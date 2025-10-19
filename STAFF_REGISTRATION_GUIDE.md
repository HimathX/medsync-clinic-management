# 👔 Staff Registration Guide

## ✅ What Was Implemented

A complete **staff member registration system** with:
- Full registration form for new staff members
- bcrypt password hashing
- Branch selection from database
- Role-based registration (nurse, admin, receptionist, manager, etc.)
- Direct database insertion (no stored procedure dependency)

---

## 📁 Files Created/Modified

### Backend:
- ✅ `backend/routers/staff.py` - Updated `/staff/register` endpoint with bcrypt

### Frontend:
- ✅ `frontend/src/pages/StaffSignup.js` - New staff registration page
- ✅ `frontend/src/App.js` - Added `/staff-signup` route
- ✅ `frontend/src/pages/Login.js` - Added "New Staff Registration" link

---

## 🌐 How to Access

### **URL:** `http://localhost:3000/staff-signup`

Or from the staff login page:
1. Go to `http://localhost:3000/staff-login`
2. Click "New Staff Registration" at the bottom

---

## 📝 Registration Form Fields

### Personal Information
- Full Name *
- NIC Number *
- Email Address *
- Gender * (Male/Female/Other)
- Date of Birth *

### Contact Information
- Primary Contact Number *
- Secondary Contact Number (optional)

### Address
- Address Line 1 *
- Address Line 2 (optional)
- City *
- Province * (dropdown with all Sri Lankan provinces)
- Postal Code *
- Country (defaults to Sri Lanka)

### Employment Details
- Branch * (dynamically loaded from database)
- Role * (nurse, admin, receptionist, manager, pharmacist, lab_technician)
- Monthly Salary (LKR) *
- Joining Date * (defaults to today)

### Security
- Password * (minimum 8 characters)
- Confirm Password *

---

## 🎯 Available Roles

| Role | Description |
|------|-------------|
| Nurse | Nursing staff |
| Admin | Administrative staff |
| Receptionist | Front desk staff |
| Manager | Branch manager (only 1 per branch) |
| Pharmacist | Pharmacy staff |
| Lab Technician | Laboratory staff |

**Note:** Doctor registration is separate (not included in this form)

---

## ✅ Validation Rules

### Automatically Validated:
- ✅ Email must be unique (no duplicates)
- ✅ NIC must be unique (no duplicates)
- ✅ Password minimum 8 characters
- ✅ Passwords must match
- ✅ Email format validation
- ✅ Only one manager per branch
- ✅ Branch must be active
- ✅ All required fields must be filled

---

## 🧪 Test Registration

Try registering a new staff member:

### Example Data:

```
Personal Info:
  Full Name: John Smith
  NIC: 199512345678
  Email: john.smith@medsync.lk
  Gender: Male
  DOB: 1995-06-15

Contact:
  Primary: +94771234567
  Secondary: +94112345678

Address:
  Line 1: 456 Hospital Road
  Line 2: Colombo 03
  City: Colombo
  Province: Western
  Postal Code: 00300

Employment:
  Branch: (Select from dropdown)
  Role: Nurse
  Salary: 65000.00
  Joined Date: (Today's date)

Security:
  Password: nurse12345
  Confirm: nurse12345
```

---

## 🔐 Security Features

1. **bcrypt Password Hashing** - Passwords are hashed using bcrypt before storage
2. **Email Uniqueness** - Prevents duplicate email registrations
3. **NIC Uniqueness** - Prevents duplicate NIC registrations
4. **Manager Restriction** - Only one manager allowed per branch
5. **Branch Validation** - Only active branches can be selected
6. **Password Strength** - Minimum 8 characters required
7. **Password Confirmation** - Must match to proceed

---

## 📊 API Endpoint

### **POST /staff/register**

**Request Body:**
```json
{
  "full_name": "John Smith",
  "NIC": "199512345678",
  "email": "john.smith@medsync.lk",
  "gender": "Male",
  "DOB": "1995-06-15",
  "password": "nurse12345",
  "contact_num1": "+94771234567",
  "contact_num2": "+94112345678",
  "address_line1": "456 Hospital Road",
  "address_line2": "Colombo 03",
  "city": "Colombo",
  "province": "Western",
  "postal_code": "00300",
  "country": "Sri Lanka",
  "branch_name": "Main Branch",
  "role": "nurse",
  "salary": 65000.00,
  "joined_date": "2025-10-18"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Staff member registered successfully",
  "staff_id": "uuid-of-new-staff"
}
```

**Error Response (400/404/500):**
```json
{
  "detail": "Email already registered"
}
```

---

## 🔄 Registration Flow

```
1. User fills out registration form
   ↓
2. Frontend validates inputs (client-side)
   ↓
3. POST request to /staff/register
   ↓
4. Backend validates (email, NIC, branch, manager check)
   ↓
5. Password hashed with bcrypt
   ↓
6. Records created:
   - address table
   - contact table
   - user table (user_type = 'employee')
   - employee table
   ↓
7. Success response with staff_id
   ↓
8. Frontend redirects to login page after 2 seconds
```

---

## 🚨 Common Errors

### "Email already registered"
- **Cause:** Email exists in database
- **Solution:** Use a different email address

### "NIC already registered"
- **Cause:** NIC exists in database
- **Solution:** Check NIC number, use different one

### "Branch already has an active manager"
- **Cause:** Trying to register manager role when branch already has one
- **Solution:** Choose different branch or different role

### "Branch 'XYZ' not found or inactive"
- **Cause:** Branch doesn't exist or is inactive
- **Solution:** Select a valid, active branch from dropdown

### "Passwords do not match"
- **Cause:** Password and confirm password fields don't match
- **Solution:** Retype passwords carefully

---

## 🧪 Testing with cURL

```bash
curl -X POST http://localhost:8000/staff/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Staff",
    "NIC": "199912345678",
    "email": "test.staff@medsync.lk",
    "gender": "Male",
    "DOB": "1999-01-01",
    "password": "testpass123",
    "contact_num1": "+94771234567",
    "contact_num2": "",
    "address_line1": "123 Test Street",
    "address_line2": "",
    "city": "Colombo",
    "province": "Western",
    "postal_code": "00100",
    "country": "Sri Lanka",
    "branch_name": "Main Branch",
    "role": "nurse",
    "salary": 60000.00,
    "joined_date": "2025-10-18"
  }'
```

---

## 📱 User Experience

1. **Form Organization** - Grouped into logical sections with fieldsets
2. **Responsive Design** - Grid layout adapts to screen size
3. **Real-time Validation** - Errors shown immediately
4. **Loading States** - Disabled inputs during submission
5. **Success Feedback** - Green success message with staff ID
6. **Auto-redirect** - Redirects to login after successful registration
7. **Branch Loading** - Branches fetched from API automatically

---

## 🎯 After Registration

1. Staff member is registered with status `is_active = TRUE`
2. Can immediately login at `/staff-login`
3. Receives `user_type = 'employee'` in user table
4. Role stored in employee table
5. Password securely hashed with bcrypt

---

## 📝 Next Steps After Implementation

### To Login:
1. Go to `http://localhost:3000/staff-login`
2. Enter registered email and password
3. Will be authenticated and redirected to staff dashboard

---

## 🎓 Technical Details

### Password Hashing:
- **Algorithm:** bcrypt
- **Library:** passlib with bcrypt
- **Hash Length:** ~60 characters (bcrypt standard)
- **Format:** `$2b$12$...`

### Database Tables Used:
1. `address` - Staff address
2. `contact` - Contact numbers
3. `user` - Login credentials (user_type = 'employee')
4. `employee` - Employment details

### Transaction Safety:
- Uses database context manager
- Auto-rollback on error
- Atomic operations

---

**Status:** ✅ Fully Functional  
**Endpoint:** `POST /staff/register`  
**Page:** `/staff-signup`  
**Last Updated:** October 18, 2025
