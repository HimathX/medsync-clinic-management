# MedSync - Quick Migration Guide

## 🚀 5-Minute Migration to Role-Based Architecture

### Step 1: Backup Current Code (1 min)
```bash
# Navigate to frontend directory
cd frontend/src

# Backup current App.js
cp App.js App.backup.js
```

---

### Step 2: Activate New Architecture (1 min)
```bash
# Replace App.js with refactored version
cp App.refactored.js App.js
```

**Or manually:** Copy contents of `App.refactored.js` to `App.js`

---

### Step 3: Verify File Structure (1 min)

Ensure these new files exist:

```
✅ src/components/ProtectedRoute.js
✅ src/components/DoctorHeader.js
✅ src/components/layouts/PatientLayout.js
✅ src/components/layouts/DoctorLayout.js
✅ src/components/layouts/StaffLayout.js
✅ src/components/shared/LoadingSpinner.js
✅ src/components/shared/ErrorMessage.js
✅ src/components/shared/EmptyState.js
✅ src/components/shared/StatCard.js
✅ src/pages/doctor/DoctorDashboard.js
✅ src/pages/PatientSignup.js
```

All files have been created! ✅

---

### Step 4: Test Each User Type (2 min)

#### Test 1: Patient Login
```
1. Go to http://localhost:3000/patient-login
2. Login with patient credentials
3. Should redirect to /patient/dashboard
4. Try accessing /doctor/dashboard (should redirect back)
```

#### Test 2: Doctor Login
```
1. Go to http://localhost:3000/staff-login
2. Login with doctor credentials (user_type = 'doctor')
3. Should redirect to /doctor/dashboard
4. Verify green header with "Doctor" badge
5. Check navigation: Dashboard, Appointments, Patients, Consultations, Schedule
```

#### Test 3: Staff Login
```
1. Go to http://localhost:3000/staff-login
2. Login with staff credentials (user_type = 'staff' or 'admin')
3. Should redirect to /staff/dashboard
4. Verify header with role badge
5. Check navigation based on role
```

---

### Step 5: Update Links (Optional)

If you have hardcoded navigation links, update them:

**Before:**
```javascript
<Link to="/dashboard">Dashboard</Link>
<Link to="/appointments">Appointments</Link>
<Link to="/billing">Billing</Link>
```

**After:**
```javascript
// Use role-specific paths
<Link to="/patient/dashboard">Dashboard</Link>  // For patients
<Link to="/doctor/dashboard">Dashboard</Link>   // For doctors
<Link to="/staff/dashboard">Dashboard</Link>    // For staff

// Or use dynamic navigation:
const userType = authService.getUserType();
const dashboardPath = `/${userType}/dashboard`;
<Link to={dashboardPath}>Dashboard</Link>
```

---

## 🔧 Troubleshooting

### Issue 1: Module Not Found
**Error:** `Cannot find module './components/layouts/PatientLayout'`

**Solution:** Make sure all layout files are created in the correct directories:
```bash
frontend/src/components/layouts/
├── PatientLayout.js
├── DoctorLayout.js
└── StaffLayout.js
```

---

### Issue 2: Redirect Loop
**Error:** Page keeps redirecting

**Solution:** Check localStorage has correct user data:
```javascript
// Open browser console
console.log(localStorage.getItem('userId'));
console.log(localStorage.getItem('userType'));
console.log(localStorage.getItem('isAuthenticated'));

// If missing, login again
```

---

### Issue 3: Wrong Dashboard
**Error:** Doctor sees patient dashboard

**Solution:** Verify user_type in database matches frontend expectations:
```sql
-- Check user_type in database
SELECT user_id, email, user_type FROM user WHERE email = 'doctor@email.com';

-- Should return: 'doctor', 'staff', 'admin', or 'patient'
```

---

### Issue 4: Navigation Not Showing
**Error:** Header navigation menu is empty

**Solution:** Check DoctorHeader/Header is receiving correct props:
```javascript
// In DoctorLayout.js or StaffLayout.js
console.log('User Type:', authService.getUserType());
console.log('Current User:', authService.getCurrentUser());
```

---

## 📋 Rollback Plan

If something goes wrong:

```bash
# Restore original App.js
cd frontend/src
cp App.backup.js App.js

# Restart development server
npm start
```

---

## ✅ Post-Migration Checklist

After migration, verify:

- [ ] Patient login works and shows patient dashboard
- [ ] Doctor login works and shows doctor dashboard with green header
- [ ] Staff login works and shows staff dashboard
- [ ] Patient cannot access doctor/staff routes
- [ ] Doctor cannot access patient routes
- [ ] Staff cannot access patient routes
- [ ] Logout works for all user types
- [ ] Old routes (/dashboard) redirect to new structure
- [ ] Navigation menus show correct items per role
- [ ] Shared components (LoadingSpinner, ErrorMessage) work
- [ ] No console errors
- [ ] All pages load data from backend

---

## 🎨 Customization Options

### Change Doctor Header Color
```javascript
// In src/components/DoctorHeader.js, line 33
<span className="ms-chip" style={{background: '#10b981', color: 'white'}}>

// Change to:
<span className="ms-chip" style={{background: '#3b82f6', color: 'white'}}>
```

### Add New Navigation Item (Doctor)
```javascript
// In src/components/DoctorHeader.js
const navLinks = [
  { to: "/doctor/dashboard", label: "Dashboard" },
  { to: "/doctor/appointments", label: "My Appointments" },
  { to: "/doctor/patients", label: "Patients" },
  { to: "/doctor/consultations", label: "Consultations" },
  { to: "/doctor/schedule", label: "Schedule" },
  { to: "/doctor/reports", label: "Reports" }, // ✅ NEW
];
```

### Customize Loading Message
```javascript
// Use LoadingSpinner with custom message
<LoadingSpinner message="Fetching your appointments..." size="medium" />
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     MedSync Frontend                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ │
│  │ Patient Portal│  │ Doctor Portal │  │ Staff Portal│ │
│  ├───────────────┤  ├───────────────┤  ├─────────────┤ │
│  │ /patient/*    │  │ /doctor/*     │  │ /staff/*    │ │
│  ├───────────────┤  ├───────────────┤  ├─────────────┤ │
│  │PatientLayout  │  │DoctorLayout   │  │StaffLayout  │ │
│  │(No Header)    │  │(Green Header) │  │(Blue Header)│ │
│  └───────────────┘  └───────────────┘  └─────────────┘ │
│          │                  │                   │        │
│          └──────────────────┼───────────────────┘        │
│                             │                            │
│                  ┌──────────▼──────────┐                 │
│                  │  ProtectedRoute     │                 │
│                  │  (Role Validation)  │                 │
│                  └──────────┬──────────┘                 │
│                             │                            │
│                  ┌──────────▼──────────┐                 │
│                  │   authService       │                 │
│                  │ (Authentication)    │                 │
│                  └─────────────────────┘                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Next Steps

After successful migration:

1. **Test thoroughly** - All user types and routes
2. **Update documentation** - Internal wikis, README files
3. **Train team** - Explain new structure to developers
4. **Monitor logs** - Watch for authentication issues
5. **Gather feedback** - From users of each portal type

---

## 💡 Tips

✅ **DO:**
- Test each user type separately
- Use browser incognito mode for different roles
- Check browser console for errors
- Verify localStorage data after login

❌ **DON'T:**
- Mix user types in same browser session
- Modify routes without updating ProtectedRoute
- Hardcode user roles in components
- Skip testing edge cases

---

## 📞 Support

If you encounter issues:
1. Check `ROLE_BASED_ARCHITECTURE.md` for detailed documentation
2. Review console errors
3. Verify authService is working correctly
4. Check database user_type values

---

**Migration Time:** ~5 minutes  
**Testing Time:** ~10 minutes  
**Total Time:** ~15 minutes

Good luck! 🚀
