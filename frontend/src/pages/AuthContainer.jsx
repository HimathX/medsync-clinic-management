import { useState } from 'react'
import '../auth.css'
import LoginForm from '../components/auth/LoginForm.jsx'
import RegistrationForm from '../components/auth/RegistrationForm.jsx'
import Modal from '../components/auth/Modal.jsx'

export default function AuthContainer() {
  const [mode, setMode] = useState('login')
  const [forgotOpen, setForgotOpen] = useState(false)
  const isLogin = mode === 'login'

  return (
    <div className="auth-bg">
      <div className={`auth-card ${isLogin ? 'card-sm' : 'card-lg'} ${isLogin ? 'show-login' : 'show-register'}`}>
        <div className="auth-header">
          <h1>MedSync</h1>
          <p className="muted">{isLogin ? 'Welcome back' : 'Create your account'}</p>
        </div>
        <div className="auth-views">
          <div className="view view-login">
            <LoginForm onForgot={() => setForgotOpen(true)} onSuccess={() => alert('Logged in!')} />
            <p className="muted link-row">Don't have an account? <button className="link" onClick={() => setMode('register')}>Sign Up</button></p>
          </div>
          <div className="view view-register">
            <RegistrationForm onSuccess={() => setMode('login')} />
            <p className="muted link-row">Already have an account? <button className="link" onClick={() => setMode('login')}>Login</button></p>
          </div>
        </div>
      </div>

      {forgotOpen && (
        <Modal title="Reset your password" onClose={() => setForgotOpen(false)}>
          <p className="muted">Enter your email to receive a reset link.</p>
          <form className="stack-3" onSubmit={(e) => { e.preventDefault(); setForgotOpen(false); alert('Reset link sent'); }}>
            <input className="input" type="email" placeholder="you@example.com" required />
            <div className="actions-row">
              <button type="button" className="btn-outline" onClick={() => setForgotOpen(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Send Link</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}



