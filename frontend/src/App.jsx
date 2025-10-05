import './App.css'
import AuthContainer from './pages/auth/AuthContainer.jsx'
import Dashboard from './pages/dashboard/Dashboard.jsx'
import Profile from './pages/profile/Profile.jsx'
import Booking from './pages/booking/Booking.jsx'
import Appointments from './pages/appointments/Appointments.jsx'
import MedicalRecords from './pages/medical-records/MedicalRecords.jsx'
import InsuranceManagement from './pages/insurance/InsuranceManagement.jsx'
import DoctorDirectory from './pages/doctor-directory/DoctorDirectory.jsx'
import TreatmentCatalog from './pages/treatment-catalog/TreatmentCatalog.jsx'
import Billing from './pages/billing/Billing.jsx'

function App() {
  return (
    <div>
      {/* <AuthContainer /> */}
      {/* <Dashboard /> */}
      {/* <Profile /> */}
      {/* <Booking /> */}
      {/* <Appointments /> */}
      {/* <MedicalRecords /> */}
      {/* <InsuranceManagement /> */}
      {/* <DoctorDirectory /> */}
      {/* <TreatmentCatalog /> */}
      <Billing />
    </div>
  )
}

export default App
