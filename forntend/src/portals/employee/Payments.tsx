import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Calendar,
  FileText,
  Phone,
  Users,
  Clock,
} from 'lucide-react'
import patientService from '@/services/patientService'
import billingService from '@/services/billingService'
import EmployeeNavbar from '@/portals/employee/Navbar'

interface Patient {
  patient_id: string
  id?: string
  full_name: string
  NIC: string
  contact_num1: string
  email?: string
}

interface Payment {
  payment_id: string
  patient_id: string
  amount_paid: number | string
  payment_method: string
  payment_date: string
  status: 'Completed' | 'Pending' | 'Failed' | 'Refunded'
  notes?: string
  created_at?: string
}

interface PaymentStats {
  total: number
  today: number
  count: number
}

export default function EmployeePayments(): React.ReactElement {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Patient search
  const [patientSearch, setPatientSearch] = useState('')
  const [allPatients, setAllPatients] = useState<Patient[]>([])
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  // Payment form
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  // Payment history
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    total: 0,
    today: 0,
    count: 0,
  })

  const handleLogout = (): void => {
    localStorage.removeItem('auth_token')
    window.location.href = '/employee-login'
  }

  const handleRefresh = useCallback(async (): Promise<void> => {
    await fetchRecentPayments()
  }, [])

  useEffect(() => {
    void fetchPatients()
    void fetchRecentPayments()
  }, [])

  // Update search results
  useEffect(() => {
    if (patientSearch.trim().length < 2) {
      setSearchResults([])
      return
    }

    const filtered = allPatients.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.NIC?.includes(patientSearch) ||
        p.patient_id?.includes(patientSearch) ||
        p.email?.toLowerCase().includes(patientSearch.toLowerCase())
    )
    setSearchResults(filtered.slice(0, 10))
  }, [patientSearch, allPatients])

  const fetchPatients = async (): Promise<void> => {
    setLoading(true)
    try {
      const data = await patientService.getAllPatients(0, 1000)
      setAllPatients(data.patients || [])
    } catch (err) {
      console.error('Error fetching patients:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentPayments = async (): Promise<void> => {
    try {
      const data = await billingService.getAllPayments(0, 50)
      const payments = data.payments || []
      setRecentPayments(payments)

      // Calculate stats
      const today = new Date().toISOString().split('T')[0]
      const completedPayments = payments.filter((p) => p.status === 'Completed')
      const todayPayments = completedPayments.filter((p) => p.payment_date === today)

      const totalAmount = completedPayments.reduce(
        (sum, p) => sum + (typeof p.amount_paid === 'string' ? parseFloat(p.amount_paid) : p.amount_paid),
        0
      )
      const todayAmount = todayPayments.reduce(
        (sum, p) => sum + (typeof p.amount_paid === 'string' ? parseFloat(p.amount_paid) : p.amount_paid),
        0
      )

      setPaymentStats({
        total: totalAmount,
        today: todayAmount,
        count: completedPayments.length,
      })
    } catch (err) {
      console.error('Error fetching payments:', err)
    }
  }

  const selectPatient = (patient: Patient): void => {
    setSelectedPatient(patient)
    setPatientSearch(patient.full_name)
    setSearchResults([])
  }

  const handleSubmitPayment = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!selectedPatient) {
      setError('Please select a patient')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    try {
      setProcessingPayment(true)
      setError('')
      setSuccess('')

      const paymentData = {
        patient_id: selectedPatient.patient_id || selectedPatient.id || '',
        amount_paid: parseFloat(amount),
        payment_method: paymentMethod,
        payment_date: paymentDate,
        notes: notes || 'Payment recorded by employee',
      }

      const response = await billingService.createPayment(paymentData)

      if (response) {
        setSuccess(`✅ Payment of LKR ${parseFloat(amount).toLocaleString()} recorded successfully!`)

        // Reset form
        setSelectedPatient(null)
        setPatientSearch('')
        setAmount('')
        setNotes('')
        setPaymentMethod('Cash')
        setPaymentDate(new Date().toISOString().split('T')[0])

        // Refresh payment history
        await fetchRecentPayments()

        // Auto-hide success
        setTimeout(() => setSuccess(''), 5000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setProcessingPayment(false)
    }
  }

  const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(num || 0)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const StatCard = ({
    icon: Icon,
    title,
    value,
    description,
    variant = 'default',
  }: {
    icon: React.ReactNode
    title: string
    value: string | number
    description: string
    variant?: 'default' | 'success' | 'warning' | 'info'
  }) => {
    const variants = {
      default: 'bg-blue-50 border-l-blue-500',
      success: 'bg-green-50 border-l-green-500',
      warning: 'bg-amber-50 border-l-amber-500',
      info: 'bg-cyan-50 border-l-cyan-500',
    }

    return (
      <Card className={`border-l-4 ${variants[variant]}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>{title}</span>
            {Icon}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <CardDescription className="text-xs mt-1">{description}</CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <EmployeeNavbar
        employeeName="Staff"
        employeeEmail="staff@clinic.com"
        employeeRole="Payment Handler"
        onLogout={handleLogout}
        onRefresh={handleRefresh}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            Patient Payments
          </h1>
          <p className="text-slate-600 mt-2">Record and manage patient payments</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-blue-600" />}
            title="Total Payments"
            value={formatCurrency(paymentStats.total)}
            description={`${paymentStats.count} completed transactions`}
            variant="default"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            title="Today's Collection"
            value={formatCurrency(paymentStats.today)}
            description={`As of ${new Date().toLocaleDateString()}`}
            variant="success"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            title="Recent Payments"
            value={recentPayments.length}
            description="Last 50 transactions"
            variant="warning"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Record Payment
                </CardTitle>
                <CardDescription>Enter payment details below</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  {/* Patient Search */}
                  <div className="space-y-2">
                    <Label htmlFor="patient">Patient *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                      <Input
                        id="patient"
                        placeholder="Search by name, NIC, or ID..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {searchResults.map((patient) => (
                          <div
                            key={patient.patient_id || patient.id}
                            onClick={() => selectPatient(patient)}
                            className="p-3 border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <div className="font-medium text-slate-900">{patient.full_name}</div>
                            <div className="text-xs text-slate-600">
                              NIC: {patient.NIC} • {patient.contact_num1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Patient */}
                  {selectedPatient && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-xs text-slate-600">Selected Patient:</div>
                      <div className="font-semibold text-slate-900">{selectedPatient.full_name}</div>
                      <div className="text-xs text-slate-600">{selectedPatient.NIC}</div>
                    </div>
                  )}

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (LKR) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label htmlFor="method">Payment Method *</Label>
                    <select
                      id="method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
                    >
                      <option value="Cash">💵 Cash</option>
                      <option value="Credit Card">💳 Credit Card</option>
                      <option value="Debit Card">💳 Debit Card</option>
                      <option value="Online">📱 Online Payment</option>
                      <option value="Insurance">🏥 Insurance</option>
                      <option value="Other">📋 Other</option>
                    </select>
                  </div>

                  {/* Payment Date */}
                  <div className="space-y-2">
                    <Label htmlFor="date">Payment Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes about this payment..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-20"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={processingPayment || !selectedPatient}
                    className="w-full"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Record Payment
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Recent Payments Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Recent Payments
                </CardTitle>
                <CardDescription>Latest transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-2" />
                    <p className="text-slate-600">Loading payments...</p>
                  </div>
                ) : recentPayments.length === 0 ? (
                  <div className="py-12 text-center">
                    <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-100">
                        <TableRow>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentPayments.slice(0, 10).map((payment) => (
                          <TableRow key={payment.payment_id}>
                            <TableCell className="font-semibold text-green-600">
                              {formatCurrency(payment.amount_paid)}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {payment.payment_method}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {formatDate(payment.payment_date)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  payment.status === 'Completed'
                                    ? 'default'
                                    : payment.status === 'Pending'
                                      ? 'secondary'
                                      : 'destructive'
                                }
                              >
                                {payment.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {recentPayments.length > 10 && (
                      <div className="p-4 bg-slate-50 text-center text-sm text-slate-600 border-t">
                        Showing 10 of {recentPayments.length} payments
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}