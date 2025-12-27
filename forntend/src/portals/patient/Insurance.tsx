import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  ArrowLeft, 
  Loader2, 
  Package, 
  AlertCircle,
  Check,
  Clock,
  TrendingUp,
  Shield,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import InsuranceService, {
  type PatientInsurance,
  type InsurancePackage,
} from '@/services/insuranceService';
import authService from '@/services/authService';
import PatientProfileService, { type PatientProfile } from '@/services/patientProfileService'

// ===== TYPES =====

interface SelectedItem {
  type: 'insurance' | 'package';
  data: PatientInsurance | InsurancePackage;
}

// ===== UTILITY FUNCTIONS =====

const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const colors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Active': 'default',
    'Inactive': 'secondary',
    'Expired': 'destructive',
    'Pending': 'outline'
  };
  return colors[status] || 'secondary';
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Active':
      return <Check className="w-4 h-4 text-green-600" />;
    case 'Expired':
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case 'Pending':
      return <Clock className="w-4 h-4 text-yellow-600" />;
    default:
      return <Shield className="w-4 h-4 text-gray-600" />;
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2
  }).format(amount);
};

const calculateDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const today = new Date();
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// ===== MAIN COMPONENT =====

export default function PatientInsurance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myInsurances, setMyInsurances] = useState<PatientInsurance[]>([]);
  const [availablePackages, setAvailablePackages] = useState<InsurancePackage[]>([]);
  const [activeTab, setActiveTab] = useState('my-insurance');
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [expiringInsurances, setExpiringInsurances] = useState<PatientInsurance[]>([]);

  const currentUser = authService.getCurrentUser();
  const patientId = currentUser?.userId || localStorage.getItem('userId');

  // Profile state
  const [profile, setProfile] = useState<PatientProfile | null>(null)


  const fetchProfile = useCallback(async () => {
    try {
      if (!patientId) return
      const profileData = await PatientProfileService.getPatientProfile(patientId)
      setProfile(profileData)
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }, [patientId])

  const fetchInsuranceData = useCallback(async () => {
    try {
      setError(null);
      
      if (!patientId) return;

      console.log('💼 Fetching insurance data for patient:', patientId);

      const [insurancesData, packagesData] = await Promise.all([
        InsuranceService.getPatientInsurances(patientId),
        InsuranceService.getAllPackages(0, 100, true)
      ]);

      setMyInsurances(insurancesData.insurances || []);
      setAvailablePackages(packagesData.packages || []);

      // Fetch expiring insurances
      const expiring = await InsuranceService.getExpiringInsurances(patientId, 30);
      setExpiringInsurances(expiring);

      console.log('✅ Insurance data fetched successfully');
    } catch (err) {
      console.error('❌ Error fetching insurance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insurance information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!patientId) {
      navigate('/patient-login');
      return;
    }
    setLoading(true);
    fetchProfile();
    fetchInsuranceData();
  }, [patientId, navigate, fetchProfile, fetchInsuranceData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchInsuranceData()]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      authService.logout()
      navigate('/')
    }
  };

  const activeInsuranceCount = myInsurances.filter(i => i.status === 'Active').length;
  const totalAnnualLimit = myInsurances
    .filter(i => i.status === 'Active')
    .reduce((sum, i) => sum + i.annual_limit, 0);
  
  const hasExpiringCoverage = expiringInsurances.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
        {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pd-4 justify-between mb">
          <div>
          <h1 className="text-3xl font-bold text-foreground">Insurance Plans</h1>
          <p className="text-muted-foreground mt-2">View and manage your insurance coverage</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Expiring Alert */}
        {hasExpiringCoverage && (
          <Alert variant="destructive" className="mb-6 bg-amber-50 border-amber-200 text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <strong>{expiringInsurances.length} insurance{expiringInsurances.length !== 1 ? 's' : ''} expiring soon!</strong> Renew your coverage to avoid gaps in protection.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Plans</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{myInsurances.length}</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Active</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{activeInsuranceCount}</p>
                </div>
                <div className="p-3 bg-green-200 rounded-lg">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Available</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{availablePackages.length}</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-lg">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Coverage</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    {totalAnnualLimit > 0 ? formatCurrency(totalAnnualLimit) : 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-amber-200 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Alert */}
        {error && !loading && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchInsuranceData}
                  className="ml-4"
                >
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="border-0 shadow-md">
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Loading insurance information...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {!loading && !error && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 p-1 rounded-lg">
              <TabsTrigger value="my-insurance" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Shield className="w-4 h-4" />
                My Plans ({myInsurances.length})
              </TabsTrigger>
              <TabsTrigger value="packages" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Package className="w-4 h-4" />
                Available ({availablePackages.length})
              </TabsTrigger>
            </TabsList>

            {/* My Insurance Tab */}
            <TabsContent value="my-insurance" className="space-y-6">
              {myInsurances.length === 0 ? (
                <Card className="border-dashed border-2 shadow-none">
                  <CardContent className="py-16 text-center">
                    <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                      <Package className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No Active Coverage</h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      You don't have any insurance plans. Browse available packages to get protected.
                    </p>
                    <Button 
                      onClick={() => setActiveTab('packages')}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      View Available Packages
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myInsurances.map((insurance) => {
                    const daysRemaining = calculateDaysRemaining(insurance.end_date);
                    const isExpiringSoon = daysRemaining < 30 && daysRemaining > 0;
                    const isExpired = daysRemaining <= 0;

                    return (
                      <Card 
                        key={insurance.insurance_id}
                        className={`cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 border-l-4 ${
                          isExpired ? 'border-l-red-500' : isExpiringSoon ? 'border-l-amber-500' : 'border-l-green-500'
                        }`}
                        onClick={() => setSelectedItem({ type: 'insurance', data: insurance })}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{insurance.package_name}</CardTitle>
                              <CardDescription className="text-xs mt-1">
                                Since {formatDate(insurance.start_date)}
                              </CardDescription>
                            </div>
                            <Badge variant={getStatusColor(insurance.status)} className="ml-2">
                              <span className="inline-block mr-1">{getStatusIcon(insurance.status)}</span>
                              {insurance.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <Separator />
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <span className="text-xs text-slate-600 font-medium">Annual Limit</span>
                            <span className="font-bold text-slate-900">{formatCurrency(insurance.annual_limit)}</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <span className="text-xs text-slate-600 font-medium">Copayment</span>
                            <span className="font-bold text-slate-900">{insurance.copayment_percentage}%</span>
                          </div>
                          {insurance.status === 'Active' && (
                            <div className={`flex items-center justify-between p-2 rounded ${
                              isExpiringSoon ? 'bg-amber-50' : isExpired ? 'bg-red-50' : 'bg-green-50'
                            }`}>
                              <span className="text-xs text-slate-600 font-medium">Days Remaining</span>
                              <span className={`font-bold ${isExpiringSoon ? 'text-amber-600' : isExpired ? 'text-red-600' : 'text-green-600'}`}>
                                {isExpired ? 'Expired' : `${daysRemaining} days`}
                              </span>
                            </div>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2 group"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem({ type: 'insurance', data: insurance });
                            }}
                          >
                            View Details
                            <ChevronRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Available Packages Tab */}
            <TabsContent value="packages" className="space-y-6">
              {availablePackages.length === 0 ? (
                <Card className="border-dashed border-2 shadow-none">
                  <CardContent className="py-16 text-center">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">No packages available currently</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availablePackages.map((pkg) => (
                    <Card 
                      key={pkg.insurance_package_id}
                      className="cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group"
                      onClick={() => setSelectedItem({ type: 'package', data: pkg })}
                    >
                      <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                      <CardHeader>
                        <div>
                          <CardTitle className="text-lg">{pkg.package_name}</CardTitle>
                          <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-2xl font-bold text-purple-600">{formatCurrency(pkg.annual_limit).split('.')[0]}</span>
                            <span className="text-sm text-slate-500">/year</span>
                          </div>
                        </div>
                      </CardHeader>
                      <Separator />
                      <CardContent className="pt-4 space-y-3">
                        {pkg.description && (
                          <p className="text-sm text-slate-600">{pkg.description}</p>
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>Coverage: {formatCurrency(pkg.annual_limit)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>Copayment: {pkg.copayment_percentage}%</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>All clinics included</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>Comprehensive coverage</span>
                          </div>
                        </div>

                        <Button 
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white group"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem({ type: 'package', data: pkg });
                          }}
                        >
                          View & Enroll
                          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          {!selectedItem ? null : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedItem.type === 'insurance' ? (
                    <>
                      <Shield className="w-5 h-5 text-blue-600" />
                      Insurance Details
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5 text-purple-600" />
                      Package Details
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>
                  Complete information about {selectedItem.data.package_name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                {selectedItem.type === 'insurance' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-xs text-slate-600 font-semibold mb-1">Status</p>
                        <Badge variant={getStatusColor(selectedItem.data.status)}>
                          {selectedItem.data.status}
                        </Badge>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-xs text-slate-600 font-semibold mb-1">Annual Limit</p>
                        <p className="font-bold text-lg">{formatCurrency(selectedItem.data.annual_limit)}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Validity Period
                      </h3>
                      <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Start Date</span>
                          <span className="font-medium">{formatDate(selectedItem.data.start_date)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">End Date</span>
                          <span className="font-medium">{formatDate(selectedItem.data.end_date)}</span>
                        </div>
                        {selectedItem.data.status === 'Active' && (
                          <>
                            <Separator />
                            <div className="flex justify-between">
                              <span className="text-sm text-slate-600">Days Remaining</span>
                              <span className="font-medium">{calculateDaysRemaining(selectedItem.data.end_date)} days</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-3">Coverage Details</h3>
                      <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Copayment</span>
                          <span className="font-medium">{selectedItem.data.copayment_percentage}%</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Insurance ID</span>
                          <code className="text-xs bg-white px-2 py-1 rounded">{selectedItem.data.insurance_id}</code>
                        </div>
                      </div>
                    </div>

                    {selectedItem.data.package_description && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Description</h3>
                        <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
                          {selectedItem.data.package_description}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-xs text-slate-600 font-semibold mb-1">Annual Coverage</p>
                        <p className="font-bold text-lg">{formatCurrency(selectedItem.data.annual_limit)}</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-xs text-slate-600 font-semibold mb-1">Copayment</p>
                        <p className="font-bold text-lg">{selectedItem.data.copayment_percentage}%</p>
                      </div>
                    </div>

                    {selectedItem.data.description && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Package Description</h3>
                        <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
                          {selectedItem.data.description}
                        </p>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Benefits Included
                      </h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">Comprehensive medical coverage up to {formatCurrency(selectedItem.data.annual_limit)}</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">Access to all clinic facilities and services</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">Coverage for consultations and treatments</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">You pay only {selectedItem.data.copayment_percentage}% copayment</span>
                        </li>
                        <li className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">24/7 support and claim assistance</span>
                        </li>
                      </ul>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-11 text-base"
                      onClick={() => {
                        setSelectedItem(null);
                        alert('Please contact our staff to enroll in this package');
                      }}
                    >
                      Request Enrollment
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}