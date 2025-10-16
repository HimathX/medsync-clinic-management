# MedSync - Role-Based Architecture Guide

## 🎯 Overview

Complete refactoring of the MedSync frontend with proper role-based access control, separated layouts, and reusable components. The system now supports three distinct user types with appropriate access controls and UI experiences.

---

## 👥 User Types

### 1. **Patient** 🏥
- **Role:** `patient`
- **Access:** Patient portal with personal health information
- **Features:** View appointments, book new appointments, medical records, prescriptions, billing

### 2. **Doctor** 👨‍⚕️
- **Role:** `doctor`
- **Access:** Doctor portal with patient management
- **Features:** View appointments, manage consultations, patient records, schedule management

### 3. **Staff** 👔
- **Roles:** `staff`, `admin`, `billing`
- **Sub-types:**
  - **Admin Staff**: Full access to patients, appointments, billing, reports
  - **System Admin**: Complete system access
  - **Billing Staff**: Billing and payment management
- **Features:** Dashboard, patient management, appointments, billing, reporting

---

## 📁 New File Structure

```
frontend/src/
├── components/
│   ├── layouts/
│   │   ├── PatientLayout.js      ✅ NEW - Patient portal wrapper
│   │   ├── DoctorLayout.js       ✅ NEW - Doctor portal wrapper
│   │   └── StaffLayout.js        ✅ NEW - Staff portal wrapper
│   ├── shared/
│   │   ├── LoadingSpinner.js     ✅ NEW - Reusable loading component
│   │   ├── ErrorMessage.js       ✅ NEW - Reusable error component
│   │   ├── EmptyState.js         ✅ NEW - Reusable empty state
│   │   └── StatCard.js           ✅ NEW - Reusable stat card
│   ├── ProtectedRoute.js         ✅ NEW - Route protection HOC
│   ├── Header.js                 ✅ EXISTING - Staff header
│   └── DoctorHeader.js           ✅ NEW - Doctor-specific header
├── pages/
│   ├── doctor/
│   │   ├── DoctorDashboard.js    ✅ NEW - Doctor dashboard
│   │   ├── [other doctor pages]  📝 TO BE CREATED
│   ├── patient/
│   │   ├── PatientDashboard.js   ✅ EXISTING
│   │   ├── BookAppointment.js    ✅ EXISTING
│   │   └── [other patient pages] ✅ EXISTING
│   └── [staff pages]             ✅ EXISTING
├── services/
│   └── authService.js            ✅ EXISTING - Authentication
└── App.refactored.js             ✅ NEW - Refactored routing
```

---

## 🔐 Authentication & Authorization

### Authentication Service

```javascript
// authService provides:
authService.isAuthenticated()    // Check if user logged in
authService.getUserType()        // Get user type: patient/doctor/staff/admin
authService.getCurrentUser()     // Get full user object
authService.login(email, password)
authService.logout()
```

### User Types Mapping

| Backend `user_type` | Frontend `userType` | Portal |
|---------------------|---------------------|--------|
| `patient` | `patient` | Patient Portal |
| `doctor` | `doctor` | Doctor Portal |
| `staff` | `staff` | Staff Portal |
| `admin` | `admin` | Staff Portal (full access) |

---

## 🛣️ Route Structure

### **Public Routes** (No Authentication Required)

```
/                     → Landing Page
/staff-login          → Staff/Doctor Login
/patient-login        → Patient Login
/patient-signup       → Patient Registration
```

### **Patient Routes** (Protected - patient only)

```
/patient/dashboard          → Patient Dashboard
/patient/book              → Book Appointment
/patient/appointments      → My Appointments
/patient/billing           → Billing & Payments
/patient/records           → Medical Records
/patient/prescriptions     → Prescriptions
/patient/lab-results       → Lab Results
```

### **Doctor Routes** (Protected - doctor only)

```
/doctor/dashboard               → Doctor Dashboard
/doctor/appointments            → Today's Appointments
/doctor/patients                → Patient List
/doctor/patients/:patientId     → Patient Details
/doctor/consultations           → All Consultations
/doctor/consultations/:id       → Specific Consultation
/doctor/schedule                → Schedule Management
```

### **Staff Routes** (Protected - staff/admin/billing)

```
/staff/dashboard              → Staff Dashboard
/staff/patients               → Patient Management
/staff/patients/:patientId    → Patient Details
/staff/patient-portal         → Patient Portal Access
/staff/appointments           → Appointment Management
/staff/treatments             → Treatment Catalog
/staff/billing                → Billing System
/staff/billing/:patientId     → Patient Billing
/staff/reporting              → Reports & Analytics
```

### **Legacy Routes** (Backward Compatibility)

Automatically redirects to new structure based on user type:
- `/dashboard` → `/patient/dashboard` or `/doctor/dashboard` or `/staff/dashboard`
- `/appointments` → Role-specific appointments page
- `/billing` → Role-specific billing page

---

## 🎨 Layout Components

### 1. **PatientLayout**
```javascript
// No header, full-screen dashboard
<PatientLayout>
  <Outlet /> {/* Patient pages render here */}
</PatientLayout>
```

**Features:**
- Full-screen experience
- Built-in navigation in PatientDashboard
- No top header bar

---

### 2. **DoctorLayout**
```javascript
// Doctor-specific header + main content
<DoctorLayout>
  <DoctorHeader />
  <main>
    <Outlet /> {/* Doctor pages render here */}
  </main>
</DoctorLayout>
```

**Features:**
- DoctorHeader with doctor-specific navigation
- Green accent color theme
- Shows doctor name
- Branch selector

**Navigation Items:**
- Dashboard
- My Appointments
- Patients
- Consultations
- Schedule

---

### 3. **StaffLayout**
```javascript
// Staff header + main content
<StaffLayout>
  <Header role={role} />
  <main>
    <Outlet /> {/* Staff pages render here */}
  </main>
</StaffLayout>
```

**Features:**
- Header with role-based navigation
- Branch selector
- Role indicator badge
- Dynamic menu based on staff type

**Navigation Items (varies by role):**
- **Admin Staff**: Dashboard, Patients, Appointments, Billing, Reporting
- **Doctor**: Dashboard, Appointments, Treatments
- **Billing Staff**: Dashboard, Billing
- **System Admin**: All pages

---

## 🛡️ ProtectedRoute Component

Wraps routes to enforce authentication and role-based access:

```javascript
<ProtectedRoute allowedRoles={['doctor', 'admin']}>
  <SomePage />
</ProtectedRoute>
```

**How it works:**
1. Checks if user is authenticated
2. If not authenticated → Redirect to `/`
3. If authenticated but wrong role → Redirect to their dashboard
4. If authenticated and correct role → Render component

**Example:**
```javascript
// Only doctors can access
<Route path="/doctor/dashboard" element={
  <ProtectedRoute allowedRoles={['doctor']}>
    <DoctorDashboard />
  </ProtectedRoute>
} />

// Doctors and admins can access
<Route path="/staff/patients" element={
  <ProtectedRoute allowedRoles={['doctor', 'admin', 'staff']}>
    <Patients />
  </ProtectedRoute>
} />
```

---

## 🧩 Shared Components

### **LoadingSpinner**
```javascript
import LoadingSpinner from '../components/shared/LoadingSpinner';

<LoadingSpinner message="Loading data..." size="large" />
```

**Props:**
- `message` (string): Loading message
- `size` ('small' | 'medium' | 'large'): Spinner size

---

### **ErrorMessage**
```javascript
import ErrorMessage from '../components/shared/ErrorMessage';

<ErrorMessage 
  title="Error Loading Data"
  message={error}
  onRetry={refetchData}
  type="error" // 'error' | 'warning' | 'info'
/>
```

**Props:**
- `title` (string): Error title
- `message` (string): Error description
- `onRetry` (function): Retry callback
- `type` ('error' | 'warning' | 'info'): Display type

---

### **EmptyState**
```javascript
import EmptyState from '../components/shared/EmptyState';

<EmptyState 
  icon="📭"
  title="No Appointments"
  message="You don't have any upcoming appointments"
  actionLabel="Book Appointment"
  onAction={() => navigate('/patient/book')}
/>
```

**Props:**
- `icon` (string): Emoji or icon
- `title` (string): Empty state title
- `message` (string): Description
- `actionLabel` (string): Button text (optional)
- `onAction` (function): Button click handler (optional)

---

### **StatCard**
```javascript
import StatCard from '../components/shared/StatCard';

<StatCard 
  icon="📅"
  title="Total Appointments"
  value={42}
  subtitle="This week"
  trend={{ direction: 'up', value: '12%' }}
  color="#10b981"
  onClick={() => navigate('/appointments')}
/>
```

**Props:**
- `icon` (string): Emoji or icon
- `title` (string): Card title
- `value` (string|number): Main value
- `subtitle` (string): Additional info (optional)
- `trend` (object): { direction: 'up'|'down', value: '12%' } (optional)
- `color` (string): Value color
- `onClick` (function): Click handler (optional)

---

## 🔄 Migration Steps

### Step 1: Backup Current App.js
```bash
# Keep the old version as backup
cp src/App.js src/App.old.js
```

### Step 2: Replace App.js
```bash
# Replace with refactored version
cp src/App.refactored.js src/App.js
```

### Step 3: Test Each User Type

**Test as Patient:**
1. Login at `/patient-login`
2. Should redirect to `/patient/dashboard`
3. Test all patient routes
4. Verify cannot access doctor/staff routes

**Test as Doctor:**
1. Login at `/staff-login` with doctor credentials
2. Should redirect to `/doctor/dashboard`
3. Test all doctor routes
4. Verify cannot access patient/staff routes

**Test as Staff:**
1. Login at `/staff-login` with staff credentials
2. Should redirect to `/staff/dashboard`
3. Test all staff routes based on role
4. Verify cannot access patient/doctor routes

### Step 4: Update Navigation Links

Update any hardcoded links in your components:

**Before:**
```javascript
<Link to="/dashboard">Dashboard</Link>
<Link to="/appointments">Appointments</Link>
```

**After:**
```javascript
<Link to="/patient/dashboard">Dashboard</Link>  // Patient
<Link to="/doctor/dashboard">Dashboard</Link>   // Doctor
<Link to="/staff/dashboard">Dashboard</Link>    // Staff
```

---

## 📊 Role-Based Feature Matrix

| Feature | Patient | Doctor | Admin Staff | Billing Staff | System Admin |
|---------|---------|--------|-------------|---------------|--------------|
| View own appointments | ✅ | ❌ | ❌ | ❌ | ❌ |
| Book appointments | ✅ | ❌ | ✅ | ❌ | ✅ |
| View own medical records | ✅ | ❌ | ❌ | ❌ | ❌ |
| View own billing | ✅ | ❌ | ❌ | ❌ | ❌ |
| View doctor's appointments | ❌ | ✅ | ❌ | ❌ | ❌ |
| Manage consultations | ❌ | ✅ | ❌ | ❌ | ✅ |
| View patient records | ❌ | ✅ | ✅ | ❌ | ✅ |
| Manage doctor schedule | ❌ | ✅ | ✅ | ❌ | ✅ |
| Manage all patients | ❌ | ❌ | ✅ | ❌ | ✅ |
| Manage all appointments | ❌ | ❌ | ✅ | ❌ | ✅ |
| Process billing | ❌ | ❌ | ✅ | ✅ | ✅ |
| View reports | ❌ | ❌ | ✅ | ❌ | ✅ |
| System admin functions | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🎯 Benefits of New Architecture

### 1. **Clear Separation of Concerns**
- Each user type has dedicated routes and layout
- No mixing of patient/doctor/staff pages
- Easier to maintain and debug

### 2. **Improved Security**
- ProtectedRoute enforces role-based access
- Cannot access pages outside your role
- Automatic redirect to appropriate dashboard

### 3. **Better User Experience**
- Role-specific UI and navigation
- No confusion about available features
- Cleaner, more focused interfaces

### 4. **Maintainability**
- Shared components reduce code duplication
- Easy to add new pages for each role
- Clear folder structure

### 5. **Scalability**
- Easy to add new user types
- Can extend permissions granularly
- Supports future feature additions

### 6. **Reusable Components**
- LoadingSpinner, ErrorMessage, EmptyState, StatCard
- Consistent UI across all portals
- Faster development of new features

---

## 🧪 Testing Checklist

### Authentication
- [ ] Can login as patient
- [ ] Can login as doctor
- [ ] Can login as staff (different types)
- [ ] Logout works for all user types
- [ ] Session persists on page refresh

### Route Protection
- [ ] Patient cannot access doctor routes
- [ ] Doctor cannot access patient routes
- [ ] Staff cannot access patient routes
- [ ] Unauthenticated redirects to home
- [ ] Wrong role redirects to own dashboard

### Navigation
- [ ] Patient nav shows correct items
- [ ] Doctor nav shows correct items
- [ ] Staff nav shows correct items based on role
- [ ] Logout button works in all layouts

### Shared Components
- [ ] LoadingSpinner displays correctly
- [ ] ErrorMessage shows and retry works
- [ ] EmptyState renders properly
- [ ] StatCard is clickable and styled

### Backward Compatibility
- [ ] Old `/dashboard` route redirects correctly
- [ ] Old `/appointments` route redirects correctly
- [ ] Old `/billing` route redirects correctly

---

## 📝 Future Enhancements

1. **Permissions System**
   - Granular permissions beyond role types
   - Permission-based feature flags
   - Dynamic menu generation

2. **Multi-Role Support**
   - Users with multiple roles
   - Role switcher in header
   - Context-aware navigation

3. **Audit Logging**
   - Track page access by role
   - Log permission violations
   - Security monitoring

4. **Customization**
   - User preferences per role
   - Customizable dashboards
   - Theme options

5. **Mobile App Support**
   - Role-specific mobile layouts
   - Mobile-first design
   - Progressive Web App (PWA)

---

## 🎉 Summary

**Files Created:**
- ✅ `ProtectedRoute.js` - Route protection
- ✅ `layouts/PatientLayout.js` - Patient layout wrapper
- ✅ `layouts/DoctorLayout.js` - Doctor layout wrapper
- ✅ `layouts/StaffLayout.js` - Staff layout wrapper
- ✅ `DoctorHeader.js` - Doctor navigation header
- ✅ `shared/LoadingSpinner.js` - Loading component
- ✅ `shared/ErrorMessage.js` - Error component
- ✅ `shared/EmptyState.js` - Empty state component
- ✅ `shared/StatCard.js` - Statistics card
- ✅ `doctor/DoctorDashboard.js` - Doctor dashboard
- ✅ `App.refactored.js` - New App.js with proper routing

**Status:** ✅ **Architecture Complete - Ready for Testing!**

Replace `src/App.js` with `src/App.refactored.js` to activate the new architecture! 🚀
