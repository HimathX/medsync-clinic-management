import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, Eye, EyeOff, ArrowLeft, LogIn } from 'lucide-react'
import authService from '@/services/authService'


interface LoginProps {
  onLogin?: (role: string, userType: string) => void
}


// Only employee can access this portal
const ALLOWED_USER_TYPES = ['employee']


export default function EmployeeLogin({
  onLogin,
}: LoginProps): React.ReactElement {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [rememberMe, setRememberMe] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)


  // Validate email format
  const isValidEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailValue)
  }


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError('')


    // Validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }


    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }


    try {
      setLoading(true)


      // Call authentication API
      const response = await authService.login(email, password)


      if (!response.success) {
        setError(response.message || 'Login failed. Please try again.')
        return
      }


      const userType = response.user_type?.toLowerCase()


      // Only allow employees
      if (!userType || !ALLOWED_USER_TYPES.includes(userType)) {
        setError('Only employees can access this portal. Please use the appropriate portal for your account type.')
        return
      }


      // Call parent callback with role and userType
      if (onLogin) {
        onLogin('employee', userType)
      }


      // Dispatch auth changed event for App.tsx to pick up the change
      window.dispatchEvent(new Event('authChanged'))
      console.log('✅ Employee authenticated')


      // Redirect to employee dashboard
      setTimeout(() => {
        navigate('/employee/dashboard')
      }, 100)
    } catch (err) {
      console.error('Login error:', err)


      if (err instanceof Error) {
        if (err.message.includes('401')) {
          setError('Invalid email or password')
        } else if (err.message.includes('500')) {
          setError('Server error. Please try again later.')
        } else {
          setError(err.message)
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader>
          <div className="text-center space-y-2">
            <div className="text-4xl">🏥</div>
            <CardTitle className="text-2xl">Employee Portal</CardTitle>
            <CardDescription>Sign in to your healthcare account</CardDescription>
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
                  placeholder="johndoe4@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  disabled={loading}
                  required
                />
                <FieldDescription>We&apos;ll never share your email</FieldDescription>
              </Field>


              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="/forgot-password"
                    className="text-sm text-primary hover:text-primary/80 underline-offset-2 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
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
                <Alert variant="destructive" className="bg-destructive/10 border-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}


              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-muted-foreground">
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
              onClick={() => navigate('/')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <a
                href="/employee-signup"
                className="text-primary font-semibold hover:text-primary/80 underline-offset-2 hover:underline"
              >
                Create one
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
