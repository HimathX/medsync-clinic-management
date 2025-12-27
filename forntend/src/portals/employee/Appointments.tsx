import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Loader2,
  Search,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit2,
  Trash2,
  Filter,
  Download,
} from 'lucide-react'
import authService from '@/services/authService'
import appointmentService from '@/services/appointmentService'
import EmployeeNavbar from '@/portals/employee/Navbar'

interface Appointment {
  appointment_id: string
  patient_id: string
  patient_name?: string
  patient_phone?: string
  patient_email?: string
  doctor_id?: string
  doctor_name?: string
  appointment_date: string
  start_time?: string
  status: string
  notes?: string
  time_slot_id?: string
}

export default function EmployeeAppointments(): React.ReactElement {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // Filter states
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  })

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [updateData, setUpdateData] = useState({ status: '', notes: '' })

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
  })

  const currentUser = authService.getCurrentUser()

  const handleLogout = (): void => {
    authService.logout()
    navigate('/staff-login')
  }

  const handleRefresh = useCallback(async (): Promise<void> => {
    await fetchAppointments()
  }, [])

  useEffect(() => {
    const user = authService.getCurrentUser()
    if (!user) {
      navigate('/staff-login')
      return
    }
    fetchAppointments()
  }, [])

  // Fetch appointments
  const fetchAppointments = async (): Promise<void> => {
    setLoading(true)
    setError('')
    try {
      const result = await appointmentService.getAllAppointments()
      let appointmentsArray: Appointment[] = []

      if (Array.isArray(result)) {
        appointmentsArray = result
      } else if ((result as any).appointments && Array.isArray((result as any).appointments)) {
        appointmentsArray = (result as any).appointments
      } else if ((result as any).data && Array.isArray((result as any).data)) {
        appointmentsArray = (result as any).data
      }

      setAppointments(appointmentsArray)
      calculateStats(appointmentsArray)
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError('Failed to load appointments')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const calculateStats = (appts: Appointment[]): void => {
    const stats = {
      total: appts.length,
      scheduled: appts.filter((a) => a.status === 'Scheduled').length,
      completed: appts.filter((a) => a.status === 'Completed').length,
      cancelled: appts.filter((a) => a.status === 'Cancelled').length,
    }
    setStats(stats)
  }

  // Apply filters
  const applyFilters = useCallback((): void => {
    let filtered = [...appointments]

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (apt) =>
          apt.patient_name?.toLowerCase().includes(searchLower) ||
          apt.doctor_name?.toLowerCase().includes(searchLower) ||
          apt.patient_phone?.includes(searchLower)
      )
    }

    if (filters.status) {
      filtered = filtered.filter((apt) => apt.status === filters.status)
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(
        (apt) => new Date(apt.appointment_date) >= new Date(filters.dateFrom)
      )
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (apt) => new Date(apt.appointment_date) <= new Date(filters.dateTo)
      )
    }

    setFilteredAppointments(filtered)
  }, [appointments, filters])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // View appointment details
  const viewAppointmentDetails = (apt: Appointment): void => {
    setSelectedAppointment(apt)
    setShowDetailsModal(true)
  }

  // Open update modal
  const openUpdateModal = (apt: Appointment): void => {
    setSelectedAppointment(apt)
    setUpdateData({ status: apt.status || '', notes: apt.notes || '' })
    setShowUpdateModal(true)
  }

  // Update appointment
  const handleUpdateAppointment = async (): Promise<void> => {
    if (!selectedAppointment) return

    try {
      await appointmentService.updateAppointment(
        selectedAppointment.appointment_id,
        updateData
      )
      setShowUpdateModal(false)
      setUpdateData({ status: '', notes: '' })
      await fetchAppointments()
    } catch (err) {
      console.error('Error updating appointment:', err)
      alert('Failed to update appointment')
    }
  }

  // Cancel appointment
  const handleCancelAppointment = async (appointmentId: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return
    }

    try {
      await appointmentService.cancelAppointment(appointmentId)
      await fetchAppointments()
    } catch (err) {
      console.error('Error cancelling appointment:', err)
      alert('Failed to cancel appointment')
    }
  }

  // Format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      case 'No-Show':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return <Calendar className="w-4 h-4" />
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />
      case 'Cancelled':
        return <XCircle className="w-4 h-4" />
      case 'No-Show':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <EmployeeNavbar
          employeeName={currentUser?.full_name || 'Staff'}
          employeeEmail={currentUser?.email || ''}
          employeeRole="Appointment Management"
          onLogout={handleLogout}
          onRefresh={handleRefresh}
        />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading appointments...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <EmployeeNavbar
        employeeName={currentUser?.full_name || 'Staff'}
        employeeEmail={currentUser?.email || ''}
        employeeRole="Appointment Management"
        onLogout={handleLogout}
        onRefresh={handleRefresh}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            Appointment Management
          </h1>
          <p className="text-slate-600 mt-2">View and manage all patient appointments</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <p className="text-xs text-slate-500 mt-1">All appointments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.scheduled}</div>
              <p className="text-xs text-slate-500 mt-1">Upcoming</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-slate-500 mt-1">Finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Cancelled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.cancelled}</div>
              <p className="text-xs text-slate-500 mt-1">Cancelled</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Patient name or phone..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No-Show">No-Show</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() =>
                  setFilters({ searchTerm: '', status: '', dateFrom: '', dateTo: '' })
                }
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>
              Showing {filteredAppointments.length} of {appointments.length} appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-16 h-16 text-slate-300 mb-4" />
                <p className="text-slate-600 text-lg">No appointments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((apt) => (
                      <TableRow key={apt.appointment_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-slate-900">
                              {apt.patient_name || 'N/A'}
                            </div>
                            {apt.patient_phone && (
                              <div className="text-xs text-slate-500">{apt.patient_phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{apt.doctor_name || '-'}</TableCell>
                        <TableCell>{formatDate(apt.appointment_date)}</TableCell>
                        <TableCell>{apt.start_time || '-'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(apt.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(apt.status)}
                              {apt.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <button
                              onClick={() => viewAppointmentDetails(apt)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openUpdateModal(apt)}
                              disabled={apt.status === 'Cancelled' || apt.status === 'Completed'}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Update Status"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancelAppointment(apt.appointment_id)}
                              disabled={apt.status === 'Cancelled' || apt.status === 'Completed'}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Cancel"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Modal */}
        {showDetailsModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Appointment Details
                  </CardTitle>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-white hover:bg-white/20 p-1 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Patient Section */}
                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Name</p>
                      <p className="font-medium">{selectedAppointment.patient_name || 'N/A'}</p>
                    </div>
                    {selectedAppointment.patient_phone && (
                      <div>
                        <p className="text-slate-500">Phone</p>
                        <p className="font-medium">{selectedAppointment.patient_phone}</p>
                      </div>
                    )}
                    {selectedAppointment.patient_email && (
                      <div className="col-span-2">
                        <p className="text-slate-500">Email</p>
                        <p className="font-medium">{selectedAppointment.patient_email}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appointment Details Section */}
                <div className="border-l-4 border-amber-600 pl-4">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Appointment Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Date</p>
                      <p className="font-medium">{formatDate(selectedAppointment.appointment_date)}</p>
                    </div>
                    {selectedAppointment.start_time && (
                      <div>
                        <p className="text-slate-500">Time</p>
                        <p className="font-medium">{selectedAppointment.start_time}</p>
                      </div>
                    )}
                    {selectedAppointment.doctor_name && (
                      <div>
                        <p className="text-slate-500">Doctor</p>
                        <p className="font-medium">{selectedAppointment.doctor_name}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-500">Status</p>
                      <Badge className={getStatusColor(selectedAppointment.status)}>
                        {selectedAppointment.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {selectedAppointment.notes && (
                  <div className="border-l-4 border-green-600 pl-4">
                    <h3 className="font-semibold text-slate-900 mb-2">Notes</h3>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">
                      {selectedAppointment.notes}
                    </p>
                  </div>
                )}
              </CardContent>

              <div className="bg-slate-50 px-6 py-4 rounded-b-lg flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Update Modal */}
        {showUpdateModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Edit2 className="w-5 h-5" />
                    Update Appointment
                  </CardTitle>
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className="text-white hover:bg-white/20 p-1 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Patient</p>
                  <p className="font-medium text-slate-900">{selectedAppointment.patient_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={updateData.status}
                    onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="No-Show">No-Show</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                  <textarea
                    value={updateData.notes}
                    onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                    rows={4}
                    placeholder="Add any additional notes..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </CardContent>

              <div className="bg-slate-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateAppointment}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Update
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}