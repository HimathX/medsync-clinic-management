import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Loader2, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react"
import patientService from "@/services/patientService"
import branchService from "@/services/branchService"
import "@/index.css"

interface PatientRegistrationData {
  full_name: string
  NIC: string
  email: string
  gender: "Male" | "Female" | "Other"
  DOB: string
  password: string
  blood_group: "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-"
  contact_num1: string
  contact_num2?: string
  address_line1: string
  address_line2?: string
  city: string
  province: string
  postal_code: string
  country: string
  registered_branch_name: string
}

interface RegistrationResponse {
  success: boolean
  message?: string
}

interface Branch {
  branch_id: string
  branch_name: string
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const
const GENDERS = ["Male", "Female", "Other"] as const
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
] as const

export default function PatientSignup(): React.ReactElement {
  const navigate = useNavigate()
  const [step, setStep] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [branches, setBranches] = useState<Branch[]>([])

  const [formData, setFormData] = useState<PatientRegistrationData>({
    full_name: "",
    NIC: "",
    email: "",
    gender: "Male",
    DOB: "",
    password: "",
    blood_group: "O+",
    contact_num1: "",
    contact_num2: "",
    address_line1: "",
    address_line2: "",
    city: "",
    province: "Western",
    postal_code: "",
    country: "Sri Lanka",
    registered_branch_name: "",
  })

  const [confirmPassword, setConfirmPassword] = useState<string>("")

  useEffect(() => {
    void fetchBranches()
  }, [])

  const fetchBranches = async (): Promise<void> => {
    try {
      const branchesData = await branchService.getAllBranches()
      setBranches(branchesData || [])
      if (branchesData && branchesData.length > 0) {
        setFormData((prev) => ({
          ...prev,
          registered_branch_name: branchesData[0].branch_name,
        }))
      }
    } catch (err) {
      console.error("Error fetching branches:", err)
      setError("Failed to load branches. Please refresh the page.")
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleSelectChange = (name: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const validateStep1 = (): boolean => {
    if (!formData.full_name.trim()) {
      setError("Full name is required")
      return false
    }
    if (!formData.NIC.trim()) {
      setError("NIC number is required")
      return false
    }
    if (formData.NIC.length !== 10 && formData.NIC.length !== 12) {
      setError("NIC must be 10 or 12 characters")
      return false
    }
    if (!formData.email.trim()) {
      setError("Email is required")
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }
    if (!formData.DOB) {
      setError("Date of birth is required")
      return false
    }
    return true
  }

  const validateStep2 = (): boolean => {
    if (!formData.contact_num1.trim()) {
      setError("Primary contact number is required")
      return false
    }
    if (!formData.address_line1.trim()) {
      setError("Address line 1 is required")
      return false
    }
    if (!formData.city.trim()) {
      setError("City is required")
      return false
    }
    if (!formData.postal_code.trim()) {
      setError("Postal code is required")
      return false
    }
    return true
  }

  const validateStep3 = (): boolean => {
    if (!formData.password) {
      setError("Password is required")
      return false
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return false
    }
    if (formData.password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    if (!formData.registered_branch_name) {
      setError("Please select a branch")
      return false
    }
    return true
  }

  const handleNext = (): void => {
    setError("")
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleBack = (): void => {
    setError("")
    setStep((prev) => prev - 1)
  }

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault()

    if (!validateStep3()) return

    try {
      setLoading(true)
      setError("")

      const registrationData: PatientRegistrationData = {
        ...formData,
        contact_num2: formData.contact_num2 || "",
        address_line2: formData.address_line2 || "",
      }

      const response: RegistrationResponse = await patientService.registerPatient(
        registrationData
      )

      if (response.success) {
        alert("Registration successful! 🎉")
        navigate("/patient-login")
      } else {
        setError(response.message || "Registration failed")
      }
    } catch (err) {
      console.error("Registration error:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Registration failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const progress = (step / 3) * 100

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl shadow-lg border-border">
        <CardHeader>
          <CardTitle>Patient Registration</CardTitle>
          <CardDescription>
            Create your account to access our healthcare services
          </CardDescription>
          <div className="space-y-2 pt-4">
            <Progress value={progress} className="h-2 bg-input" />
            <p className="text-sm text-muted-foreground">Step {step} of 3</p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <FieldGroup className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="full_name">Full Name *</FieldLabel>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
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
                      onChange={handleInputChange}
                      placeholder="XXXXXXXXXV or XXXXXXXXXXXX"
                      maxLength={12}
                      disabled={loading}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Email Address *</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="m@example.com"
                      disabled={loading}
                      required
                    />
                    <FieldDescription>
                      We&apos;ll use this to contact you about appointments.
                    </FieldDescription>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="DOB">Date of Birth *</FieldLabel>
                    <Input
                      id="DOB"
                      name="DOB"
                      type="date"
                      value={formData.DOB}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split("T")[0]}
                      disabled={loading}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="gender">Gender *</FieldLabel>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        handleSelectChange("gender", value)
                      }
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

                <Field>
                  <FieldLabel htmlFor="blood_group">Blood Group *</FieldLabel>
                  <Select
                    value={formData.blood_group}
                    onValueChange={(value) =>
                      handleSelectChange("blood_group", value)
                    }
                  >
                    <SelectTrigger id="blood_group">
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map((bg) => (
                        <SelectItem key={bg} value={bg}>
                          {bg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            )}

            {/* Steps 2 & 3 can be similarly refactored with Field/FieldGroup */}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-6">
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
            </div>
          </form>

          <div className="mt-6 pt-6 border-t space-y-3 text-center">
            <p className="text-sm">
              Already have an account?{" "}
              <a
                href="/patient-login"
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
  )
}
