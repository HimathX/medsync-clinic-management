import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
  ArrowLeft,
  LogIn,
} from "lucide-react";
import authService from "@/services/authService";

interface LoginProps {
  onLogin?: (role: string, userType: string) => void;
}

// Only doctors can access this portal
const ALLOWED_USER_TYPES = ["doctor"];

export default function DoctorLogin({
  onLogin,
}: LoginProps): React.ReactElement {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Validate email format
  const isValidEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!authService.isValidPassword(password)) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);

      // Call doctor-specific authentication API
      const response = await authService.doctorLogin(email, password);

      if (!response.success) {
        setError(response.message || "Login failed. Please try again.");
        return;
      }

      const userType = response.user_type?.toLowerCase();

      // Only allow doctors
      if (!userType || !ALLOWED_USER_TYPES.includes(userType)) {
        setError(
          "Only doctors can access this portal. Please use the appropriate portal for your account type."
        );
        await authService.logout();
        return;
      }

      // Store additional doctor info if needed
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("rememberEmail", email);
      }

      console.log(
        "✅ Doctor authenticated with specialization:",
        response.specialization
      );

      // Call parent callback with role and userType
      if (onLogin) {
        onLogin("doctor", userType);
      }

      // Dispatch auth changed event for App.tsx to pick up the change
      window.dispatchEvent(new Event("authChanged"));

      // Redirect to doctor dashboard
      setTimeout(() => {
        navigate("/doctor/dashboard");
      }, 100);
    } catch (err) {
      console.error("Login error:", err);

      if (err instanceof Error) {
        if (err.message.includes("401") || err.message.includes("Invalid")) {
          setError("Invalid email or password. Please check your credentials.");
        } else if (err.message.includes("500")) {
          setError("Server error. Please try again later.");
        } else if (err.message.includes("doctor")) {
          setError(err.message);
        } else {
          setError(err.message || "Login failed. Please try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Restore remembered email if available
  React.useEffect(() => {
    const rememberMe = localStorage.getItem("rememberMe") === "true";
    const rememberEmail = localStorage.getItem("rememberEmail");

    if (rememberMe && rememberEmail) {
      setEmail(rememberEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader>
          <div className="text-center space-y-2">
            <div className="text-4xl">👨‍⚕️</div>
            <CardTitle className="text-2xl">Doctor Portal</CardTitle>
            <CardDescription>
              Sign in to your healthcare professional account
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup className="space-y-4">
              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@clinic.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  required
                  autoComplete="email"
                />
                <FieldDescription>
                  Your registered email address
                </FieldDescription>
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="/doctor-forgot-password"
                    className="text-sm text-primary hover:text-primary/80 underline-offset-2 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    disabled={loading}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </Field>

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

              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 rounded border-border cursor-pointer"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 text-sm text-muted-foreground cursor-pointer"
                >
                  Remember me on this device
                </label>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </FieldGroup>
          </form>

          <div className="mt-6 pt-6 border-t border-border space-y-3">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <a
                href="/doctor-signup"
                className="text-primary font-semibold hover:text-primary/80 underline-offset-2 hover:underline"
              >
                Create one
              </a>
            </p>

            <div className="border-t border-border pt-4">
              <p className="text-center text-xs text-muted-foreground">
                Looking for another portal?{" "}
                <a
                  href="/"
                  className="text-primary hover:text-primary/80 underline-offset-2 hover:underline"
                >
                  Back to main site
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
