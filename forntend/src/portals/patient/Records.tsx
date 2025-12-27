import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  Calendar,
  FileText,
  Pill,
  Stethoscope
} from 'lucide-react'
import authService from '@/services/authService'
import PatientProfileService, { type PatientProfile } from '@/services/patientProfileService'
import consultationService, {
  type ConsultationSummary,
} from '@/services/consultationService'
import treatmentService, { type Treatment } from '@/services/treatmentService'

interface MedicalRecord {
  id: string
  date: string
  type: 'Consultation' | 'Prescription' | 'Treatment'
  doctor: string
  description: string
  details: unknown
}

export default function PatientMedicalRecords(): React.ReactElement {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'all' | 'prescriptions' | 'treatments'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [refreshing, setRefreshing] = useState(false)

  // Medical records state
  const [consultations, setConsultations] = useState<MedicalRecord[]>([])
  const [prescriptions, setPrescriptions] = useState<MedicalRecord[]>([])
  const [treatments, setTreatments] = useState<MedicalRecord[]>([])
  const [allRecords, setAllRecords] = useState<MedicalRecord[]>([])

  // Dialog state
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  // Profile state
  const [profile, setProfile] = useState<PatientProfile | null>(null)

  // Get patient ID
  const currentUser = authService.getCurrentUser()
  const patientId = currentUser?.userId || localStorage.getItem('userId')

  const fetchProfile = useCallback(async () => {
    try {
      if (!patientId) return
      const profileData = await PatientProfileService.getPatientProfile(patientId)
      setProfile(profileData)
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }, [patientId])

  const fetchMedicalRecords = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      if (!patientId) return

      // Fetch patient history
      const historyResponse = await consultationService.getPatientHistory(patientId)
      const consultationSummaries = historyResponse.consultations || []

      // Fetch full details and treatments for each consultation
      const consultationRecords: MedicalRecord[] = []
      const prescriptionRecords: MedicalRecord[] = []
      const treatmentRecords: MedicalRecord[] = []

      for (const consultation of consultationSummaries) {
        try {
          const details = await consultationService.getConsultationById(
            consultation.consultation_rec_id
          )

          // Add as consultation record
          consultationRecords.push({
            id: consultation.consultation_rec_id,
            date: consultation.available_date,
            type: 'Consultation',
            doctor: consultation.doctor_name || 'N/A',
            description: consultation.diagnoses || 'Medical consultation',
            details: details.consultation,
          })

          // Add prescriptions if any
          if (details.prescription_items && details.prescription_items.length > 0) {
            prescriptionRecords.push({
              id: `rx-${consultation.consultation_rec_id}`,
              date: consultation.available_date,
              type: 'Prescription',
              doctor: consultation.doctor_name || 'N/A',
              description: `${details.prescription_items.length} medication(s) prescribed`,
              details: details.prescription_items,
            })
          }

          // Add treatments if any
          if (details.treatments && details.treatments.length > 0) {
            details.treatments.forEach((treatment, index) => {
              treatmentRecords.push({
                id: `tx-${treatment.treatment_id || index}`,
                date: treatment.created_at || consultation.available_date,
                type: 'Treatment',
                doctor: 'N/A',
                description: treatment.treatment_name || 'Treatment procedure',
                details: treatment,
              })
            })
          }
        } catch (err) {
          console.error(`Error fetching details for consultation ${consultation.consultation_rec_id}:`, err)
        }
      }

      setConsultations(consultationRecords)
      setPrescriptions(prescriptionRecords)
      setTreatments(treatmentRecords)

      // Combine and sort all records by date
      const combined = [...consultationRecords, ...prescriptionRecords, ...treatmentRecords].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      setAllRecords(combined)
    } catch (err) {
      console.error('❌ Error fetching medical records:', err)
      setError('Failed to load medical records. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    if (!patientId) {
      navigate('/patient-login')
      return
    }
    fetchProfile()
    fetchMedicalRecords()
  }, [patientId, navigate, fetchProfile, fetchMedicalRecords])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchProfile(), fetchMedicalRecords()])
    setRefreshing(false)
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      authService.logout()
      navigate('/')
    }
  }

  const getFilteredRecords = (): MedicalRecord[] => {
    switch (activeTab) {
      case 'prescriptions':
        return prescriptions
      case 'treatments':
        return treatments
      default:
        return allRecords
    }
  }

  const handleRecordClick = (record: MedicalRecord) => {
    setSelectedRecord(record)
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setSelectedRecord(null)
  }

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'Consultation':
        return <Stethoscope className="h-5 w-5" />
      case 'Prescription':
        return <Pill className="h-5 w-5" />
      case 'Treatment':
        return <FileText className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getRecordColor = (type: string) => {
    switch (type) {
      case 'Consultation':
        return 'bg-blue-100 text-blue-800'
      case 'Prescription':
        return 'bg-amber-100 text-amber-800'
      case 'Treatment':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const records = getFilteredRecords()

  if (error && loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
              <h2 className="text-xl font-bold">Error Loading Records</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={handleRefresh} className="w-full">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Medical Records</h1>
            <p className="text-muted-foreground mt-2">View your consultations, prescriptions, and treatments</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && !loading && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading medical records...</p>
            </CardContent>
          </Card>
        )}

        {!loading && (
          <Card>
            <CardHeader>
              <CardTitle>Your Medical Records</CardTitle>
              <CardDescription>
                {records.length} record{records.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as typeof activeTab)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">
                    All Records <Badge variant="secondary" className="ml-2">{allRecords.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="prescriptions">
                    Prescriptions <Badge variant="secondary" className="ml-2">{prescriptions.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="treatments">
                    Treatments <Badge variant="secondary" className="ml-2">{treatments.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                {/* Content */}
                <TabsContent value={activeTab} className="mt-6 space-y-4">
                  {records.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Records Found</h3>
                      <p className="text-muted-foreground">
                        You don't have any {activeTab === 'all' ? 'medical records' : activeTab} yet.
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-auto">
                      <div className="space-y-4 pr-4">
                        {records.map((record) => (
                          <div
                            key={record.id}
                            onClick={() => handleRecordClick(record)}
                            className="p-4 border border-border rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className={`p-2 rounded-lg ${getRecordColor(record.type)} flex-shrink-0`}>
                                  {getRecordIcon(record.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {record.description}
                                  </h4>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(record.date).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{record.doctor}</span>
                                  </div>
                                </div>
                              </div>
                              <Badge className="flex-shrink-0 ml-2">{record.type}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Record Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRecord && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getRecordIcon(selectedRecord.type)}
                  {selectedRecord.description}
                </DialogTitle>
                <DialogDescription>
                  {new Date(selectedRecord.date).toLocaleDateString()} • Dr. {selectedRecord.doctor}
                </DialogDescription>
              </DialogHeader>

              <Separator />

              {/* Prescription Details */}
              {selectedRecord.type === 'Prescription' && Array.isArray(selectedRecord.details) && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Pill className="h-5 w-5" />
                      Prescribed Medications
                    </h3>
                    <div className="space-y-3">
                      {(selectedRecord.details as any[]).map((med, idx) => (
                        <Card key={idx} className="bg-amber-50 border-amber-200">
                          <CardContent className="pt-4">
                            <h4 className="font-semibold text-foreground mb-2">{med.generic_name || 'N/A'}</h4>
                            <p className="text-sm text-muted-foreground mb-3">{med.manufacturer && `by ${med.manufacturer}`}</p>

                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                              <div>
                                <span className="font-medium text-muted-foreground">Form:</span>
                                <p className="text-foreground">{med.form || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Dosage:</span>
                                <p className="text-foreground">{med.dosage || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Frequency:</span>
                                <p className="text-foreground">{med.frequency || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Duration:</span>
                                <p className="text-foreground">{med.duration_days ? `${med.duration_days} days` : 'N/A'}</p>
                              </div>
                            </div>

                            {med.instructions && (
                              <div className="mt-3 pt-3 border-t border-amber-200">
                                <span className="font-medium text-muted-foreground text-sm">📋 Instructions:</span>
                                <p className="text-sm text-foreground mt-1">{med.instructions}</p>
                              </div>
                            )}

                            {med.side_effects && (
                              <div className="mt-3">
                                <span className="font-medium text-muted-foreground text-sm">⚡ Side Effects:</span>
                                <p className="text-sm text-foreground mt-1">{med.side_effects}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Consultation Details */}
              {selectedRecord.type === 'Consultation' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Stethoscope className="h-5 w-5" />
                      Consultation Details
                    </h3>
                    <div className="space-y-3 text-sm">
                      {(selectedRecord.details as any)?.symptoms && (
                        <div>
                          <span className="font-medium text-muted-foreground">Symptoms:</span>
                          <p className="text-foreground mt-1">{(selectedRecord.details as any).symptoms}</p>
                        </div>
                      )}
                      {(selectedRecord.details as any)?.diagnoses && (
                        <div>
                          <span className="font-medium text-muted-foreground">Diagnoses:</span>
                          <p className="text-foreground mt-1">{(selectedRecord.details as any).diagnoses}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Treatment Details */}
              {selectedRecord.type === 'Treatment' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Treatment Details
                    </h3>
                    <div className="space-y-3 text-sm">
                      {(selectedRecord.details as any)?.treatment_name && (
                        <div>
                          <span className="font-medium text-muted-foreground">Treatment:</span>
                          <p className="text-foreground mt-1">{(selectedRecord.details as any).treatment_name}</p>
                        </div>
                      )}
                      {(selectedRecord.details as any)?.base_price && (
                        <div>
                          <span className="font-medium text-muted-foreground">Cost:</span>
                          <p className="text-foreground mt-1">LKR {(selectedRecord.details as any).base_price}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeDialog}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}