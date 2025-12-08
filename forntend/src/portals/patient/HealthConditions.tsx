import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react'
import conditionsService from '@/services/conditionService'
import authService from '@/services/authService'
import '@/index.css'

interface Allergy {
  patient_allergy_id: string
  allergy_name: string
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Life-threatening'
  reaction_description?: string
  diagnosed_date?: string
}

interface Condition {
  patient_id: string
  condition_id: string
  condition_name: string
  category_name: string
  current_status: 'Active' | 'In Treatment' | 'Managed' | 'Resolved'
  is_chronic: boolean
  severity?: string
  diagnosed_date?: string
  condition_description?: string
  notes?: string
}

interface SelectedItem {
  type: 'allergy' | 'condition'
  data: Allergy | Condition
}

type TabType = 'all' | 'conditions' | 'allergies'

const SEVERITY_BADGE_STYLES: Record<string, string> = {
  Mild: 'bg-blue-100 text-blue-900',
  Moderate: 'bg-amber-100 text-amber-900',
  Severe: 'bg-orange-100 text-orange-900',
  'Life-threatening': 'bg-red-100 text-red-900',
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  Active: 'bg-amber-100 text-amber-900',
  'In Treatment': 'bg-blue-100 text-blue-900',
  Managed: 'bg-emerald-100 text-emerald-900',
  Resolved: 'bg-gray-100 text-gray-900',
}

export default function HealthConditions(): React.ReactElement {
  const navigate = useNavigate()
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [allergies, setAllergies] = useState<Allergy[]>([])
  const [conditions, setConditions] = useState<Condition[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)

  const currentUser = authService.getCurrentUser()
  const patientId = currentUser?.patientId || localStorage.getItem('patientId')

  useEffect(() => {
    if (!patientId) {
      navigate('/patient-login')
      return
    }
    fetchHealthData()
  }, [patientId, navigate])

  const fetchHealthData = async (): Promise<void> => {
    try {
      setLoading(true)
      setError('')

      const [allergiesData, conditionsData] = await Promise.all([
        conditionsService.getPatientAllergies(patientId),
        conditionsService.getPatientConditions(patientId, false),
      ])

      setAllergies(allergiesData.allergies || [])
      setConditions(conditionsData.conditions || [])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load health conditions'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityBadgeStyle = (severity: string): string => {
    return SEVERITY_BADGE_STYLES[severity] || SEVERITY_BADGE_STYLES.Mild
  }

  const getStatusBadgeStyle = (status: string): string => {
    return STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.Active
  }

  const chronicConditionsCount = conditions.filter((c) => c.is_chronic).length
  const activeConditionsCount = conditions.filter(
    (c) => c.current_status === 'Active' || c.current_status === 'In Treatment'
  ).length

  const totalItems = allergies.length + conditions.length

  const renderAllergies = (): React.ReactElement => (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">🤧 Allergies</h2>
      {allergies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-muted-foreground">No known allergies recorded</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allergies.map((allergy) => (
            <button
              key={allergy.patient_allergy_id}
              onClick={() => setSelectedItem({ type: 'allergy', data: allergy })}
              className="text-left"
            >
              <Card className="h-full hover:shadow-lg hover:border-primary transition-all cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex gap-4 mb-4">
                    <div className="text-4xl">🤧</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {allergy.allergy_name}
                      </h3>
                      <span
                        className={`inline-block text-xs font-bold px-3 py-1 rounded-full mt-2 ${getSeverityBadgeStyle(
                          allergy.severity
                        )}`}
                      >
                        {allergy.severity}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {allergy.reaction_description && (
                      <div>
                        <p className="text-muted-foreground">Reaction</p>
                        <p className="text-foreground">{allergy.reaction_description}</p>
                      </div>
                    )}
                    {allergy.diagnosed_date && (
                      <div>
                        <p className="text-muted-foreground">Diagnosed</p>
                        <p className="text-foreground">
                          {new Date(allergy.diagnosed_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const renderConditions = (): React.ReactElement => (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">🏥 Medical Conditions</h2>
      {conditions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-muted-foreground">No medical conditions recorded</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {conditions.map((condition) => (
            <button
              key={`${condition.patient_id}-${condition.condition_id}`}
              onClick={() => setSelectedItem({ type: 'condition', data: condition })}
              className="text-left"
            >
              <Card className="h-full hover:shadow-lg hover:border-primary transition-all cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex gap-4 mb-4">
                    <div className="text-4xl">{condition.is_chronic ? '⚠️' : '🏥'}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {condition.condition_name}
                      </h3>
                      <span
                        className={`inline-block text-xs font-bold px-3 py-1 rounded-full mt-2 ${getStatusBadgeStyle(
                          condition.current_status
                        )}`}
                      >
                        {condition.current_status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {condition.category_name}
                    </span>
                    {condition.is_chronic && (
                      <span className="text-xs bg-amber-100 text-amber-900 px-2 py-1 rounded font-semibold">
                        Chronic
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {condition.diagnosed_date && (
                      <div>
                        <p className="text-muted-foreground">Diagnosed</p>
                        <p className="text-foreground">
                          {new Date(condition.diagnosed_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                    {condition.severity && (
                      <div>
                        <p className="text-muted-foreground">Severity</p>
                        <p className="text-foreground">{condition.severity}</p>
                      </div>
                    )}
                    {condition.notes && (
                      <div>
                        <p className="text-muted-foreground">Notes</p>
                        <p className="text-foreground line-clamp-2">{condition.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border sticky top-0 bg-card z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/patient/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Health Conditions</h1>
          <div className="w-24"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🤧</div>
                <div>
                  <p className="text-3xl font-bold text-primary">{allergies.length}</p>
                  <p className="text-sm text-muted-foreground">Known Allergies</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🏥</div>
                <div>
                  <p className="text-3xl font-bold text-primary">{conditions.length}</p>
                  <p className="text-sm text-muted-foreground">Medical Conditions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">⚠️</div>
                <div>
                  <p className="text-3xl font-bold text-primary">{chronicConditionsCount}</p>
                  <p className="text-sm text-muted-foreground">Chronic Conditions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">✅</div>
                <div>
                  <p className="text-3xl font-bold text-primary">{activeConditionsCount}</p>
                  <p className="text-sm text-muted-foreground">Active Conditions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8">
          {(['all', 'conditions', 'allergies'] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab)}
              className="flex-1"
            >
              {tab === 'all' && `📋 All (${totalItems})`}
              {tab === 'conditions' && `🏥 Medical (${conditions.length})`}
              {tab === 'allergies' && `🤧 Allergies (${allergies.length})`}
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading health conditions...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <p>{error}</p>
                <Button size="sm" onClick={fetchHealthData} variant="outline">
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Content */}
        {!loading && !error && (
          <div className="space-y-12">
            {(activeTab === 'all' || activeTab === 'allergies') && renderAllergies()}
            {(activeTab === 'all' || activeTab === 'conditions') && renderConditions()}
          </div>
        )}

        {/* Detail Modal */}
        {selectedItem && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedItem(null)}
          >
            <Card
              className="w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedItem.type === 'allergy' ? '🤧' : '🏥'}
                  {selectedItem.type === 'allergy' ? 'Allergy Details' : 'Condition Details'}
                </CardTitle>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </CardHeader>

              <CardContent className="space-y-6">
                {selectedItem.type === 'allergy' ? (
                  <>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Allergen</h3>
                      <p className="text-muted-foreground">
                        {(selectedItem.data as Allergy).allergy_name}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Severity</h3>
                      <span
                        className={`inline-block text-xs font-bold px-4 py-2 rounded-full ${getSeverityBadgeStyle(
                          (selectedItem.data as Allergy).severity
                        )}`}
                      >
                        {(selectedItem.data as Allergy).severity}
                      </span>
                    </div>

                    {(selectedItem.data as Allergy).reaction_description && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Reaction</h3>
                        <p className="text-muted-foreground">
                          {(selectedItem.data as Allergy).reaction_description}
                        </p>
                      </div>
                    )}

                    {(selectedItem.data as Allergy).diagnosed_date && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Diagnosed</h3>
                        <p className="text-muted-foreground">
                          {new Date(
                            (selectedItem.data as Allergy).diagnosed_date!
                          ).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Condition</h3>
                      <p className="text-muted-foreground">
                        {(selectedItem.data as Condition).condition_name}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Category</h3>
                      <p className="text-muted-foreground">
                        {(selectedItem.data as Condition).category_name}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Status</h3>
                      <span
                        className={`inline-block text-xs font-bold px-4 py-2 rounded-full ${getStatusBadgeStyle(
                          (selectedItem.data as Condition).current_status
                        )}`}
                      >
                        {(selectedItem.data as Condition).current_status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Type</h3>
                      <p className="text-muted-foreground">
                        {(selectedItem.data as Condition).is_chronic ? 'Chronic' : 'Acute'}
                      </p>
                    </div>

                    {(selectedItem.data as Condition).severity && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Severity</h3>
                        <p className="text-muted-foreground">
                          {(selectedItem.data as Condition).severity}
                        </p>
                      </div>
                    )}

                    {(selectedItem.data as Condition).diagnosed_date && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Diagnosed</h3>
                        <p className="text-muted-foreground">
                          {new Date(
                            (selectedItem.data as Condition).diagnosed_date!
                          ).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    )}

                    {(selectedItem.data as Condition).condition_description && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Description</h3>
                        <p className="text-muted-foreground">
                          {(selectedItem.data as Condition).condition_description}
                        </p>
                      </div>
                    )}

                    {(selectedItem.data as Condition).notes && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Medical Notes</h3>
                        <p className="text-muted-foreground">
                          {(selectedItem.data as Condition).notes}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}