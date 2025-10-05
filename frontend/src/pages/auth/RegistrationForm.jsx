import { useState } from 'react'
import Button from './Button.jsx'
import FormInput from './FormInput.jsx'
import BranchSelector from './BranchSelector.jsx'
import LoadingSpinner from './LoadingSpinner.jsx'

export default function RegistrationForm({ onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [values, setValues] = useState({
    name: '', dob: '', gender: '', id: '', phone: '', email: '',
    emergencyName: '', emergencyPhone: '', insurance: '', branch: 'Colombo', twofa: false,
    password: '', confirm: ''
  })

  function validate() {
    const e = {}
    if (!values.name) e.name = 'Required'
    if (!values.dob) e.dob = 'Required'
    if (!values.gender) e.gender = 'Required'
    if (!values.phone || !/^\+?\d{7,15}$/.test(values.phone)) e.phone = 'Invalid phone'
    if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = 'Invalid email'
    if (!values.password || values.password.length < 8) e.password = 'Min 8 chars'
    if (values.password && !/[A-Z]/.test(values.password)) e.password = 'Use uppercase for strength'
    if (values.password !== values.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    onSuccess && onSuccess()
  }

  function set(name, v) { setValues(s => ({ ...s, [name]: v })) }

  return (
    <form className="stack-4" onSubmit={onSubmit} noValidate>
      <div className="grid-2">
        <FormInput label="Full Name" value={values.name} onChange={v => set('name', v)} error={errors.name} placeholder="Jane Doe" />
        <FormInput label="Date of Birth" type="date" value={values.dob} onChange={v => set('dob', v)} error={errors.dob} />
        <FormInput label="Gender" value={values.gender} onChange={v => set('gender', v)} error={errors.gender} placeholder="Female" />
        <FormInput label="NIC/Passport" value={values.id} onChange={v => set('id', v)} placeholder="123456789V" />
        <FormInput label="Phone" type="tel" value={values.phone} onChange={v => set('phone', v)} error={errors.phone} placeholder="+94 71 234 5678" />
        <FormInput label="Email" type="email" value={values.email} onChange={v => set('email', v)} error={errors.email} placeholder="you@example.com" />
        <FormInput label="Emergency Contact" value={values.emergencyName} onChange={v => set('emergencyName', v)} placeholder="Relative name" />
        <FormInput label="Emergency Phone" type="tel" value={values.emergencyPhone} onChange={v => set('emergencyPhone', v)} placeholder="+94 77 000 1111" />
        <FormInput label="Insurance Provider" value={values.insurance} onChange={v => set('insurance', v)} placeholder="AIA" />
        <BranchSelector value={values.branch} onChange={v => set('branch', v)} />
        <FormInput label="Password" type="password" value={values.password} onChange={v => set('password', v)} error={errors.password} placeholder="Strong password" />
        <FormInput label="Confirm Password" type="password" value={values.confirm} onChange={v => set('confirm', v)} error={errors.confirm} placeholder="Repeat password" />
      </div>
      <label className="checkbox">
        <input type="checkbox" checked={values.twofa} onChange={e => set('twofa', e.target.checked)} />
        <span>Enable Two-factor authentication</span>
      </label>
      <Button type="submit" className="btn-primary" disabled={loading}>
        {loading ? <LoadingSpinner size={16} /> : 'Create Account'}
      </Button>
    </form>
  )
}



