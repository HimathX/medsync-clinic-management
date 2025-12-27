import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Search, Plus, Eye, Calendar, AlertTriangle, Users, TrendingUp, Heart } from 'lucide-react'
import patientService from '@/services/patientService'
import '@/index.css'
import EmployeeNavbar from '@/portals/employee/Navbar'
import type { PatientProfile } from '@/services/patientProfileService'

interface PatientMetrics {
  total_patients: number
  new_patients_last_30_days: number
  patients_with_active_appointments: number
  patients_with_allergies: number
}

interface EnhancedPatient {
  id: string
  full_name: string
  NIC: string
  email: string
  gender: 'Male' | 'Female' | 'Other'
  DOB: string
  blood_group: string
  contact_num1: string
  contact_num2?: string
  address_line1: string
  address_line2?: string
  city: string
  province: string
  postal_code: string
  country: string
  registered_branch_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function EmployeePatients(): React.ReactElement {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<EnhancedPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<EnhancedPatient | null>(null)
  const [metrics, setMetrics] = useState<PatientMetrics | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [pagination] = useState({ skip: 0, limit: 20 })
  const [profile, setProfile] = useState<PatientProfile | null>(null)

  const [newPatientForm, setNewPatientForm] = useState({
    full_name: '',
    NIC: '',
    email: '',
    gender: 'Male' as const,
    DOB: '',
    password: '',
    blood_group: 'O+' as const,
    contact_num1: '',
    contact_num2: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province: 'Western' as const,
    postal_code: '',
    country: 'Sri Lanka',
    registered_branch_name: 'Colombo',
  })

  useEffect(() => {
    void fetchPatients()
    void fetchMetrics()
  }, [pagination])

  const handleLogout = (): void => {
    // wire to your auth service
    navigate('/employee-login')
  }

  const handleRefresh = (): void => {
    void fetchPatients()
    void fetchMetrics()
  }

  const fetchPatients = async (): Promise<void> => {
    setLoading(true)
    try {
      const response = await patientService.getAllPatients(pagination.skip, pagination.limit)
      setPatients(response.patients)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patients')
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async (): Promise<void> => {
    try {
      setMetrics({
        total_patients: patients.length,
        new_patients_last_30_days: 12,
        patients_with_active_appointments: 45,
        patients_with_allergies: 23,
      })
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
    }
  }

  const handleAddPatient = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      setLoading(true)
      await patientService.registerPatient(newPatientForm as any)
      alert('Patient registered successfully!')
      setShowAddDialog(false)
      setNewPatientForm({
        full_name: '',
        NIC: '',
        email: '',
        gender: 'Male',
        DOB: '',
        password: '',
        blood_group: 'O+',
        contact_num1: '',
        contact_num2: '',
        address_line1: '',
        address_line2: '',
        city: '',
        province: 'Western',
        postal_code: '',
        country: 'Sri Lanka',
        registered_branch_name: 'Colombo',
      })
      await fetchPatients()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register patient')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchByNIC = async (nic: string): Promise<void> => {
    if (!nic.trim()) {
      setError('Please enter a NIC')
      return
    }
    try {
      setLoading(true)
      const patient = await patientService.searchByNIC(nic)
      setPatients([patient as any])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Patient not found')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (patient: EnhancedPatient): void => {
    setSelectedPatient(patient)
  }

  const filteredPatients = patients.filter((patient) => {
    const search = searchTerm.toLowerCase()
    return (
      patient.full_name.toLowerCase().includes(search) ||
      patient.NIC.toLowerCase().includes(search) ||
      patient.email.toLowerCase().includes(search)
    )
  })

  const StatCard = ({
    icon: Icon,
    title,
    value,
    description,
    color,
  }: {
    icon: any
    title: string
    value: string | number
    description: string
    color: string
  }) => (
    <Card className={`border-l-4 ${color}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>{title}</span>
          <Icon className="w-4 h-4 opacity-60" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <CardDescription className="text-xs mt-1">{description}</CardDescription>
      </CardContent>
    </Card>
  )

  if (loading && patients.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <EmployeeNavbar
          employeeName="Employee"
          employeeEmail="employee@example.com"
          employeeRole="Staff"
          onLogout={handleLogout}
          onRefresh={handleRefresh}
        />
        <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-background">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-lg text-muted-foreground">Loading patients...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <EmployeeNavbar
        employeeName="Employee"
        employeeEmail="employee@example.com"
        employeeRole="Staff"
        onLogout={handleLogout}
        onRefresh={handleRefresh}
      />
      
      {/* Header */}
      <div className="bg-card sticky top-0 z-40 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center ">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Patient Management</h1>
              <p className="text-muted-foreground mt-1">Manage and view patient records</p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register New Patient</DialogTitle>
                  <DialogDescription>
                    Fill in the patient information below to register a new patient
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddPatient} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        placeholder="John Doe"
                        value={newPatientForm.full_name}
                        onChange={(e) =>
                          setNewPatientForm({
                            ...newPatientForm,
                            full_name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="NIC">NIC Number *</Label>
                      <Input
                        id="NIC"
                        placeholder="199912345678"
                        value={newPatientForm.NIC}
                        onChange={(e) =>
                          setNewPatientForm({ ...newPatientForm, NIC: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={newPatientForm.email}
                        onChange={(e) =>
                          setNewPatientForm({ ...newPatientForm, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Min 8 characters"
                        value={newPatientForm.password}
                        onChange={(e) =>
                          setNewPatientForm({
                            ...newPatientForm,
                            password: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="DOB">Date of Birth *</Label>
                      <Input
                        id="DOB"
                        type="date"
                        value={newPatientForm.DOB}
                        onChange={(e) =>
                          setNewPatientForm({ ...newPatientForm, DOB: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender *</Label>
                      <Select
                        value={newPatientForm.gender}
                        onValueChange={(value) =>
                          setNewPatientForm({
                            ...newPatientForm,
                            gender: value as any,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="blood_group">Blood Group</Label>
                      <Select
                        value={newPatientForm.blood_group}
                        onValueChange={(value) =>
                          setNewPatientForm({
                            ...newPatientForm,
                            blood_group: value as any,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_num1">Contact Number *</Label>
                      <Input
                        id="contact_num1"
                        placeholder="0771234567"
                        value={newPatientForm.contact_num1}
                        onChange={(e) =>
                          setNewPatientForm({
                            ...newPatientForm,
                            contact_num1: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_num2">Secondary Contact</Label>
                      <Input
                        id="contact_num2"
                        placeholder="0711234567"
                        value={newPatientForm.contact_num2}
                        onChange={(e) =>
                          setNewPatientForm({
                            ...newPatientForm,
                            contact_num2: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="address_line1">Address Line 1 *</Label>
                      <Input
                        id="address_line1"
                        placeholder="123 Main Street"
                        value={newPatientForm.address_line1}
                        onChange={(e) =>
                          setNewPatientForm({
                            ...newPatientForm,
                            address_line1: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="Colombo"
                        value={newPatientForm.city}
                        onChange={(e) =>
                          setNewPatientForm({ ...newPatientForm, city: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code *</Label>
                      <Input
                        id="postal_code"
                        placeholder="00100"
                        value={newPatientForm.postal_code}
                        onChange={(e) =>
                          setNewPatientForm({
                            ...newPatientForm,
                            postal_code: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        'Register Patient'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Users}
              title="Total Patients"
              value={metrics.total_patients}
              description="All registered patients"
              color="border-l-blue-500"
            />
            <StatCard
              icon={TrendingUp}
              title="New Patients"
              value={metrics.new_patients_last_30_days}
              description="Last 30 days"
              color="border-l-green-500"
            />
            <StatCard
              icon={Calendar}
              title="Active Appointments"
              value={metrics.patients_with_active_appointments}
              description="Scheduled patients"
              color="border-l-amber-500"
            />
            <StatCard
              icon={AlertTriangle}
              title="With Allergies"
              value={metrics.patients_with_allergies}
              description="Alert on file"
              color="border-l-red-500"
            />
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general" className="w-full">
              <TabsList>
                <TabsTrigger value="general">General Search</TabsTrigger>
                <TabsTrigger value="nic">Search by NIC</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, NIC, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('')
                      fetchPatients()
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="nic" className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Input
                    id="nicSearch"
                    placeholder="Enter NIC number..."
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      const nicInput = document.getElementById(
                        'nicSearch'
                      ) as HTMLInputElement
                      handleSearchByNIC(nicInput.value)
                    }}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Patients List</CardTitle>
            <CardDescription>
              {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">No patients found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>NIC</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Blood Group</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.full_name}</TableCell>
                        <TableCell>{patient.NIC}</TableCell>
                        <TableCell>{patient.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{patient.blood_group}</Badge>
                        </TableCell>
                        <TableCell>{patient.registered_branch_name}</TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(patient)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-96 overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Patient Details</DialogTitle>
                              </DialogHeader>
                              {selectedPatient && (
                                <div className="space-y-6">
                                  <div>
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                      <Heart className="w-4 h-4" />
                                      Personal Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="text-muted-foreground">Name</p>
                                        <p className="font-medium">{selectedPatient.full_name}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">NIC</p>
                                        <p className="font-medium">{selectedPatient.NIC}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Email</p>
                                        <p className="font-medium">{selectedPatient.email}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Gender</p>
                                        <p className="font-medium">{selectedPatient.gender}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Date of Birth</p>
                                        <p className="font-medium">
                                          {new Date(selectedPatient.DOB).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Blood Group</p>
                                        <p className="font-medium">{selectedPatient.blood_group}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="font-semibold mb-4">Contact Information</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="text-muted-foreground">Primary Contact</p>
                                        <p className="font-medium">{selectedPatient.contact_num1}</p>
                                      </div>
                                      {selectedPatient.contact_num2 && (
                                        <div>
                                          <p className="text-muted-foreground">Secondary Contact</p>
                                          <p className="font-medium">{selectedPatient.contact_num2}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="font-semibold mb-4">Address</h3>
                                    <div className="text-sm space-y-1">
                                      <p>{selectedPatient.address_line1}</p>
                                      {selectedPatient.address_line2 && (
                                        <p>{selectedPatient.address_line2}</p>
                                      )}
                                      <p>
                                        {selectedPatient.city}, {selectedPatient.province}{' '}
                                        {selectedPatient.postal_code}
                                      </p>
                                      <p>{selectedPatient.country}</p>
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="font-semibold mb-2">Status</h3>
                                    <Badge
                                      variant={selectedPatient.is_active ? 'default' : 'secondary'}
                                    >
                                      {selectedPatient.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
