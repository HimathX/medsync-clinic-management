import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Settings,
  HelpCircle,
  LogOut,
  User,
  RefreshCcw
} from 'lucide-react'
import authService from '@/services/authService'
import PatientProfileService, { type PatientProfile } from '@/services/patientProfileService'

interface PatientNavbarProps {
  patientName?: string
  patientEmail?: string
  patientId?: string
  onLogout?: () => void
  onRefresh?: () => void
  isRefreshing?: boolean
}

export default function PatientNavbar({
  patientName,
  patientEmail,
  patientId,
  onLogout,
  onRefresh,
  isRefreshing,
}: PatientNavbarProps): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [refreshingInternal, setRefreshingInternal] = useState(false)

  const resolvedPatientId = patientId || localStorage.getItem('userId') || undefined

  const fetchProfile = useCallback(async () => {
    try {
      if (!resolvedPatientId) return
      const profileData = await PatientProfileService.getPatientProfile(resolvedPatientId)
      setProfile(profileData)
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }, [resolvedPatientId])

  useEffect(() => {
    // Only fetch if consumer didn't pass patientName/email
    if (!patientName || !patientEmail) {
      void fetchProfile()
    }
  }, [patientName, patientEmail, fetchProfile])

  const handleLogout = async () => {
    if (onLogout) {
      onLogout()
      return
    }
    if (window.confirm('Are you sure you want to logout?')) {
      authService.logout()
      navigate('/')
    }
  }

  const handleRefresh = async () => {
    if (onRefresh) {
      onRefresh()
      return
    }
    setRefreshingInternal(true)
    await fetchProfile()
    setRefreshingInternal(false)
  }

  const displayName = patientName || profile?.full_name || 'Patient'
  const displayEmail = patientEmail || profile?.email || ''

  const patientInitials =
    displayName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'P'

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
            <div className="w-15 h-15 flex items-center justify-center">
              <img 
                src="/assets/logo.jpg"
                alt="MedSync"
                className="w-full h-full object-contain"
              />
            </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">MedSync</h1>
            <p className="text-xs text-slate-500">Patient Portal</p>
          </div>
        </div>

        {/* Center Navigation */}
        <nav className="hidden md:flex gap-6">
          <button
            onClick={() => navigate('/patient/dashboard')}
            className={`text-base font-medium transition-colors ${
              location.pathname === '/patient/dashboard'
                ? 'text-slate-900 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => navigate('/patient/book-appointment')}
            className={`text-base font-medium transition-colors ${
              location.pathname === '/patient/book-appointment'
                ? 'text-slate-900 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Appointments
          </button>
          <button
            onClick={() => navigate('/patient/records')}
            className={`text-base font-medium transition-colors ${
              location.pathname === '/patient/records'
                ? 'text-slate-900 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Records
          </button>
          <button
            onClick={() => navigate('/patient/insurance')}
            className={`text-base font-medium transition-colors ${
              location.pathname === '/patient/insurance'
                ? 'text-slate-900 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Insurance
          </button>
          <button
            onClick={() => navigate('/patient/billing')}
            className={`text-base font-medium transition-colors ${
              location.pathname === '/patient/billing'
                ? 'text-slate-900 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Billing
          </button>
        </nav>

        {/* Right Section - Actions & Profile */}
        <div className="flex items-center gap-4">
          {/* Profile Dropdown */}
          <DropdownMenu open={showProfileMenu} onOpenChange={setShowProfileMenu}>
            <DropdownMenuTrigger asChild>
              <button
                className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-white font-semibold flex items-center justify-center hover:opacity-90 transition-opacity"
                title="Open profile menu"
              >
                {patientInitials}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              {/* User Info */}
              <div className="px-2 py-1.5">
                <p className="font-semibold text-sm text-slate-900">{displayName}</p>
                <p className="text-xs text-slate-500">{displayEmail}</p>
              </div>

              <DropdownMenuSeparator />

              {/* Menu Items */}
              <DropdownMenuItem
                onClick={() => navigate('/patient/profile')}
                className="cursor-pointer"
              >
                <User className="w-4 h-4 mr-2" />
                My Profile
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/patient/settings')}
                className="cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/patient/help')}
                className="cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Help & Support
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Logout */}
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}