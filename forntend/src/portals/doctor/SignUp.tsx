import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import doctorService, {
  type DoctorRegistrationData,
} from "@/services/doctorService";
import branchService from "@/services/branchService";
import "@/index.css";

// Types
interface DoctorSignupFormData extends DoctorRegistrationData {
  confirmPassword: string;
}

interface Branch {
  branch_id: string;
  branch_name: string;
  [key: string]: unknown;
}

const GENDERS = ["Male", "Female", "Other"] as const;
const PROVINCES = [
  "Western",
  "Central",
  "Southern",
  "Northern",
  "Eastern",
  "North Western",
  "North Central",
  "Uva",
  "Sabaragamuwa",
] as const;

const SPECIALIZATIONS = [
  "General Practice",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Surgery",
  "Psychiatry",
  "Dermatology",
  "Oncology",
  "Gastroenterology",
];

// Step 1: Personal Information
interface Step1Props {
  formData: DoctorSignupFormData;
  loading: boolean;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onSelectChange: (name: string, value: string) => void;
}

function PersonalInformationStep({
  formData,
  loading,
  onInputChange,
  onSelectChange,
}: Step1Props): React.ReactElement {
  return (
    <FieldGroup className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground">
        👨‍⚕️ Personal Information
      </h3>

      <Field>
        <FieldLabel htmlFor="full_name">Full Name *</FieldLabel>
        <Input
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={onInputChange}
          placeholder="Dr. John Smith"
          disabled={loading}
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="NIC">NIC Number *</FieldLabel>
          <Input
            id="NIC"
            name="NIC"
            value={formData.NIC}
            onChange={onInputChange}
            placeholder="XXXXXXXXXV or XXXXXXXXXXXX"
            maxLength={12}
            disabled={loading}
            required
          />
          <FieldDescription>10 or 12 characters</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="DOB">Date of Birth *</FieldLabel>
          <Input
            id="DOB"
            name="DOB"
            type="date"
            value={formData.DOB}
            onChange={onInputChange}
            max={new Date().toISOString().split("T")[0]}
            disabled={loading}
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="gender">Gender *</FieldLabel>
          <Select
            value={formData.gender}
            onValueChange={(value) => onSelectChange("gender", value)}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDERS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </FieldGroup>
  );
}

// Step 2: Contact & Address
interface Step2Props {
  formData: DoctorSignupFormData;
  loading: boolean;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onSelectChange: (name: string, value: string) => void;
}

function ContactAddressStep({
  formData,
  loading,
  onInputChange,
  onSelectChange,
}: Step2Props): React.ReactElement {
  return (
    <FieldGroup className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground">
        📍 Contact & Address
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="email">Email Address *</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={onInputChange}
            placeholder="doctor@example.com"
            disabled={loading}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="contact_num1">Primary Contact *</FieldLabel>
          <Input
            id="contact_num1"
            name="contact_num1"
            type="tel"
            value={formData.contact_num1}
            onChange={onInputChange}
            placeholder="+94771234567"
            disabled={loading}
            required
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="contact_num2">Secondary Contact Number</FieldLabel>
        <Input
          id="contact_num2"
          name="contact_num2"
          type="tel"
          value={formData.contact_num2}
          onChange={onInputChange}
          placeholder="+94112345678"
          disabled={loading}
        />
        <FieldDescription>Optional backup contact number</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="address_line1">Address Line 1 *</FieldLabel>
        <Input
          id="address_line1"
          name="address_line1"
          value={formData.address_line1}
          onChange={onInputChange}
          placeholder="House number and street name"
          disabled={loading}
          required
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="address_line2">Address Line 2</FieldLabel>
        <Input
          id="address_line2"
          name="address_line2"
          value={formData.address_line2}
          onChange={onInputChange}
          placeholder="Apartment, suite, etc."
          disabled={loading}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="city">City *</FieldLabel>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={onInputChange}
            placeholder="Colombo"
            disabled={loading}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="province">Province *</FieldLabel>
          <Select
            value={formData.province}
            onValueChange={(value) => onSelectChange("province", value)}
          >
            <SelectTrigger id="province">
              <SelectValue placeholder="Select province" />
            </SelectTrigger>
            <SelectContent>
              {PROVINCES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="postal_code">Postal Code *</FieldLabel>
          <Input
            id="postal_code"
            name="postal_code"
            value={formData.postal_code}
            onChange={onInputChange}
            placeholder="00100"
            disabled={loading}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="country">Country *</FieldLabel>
          <Input
            id="country"
            name="country"
            value={formData.country}
            onChange={onInputChange}
            disabled={loading}
            required
          />
        </Field>
      </div>
    </FieldGroup>
  );
}

// Step 3: Medical & Security
interface Step3Props {
  formData: DoctorSignupFormData;
  confirmPassword: string;
  branches: Branch[];
  showPassword: boolean;
  showConfirmPassword: boolean;
  loading: boolean;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onSelectChange: (name: string, value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSpecializationToggle: (spec: string) => void;
  onTogglePassword: (field: "password" | "confirm") => void;
}

function MedicalSecurityStep({
  formData,
  confirmPassword,
  branches,
  showPassword,
  showConfirmPassword,
  loading,
  onInputChange,
  onSelectChange,
  onConfirmPasswordChange,
  onSpecializationToggle,
  onTogglePassword,
}: Step3Props): React.ReactElement {
  return (
    <FieldGroup className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground mb-4">
          🩺 Medical Information
        </h3>

        <div className="space-y-4">
          <Field>
            <FieldLabel htmlFor="license_number">
              Medical License Number *
            </FieldLabel>
            <Input
              id="license_number"
              name="license_number"
              value={formData.license_number}
              onChange={onInputChange}
              placeholder="ML123456"
              disabled={loading}
              required
            />
          </Field>

          <div>
            <FieldLabel>Specializations *</FieldLabel>
            <FieldDescription>
              Select one or more specializations
            </FieldDescription>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {SPECIALIZATIONS.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => onSpecializationToggle(spec)}
                  disabled={loading}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium text-left ${
                    formData.specialization_ids.includes(spec)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:border-primary"
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="branch_name">Branch *</FieldLabel>
              <Select
                value={formData.branch_name}
                onValueChange={(value) => onSelectChange("branch_name", value)}
              >
                <SelectTrigger id="branch_name">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.length === 0 ? (
                    <SelectItem value="" disabled>
                      Loading branches...
                    </SelectItem>
                  ) : (
                    branches.map((branch) => (
                      <SelectItem
                        key={branch.branch_id}
                        value={branch.branch_name}
                      >
                        {branch.branch_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FieldDescription>Your primary workplace branch</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="salary">Monthly Salary (LKR) *</FieldLabel>
              <Input
                id="salary"
                name="salary"
                type="number"
                value={formData.salary}
                onChange={onInputChange}
                placeholder="150000"
                min="0"
                step="0.01"
                disabled={loading}
                required
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground mb-4">
          🔒 Account Security
        </h3>

        <div className="space-y-4">
          <Field>
            <FieldLabel htmlFor="password">Password *</FieldLabel>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={onInputChange}
                placeholder="Enter a strong password"
                minLength={8}
                disabled={loading}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => onTogglePassword("password")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <FieldDescription>
              Must be at least 8 characters with mix of upper, lower, numbers,
              and symbols
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">
              Confirm Password *
            </FieldLabel>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                placeholder="Re-enter your password"
                minLength={8}
                disabled={loading}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => onTogglePassword("confirm")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <FieldDescription>Please confirm your password</FieldDescription>
          </Field>

          <Alert className="bg-accent border-accent">
            <AlertTriangle className="h-4 w-4 text-accent-foreground" />
            <AlertDescription className="text-accent-foreground">
              By registering, you agree to our Terms of Service and Privacy
              Policy
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </FieldGroup>
  );
}

export default function DoctorSignup(): React.ReactElement {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const [formData, setFormData] = useState<DoctorSignupFormData>({
    full_name: "",
    NIC: "",
    gender: "Male",
    DOB: "",
    email: "",
    contact_num1: "",
    contact_num2: "",
    address_line1: "",
    address_line2: "",
    city: "",
    province: "Western",
    postal_code: "",
    country: "Sri Lanka",
    license_number: "",
    specialization_ids: [],
    branch_name: "",
    salary: 0,
    password: "",
    confirmPassword: "",
  });

  const [confirmPassword, setConfirmPassword] = useState<string>("");

  useEffect(() => {
    void fetchBranches();
  }, []);

  const fetchBranches = async (): Promise<void> => {
    try {
      const branchesData = await branchService.getAllBranches();
      setBranches(branchesData || []);
      if (branchesData && branchesData.length > 0) {
        setFormData((prev) => ({
          ...prev,
          branch_name: branchesData[0].branch_name,
        }));
      }
    } catch (err) {
      console.error("Error fetching branches:", err);
      setError("Failed to load branches. Please refresh the page.");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSelectChange = (name: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSpecializationToggle = (spec: string): void => {
    setFormData((prev) => ({
      ...prev,
      specialization_ids: prev.specialization_ids.includes(spec)
        ? prev.specialization_ids.filter((s) => s !== spec)
        : [...prev.specialization_ids, spec],
    }));
  };

  const validateStep1 = (): boolean => {
    if (!formData.full_name.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!formData.NIC.trim()) {
      setError("NIC number is required");
      return false;
    }
    if (formData.NIC.length !== 10 && formData.NIC.length !== 12) {
      setError("NIC must be 10 or 12 characters");
      return false;
    }
    if (!formData.DOB) {
      setError("Date of birth is required");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.contact_num1.trim()) {
      setError("Primary contact number is required");
      return false;
    }
    if (!formData.address_line1.trim()) {
      setError("Address line 1 is required");
      return false;
    }
    if (!formData.city.trim()) {
      setError("City is required");
      return false;
    }
    if (!formData.postal_code.trim()) {
      setError("Postal code is required");
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!formData.license_number.trim()) {
      setError("Medical license number is required");
      return false;
    }
    if (formData.specialization_ids.length === 0) {
      setError("Please select at least one specialization");
      return false;
    }
    if (!formData.branch_name) {
      setError("Please select a branch");
      return false;
    }
    if (!formData.salary || formData.salary <= 0) {
      setError("Please enter a valid salary");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (formData.password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleNext = (): void => {
    setError("");
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = (): void => {
    setError("");
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!validateStep3()) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { confirmPassword: _, ...registrationData } = formData;

      const response = await doctorService.registerDoctor({
        ...registrationData,
        salary:
          typeof registrationData.salary === "string"
            ? parseFloat(registrationData.salary)
            : registrationData.salary,
      } as DoctorRegistrationData);

      if (response.success) {
        alert(
          "✅ Registration successful! Your Doctor ID: " + response.doctor_id
        );
        navigate("/doctor-login");
      } else {
        setError(
          response.detail ||
            response.message ||
            "Registration failed. Please try again."
        );
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to register. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl shadow-lg border-border">
        <CardHeader>
          <CardTitle className="text-3xl">Doctor Registration</CardTitle>
          <CardDescription>
            Create your account and join our medical team
          </CardDescription>

          {/* Progress Bar */}
          <div className="space-y-2 pt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">Step {step} of 3</p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="animate-in fade-in-50 duration-300">
                <PersonalInformationStep
                  formData={formData}
                  loading={loading}
                  onInputChange={handleInputChange}
                  onSelectChange={handleSelectChange}
                />
              </div>
            )}

            {/* Step 2: Contact & Address */}
            {step === 2 && (
              <div className="animate-in fade-in-50 duration-300">
                <ContactAddressStep
                  formData={formData}
                  loading={loading}
                  onInputChange={handleInputChange}
                  onSelectChange={handleSelectChange}
                />
              </div>
            )}

            {/* Step 3: Medical & Security */}
            {step === 3 && (
              <div className="animate-in fade-in-50 duration-300">
                <MedicalSecurityStep
                  formData={formData}
                  confirmPassword={confirmPassword}
                  branches={branches}
                  showPassword={showPassword}
                  showConfirmPassword={showConfirmPassword}
                  loading={loading}
                  onInputChange={handleInputChange}
                  onSelectChange={handleSelectChange}
                  onConfirmPasswordChange={setConfirmPassword}
                  onSpecializationToggle={handleSpecializationToggle}
                  onTogglePassword={(field) => {
                    if (field === "password") {
                      setShowPassword(!showPassword);
                    } else {
                      setShowConfirmPassword(!showConfirmPassword);
                    }
                  }}
                />
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert
                variant="destructive"
                className="bg-destructive/10 border-destructive"
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-destructive">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Navigation Buttons */}
            <FieldGroup className="flex gap-3 pt-4">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Complete Registration
                    </>
                  )}
                </Button>
              )}
            </FieldGroup>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-border space-y-3 text-center">
            <p className="text-sm text-foreground">
              Already have an account?{" "}
              <a
                href="/doctor-login"
                className="font-semibold text-primary hover:text-primary/80"
              >
                Login here
              </a>
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
