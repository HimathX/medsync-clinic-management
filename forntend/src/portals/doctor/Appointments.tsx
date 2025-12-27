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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DoctorNavbar from "@/portals/doctor/Navbar";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  Search,
  Filter,
  RefreshCcw,
  AlertTriangle,
  User,
  Phone,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";

import doctorService, {
  type TimeSlot,
  type DashboardStats,
} from "@/services/doctorService";
import authService from "@/services/authService";
import "@/index.css";

type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no-show"
  | string;

interface DisplayAppointment {
  id: string;
  patientName: string;
  time: string;
  date: string;
  branch?: string;
  status: AppointmentStatus;
  specialty?: string;
  contact?: string;
}

function formatDate(dateStr: string | Date): string {
  if (!dateStr) return "N/A";
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatTime(time: string | Date): string {
  if (!time) return "N/A";
  if (typeof time !== "string") {
    return time.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  // backend sends "HH:MM:SS" – show HH:MM
  return time.substring(0, 5);
}

function getStatusBadgeVariant(status: AppointmentStatus) {
  const normalized = status?.toLowerCase();
  switch (normalized) {
    case "confirmed":
    case "scheduled":
      return "default";
    case "completed":
      return "outline";
    case "cancelled":
    case "canceled":
      return "destructive";
    case "no-show":
      return "secondary";
    default:
      return "secondary";
  }
}

function getStatusLabel(status: AppointmentStatus) {
  if (!status) return "Unknown";
  const normalized = status.toLowerCase();
  if (normalized === "canceled") return "Cancelled";
  return normalized
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export default function DoctorAppointments(): React.ReactElement {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<
    DisplayAppointment[]
  >([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    DisplayAppointment[]
  >([]);

  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "all">(
    "today"
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">(
    "all"
  );

  const currentUser = authService.getCurrentUser();

  // Doctor Information from authService
  const doctorId = authService.getDoctorId() || "";
  const fullName = authService.getFullName() || "Doctor";
  const specialization =
    authService.getSpecialization() || "Medical Professional";
  const email = authService.getEmail() || "";

  const mapTimeSlotToAppointment = (slot: TimeSlot): DisplayAppointment => {
    return {
      id: slot.timeslotid,
      patientName: slot.patientname || "N/A",
      time: slot.starttime,
      date: slot.availabledate,
      branch: slot.branchname,
      status: (slot.appointmentstatus as AppointmentStatus) || "scheduled",
      specialty: "Consultation",
      contact: "", // can be filled if API provides
    };
  };

  const fetchData = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        setError(null);
        if (!doctorId) {
          setError("Doctor ID not found. Please log in again.");
          return;
        }

        // dashboard stats
        const statsData = await doctorService.getDashboardStats(doctorId);
        setStats(statsData);

        // today's appointments
        const todayData = await doctorService.getTodayAppointments(doctorId);
        const todayMapped = (todayData?.appointments || []).map(
          mapTimeSlotToAppointment
        );
        setTodayAppointments(todayMapped);

        // upcoming appointments (next 7 days)
        const upcomingData = await doctorService.getUpcomingAppointments(
          doctorId,
          7
        );
        const upcomingMapped = (upcomingData?.appointments || []).map(
          mapTimeSlotToAppointment
        );
        setUpcomingAppointments(upcomingMapped);
      } catch (err: any) {
        console.error("Error loading doctor appointments", err);
        setError(
          err instanceof Error ? err.message : "Failed to load appointments."
        );
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [doctorId]
  );

  useEffect(() => {
    if (!authService.isDoctor?.()) {
      navigate("/doctor-login");
      return;
    }
    void fetchData(true);
  }, [fetchData, navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(false);
    setRefreshing(false);
  };

  const appointmentsAll = [...todayAppointments, ...upcomingAppointments];

  const filteredAppointments = (list: DisplayAppointment[]) => {
    return list.filter((apt) => {
      const matchesSearch =
        !searchTerm ||
        apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.branch?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        apt.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  };

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

  const listForTab =
    activeTab === "today"
      ? filteredAppointments(todayAppointments)
      : activeTab === "upcoming"
      ? filteredAppointments(upcomingAppointments)
      : filteredAppointments(appointmentsAll);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Loading appointments...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 space-y-4 text-center">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold">
              Unable to load appointments
            </h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              onClick={handleRefresh}
              className="w-full"
              variant="default"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            Appointment Management
          </h1>
          <p className="text-slate-600 mt-2">
            View and manage all patient appointments
          </p>
        </div>
        {/* Top stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Today&apos;s Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.todayappointments ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Scheduled for today
                </p>
                <Progress
                  value={(stats.todayappointments ?? 0) * 10}
                  className="mt-3 h-1"
                />
              </CardContent>
            </Card>

            <Card className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Consultations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.pendingconsultations ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting completion
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.completedtoday ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Finished consultations
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Upcoming (7 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {upcomingAppointments.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  In the next week
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters + Tabs */}
        <Card className="border border-border">
          <CardHeader className="pb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Manage Appointments</CardTitle>
              <CardDescription>
                View and manage today&apos;s, upcoming, and all appointments.
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by patient or branch..."
                    className="pl-8 pr-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <select
                    className="pl-8 pr-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value as AppointmentStatus | "all"
                      )
                    }
                  >
                    <option value="all">All statuses</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no-show">No-show</option>
                  </select>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/doctor/schedule")}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                View Schedule
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <Tabs
              value={activeTab}
              onValueChange={(val) =>
                setActiveTab(val as "today" | "upcoming" | "all")
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value="today" className="space-y-3">
                {listForTab.length === 0 ? (
                  <div className="py-10 text-center space-y-3">
                    <Calendar className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      No appointments scheduled for today.
                    </p>
                  </div>
                ) : (
                  <AppointmentList items={listForTab} />
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-3">
                {listForTab.length === 0 ? (
                  <div className="py-10 text-center space-y-3">
                    <Clock className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      No upcoming appointments in the next 7 days.
                    </p>
                  </div>
                ) : (
                  <AppointmentList items={listForTab} />
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-3">
                {listForTab.length === 0 ? (
                  <div className="py-10 text-center space-y-3">
                    <Calendar className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      No appointments found.
                    </p>
                  </div>
                ) : (
                  <AppointmentList items={listForTab} />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function AppointmentList({ items }: { items: DisplayAppointment[] }) {
  return (
    <div className="space-y-2">
      {items.map((apt) => (
        <div
          key={apt.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-border rounded-lg hover:bg-muted/40 transition-colors"
        >
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium text-foreground">{apt.patientName}</p>
              <Badge
                variant={getStatusBadgeVariant(apt.status)}
                className="capitalize"
              >
                {getStatusLabel(apt.status)}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(apt.date)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(apt.time)}
              </span>
              {apt.branch && (
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {apt.branch}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {apt.contact && (
              <Button variant="ghost" size="icon" title="Call patient">
                <Phone className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              Details
            </Button>
            {apt.status.toLowerCase() !== "completed" && (
              <Button
                variant="default"
                size="icon"
                className="bg-emerald-600 hover:bg-emerald-700"
                title="Mark as completed"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            {apt.status.toLowerCase() !== "cancelled" &&
              apt.status.toLowerCase() !== "canceled" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  title="Cancel appointment"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
          </div>
        </div>
      ))}
    </div>
  );
}
