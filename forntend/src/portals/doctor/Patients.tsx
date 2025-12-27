import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DoctorNavbar from "@/portals/doctor/Navbar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Users,
  Activity,
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  Stethoscope,
  User as UserIcon,
  RefreshCw,
  Loader2,
  Heart,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import consultationService from "@/services/consultationService";
import authService from "@/services/authService";
import "@/index.css";

// ============================================
// TYPES
// ============================================

interface PatientDetail {
  patient_id: string | number;
  first_name: string;
  last_name: string;
  email?: string;
  phone_no?: string;
  date_of_birth?: string;
  total_consultations: number;
  last_consultation_date?: string;
  total_prescriptions: number;
  total_treatments: number;
  follow_up_pending: boolean;
}

interface DoctorStats {
  total_patients: number;
  total_consultations: number;
  total_prescriptions: number;
  total_treatments: number;
  follow_ups_pending: number;
  recent_patients: number;
}

// ============================================
// DOCTOR PATIENTS COMPONENT
// ============================================

export default function DoctorPatients(): React.ReactElement {
  const navigate = useNavigate();

  // ============= STATE =============
  const [patients, setPatients] = useState<PatientDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "recent" | "pending-followup"
  >("all");

  // ============= MEMOS - WRAPPED IN useMemo TO PREVENT INFINITE LOOPS =============
  const doctorId = useMemo(() => authService.getDoctorId() || "", []);
  const fullName = useMemo(() => authService.getFullName() || "Doctor", []);
  const specialization = useMemo(
    () => authService.getSpecialization() || "Medical Professional",
    []
  );
  const email = useMemo(() => authService.getEmail() || "", []);

  // ============= DATA FETCHING =============

  const fetchPatients = useCallback(async () => {
    console.log("🔄 fetchPatients called with doctorId:", doctorId);

    if (!doctorId) {
      console.error("❌ No doctor ID found");
      setError("Doctor ID not found. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("📡 Fetching consultations for doctor:", doctorId);

      // Fetch all consultations for the doctor
      const response = await consultationService.getConsultationsByDoctor(
        doctorId,
        0,
        500
      );

      console.log("📦 Response received:", response);

      if (
        !response ||
        !response.consultations ||
        response.consultations.length === 0
      ) {
        console.warn("⚠️ No consultations found");
        setPatients([]);
        setLoading(false);
        return;
      }

      console.log("📊 Total consultations:", response.consultations.length);

      // Extract unique patients from consultations
      const patientMap: Record<string | number, PatientDetail> = {};

      response.consultations.forEach((consultation: any) => {
        if (consultation.patient_id && !patientMap[consultation.patient_id]) {
          const nameParts = (consultation.patient_name || "Patient").split(" ");
          const firstName =
            consultation.patient_first_name || nameParts[0] || "Patient";
          const lastName =
            consultation.patient_last_name ||
            nameParts.slice(1).join(" ") ||
            "";

          patientMap[consultation.patient_id] = {
            patient_id: consultation.patient_id,
            first_name: firstName,
            last_name: lastName,
            email: consultation.patient_email || "N/A",
            phone_no: consultation.patient_phone || "N/A",
            date_of_birth: consultation.patient_dob,
            total_consultations: 1,
            last_consultation_date: consultation.available_date,
            total_prescriptions: consultation.prescription_count || 0,
            total_treatments: consultation.treatment_count || 0,
            follow_up_pending: consultation.follow_up_required || false,
          };
        } else if (patientMap[consultation.patient_id]) {
          // Update existing patient record
          const patient = patientMap[consultation.patient_id];
          patient.total_consultations += 1;
          patient.total_prescriptions += consultation.prescription_count || 0;
          patient.total_treatments += consultation.treatment_count || 0;
          patient.follow_up_pending =
            patient.follow_up_pending ||
            consultation.follow_up_required ||
            false;

          // Update last consultation date if this one is more recent
          if (
            consultation.available_date &&
            (!patient.last_consultation_date ||
              new Date(consultation.available_date) >
                new Date(patient.last_consultation_date))
          ) {
            patient.last_consultation_date = consultation.available_date;
          }
        }
      });

      const list = Object.values(patientMap).sort((a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(
          `${b.first_name} ${b.last_name}`
        )
      );

      console.log("✅ Unique patients extracted:", list.length);
      setPatients(list);
      setLoading(false);
    } catch (err) {
      console.error("❌ Error loading patients:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load patients";
      setError(errorMessage);
      setLoading(false);
    }
  }, [doctorId]); // doctorId is now stable (memoized)

  // ============= FILTERING =============

  const filtered = useMemo(() => {
    let list = patients;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.first_name?.toLowerCase().includes(q) ||
          p.last_name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.phone_no?.toLowerCase().includes(q) ||
          p.patient_id?.toString().includes(q)
      );
    }

    if (activeTab === "recent") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      list = list.filter(
        (p) =>
          p.last_consultation_date &&
          new Date(p.last_consultation_date) >= thirtyDaysAgo
      );
    } else if (activeTab === "pending-followup") {
      list = list.filter((p) => p.follow_up_pending);
    }

    return list;
  }, [patients, search, activeTab]);

  // ============= STATISTICS =============

  const stats = useMemo(
    () => ({
      total_patients: patients.length,
      total_consultations: patients.reduce(
        (sum, p) => sum + p.total_consultations,
        0
      ),
      total_prescriptions: patients.reduce(
        (sum, p) => sum + p.total_prescriptions,
        0
      ),
      total_treatments: patients.reduce(
        (sum, p) => sum + p.total_treatments,
        0
      ),
      follow_ups_pending: patients.filter((p) => p.follow_up_pending).length,
      recent_patients: patients.filter((p) => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return (
          p.last_consultation_date &&
          new Date(p.last_consultation_date) >= thirtyDaysAgo
        );
      }).length,
    }),
    [patients]
  );

  // ============= HELPER FUNCTIONS =============

  const calculateAge = (dob: string | undefined): number | null => {
    if (!dob) return null;
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return age >= 0 ? age : null;
    } catch {
      return null;
    }
  };

  const formatDate = (date: string | undefined): string => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // ============= LIFECYCLE =============

  useEffect(() => {
    console.log("🔍 DoctorPatients mounted");
    console.log("Doctor ID:", doctorId);

    if (!doctorId) {
      console.error("❌ No doctor ID found");
      navigate("/doctor-login", { replace: true });
      return;
    }

    console.log("✅ Doctor ID found, fetching patients");
    void fetchPatients();
  }, [doctorId, fetchPatients]); // Only runs when doctorId changes

  // ============= HANDLERS =============

  const handleRefresh = async () => {
    console.log("🔄 Refresh clicked");
    setRefreshing(true);
    await fetchPatients();
    setRefreshing(false);
  };

  const handleLogout = () => {
    console.log("👋 Logout clicked");
    authService.logout();
    navigate("/doctor-login", { replace: true });
  };

  // ============= RENDER: LOADING =============

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Loading patients...</p>
            <p className="text-xs text-muted-foreground">
              {doctorId
                ? `Doctor: ${doctorId.substring(0, 12)}...`
                : "Authenticating..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============= RENDER: MAIN =============

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ===== PAGE HEADER ===== */}
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            My Patients
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and view patient consultation history
          </p>
        </div>

        {/* ===== ERROR ALERT ===== */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ===== STATS GRID ===== */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card className="hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_patients}</div>
              <p className="text-xs text-muted-foreground mt-1">
                unique patients
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Consultations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.total_consultations}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                total conducted
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Recent (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats.recent_patients}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                active patients
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.total_prescriptions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">issued</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Treatments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_treatments}</div>
              <p className="text-xs text-muted-foreground mt-1">ordered</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Pending Follow-up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${
                  stats.follow_ups_pending > 0
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                {stats.follow_ups_pending}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                need attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ===== SEARCH & FILTER CARD ===== */}
        <Card>
          <CardHeader className="pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Search & Filter</CardTitle>
                <CardDescription>Find and filter patients</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(v) =>
                setActiveTab(v as "all" | "recent" | "pending-followup")
              }
            >
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="all">All ({patients.length})</TabsTrigger>
                <TabsTrigger value="recent">
                  Recent ({stats.recent_patients})
                </TabsTrigger>
                <TabsTrigger value="pending-followup">
                  Pending ({stats.follow_ups_pending})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
        </Card>

        {/* ===== PATIENTS LIST ===== */}
        <Card>
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Patients ({filtered.length})</CardTitle>
              <CardDescription>
                {activeTab === "all"
                  ? "All patients you have consulted"
                  : activeTab === "recent"
                  ? "Patients consulted in the last 30 days"
                  : "Patients requiring follow-up"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <UserIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {search
                    ? "No patients match your search"
                    : "No patients found"}
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-2 pr-4">
                  {filtered.map((patient) => {
                    const age = calculateAge(patient.date_of_birth);
                    const followUpBadgeColor = patient.follow_up_pending
                      ? "destructive"
                      : "outline";

                    return (
                      <div
                        key={patient.patient_id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        {/* ===== PATIENT INFO ===== */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Avatar */}
                          <div className="h-10 w-10 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center font-semibold text-sm flex-shrink-0">
                            {(patient.first_name?.[0] || "P").toUpperCase()}
                            {(patient.last_name?.[0] || "").toUpperCase()}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Name & Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm truncate">
                                {patient.first_name} {patient.last_name}
                              </span>
                              {age !== null && (
                                <Badge
                                  variant="outline"
                                  className="text-xs flex-shrink-0"
                                >
                                  {age} years
                                </Badge>
                              )}
                              <Badge
                                variant="secondary"
                                className="text-[10px] flex-shrink-0"
                              >
                                #{patient.patient_id}
                              </Badge>
                            </div>

                            {/* Contact Info */}
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              {patient.email && patient.email !== "N/A" && (
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {patient.email}
                                  </span>
                                </span>
                              )}
                              {patient.phone_no &&
                                patient.phone_no !== "N/A" && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 flex-shrink-0" />
                                    {patient.phone_no}
                                  </span>
                                )}
                            </div>

                            {/* Consultation Stats */}
                            <div className="flex flex-wrap gap-3 text-xs">
                              <Badge variant="outline" className="gap-1">
                                <Stethoscope className="h-3 w-3" />
                                {patient.total_consultations} consultation
                                {patient.total_consultations !== 1 ? "s" : ""}
                              </Badge>
                              {patient.total_prescriptions > 0 && (
                                <Badge variant="outline" className="gap-1">
                                  💊 {patient.total_prescriptions} prescription
                                  {patient.total_prescriptions !== 1 ? "s" : ""}
                                </Badge>
                              )}
                              {patient.total_treatments > 0 && (
                                <Badge variant="outline" className="gap-1">
                                  🏥 {patient.total_treatments} treatment
                                  {patient.total_treatments !== 1 ? "s" : ""}
                                </Badge>
                              )}
                              {patient.follow_up_pending && (
                                <Badge
                                  variant={followUpBadgeColor}
                                  className="gap-1"
                                >
                                  ⚠️ Follow-up Pending
                                </Badge>
                              )}
                            </div>

                            {/* Last Consultation */}
                            {patient.last_consultation_date && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Last consultation:{" "}
                                {formatDate(patient.last_consultation_date)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ===== ACTIONS ===== */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/doctor/consultations?patient=${patient.patient_id}`
                              )
                            }
                            className="gap-1"
                          >
                            <Stethoscope className="h-4 w-4" />
                            <span className="hidden sm:inline">Consult</span>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                •••
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/doctor/patients/${patient.patient_id}/history`
                                  )
                                }
                              >
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/doctor/patients/${patient.patient_id}/notes`
                                  )
                                }
                              >
                                Medical Notes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/doctor/patients/${patient.patient_id}/prescriptions`
                                  )
                                }
                              >
                                Prescriptions
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/doctor/patients/${patient.patient_id}/treatments`
                                  )
                                }
                              >
                                Treatments
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
