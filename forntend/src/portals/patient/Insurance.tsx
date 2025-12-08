import { useState, useEffect } from 'react';
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
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowLeft, Loader2, Package, AlertCircle } from 'lucide-react';
import insuranceService from '../../services/insuranceService';
import authService from '../../services/authService';

// ===== TYPES =====

interface Insurance {
  insurance_id: string;
  package_name: string;
  status: 'Active' | 'Inactive' | 'Expired' | 'Pending';
  annual_limit: number;
  copayment_percentage: number;
  end_date: string;
  start_date: string;
  package_description?: string;
}

interface InsurancePackage {
  insurance_package_id: string;
  package_name: string;
  annual_limit: number;
  copayment_percentage: number;
  description?: string;
}

interface SelectedItem {
  type: 'insurance' | 'package';
  data: Insurance | InsurancePackage;
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

export default function Insurance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myInsurances, setMyInsurances] = useState<Insurance[]>([]);
  const [availablePackages, setAvailablePackages] = useState<InsurancePackage[]>([]);
  const [activeTab, setActiveTab] = useState('my-insurance');
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  const currentUser = authService.getCurrentUser();
  const patientId = currentUser?.patientId || localStorage.getItem('patientId');

  useEffect(() => {
    if (!patientId) {
      navigate('/patient-login');
      return;
    }
    fetchInsuranceData();
  }, [patientId]);

  const fetchInsuranceData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('💼 Fetching insurance data for patient:', patientId);

      const [insurancesData, packagesData] = await Promise.all([
        insuranceService.getPatientInsurances(patientId),
        insuranceService.getAllPackages(0, 100, true)
      ]);

      console.log('✅ Insurance data fetched:', { insurances: insurancesData, packages: packagesData });

      setMyInsurances(insurancesData.insurances || []);
      setAvailablePackages(packagesData.packages || []);
    } catch (err) {
      console.error('❌ Error fetching insurance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insurance information');
    } finally {
      setLoading(false);
    }
  };

  const activeInsuranceCount = myInsurances.filter(i => i.status === 'Active').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/patient/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <h2 className="text-2xl font-bold text-slate-900">Insurance Coverage</h2>
            <div className="w-24" />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <span className="text-2xl">💼</span>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">My Insurance Plans</p>
                  <p className="text-3xl font-bold text-slate-900">{myInsurances.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Active Coverage</p>
                  <p className="text-3xl font-bold text-slate-900">{activeInsuranceCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <span className="text-2xl">📦</span>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Available Packages</p>
                  <p className="text-3xl font-bold text-slate-900">{availablePackages.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Annual Coverage</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {myInsurances.length > 0 && myInsurances[0].annual_limit
                      ? formatCurrency(myInsurances[0].annual_limit)
                      : 'N/A'}
                  </p>
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
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <p className="text-slate-600 font-medium">Loading insurance information...</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="my-insurance" className="flex items-center gap-2">
                <span>💼</span>
                My Insurance ({myInsurances.length})
              </TabsTrigger>
              <TabsTrigger value="packages" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Packages ({availablePackages.length})
              </TabsTrigger>
            </TabsList>

            {/* My Insurance Tab */}
            <TabsContent value="my-insurance" className="space-y-6">
              {myInsurances.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="pt-12 pb-12 text-center">
                    <div className="mb-6">
                      <div className="inline-block p-8 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl mb-6">
                        <span className="text-6xl">💳</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No Insurance Coverage</h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      You don't have any active insurance plans. Browse our available packages to find coverage that fits your needs.
                    </p>
                    <Button 
                      size="lg"
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

                    return (
                      <Card 
                        key={insurance.insurance_id}
                        className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                        onClick={() => setSelectedItem({ type: 'insurance', data: insurance })}
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                              <span className="text-3xl">💼</span>
                            </div>
                            <Badge variant={getStatusColor(insurance.status)}>
                              {insurance.status}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl">{insurance.package_name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start p-3 bg-slate-50 rounded-lg">
                              <span className="text-sm font-medium text-slate-600">Annual Limit</span>
                              <span className="font-bold text-slate-900">{formatCurrency(insurance.annual_limit)}</span>
                            </div>
                            <div className="flex justify-between items-start p-3 bg-slate-50 rounded-lg">
                              <span className="text-sm font-medium text-slate-600">Copayment</span>
                              <span className="font-bold text-slate-900">{insurance.copayment_percentage}%</span>
                            </div>
                            <div className="flex justify-between items-start p-3 bg-slate-50 rounded-lg">
                              <span className="text-sm font-medium text-slate-600">Valid Until</span>
                              <span className="font-bold text-slate-900">{formatDate(insurance.end_date)}</span>
                            </div>
                            {insurance.status === 'Active' && (
                              <div className={`flex justify-between items-start p-3 rounded-lg ${
                                isExpiringSoon 
                                  ? 'bg-amber-50 border border-amber-200' 
                                  : 'bg-slate-50'
                              }`}>
                                <span className="text-sm font-medium text-slate-600">Days Remaining</span>
                                <span className={`font-bold ${isExpiringSoon ? 'text-amber-600' : 'text-slate-900'}`}>
                                  {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                                </span>
                              </div>
                            )}
                          </div>

                          {isExpiringSoon && insurance.status === 'Active' && (
                            <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="ml-2 text-sm">
                                Expiring soon! Renew before {formatDate(insurance.end_date)}
                              </AlertDescription>
                            </Alert>
                          )}
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
                <Card className="border-dashed">
                  <CardContent className="pt-12 pb-12 text-center">
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No insurance packages available at the moment</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availablePackages.map((pkg) => (
                    <Card 
                      key={pkg.insurance_package_id}
                      className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-2 border-transparent hover:border-purple-200"
                      onClick={() => setSelectedItem({ type: 'package', data: pkg })}
                    >
                      <CardHeader>
                        <CardTitle>{pkg.package_name}</CardTitle>
                        <CardDescription className="text-2xl font-bold text-purple-600 mt-2">
                          {formatCurrency(pkg.annual_limit)}
                          <span className="text-sm text-slate-500 font-normal"> /year</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {pkg.description && (
                          <p className="text-sm text-slate-600">{pkg.description}</p>
                        )}

                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <span className="text-lg">💰</span>
                            <span className="text-sm">Annual Coverage: {formatCurrency(pkg.annual_limit)}</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <span className="text-lg">📊</span>
                            <span className="text-sm">Copayment: {pkg.copayment_percentage}%</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <span className="text-lg">✅</span>
                            <span className="text-sm">Comprehensive Coverage</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <span className="text-lg">🏥</span>
                            <span className="text-sm">All Clinics Included</span>
                          </div>
                        </div>

                        <Button 
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('Please contact our staff to enroll in this package');
                          }}
                        >
                          Request Enrollment
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
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.type === 'insurance' ? '💼 Insurance Details' : '📦 Package Details'}
            </DialogTitle>
          </DialogHeader>

          {selectedItem?.type === 'insurance' ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">Coverage Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-slate-600">Package</span>
                    <span className="font-medium">{selectedItem.data.package_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-slate-600">Status</span>
                    <Badge variant={getStatusColor(selectedItem.data.status)}>
                      {selectedItem.data.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-slate-600">Annual Limit</span>
                    <span className="font-medium">{formatCurrency(selectedItem.data.annual_limit)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600">Copayment</span>
                    <span className="font-medium">{selectedItem.data.copayment_percentage}% (You pay this percentage)</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Validity Period</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-slate-600">Start Date</span>
                    <span className="font-medium">{formatDate(selectedItem.data.start_date)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-slate-600">End Date</span>
                    <span className="font-medium">{formatDate(selectedItem.data.end_date)}</span>
                  </div>
                  {selectedItem.data.status === 'Active' && (
                    <div className="flex justify-between py-2">
                      <span className="text-slate-600">Days Remaining</span>
                      <span className="font-medium">{calculateDaysRemaining(selectedItem.data.end_date)} days</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedItem.data.package_description && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Package Description</h3>
                  <p className="text-sm text-slate-600">{selectedItem.data.package_description}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-lg mb-2">Insurance ID</h3>
                <div className="p-3 bg-slate-100 rounded font-mono text-sm break-all">
                  {selectedItem.data.insurance_id}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">Package Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-slate-600">Package Name</span>
                    <span className="font-medium">{selectedItem.data.package_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-slate-600">Annual Coverage</span>
                    <span className="font-medium">{formatCurrency(selectedItem.data.annual_limit)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600">Copayment</span>
                    <span className="font-medium">{selectedItem.data.copayment_percentage}%</span>
                  </div>
                </div>
              </div>

              {selectedItem.data.description && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-sm text-slate-600">{selectedItem.data.description}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-lg mb-3">Benefits</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Comprehensive medical coverage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Access to all clinic facilities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Coverage for consultations and treatments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>{selectedItem.data.copayment_percentage}% copayment (You pay only {selectedItem.data.copayment_percentage}%)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Annual limit of {formatCurrency(selectedItem.data.annual_limit)}</span>
                  </li>
                </ul>
              </div>

              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => {
                  setSelectedItem(null);
                  alert('Please visit our clinic or contact staff to enroll in this package');
                }}
              >
                Request Enrollment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
