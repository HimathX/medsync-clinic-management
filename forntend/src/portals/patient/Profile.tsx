import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  ArrowLeft,
  Edit2,
  Loader2,
  Save,
  X,
  MapPin,
  Mail,
  Phone,
  User,
  Heart,
  AlertTriangle,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import PatientProfileService, {
  type PatientProfile,
  type PatientStats,
  type MedicalSummary,
} from '@/services/patientProfileService';
import authService from '@/services/authService';

// ===== TYPES =====

interface EditFormData {
  full_name: string;
  email: string;
  contact_num1: string;
  contact_num2?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
}

// ===== MAIN COMPONENT =====

export default function PatientProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [medicalSummary, setMedicalSummary] = useState<MedicalSummary | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [refreshing, setRefreshing] = useState(false);

  const currentUser = authService.getCurrentUser();
  const patientId = currentUser?.userId || localStorage.getItem('userId');

  const [formData, setFormData] = useState<EditFormData>({
    full_name: '',
    email: '',
    contact_num1: '',
  });

  const fetchProfileData = useCallback(async () => {
    try {
      setError(null);

      if (!patientId) return;

      console.log('👤 Fetching profile data for patient:', patientId);

      const [profileData, statsData, medicalData] = await Promise.all([
        PatientProfileService.getPatientProfile(patientId),
        PatientProfileService.getPatientStatistics(patientId),
        PatientProfileService.getMedicalSummary(patientId),
      ]);

      setProfile(profileData);
      setStats(statsData);
      setMedicalSummary(medicalData);

      setFormData({
        full_name: profileData.full_name,
        email: profileData.email,
        contact_num1: profileData.contact_num1,
        contact_num2: profileData.contact_num2 || '',
        address_line1: profileData.address_line1 || '',
        address_line2: profileData.address_line2 || '',
        city: profileData.city || '',
        province: profileData.province || '',
        postal_code: profileData.postal_code || '',
        country: profileData.country || '',
        emergency_contact_name: profileData.emergency_contact_name || '',
        emergency_contact_relationship: profileData.emergency_contact_relationship || '',
        emergency_contact_phone: profileData.emergency_contact_phone || '',
        allergies: profileData.allergies || '',
        chronic_conditions: profileData.chronic_conditions || '',
        current_medications: profileData.current_medications || '',
        insurance_provider: profileData.insurance_provider || '',
        insurance_policy_number: profileData.insurance_policy_number || '',
      });

      console.log('✅ Profile data fetched successfully');
    } catch (err) {
      console.error('❌ Error fetching profile data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchProfileData()
    setRefreshing(false)
  }

  useEffect(() => {
    if (!patientId) {
      navigate('/patient-login');
      return;
    }
    setLoading(true);
    fetchProfileData();
  }, [patientId, navigate, fetchProfileData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      authService.logout()
      navigate('/')
    }
  }
  const handleSaveProfile = async () => {
    if (!patientId || !profile) return;

    setIsSubmitting(true);
    try {
      const validation = PatientProfileService.validateProfileUpdate(formData);
      if (!validation.valid) {
        setError(validation.errors.join(', '));
        setIsSubmitting(false);
        return;
      }

      await PatientProfileService.updatePatientProfile(patientId, formData);
      setEditSuccess(true);
      await fetchProfileData();
      setIsEditModalOpen(false);

      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const profileComplete = profile ? PatientProfileService.isProfileComplete(profile) : null;
  const profileCompleteness = profile ? PatientProfileService.getProfileCompleteness(profile) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground font-medium">Loading profile...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/patient/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (

        <div className="min-h-screen bg-background">
      {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
                <p className="text-sm text-muted-foreground">View and manage your personal information</p>
              </div>
            </div>
            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Alert */}
        {editSuccess && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              Profile updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && !loading && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Profile Completion Card */}
        {profileCompleteness && (
          <Card className="mb-8 border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Profile Completeness</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-foreground">
                      {profileCompleteness.percentage}%
                    </p>
                    <Badge
                      variant={
                        profileCompleteness.level === 'High'
                          ? 'default'
                          : profileCompleteness.level === 'Medium'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {profileCompleteness.level}
                    </Badge>
                  </div>
                </div>
                <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center shadow-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {profileCompleteness.percentage}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-lg">
            <TabsTrigger value="personal" className="flex items-center gap-2 data-[state=active]:bg-background">
              <User className="w-4 h-4" />
              Personal
            </TabsTrigger>
            {/* <TabsTrigger value="medical" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Heart className="w-4 h-4" />
              Medical
            </TabsTrigger> */}
            <TabsTrigger value="statistics" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Calendar className="w-4 h-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            {/* Contact Section */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-muted">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase">Email</p>
                    <p className="text-lg font-medium text-foreground">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase">Primary Phone</p>
                    <p className="text-lg font-medium text-foreground">{profile.contact_num1}</p>
                  </div>
                  {profile.contact_num2 && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase">
                        Secondary Phone
                      </p>
                      <p className="text-lg font-medium text-foreground">{profile.contact_num2}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Personal Details Section */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-muted">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase">Full Name</p>
                    <p className="text-lg font-medium text-foreground">{profile.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase">NIC</p>
                    <p className="text-lg font-medium text-foreground">{profile.NIC}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase">Gender</p>
                    <p className="text-lg font-medium text-foreground">{profile.gender}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase">Date of Birth</p>
                    <p className="text-lg font-medium text-foreground">
                      {new Date(profile.DOB).toLocaleDateString()}
                    </p>
                  </div>
                  {profile.blood_group && (
                    <div>
                      <p className="text-lg text-muted-foreground font-semibold mb-1 uppercase">Blood Group</p>
                      <Badge className="bg-destructive text-primary-foreground text-base py-1 px-3">
                        {profile.blood_group}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Address Section */}
            {profile.address_line1 && (
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-muted">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-foreground leading-relaxed">
                    {profile.address_line1}
                    {profile.address_line2 && <>, {profile.address_line2}</>}
                    <br />
                    {profile.city && <>{profile.city}</>}
                    {profile.province && <>, {profile.province}</>}
                    {profile.postal_code && <> {profile.postal_code}</>}
                    <br />
                    {profile.country}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Emergency Contact Section */}
            {profile.emergency_contact_name && (
              <Card className="border-0 shadow-md border-l-4 border-l-destructive">
                <CardHeader className="bg-muted">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase">Name</p>
                    <p className="text-lg font-medium text-foreground">
                      {profile.emergency_contact_name}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase">Relationship</p>
                      <p className="text-foreground">{profile.emergency_contact_relationship}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase">Phone</p>
                      <p className="text-foreground">{profile.emergency_contact_phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Insurance Section */}
            {profile.insurance_provider && (
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-muted">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Insurance Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase">Provider</p>
                      <p className="text-lg font-medium text-foreground">{profile.insurance_provider}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase">Policy Number</p>
                      <code className="bg-input px-3 py-2 rounded text-foreground">
                        {profile.insurance_policy_number}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

  
          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            {stats && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                            Total Appointments
                          </p>
                          <p className="text-3xl font-bold text-foreground mt-2">
                            {stats.total_appointments}
                          </p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <Calendar className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                            Completed
                          </p>
                          <p className="text-3xl font-bold text-foreground mt-2">
                            {stats.completed_appointments}
                          </p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <CheckCircle className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                            Upcoming
                          </p>
                          <p className="text-3xl font-bold text-foreground mt-2">
                            {stats.upcoming_appointments}
                          </p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <Calendar className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                            Prescriptions
                          </p>
                          <p className="text-3xl font-bold text-foreground mt-2">
                            {stats.prescriptions}
                          </p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <CheckCircle className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                            Lab Results
                          </p>
                          <p className="text-3xl font-bold text-foreground mt-2">
                            {stats.lab_results}
                          </p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <Heart className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Last Visit */}
                {stats.last_visit && (
                  <Card className="border-0 shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground uppercase">Last Visit</p>
                          <p className="text-lg font-medium text-foreground mt-1">{stats.last_visit}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal and medical information</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </h3>
              <div className="space-y-3 bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Contact Information
              </h3>
              <div className="space-y-3 bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                      Primary Phone *
                    </label>
                    <input
                      type="tel"
                      name="contact_num1"
                      value={formData.contact_num1}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                      Secondary Phone
                    </label>
                    <input
                      type="tel"
                      name="contact_num2"
                      value={formData.contact_num2}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Address
              </h3>
              <div className="space-y-3 bg-muted p-4 rounded-lg">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                      Province
                    </label>
                    <input
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Emergency Contact
              </h3>
              <div className="space-y-3 bg-muted p-4 rounded-lg">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                      Relationship
                    </label>
                    <input
                      type="text"
                      name="emergency_contact_relationship"
                      value={formData.emergency_contact_relationship}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-destructive" />
                Medical Information
              </h3>
              <div className="space-y-3 bg-muted p-4 rounded-lg">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                    Allergies
                  </label>
                  <textarea
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="List any known allergies..."
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                    Chronic Conditions
                  </label>
                  <textarea
                    name="chronic_conditions"
                    value={formData.chronic_conditions}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="List any chronic conditions..."
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                    Current Medications
                  </label>
                  <textarea
                    name="current_medications"
                    value={formData.current_medications}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="List current medications..."
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* Insurance Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Insurance Information
              </h3>
              <div className="space-y-3 bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                      Insurance Provider
                    </label>
                    <input
                      type="text"
                      name="insurance_provider"
                      value={formData.insurance_provider}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">
                      Policy Number
                    </label>
                    <input
                      type="text"
                      name="insurance_policy_number"
                      value={formData.insurance_policy_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isSubmitting}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}