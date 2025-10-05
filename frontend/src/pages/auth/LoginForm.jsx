import { useState } from 'react'
import Button from './Button.jsx'
import FormInput from './FormInput.jsx'
import LoadingSpinner from './LoadingSpinner.jsx'

export default function LoginForm({ onForgot, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [values, setValues] = useState({ email: '', phone: '', password: '' })

  function validate() {
    const next = {}
    if (!values.email && !values.phone) next.email = 'Email or phone is required'
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = 'Invalid email'
    if (values.phone && !/^\+?\d{7,15}$/.test(values.phone)) next.phone = 'Invalid phone number'
    if (!values.password || values.password.length < 6) next.password = 'Minimum 6 characters'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    // Provide a minimal credentials object so parent can handle authentication
    const credentials = {
      role: 'Admin Staff',
      branch: 'Main Clinic',
      token: 'dummy-token'
    }
    onSuccess && onSuccess(credentials)
  }

  function onChange(name, value) { setValues(v => ({ ...v, [name]: value })) }

  return (
    <form className="stack-4" onSubmit={handleSubmit} noValidate>
      <FormInput label="Email" type="email" value={values.email} onChange={v => onChange('email', v)} error={errors.email} placeholder="you@example.com" />
      <FormInput label="Phone" type="tel" value={values.phone} onChange={v => onChange('phone', v)} error={errors.phone} placeholder="+1 555 123 4567" />
      <FormInput label="Password" type="password" value={values.password} onChange={v => onChange('password', v)} error={errors.password} placeholder="••••••••" />
      <div className="between">
        <button type="button" className="link" onClick={onForgot}>Forgot password?</button>
        <div />
      </div>
      <Button type="submit" className="btn-primary" disabled={loading}>
        {loading ? <LoadingSpinner size={16} /> : 'Login'}
      </Button>
    </form>
  )
}


