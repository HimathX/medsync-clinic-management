import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Search,
  ArrowRight,
  ArrowLeft,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Phone,
  Calendar,
  FileText,
  Stethoscope,
  MapPin,
} from "lucide-react";
import patientService from "@/services/patientService";
import doctorService from "@/services/doctorService";
import appointmentService from "@/services/appointmentService";
import branchService from "@/services/branchService";
import EmployeeNavbar from "@/portals/employee/Navbar";

interface Patient {
  patient_id: string;
  id?: string;
  full_name: string;
  NIC: string;
  contact_num1: string;
  email?: string;
}

interface Doctor {
  doctor_id: string;
  full_name: string;
  specializations?: string[];
  medical_licence_no?: string;
  consultation_fee?: number;
}

interface TimeSlot {
  time_slot_id: string;
  available_date: string;
  start_time: string;
  end_time: string;
  branch_name: string;
  branch_id?: string; // added to resolve branch via branchService
  doctor_id?: string;
}

type BookingStep = 1 | 2 | 3;

export default function EmployeeSchedule(): React.ReactElement {
  const navigate = useNavigate();
  const [step, setStep] = useState<BookingStep>(1);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Step 1: Patient selection
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  // Step 2: Doctor selection
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Step 3: Time slot selection
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");

  // Branch lookup
  const [branchesById, setBranchesById] = useState<Record<string, string>>({});

  const handleLogout = (): void => {
    localStorage.removeItem("auth_token");
    window.location.href = "/employee-login";
  };

  useEffect(() => {
    void fetchPatients();
    void fetchBranches();
  }, []);

  // Update filtered patients when search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = patients.filter(
        (p) =>
          p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.NIC?.includes(searchTerm) ||
          (p.patient_id || p.id)?.includes(searchTerm)
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients.slice(0, 10));
    }
  }, [searchTerm, patients]);

  const fetchPatients = async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const data = await patientService.getAllPatients(0, 1000);
      setPatients(data.patients || []);
      setFilteredPatients((data.patients || []).slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const data = await doctorService.getAllDoctors();
      setDoctors(data.doctors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async (doctorId: string): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const response = await doctorService.getDoctorTimeSlots(doctorId);
      setTimeSlots(response.time_slots || []);
    } catch (err) {
      console.error("Error fetching time slots:", err);
      setError("Failed to load available time slots");
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async (): Promise<void> => {
    try {
      const branches = await branchService.getAllBranches(0, 300, true);
      const map: Record<string, string> = {};
      branches.forEach((b) => {
        map[b.branch_id] = branchService.formatBranch
          ? branchService.formatBranch(b)
          : b.branch_name;
      });
      setBranchesById(map);
    } catch (err) {
      console.error("Failed to load branches", err);
    }
  };

  const getBranchLabel = (slot?: TimeSlot | null): string => {
    if (!slot) return "—";
    if (slot.branch_name) return slot.branch_name;
    if (slot.branch_id && branchesById[slot.branch_id]) {
      return branchesById[slot.branch_id];
    }
    return "—";
  };

  const handlePatientSelect = (patient: Patient): void => {
    setSelectedPatient(patient);
    setStep(2);
    void fetchDoctors();
  };

  const handleDoctorSelect = (doctor: Doctor): void => {
    setSelectedDoctor(doctor);
    setStep(3);
    void fetchTimeSlots(doctor.doctor_id);
  };

  const handleSlotSelect = (slot: TimeSlot): void => {
    setSelectedSlot(slot);
  };

  const handleBookAppointment = async (): Promise<void> => {
    if (!selectedPatient || !selectedSlot) return;

    setBookingLoading(true);
    setError("");
    setSuccess("");

    try {
      const bookingData = {
        patient_id: selectedPatient.patient_id || selectedPatient.id || "",
        time_slot_id: selectedSlot.time_slot_id,
        notes: notes || "Booked by employee",
      };

      const result = await appointmentService.bookAppointment(bookingData);
      setSuccess(
        `✅ Appointment booked successfully! ID: ${result.appointment_id}`
      );
      alert(`Appointment booked successfully!`); // new alert

      // Reset form after 2 seconds
      setTimeout(() => {
        setStep(1);
        setSelectedPatient(null);
        setSelectedDoctor(null);
        setSelectedSlot(null);
        setNotes("");
        setSearchTerm("");
        setSuccess("");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to book appointment"
      );
    } finally {
      setBookingLoading(false);
    }
  };
  function formatDate(date: string | Date): string {
    if (!date) return "";

    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const formatTime = (
    time: string | number | { hour: number; minute: number } | null | undefined
  ): string => {
    if (!time) return "N/A";

    const toLabel = (h: number, m: number) => {
      const period = h >= 12 ? "P.M." : "A.M.";
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      return `${String(hour12).padStart(2, "0")}:${String(m).padStart(
        2,
        "0"
      )} ${period}`;
    };

    if (typeof time === "number") {
      const hours = Math.floor(time / 3600);
      const minutes = Math.floor((time % 3600) / 60);
      return toLabel(hours, minutes);
    }

    if (typeof time === "object") {
      const { hour, minute } = time as { hour: number; minute: number };
      return toLabel(hour, minute);
    }

    if (typeof time === "string") {
      const [h, m] = time.split(":").map((v) => parseInt(v, 10));
      if (!Number.isNaN(h) && !Number.isNaN(m)) return toLabel(h, m);
      return time; // fallback
    }

    return "N/A";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <EmployeeNavbar
        employeeName="Staff"
        employeeEmail="staff@clinic.com"
        employeeRole="Appointment Scheduler"
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            Book Appointment
          </h1>
          <p className="text-slate-600 mt-2">
            Step {step} of 3 -{" "}
            {step === 1
              ? "Select Patient"
              : step === 2
              ? "Select Doctor"
              : "Select Time Slot"}
          </p>
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
            <AlertDescription className="text-green-700">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Step 1: Select Patient */}
        {step === 1 && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Select Patient
              </CardTitle>
              <CardDescription>
                Search and select a patient from the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name, NIC, or Patient ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Patient List */}
              <div className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-2" />
                    <p className="text-slate-600">Loading patients...</p>
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="py-12 text-center">
                    <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">No patients found</p>
                  </div>
                ) : (
                  filteredPatients.map((patient) => (
                    <div
                      key={patient.patient_id || patient.id}
                      onClick={() => handlePatientSelect(patient)}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">
                          {patient.full_name}
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            NIC: {patient.NIC}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {patient.contact_num1}
                          </div>
                        </div>
                      </div>
                      <Button className="ml-4">
                        Select <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Doctor */}
        {step === 2 && selectedPatient && (
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Select Doctor
              </CardTitle>
              <CardDescription>
                Choose a doctor for the appointment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selected Patient Info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-slate-600">Selected Patient:</div>
                <div className="text-lg font-semibold text-slate-900 flex items-center justify-between">
                  {selectedPatient.full_name}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStep(1)}
                  >
                    Change
                  </Button>
                </div>
              </div>

              {/* Doctor Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                  <div className="col-span-2 flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-2" />
                    <p className="text-slate-600">Loading doctors...</p>
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="col-span-2 py-12 text-center">
                    <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">No doctors available</p>
                  </div>
                ) : (
                  doctors.map((doctor) => (
                    <div
                      key={doctor.doctor_id}
                      onClick={() => handleDoctorSelect(doctor)}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">👨‍⚕️</div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">
                            {doctor.full_name}
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            {doctor.specializations &&
                              doctor.specializations.length > 0 && (
                                <Badge variant="secondary">
                                  {doctor.specializations[0]}
                                </Badge>
                              )}
                            {doctor.consultation_fee && (
                              <div className="text-slate-700 font-medium">
                                LKR {doctor.consultation_fee.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Select
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Navigation */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select Time Slot */}
        {step === 3 && selectedDoctor && selectedPatient && (
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Select Time Slot
              </CardTitle>
              <CardDescription>
                Choose an available appointment time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selected Info */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                <div className="text-sm text-slate-600">
                  Selected Appointment Details:
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-slate-600">Patient</div>
                    <div className="font-semibold text-slate-900">
                      {selectedPatient.full_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Doctor</div>
                    <div className="font-semibold text-slate-900">
                      {selectedDoctor.full_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">Branch</div>
                    <div className="font-semibold text-slate-900">
                      {getBranchLabel(selectedSlot)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(2)}
                  className="w-full"
                >
                  Change
                </Button>
              </div>

              {/* Time Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                  <div className="col-span-2 flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-2" />
                    <p className="text-slate-600">Loading available slots...</p>
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="col-span-2 py-12 text-center">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">No available time slots</p>
                  </div>
                ) : (
                  timeSlots.map((slot) => (
                    <div
                      key={slot.time_slot_id}
                      onClick={() => handleSlotSelect(slot)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedSlot?.time_slot_id === slot.time_slot_id
                          ? "border-green-500 bg-green-50"
                          : "border-slate-200 bg-slate-50 hover:border-green-300"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          <Calendar className="w-4 h-4" />
                          {formatDate(slot.available_date)}
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Clock className="w-4 h-4" />
                          {formatTime(slot.start_time)} -{" "}
                          {formatTime(slot.end_time)}
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                          <MapPin className="w-4 h-4" />
                          {getBranchLabel(slot)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Notes Section */}
              {selectedSlot && (
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about the appointment..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-24"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleBookAppointment}
                  disabled={!selectedSlot || bookingLoading}
                  className="flex-1"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Book Appointment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
