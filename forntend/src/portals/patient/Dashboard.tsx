import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Pill,
  CreditCard,
  FileText,
  MessageSquare,
  AlertTriangle,
  Phone,
  Mail,
  Shield,
} from "lucide-react";
import PatientDashboardService, {
  type MedicalSummary,
  type MedicalAlert,
  type HealthMetrics,
} from "@/services/patientDashboardService";
import PatientProfileService, {
  type PatientProfile,
} from "@/services/patientProfileService";
import authService from "@/services/authService";

function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

interface Appointment {
  id: string;
  title: string;
  doctor: string;
  specialty: string;
  date: Date;
  time: string;
  branch: string;
  room: string;
  status: string;
}

export default function PatientDashboard(): React.ReactElement {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showAlert, setShowAlert] = useState<MedicalAlert | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const currentUser = authService.getCurrentUser();
  const patientId = currentUser?.userId || localStorage.getItem("userId");

  useEffect(() => {
    if (!patientId) {
      navigate("/patient-login");
    }
  }, [patientId, navigate]);

  // State for profile and medical data
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [medicalSummary, setMedicalSummary] = useState<MedicalSummary | null>(
    null
  );
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(
    null
  );
  const [medicalAlerts, setMedicalAlerts] = useState<MedicalAlert[]>([]);
  const [healthScore, setHealthScore] = useState(0);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!patientId) return;

      // Fetch profile data
      const profileData = await PatientProfileService.getPatientProfile(
        patientId
      );
      setProfile(profileData);

      // Fetch medical summary
      const medicalData = await PatientDashboardService.getMedicalSummary(
        patientId,
        {
          includeConsultations: true,
          includePrescriptions: true,
          includeLabResults: true,
        }
      );
      setMedicalSummary(medicalData);

      // Calculate health metrics
      const metrics = PatientDashboardService.getHealthMetrics(medicalData);
      setHealthMetrics(metrics);

      // Parse alerts
      const alerts = PatientDashboardService.parseAlerts(medicalData);
      setMedicalAlerts(alerts);

      // Calculate health score
      const score = PatientDashboardService.calculateHealthScore(medicalData);
      setHealthScore(score);

      console.log("✅ All dashboard data loaded successfully");
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      fetchAllData();
    }
  }, [patientId, fetchAllData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      authService.logout();
      navigate("/");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Error Loading Dashboard</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={handleRefresh} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const healthStatus = PatientDashboardService.getHealthStatus(healthScore);
  const upcomingAppointments =
    medicalSummary?.recent_consultations.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-900">
            Welcome back, {profile?.full_name?.split(" ")[0]}!
          </h2>
          <p className="text-slate-600">
            Your comprehensive health management dashboard
          </p>
        </div>

        {/* Health Score Card */}
        {/* <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Health Score</CardTitle>
                <CardDescription>Overall wellness status</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-purple-600">{healthScore}</div>
                <Badge className={`mt-2 ${
                  healthStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                  healthStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  healthStatus.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {healthStatus.icon} {healthStatus.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={healthScore} className="h-2" />
            <p className="text-sm text-slate-600 mt-4">
              {healthScore >= 80 && 'Great job maintaining your health! Keep it up.'}
              {healthScore >= 60 && healthScore < 80 && 'Good health status. Consider scheduling a checkup soon.'}
              {healthScore >= 40 && healthScore < 60 && 'Your health needs attention. Please contact your doctor.'}
              {healthScore < 40 && 'Critical health status. Immediate medical attention recommended.'}
            </p>
          </CardContent>
        </Card> */}

        {/* Critical Alerts */}
        {/* {medicalAlerts.length > 0 && (
          <div className="space-y-3">
            {medicalAlerts.slice(0, 3).map((alert, idx) => (
              <Alert 
                key={idx}
                className={`${
                  alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                  alert.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <AlertDescription className={`${
                  alert.type === 'critical' ? 'text-red-800' :
                  alert.type === 'warning' ? 'text-amber-800' :
                  'text-blue-800'
                }`}>
                  <span className="mr-2">{alert.icon}</span>
                  {alert.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )} */}

        {/* Health Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Consultations</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {healthMetrics?.total_consultations || 0}
                  </p>
                </div>
                <Calendar className="w-10 h-10 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Prescriptions</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {healthMetrics?.total_prescriptions || 0}
                  </p>
                </div>
                <Pill className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Conditions</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {healthMetrics?.active_conditions || 0}
                  </p>
                </div>
                <Shield className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Allergies</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {healthMetrics?.known_allergies || 0}
                  </p>
                </div>
                <AlertTriangle className="w-10 h-10 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/patient/book-appointment")}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all group"
            >
              <Calendar className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-slate-900">Book Appointment</p>
              <p className="text-sm text-slate-600">
                Schedule with specialists
              </p>
            </button>

            <button
              onClick={() => navigate("/patient/records")}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <FileText className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-slate-900">Medical Records</p>
              <p className="text-sm text-slate-600">View health history</p>
            </button>

            <button
              onClick={() => navigate("/patient/billing")}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all group"
            >
              <CreditCard className="w-6 h-6 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-slate-900">Billing</p>
              <p className="text-sm text-slate-600">Manage payments</p>
            </button>

            <button
              onClick={() => navigate("/patient/records")}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-all group"
            >
              <Pill className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-slate-900">Prescriptions</p>
              <p className="text-sm text-slate-600">Active medications</p>
            </button>

            <button
              onClick={() => navigate("/patient/insurance")}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:border-cyan-300 hover:bg-cyan-50 transition-all group"
            >
              <Shield className="w-6 h-6 text-cyan-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-slate-900">Insurance</p>
              <p className="text-sm text-slate-600">Coverage details</p>
            </button>

            <button className="p-4 bg-white border border-slate-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-all group">
              <MessageSquare className="w-6 h-6 text-pink-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-slate-900">Contact Doctor</p>
              <p className="text-sm text-slate-600">Send a message</p>
            </button>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="consultations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="consultations">
              Recent Consultations
            </TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
          </TabsList>

          {/* Recent Consultations Tab */}
          <TabsContent value="consultations">
            <Card>
              <CardHeader>
                <CardTitle>Recent Consultations</CardTitle>
                <CardDescription>Your latest doctor visits</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 bg-slate-100 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : medicalSummary?.recent_consultations.length === 0 ? (
                  <div className="text-center py-8 space-y-4">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-slate-600">No recent consultations</p>
                    <Button onClick={() => navigate("/patient/book")}>
                      Book Appointment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicalSummary?.recent_consultations
                      .slice(0, 5)
                      .map((consultation) => (
                        <div
                          key={consultation.consultation_id}
                          className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">
                                {consultation.specialty}
                              </p>
                              <p className="text-sm text-slate-600">
                                Dr. {consultation.doctor_name}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {formatDate(consultation.consultation_date)}
                            </Badge>
                          </div>
                          {consultation.diagnosis && (
                            <p className="text-sm text-slate-700 mt-2">
                              <strong>Diagnosis:</strong>{" "}
                              {consultation.diagnosis}
                            </p>
                          )}
                          {consultation.notes && (
                            <p className="text-sm text-slate-600 mt-1">
                              <strong>Notes:</strong> {consultation.notes}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications">
            <Card>
              <CardHeader>
                <CardTitle>Active Medications</CardTitle>
                <CardDescription>
                  {medicalSummary?.active_prescriptions.length || 0} active
                  prescriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {medicalSummary?.active_prescriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <Pill className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No active prescriptions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicalSummary?.active_prescriptions.map(
                      (prescription) => {
                        const status =
                          PatientDashboardService.getPrescriptionStatus(
                            prescription
                          );
                        return (
                          <div
                            key={prescription.prescription_id}
                            className="p-4 border border-slate-200 rounded-lg"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  Dr. {prescription.doctor_name}
                                </p>
                                <p className="text-sm text-slate-600">
                                  Prescribed:{" "}
                                  {formatDate(prescription.prescription_date)}
                                </p>
                              </div>
                              <Badge
                                className={`${
                                  status.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : status.status === "expiring"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {status.label}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {prescription.medications.map((med, idx) => (
                                <div
                                  key={idx}
                                  className="text-sm bg-slate-50 p-2 rounded"
                                >
                                  <p className="font-medium text-slate-900">
                                    {med.generic_name}
                                  </p>
                                  <p className="text-slate-600">
                                    {med.dosage} - {med.frequency}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
