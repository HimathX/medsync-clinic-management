import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Stethoscope,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Award,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  MapPin,
  DollarSign,
  Zap,
  Mail,
} from 'lucide-react'
import doctorService, {
  type Doctor,
  type PerformanceMetrics,
  type ConsultationAnalytics,
  type DoctorSchedule,
} from '@/services/doctorService'
import EmployeeNavbar from '@/portals/employee/Navbar'

interface DoctorWithMetrics extends Doctor {
  metrics?: PerformanceMetrics
  analytics?: ConsultationAnalytics
  schedule?: DoctorSchedule
}

export default function DoctorManagement(): React.ReactElement {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Doctors list
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])

  // Selected doctor details
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorWithMetrics | null>(null)
  const [selectedDoctorLoading, setSelectedDoctorLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  const handleLogout = (): void => {
    localStorage.removeItem('auth_token')
    window.location.href = '/employee-login'
  }

  const handleRefresh = useCallback(async (): Promise<void> => {
    await fetchDoctors()
  }, [])

  useEffect(() => {
    void fetchDoctors()
  }, [])

  // Update filtered doctors
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setFilteredDoctors(allDoctors)
    } else {
      const filtered = allDoctors.filter(
        (d) =>
          (d.full_name || d.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.medical_licence_no?.includes(searchTerm) ||
          d.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredDoctors(filtered)
    }
  }, [searchTerm, allDoctors])

  const fetchDoctors = async (): Promise<void> => {
    setLoading(true)
    setError('')
    try {
      const data = await doctorService.getAllDoctors()
      setAllDoctors(data.doctors || [])
      setFilteredDoctors(data.doctors || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch doctors')
    } finally {
      setLoading(false)
    }
  }
    useEffect(() => {
    if (allDoctors.length > 0 && !selectedDoctor) {
        selectDoctor(allDoctors[0])
    }
    }, [allDoctors, selectedDoctor])

  const fetchDoctorDetails = async (doctorId: string): Promise<void> => {
    setSelectedDoctorLoading(true)
    setError('')
    try {
      const doctorData = allDoctors.find((d) => d.doctor_id === doctorId)
      if (!doctorData) return

      const metrics = await doctorService.getPerformanceMetrics(doctorId)
      const analytics = await doctorService.getConsultationAnalytics(doctorId, 30)
      const schedule = await doctorService.getSchedule(doctorId)

      setSelectedDoctor({
        ...doctorData,
        metrics,
        analytics,
        schedule,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch doctor details')
    } finally {
      setSelectedDoctorLoading(false)
    }
  }

  const selectDoctor = (doctor: Doctor): void => {
    void fetchDoctorDetails(doctor.doctor_id || '')
    setActiveTab('details')
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount || 0)
  }

  const formatPercentage = (value: number): string => {
    return `${(value || 0).toFixed(1)}%`
  }

  const StatBox = ({
    icon: Icon,
    label,
    value,
    unit = '',
    color = 'blue',
  }: {
    icon: React.ReactNode
    label: string
    value: string | number
    unit?: string
    color?: 'blue' | 'green' | 'amber' | 'red' | 'purple'
  }) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      amber: 'bg-amber-50 text-amber-700 border-amber-200',
      red: 'bg-red-50 text-red-700 border-red-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
    }

    return (
      <div className={`p-4 rounded-lg border ${colors[color]}`}>
        <div className="flex items-center gap-2 mb-2">
          {Icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="text-2xl font-bold">
          {value}
          {unit && <span className="text-sm ml-1">{unit}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <EmployeeNavbar
        employeeName="Staff"
        employeeEmail="staff@clinic.com"
        employeeRole="Doctor Management"
        onLogout={handleLogout}
        onRefresh={handleRefresh}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            Doctor Management
          </h1>
          <p className="text-slate-600 mt-2">View doctor profiles, performance metrics, and analytics</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Doctors List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  Doctors
                </CardTitle>
                <CardDescription>Select a doctor to view details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    placeholder="Search doctor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Doctors List */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    </div>
                  ) : filteredDoctors.length === 0 ? (
                    <div className="py-8 text-center text-slate-600">
                      <Stethoscope className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm">No doctors found</p>
                    </div>
                  ) : (
                    filteredDoctors.map((doctor) => (
                      <button
                        key={doctor.doctor_id}
                        onClick={() => selectDoctor(doctor)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          selectedDoctor?.doctor_id === doctor.doctor_id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-semibold text-slate-900">
                          {doctor.full_name || doctor.name}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          {doctor.is_available ? '🟢 Available' : '🔴 Unavailable'}
                        </div>
                        {doctor.consultation_fee && (
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            LKR {doctor.consultation_fee.toLocaleString()}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Doctor Details */}
          {selectedDoctor ? (
            <div className="lg:col-span-3 space-y-6">
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4">
                  {selectedDoctorLoading ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
                        <p>Loading details...</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Basic Information */}
                      <Card className="border-border">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Basic Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="border-b pb-3">
                            <p className="text-sm text-muted-foreground">Full Name</p>
                            <p className="font-semibold">{selectedDoctor.full_name || selectedDoctor.name}</p>
                          </div>
                          <div className="border-b pb-3">
                            <p className="text-sm text-muted-foreground">Medical License</p>
                            <p className="font-semibold font-mono">{selectedDoctor.medical_licence_no}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <div className="mt-1">
                              <Badge variant={selectedDoctor.is_available ? 'default' : 'secondary'}>
                                {selectedDoctor.is_available ? 'Available' : 'Unavailable'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Contact Information */}
                      <Card className="border-border">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            Contact Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="border-b pb-3">
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-semibold break-all">{selectedDoctor.email || 'N/A'}</p>
                          </div>
                          <div className="border-b pb-3">
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="font-semibold">{selectedDoctor.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Room Number</p>
                            <p className="font-semibold">{selectedDoctor.room_no || 'N/A'}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Professional Details */}
                      <Card className="border-border md:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Award className="w-5 h-5" />
                            Professional Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="border-b pb-3">
                            <p className="text-sm text-muted-foreground">Specialization</p>
                            <p className="font-semibold">{selectedDoctor.specialization || 'General'}</p>
                          </div>
                          <div className="border-b pb-3">
                            <p className="text-sm text-muted-foreground">Consultation Fee</p>
                            <p className="font-semibold text-primary">
                              {formatCurrency(selectedDoctor.consultation_fee || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Experience</p>
                            <p className="font-semibold">{selectedDoctor.years_of_experience || 'N/A'} years</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  {selectedDoctorLoading ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-2" />
                        <p>Loading details...</p>
                      </CardContent>
                    </Card>
                  ) : selectedDoctor.metrics ? (
                    <div className="grid grid-cols-2 gap-4">
                      <StatBox
                        icon={<Users className="w-5 h-5" />}
                        label="Total Consultations"
                        value={selectedDoctor.metrics.total_consultations}
                        color="blue"
                      />
                      <StatBox
                        icon={<CheckCircle className="w-5 h-5" />}
                        label="Completed"
                        value={selectedDoctor.metrics.completed_consultations}
                        color="green"
                      />
                      <StatBox
                        icon={<AlertTriangle className="w-5 h-5" />}
                        label="Cancelled"
                        value={selectedDoctor.metrics.cancelled_appointments}
                        color="amber"
                      />
                      <StatBox
                        icon={<TrendingUp className="w-5 h-5" />}
                        label="No Shows"
                        value={selectedDoctor.metrics.no_shows}
                        color="red"
                      />
                      <StatBox
                        icon={<Award className="w-5 h-5" />}
                        label="Completion Rate"
                        value={formatPercentage(selectedDoctor.metrics.completion_rate)}
                        color="purple"
                      />
                      <StatBox
                        icon={<Zap className="w-5 h-5" />}
                        label="No-Show Rate"
                        value={formatPercentage(selectedDoctor.metrics.no_show_rate)}
                        color="red"
                      />
                      <StatBox
                        icon={<DollarSign className="w-5 h-5" />}
                        label="Total Revenue"
                        value={formatCurrency(selectedDoctor.metrics.total_revenue)}
                        color="green"
                      />
                      <StatBox
                        icon={<BarChart3 className="w-5 h-5" />}
                        label="Avg Revenue"
                        value={formatCurrency(selectedDoctor.metrics.avg_revenue_per_consultation)}
                        color="blue"
                      />
                    </div>
                  ) : null}
                </TabsContent>

                {/* Performance Tab */}
                <TabsContent value="performance" className="space-y-4">
                  {selectedDoctorLoading ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-2" />
                        <p>Loading performance data...</p>
                      </CardContent>
                    </Card>
                  ) : selectedDoctor.metrics ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Performance Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Performance Rating */}
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <div className="font-semibold text-slate-900">Performance Rating</div>
                              <div className="text-sm text-slate-600 mt-1">
                                {doctorService.getPerformanceRating(selectedDoctor.metrics).label}
                              </div>
                            </div>
                            <div className="text-3xl">
                              {doctorService.getPerformanceRating(selectedDoctor.metrics).icon}
                            </div>
                          </div>
                        </div>

                        {/* Key Metrics Table */}
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader className="bg-slate-100">
                              <TableRow>
                                <TableHead>Metric</TableHead>
                                <TableHead className="text-right">Value</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Unique Patients</TableCell>
                                <TableCell className="text-right">
                                  {selectedDoctor.metrics.unique_patients}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="default">Active</Badge>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Completion Rate</TableCell>
                                <TableCell className="text-right">
                                  {formatPercentage(selectedDoctor.metrics.completion_rate)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge
                                    variant={
                                      selectedDoctor.metrics.completion_rate >= 80 ? 'default' : 'secondary'
                                    }
                                  >
                                    {selectedDoctor.metrics.completion_rate >= 80 ? 'Excellent' : 'Good'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">No-Show Rate</TableCell>
                                <TableCell className="text-right">
                                  {formatPercentage(selectedDoctor.metrics.no_show_rate)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge
                                    variant={
                                      selectedDoctor.metrics.no_show_rate <= 10 ? 'default' : 'destructive'
                                    }
                                  >
                                    {selectedDoctor.metrics.no_show_rate <= 10 ? 'Low' : 'High'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Avg Revenue/Consultation</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(selectedDoctor.metrics.avg_revenue_per_consultation)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="default">Stable</Badge>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}
                </TabsContent>

                {/* Schedule Tab */}
                <TabsContent value="schedule" className="space-y-4">
                  {selectedDoctorLoading ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-2" />
                        <p>Loading schedule...</p>
                      </CardContent>
                    </Card>
                  ) : selectedDoctor.schedule ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          Schedule Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <StatBox
                            icon={<Calendar className="w-5 h-5" />}
                            label="Total Slots"
                            value={selectedDoctor.schedule.statistics.total_slots}
                            color="blue"
                          />
                          <StatBox
                            icon={<CheckCircle className="w-5 h-5" />}
                            label="Booked Slots"
                            value={selectedDoctor.schedule.statistics.booked_slots}
                            color="green"
                          />
                          <StatBox
                            icon={<Zap className="w-5 h-5" />}
                            label="Available Slots"
                            value={selectedDoctor.schedule.statistics.available_slots}
                            color="amber"
                          />
                          <StatBox
                            icon={<TrendingUp className="w-5 h-5" />}
                            label="Utilization"
                            value={formatPercentage(selectedDoctor.schedule.statistics.utilization_rate)}
                            color="purple"
                          />
                        </div>

                        {/* Schedule Details */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm text-slate-600 mb-2">Schedule Period</div>
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-slate-900">
                              {new Date(selectedDoctor.schedule.start_date).toLocaleDateString()}
                            </div>
                            <div className="text-slate-600">to</div>
                            <div className="font-semibold text-slate-900">
                              {new Date(selectedDoctor.schedule.end_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <Stethoscope className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg">Select a doctor from the list to view details</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}