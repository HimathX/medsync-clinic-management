import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorNavbar from "@/portals/doctor/Navbar.tsx";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  LogOut,
  Settings,
  Bell,
  Search,
  ChevronRight,
  Plus,
  Eye,
  Download,
  Loader2,
  FileText,
  Phone,
  Award,
} from "lucide-react";
import "@/index.css";

import doctorService from "@/services/doctorService";
import authService from "@/services/authService";

/**
 * Enhanced Doctor Dashboard Component with Navbar
 *
 * Features:
 * - Doctor authentication verification
 * - Professional green navbar with doctor info
 * - Profile completeness validation
 * - Real-time dashboard data from API
 * - Appointment management
 * - Patient analytics
 * - Doctor-specific information display
 * - Secure logout with data clearing
 */
export default function DoctorDashboard(): React.ReactElement {
  const navigate = useNavigate();

  // UI State
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard Statistics
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    consultationsCompleted: 0,
    averageRating: 0,
  });

  // Dashboard Data
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    consultationsTrend: [] as any[],
    patientSatisfaction: [] as any[],
  });

  // Doctor Information from authService
  const doctorId = authService.getDoctorId() || "";
  const fullName = authService.getFullName() || "Doctor";
  const specialization =
    authService.getSpecialization() || "Medical Professional";
  const branchName = authService.getBranchName() || "Primary Branch";
  const phone = authService.getPhone() || "";
  const license = authService.getLicenseNumber() || "";
  const email = authService.getEmail() || "";

  /**
   * Initialize dashboard - verify auth and load data
   */
  useEffect(() => {
    // Verify doctor authentication
    if (!authService.isDoctor()) {
      console.error("❌ User is not authenticated as doctor");
      navigate("/doctor-login");
      return;
    }
    console.log("✅ Doctor authenticated:", fullName);
    void fetchDashboardData();
  }, [doctorId, navigate]);

  /**
   * Fetch all dashboard data from services
   */
  const fetchDashboardData = async (): Promise<void> => {
    if (!doctorId) {
      console.error("❌ Doctor ID not found");
      setError("Doctor ID not found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("📊 Fetching dashboard data for doctor:", doctorId);

      // Fetch dashboard statistics
      const statsData = await doctorService.getDashboardStats(doctorId);
      setStats({
        todayAppointments: statsData.today_appointments || 0,
        totalPatients: statsData.total_patients || 0,
        consultationsCompleted: statsData.completed_today || 0,
        averageRating: statsData.average_rating || 4.8,
      });
      console.log("✅ Stats loaded:", statsData);

      // Fetch today's appointments
      const todayData = await doctorService.getTodayAppointments(doctorId);
      if (todayData.appointments) {
        const mappedAppointments = todayData.appointments
          .slice(0, 4)
          .map((apt: any) => ({
            id: apt.time_slot_id,
            patientName: apt.patient_name || "N/A",
            time: apt.start_time,
            status: apt.appointment_status || "scheduled",
            specialty: "Consultation",
            branch: apt.branch_name || branchName,
          }));
        setAppointments(mappedAppointments);
        console.log("✅ Appointments loaded:", mappedAppointments.length);
      }

      // Fetch analytics data
      const analyticsData = await doctorService.getConsultationAnalytics(
        doctorId,
        30
      );
      setAnalytics({
        consultationsTrend: analyticsData.daily_analytics
          .slice(0, 6)
          .map((d: any) => ({
            month: new Date(d.consultation_date).toLocaleDateString("en-US", {
              month: "short",
            }),
            value: d.total_consultations,
          })),
        patientSatisfaction: [
          { rating: "5 Star", count: 45 },
          { rating: "4 Star", count: 32 },
          { rating: "3 Star", count: 8 },
        ],
      });
      console.log("✅ Analytics loaded");

      console.log("✅ Dashboard data loaded successfully for " + fullName);
    } catch (err) {
      console.error("❌ Error fetching dashboard:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle doctor logout with authService
   */
  const handleLogout = async (): Promise<void> => {
    try {
      console.log("🔐 Logging out doctor:", fullName);
      await authService.logout();
      console.log("✅ Doctor logged out successfully");
      navigate("/doctor-login");
    } catch (err) {
      console.error("❌ Logout error:", err);
      // Redirect even if logout fails
      navigate("/doctor-login");
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async (): Promise<void> => {
    console.log("🔄 Refreshing dashboard data...");
    await fetchDashboardData();
    console.log("✅ Dashboard refreshed");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ============= MAIN CONTENT ============= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-8 space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            Welcome back, {fullName}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-muted-foreground text-sm">
            <span>{specialization}</span>
            <span className="hidden sm:inline">•</span>
            <span>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          {phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{phone}</span>
            </div>
          )}
          {license && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>License: {license}</span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading dashboard...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quick Stats Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Today's Appointments */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Today's Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {stats.todayAppointments}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  scheduled for today
                </p>
                <Progress
                  value={(stats.todayAppointments / 10) * 100}
                  className="mt-3 h-1"
                />
              </CardContent>
            </Card>

            {/* Total Patients */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Patients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {stats.totalPatients}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  registered patients
                </p>
                <div className="mt-3 h-1 bg-green-500/20 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-green-500" />
                </div>
              </CardContent>
            </Card>

            {/* Consultations Completed */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Consultations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {stats.consultationsCompleted}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  completed today
                </p>
                <div className="mt-3 h-1 bg-blue-500/20 rounded-full overflow-hidden">
                  <div className="h-full w-4/5 bg-blue-500" />
                </div>
              </CardContent>
            </Card>

            {/* Patient Rating */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Patient Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground flex items-center gap-2">
                  {stats.averageRating.toFixed(1)}
                  <span className="text-lg">⭐</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Average rating
                </p>
                <div className="mt-3 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < Math.floor(stats.averageRating)
                          ? "bg-yellow-500"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ============= TABS SECTION ============= */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* ===== OVERVIEW TAB ===== */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Schedule */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Today's Schedule</CardTitle>
                        <CardDescription>
                          {appointments.length} appointments scheduled
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {appointments.length > 0 ? (
                        appointments.map((apt) => (
                          <div
                            key={apt.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                {apt.patientName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {apt.specialty}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-medium text-foreground flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {new Date(apt.time).toLocaleTimeString(
                                    "en-US",
                                    { hour: "2-digit", minute: "2-digit" }
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {apt.branch}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  apt.status === "confirmed" ||
                                  apt.status === "scheduled"
                                    ? "default"
                                    : "secondary"
                                }
                                className="capitalize"
                              >
                                {apt.status}
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          No appointments scheduled for today
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming</CardTitle>
                  <CardDescription>Next 7 days</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
                      <p className="text-sm font-medium text-foreground">
                        Team Meeting
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tomorrow, 2:00 PM
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-colors">
                      <p className="text-sm font-medium text-foreground">
                        CME Training
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Dec 20, 10:00 AM
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 transition-colors">
                      <p className="text-sm font-medium text-foreground">
                        Case Review
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Dec 22, 3:00 PM
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== APPOINTMENTS TAB ===== */}
          <TabsContent value="appointments" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Appointments</CardTitle>
                    <CardDescription>
                      Manage your consultation schedule
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Appointment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {appointments.length > 0 ? (
                    appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {apt.patientName}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {apt.specialty}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {apt.branch}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-medium text-foreground">
                            {new Date(apt.time).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <Badge
                            variant={
                              apt.status === "confirmed" ||
                              apt.status === "scheduled"
                                ? "default"
                                : "secondary"
                            }
                            className="capitalize"
                          >
                            {apt.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No appointments available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== PATIENTS TAB ===== */}
          <TabsContent value="patients" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Patients</CardTitle>
                    <CardDescription>
                      {patients.length} active patients
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Name
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Email
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Last Visit
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.length > 0 ? (
                        patients.map((patient) => (
                          <tr
                            key={patient.id}
                            className="border-b border-border hover:bg-secondary/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <p className="font-medium text-foreground">
                                {patient.name}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {patient.email}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {new Date(patient.lastVisit).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  patient.status === "Active"
                                    ? "default"
                                    : "secondary"
                                }
                                className="capitalize"
                              >
                                {patient.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-4 px-4 text-center text-muted-foreground"
                          >
                            No patients found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== ANALYTICS TAB ===== */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Consultation Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Consultation Trend</CardTitle>
                  <CardDescription>Last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.consultationsTrend.length > 0 ? (
                      analytics.consultationsTrend.map((item) => (
                        <div key={item.month}>
                          <div className="flex justify-between mb-1">
                            <p className="text-sm font-medium text-foreground">
                              {item.month}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.value}
                            </p>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${
                                  (item.value /
                                    Math.max(
                                      ...analytics.consultationsTrend.map(
                                        (t) => t.value
                                      ),
                                      160
                                    )) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        No consultation data available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Patient Satisfaction */}
              <Card>
                <CardHeader>
                  <CardTitle>Patient Satisfaction</CardTitle>
                  <CardDescription>Rating distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.patientSatisfaction.length > 0 ? (
                      analytics.patientSatisfaction.map((item) => (
                        <div key={item.rating}>
                          <div className="flex justify-between mb-1">
                            <p className="text-sm font-medium text-foreground">
                              {item.rating}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.count}
                            </p>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-500 transition-all"
                              style={{
                                width: `${
                                  (item.count /
                                    Math.max(
                                      ...analytics.patientSatisfaction.map(
                                        (s) => s.count
                                      ),
                                      45
                                    )) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        No satisfaction data available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Performance Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">95%</span>{" "}
                    consultation completion rate
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">3%</span>{" "}
                    no-show rate
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">₨4.2M</span>{" "}
                    total revenue
                  </p>
                </CardContent>
              </Card>

              {/* Common Conditions Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Common Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Hypertension
                    </span>{" "}
                    - 28 cases
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Diabetes
                    </span>{" "}
                    - 22 cases
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Cardiac Issues
                    </span>{" "}
                    - 18 cases
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
