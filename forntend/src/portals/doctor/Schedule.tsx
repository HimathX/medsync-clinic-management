import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorNavbar from "@/portals/doctor/Navbar.tsx";
import timeslotService from "@/services/timeSlotService";
import authService from "@/services/authService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  Plus,
  Calendar,
  Trash2,
  CheckCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Doctor Schedule Management Component (Enhanced)
 * Features:
 * - View all time slots
 * - Create single time slot
 * - Bulk create time slots
 * - Delete time slots
 * - Real-time statistics
 * - Professional design with shadcn/ui
 */
const DoctorSchedule = () => {
  const navigate = useNavigate();

  // Core State
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Doctor Data
  const [doctorData, setDoctorData] = useState({
    name: "Doctor",
    email: "",
    specialization: "Physician",
  });

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Form States
  const [newSlot, setNewSlot] = useState({
    available_date: "",
    start_time: "",
    end_time: "",
  });

  const [bulkSlots, setBulkSlots] = useState({
    start_date: "",
    end_date: "",
    days: [] as string[],
    start_time: "",
    end_time: "",
    slot_duration: 30,
  });
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Initialize component - verify auth and load data
   */
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
          console.error("❌ No user found");
          navigate("/doctor-login", { replace: true });
          return;
        }

        const doctorId =
          currentUser?.doctor_id || localStorage.getItem("doctor_id");

        if (!doctorId) {
          console.error("❌ Doctor ID not found");
          navigate("/doctor-login", { replace: true });
          return;
        }

        setDoctorData({
          name: authService.getFullName() || "Doctor",
          email: authService.getEmail() || "",
          specialization: authService.getSpecialization() || "Physician",
        });

        console.log("✅ Doctor authenticated:", authService.getFullName());
        await fetchTimeSlots(doctorId);
      } catch (err) {
        console.error("❌ Initialization error:", err);
        setError("Failed to initialize. Please try again.");
      }
    };

    void initializeComponent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  /**
   * Fetch branch ID from localStorage or API
   */
  const getBranchId = async (): Promise<string | null> => {
    try {
      const storedBranchId = localStorage.getItem("branch_id");
      if (storedBranchId) {
        console.log("✅ Using stored branch_id:", storedBranchId);
        return storedBranchId;
      }
    } catch (err) {
      console.error("❌ Error fetching branch_id:", err);
      return null;
    }
  };

  /**
   * Fetch time slots for doctor
   */
  const fetchTimeSlots = async (doctorIdParam?: string) => {
    const doctorId = doctorIdParam || localStorage.getItem("doctor_id");
    console.log("📡 Fetching time slots for doctor:", doctorId);

    setLoading(true);
    setError("");

    try {
      const data = await timeslotService.getTimeSlotsByDoctor(
        doctorId,
        false,
        false
      );
      console.log("📥 Time slots response:", data);

      const slots =
        (data && (data.time_slots || data.timeSlots || data.slots)) || [];

      if (!Array.isArray(slots)) {
        console.warn("Unexpected time slots format, setting empty array");
        setTimeSlots([]);
      } else {
        setTimeSlots(slots);
        console.log("✅ Loaded", slots.length, "time slots");
      }
    } catch (err) {
      console.error("❌ Error fetching time slots:", err);
      const message =
        (err as any)?.message ||
        (err as any)?.response?.data?.detail ||
        "Failed to load schedule. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle single slot deletion
   */
  const handleDeleteSlot = async (slotId: string) => {
    if (!window.confirm("Delete this time slot? This cannot be undone."))
      return;

    try {
      await timeslotService.deleteTimeSlot(slotId);
      console.log("✅ Time slot deleted:", slotId);
      const doctorId = localStorage.getItem("doctor_id");
      await fetchTimeSlots(doctorId);
    } catch (err) {
      console.error("❌ Error deleting slot:", err);
      setError("Failed to delete time slot. It may be booked.");
    }
  };

  /**
   * Handle single slot creation
   */
  const handleCreateSlot = async () => {
    if (!newSlot.available_date || !newSlot.start_time || !newSlot.end_time) {
      setError("Please fill in all fields");
      return;
    }

    const doctorId = localStorage.getItem("doctor_id");
    const branchId = await getBranchId();

    if (!branchId) {
      setError(
        "Branch information not found. Please ensure your account is associated with a branch."
      );
      return;
    }

    setIsCreating(true);
    try {
      const bulkData = {
        doctor_id: doctorId,
        branch_id: branchId,
        time_slots: [
          {
            available_date: newSlot.available_date,
            start_time: newSlot.start_time + ":00",
            end_time: newSlot.end_time + ":00",
          },
        ],
      };

      await timeslotService.createBulkTimeSlots(bulkData);
      console.log("✅ Time slot created successfully");
      setShowCreateModal(false);
      setNewSlot({ available_date: "", start_time: "", end_time: "" });
      await fetchTimeSlots(doctorId);
    } catch (err) {
      console.error("❌ Error creating slot:", err);
      setError("Failed to create time slot: " + (err as any).message);
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Handle bulk slot creation
   */
  const handleBulkCreate = async () => {
    if (
      !bulkSlots.start_date ||
      !bulkSlots.end_date ||
      !bulkSlots.start_time ||
      !bulkSlots.end_time ||
      bulkSlots.days.length === 0
    ) {
      setError("Please fill in all fields and select at least one day");
      return;
    }

    const doctorId = localStorage.getItem("doctor_id");
    const branchId = await getBranchId();

    if (!branchId) {
      setError("Branch information not found.");
      return;
    }

    setIsCreating(true);
    try {
      const start = new Date(bulkSlots.start_date);
      const end = new Date(bulkSlots.end_date);
      const timeSlots = [];

      for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        const dayName = date
          .toLocaleDateString("en-US", { weekday: "long" })
          .toLowerCase();

        if (bulkSlots.days.includes(dayName)) {
          timeSlots.push({
            available_date: date.toISOString().split("T")[0],
            start_time: bulkSlots.start_time + ":00",
            end_time: bulkSlots.end_time + ":00",
          });
        }
      }

      if (timeSlots.length === 0) {
        setError(
          "No time slots generated. Check your date range and selected days."
        );
        return;
      }

      const bulkData = {
        doctor_id: doctorId,
        branch_id: branchId,
        time_slots: timeSlots,
      };

      await timeslotService.createBulkTimeSlots(bulkData);
      console.log("✅ Bulk time slots created:", timeSlots.length);
      setShowBulkModal(false);
      setBulkSlots({
        start_date: "",
        end_date: "",
        days: [],
        start_time: "",
        end_time: "",
        slot_duration: 30,
      });
      await fetchTimeSlots(doctorId);
    } catch (err) {
      console.error("❌ Error creating bulk slots:", err);
      setError("Failed to create time slots: " + (err as any).message);
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Toggle day selection
   */
  const toggleDay = (day: string) => {
    setBulkSlots((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /**
   * Format time for display
   */
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
    return timeStr.substring(0, 5);
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const doctorId = localStorage.getItem("doctor_id");
      await fetchTimeSlots(doctorId);
      console.log("✅ Dashboard refreshed");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading schedule...</p>
          </div>
        </div>
      </div>
    );
  }
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

  const totalSlots = timeSlots.length;
  const availableSlots = timeSlots.filter((s) => !s.is_booked).length;
  const bookedSlots = timeSlots.filter((s) => s.is_booked).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
                Schedule Management
              </h1>
              <p className="text-slate-600 mt-2">
                View and manage your availability slots
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 md:flex-none"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Single Slot
              </Button>
              <Button
                onClick={() => setShowBulkModal(true)}
                variant="default"
                className="flex-1 md:flex-none"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Bulk Create
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Total Slots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {totalSlots}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All time slots
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {availableSlots}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready to book
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950 border-red-200 dark:border-red-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                Booked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {bookedSlots}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Scheduled appointments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Time Slots</h2>

          {timeSlots.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No time slots found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first slot to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timeSlots.map((slot) => (
                <Card
                  key={slot.time_slot_id}
                  className={cn(
                    "transition-all hover:shadow-md",
                    !slot.is_booked
                      ? "border-emerald-200 dark:border-emerald-800"
                      : "border-muted opacity-60"
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {formatDate(slot.available_date)}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-semibold",
                          !slot.is_booked
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {!slot.is_booked ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Available
                          </span>
                        ) : (
                          "Booked"
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-center gap-2 text-sm mb-4">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatTime(slot.start_time)} –{" "}
                        {formatTime(slot.end_time)}
                      </span>
                    </div>

                    <Button
                      onClick={() => handleDeleteSlot(slot.time_slot_id)}
                      variant="destructive"
                      size="sm"
                      disabled={slot.is_booked}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Single Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Time Slot</DialogTitle>
            <DialogDescription>
              Add a new availability slot to your schedule
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newSlot.available_date}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, available_date: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, start_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, end_time: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSlot} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Modal */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Create Time Slots</DialogTitle>
            <DialogDescription>
              Create multiple slots for selected days
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-start-date">Start Date</Label>
                <Input
                  id="bulk-start-date"
                  type="date"
                  value={bulkSlots.start_date}
                  onChange={(e) =>
                    setBulkSlots({ ...bulkSlots, start_date: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-end-date">End Date</Label>
                <Input
                  id="bulk-end-date"
                  type="date"
                  value={bulkSlots.end_date}
                  onChange={(e) =>
                    setBulkSlots({ ...bulkSlots, end_date: e.target.value })
                  }
                  min={
                    bulkSlots.start_date ||
                    new Date().toISOString().split("T")[0]
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Days of Week</Label>
              <div className="grid grid-cols-4 gap-2">
                {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map(
                  (day, idx) => {
                    const fullDay = [
                      "monday",
                      "tuesday",
                      "wednesday",
                      "thursday",
                      "friday",
                      "saturday",
                      "sunday",
                    ][idx];
                    return (
                      <Button
                        key={fullDay}
                        variant={
                          bulkSlots.days.includes(fullDay)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => toggleDay(fullDay)}
                        className="text-xs"
                      >
                        {day.substring(0, 3)}
                      </Button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-start-time">Start Time</Label>
                <Input
                  id="bulk-start-time"
                  type="time"
                  value={bulkSlots.start_time}
                  onChange={(e) =>
                    setBulkSlots({ ...bulkSlots, start_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-end-time">End Time</Label>
                <Input
                  id="bulk-end-time"
                  type="time"
                  value={bulkSlots.end_time}
                  onChange={(e) =>
                    setBulkSlots({ ...bulkSlots, end_time: e.target.value })
                  }
                />
              </div>
            </div>

            {bulkSlots.days.length > 0 &&
              bulkSlots.start_date &&
              bulkSlots.end_date && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Preview</AlertTitle>
                  <AlertDescription>
                    Will create slots for {bulkSlots.days.length} day(s) between{" "}
                    {bulkSlots.start_date} and {bulkSlots.end_date}
                  </AlertDescription>
                </Alert>
              )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Slots
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorSchedule;
