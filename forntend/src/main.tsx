import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
// import App from './App.tsx'
import LandingPage from './Landing.tsx'
// import PatientSignup  from '@/portals/patient/pages/SignUp'
// import PatientLogin from './portals/patient/pages/Login'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>
  </StrictMode>,
)