import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Components
import DoctorNavbar from "@/portals/doctor/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import {
  Calendar,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  Eye,
  Phone,
  CheckCircle2,
  XCircle,
  User,
  FileText,
} from "lucide-react";

// Services & Styles
import authService from "@/services/authService";
import appointmentService from "@/services/appointmentService";
import "@/index.css";

// ============================================
// TYPES
// ============================================

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

interface DashboardStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
}

interface DoctorData {
  name: string;
  email: string;
  specialization: string;
  branch_name: string;
}

// ============================================
// DOCTOR APPOINTMENTS COMPONENT
// ============================================

export default function DoctorConsultations(): React.ReactElement {
  const navigate = useNavigate();

  // ============= STATE =============
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    DisplayAppointment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [filters, setFilters] = useState({
    date: "",
    status: "all" as AppointmentStatus | "all",
    search: "",
  });

  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
  });

  const [doctorData, setDoctorData] = useState<DoctorData>({
    name: "Doctor",
    email: "",
    specialization: "Physician",
    branch_name: "",
  });

  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "all">(
    "today"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">(
    "all"
  );

  // ============= HELPERS =============

  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeStr: string | number): string => {
    if (!timeStr) return "";
    if (typeof timeStr === "number") {
      const hours = Math.floor(timeStr / 3600);
      const minutes = Math.floor((timeStr % 3600) / 60);
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`;
    }
    if (typeof timeStr === "string") {
      return timeStr.substring(0, 5);
    }
    return "";
  };

  const getStatusBadgeVariant = (status: AppointmentStatus) => {
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
  };

  const getStatusLabel = (status: AppointmentStatus): string => {
    if (!status) return "Unknown";
    const normalized = status.toLowerCase();
    if (normalized === "canceled") return "Cancelled";
    return normalized
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  };

  // ============= DATA FETCHING =============

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const doctorId = localStorage.getItem("doctor_id");
      if (!doctorId) {
        setError("Doctor ID not found");
        return;
      }

      const appts = await appointmentService.getDoctorAppointments(
        doctorId,
        false
      );

      if (Array.isArray(appts)) {
        setAppointments(appts);
        updateStats(appts);
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError("Failed to load appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStats = (appts: any[]) => {
    setStats({
      total: appts.length,
      scheduled: appts.filter((a) => a.status?.toLowerCase() === "scheduled")
        .length,
      completed: appts.filter((a) => a.status?.toLowerCase() === "completed")
        .length,
      cancelled: appts.filter((a) => a.status?.toLowerCase() === "cancelled")
        .length,
    });
  };

  const applyFilters = useCallback(() => {
    let filtered = appointments;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.patient_name?.toLowerCase().includes(q) ||
          apt.patient_id?.toString().includes(q) ||
          apt.patient_email?.toLowerCase().includes(q)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(
        (apt) => apt.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (filters.date) {
      filtered = filtered.filter((apt) => apt.available_date === filters.date);
    }

    setFilteredAppointments(
      filtered.map((apt) => ({
        id: apt.appointment_id,
        patientName: apt.patient_name || "N/A",
        time: apt.start_time,
        date: apt.available_date,
        branch: apt.branch_name,
        status: apt.status,
        specialty: "Consultation",
        contact: apt.patient_phone,
      }))
    );
  }, [appointments, searchTerm, statusFilter, filters.date]);

  // ============= LIFECYCLE =============

  useEffect(() => {
    const userType = localStorage.getItem("userType");
    const doctorId = localStorage.getItem("doctor_id");

    if (userType !== "doctor" || !doctorId) {
      navigate("/doctor-login", { replace: true });
      return;
    }

    const fullName = localStorage.getItem("fullName") || "Doctor";
    const email = localStorage.getItem("email") || "";
    const specialization =
      localStorage.getItem("specialization") || "Physician";
    const branchName = localStorage.getItem("branch_name") || "";

    setDoctorData({
      name: fullName,
      email,
      specialization,
      branch_name: branchName,
    });

    void fetchAppointments();
  }, [fetchAppointments, navigate]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleLogout = () => {
    try {
      authService.logout();
      navigate("/doctor-login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const listForTab =
    activeTab === "today"
      ? filteredAppointments.slice(0, 5)
      : activeTab === "upcoming"
      ? filteredAppointments.slice(5, 10)
      : filteredAppointments;

  // ============= RENDER =============

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading appointments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ============= MAIN ============= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ===== PAGE HEADER ===== */}
        <h1 className="text-4xl font-bold text-foreground">
          Consultation Management
        </h1>
        <p className="text-muted-foreground mt-2">
          View and manage all patient consultations
        </p>

        {/* ===== ERROR ALERT ===== */}
        {error && (
          <Alert variant="destructive" className="border-destructive/40">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ===== STATS CARDS ===== */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <Progress
                  value={(stats.total / 100) * 100}
                  className="mt-3 h-1"
                />
              </CardContent>
            </Card>

            <Card className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Scheduled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.scheduled}</div>
                <p className="text-xs text-muted-foreground mt-1">pending</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.completed}</div>
                <p className="text-xs text-muted-foreground mt-1">finished</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cancelled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.cancelled}</div>
                <p className="text-xs text-muted-foreground mt-1">cancelled</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== FILTERS & TABS ===== */}
        <Card className="border border-border">
          <CardHeader className="pb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Manage Appointments</CardTitle>
              <CardDescription>
                View and manage all appointments
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search patient..."
                  className="pl-8 pr-3 py-2 rounded-md border border-input bg-background text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  className="pl-8 pr-3 py-2 rounded-md border border-input bg-background text-sm"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as AppointmentStatus | "all")
                  }
                >
                  <option value="all">All statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <Tabs
              value={activeTab}
              onValueChange={(val) =>
                setActiveTab(val as "today" | "upcoming" | "all")
              }
            >
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value="today" className="space-y-3">
                {listForTab.length === 0 ? (
                  <div className="py-10 text-center">
                    <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No appointments scheduled
                    </p>
                  </div>
                ) : (
                  <AppointmentList items={listForTab} />
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-3">
                {listForTab.length === 0 ? (
                  <div className="py-10 text-center">
                    <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No upcoming appointments
                    </p>
                  </div>
                ) : (
                  <AppointmentList items={listForTab} />
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-3">
                {listForTab.length === 0 ? (
                  <div className="py-10 text-center">
                    <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No appointments found
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

// ============================================
// APPOINTMENT LIST COMPONENT
// ============================================

interface AppointmentListProps {
  items: DisplayAppointment[];
}

function AppointmentList({ items }: AppointmentListProps) {
  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeStr: string | number): string => {
    if (!timeStr) return "";
    if (typeof timeStr === "number") {
      const hours = Math.floor(timeStr / 3600);
      const minutes = Math.floor((timeStr % 3600) / 60);
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`;
    }
    if (typeof timeStr === "string") {
      return timeStr.substring(0, 5);
    }
    return "";
  };

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
              <Badge variant="outline" className="text-xs">
                {apt.specialty}
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
            <Badge
              variant={
                apt.status === "completed"
                  ? "outline"
                  : apt.status === "cancelled"
                  ? "destructive"
                  : "default"
              }
              className="capitalize"
            >
              {apt.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
            {apt.status.toLowerCase() !== "completed" && (
              <Button
                variant="default"
                size="icon"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            {apt.status.toLowerCase() !== "cancelled" && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
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
