import { useState } from 'react';
import './auth.css';
import Login from './Login.jsx';
import SignUp from './SignUp.jsx';

export default function AuthContainer({ onLogin }) {
  const [showLogin, setShowLogin] = useState(true);

  const handleLoginSuccess = () => {
    // Notify parent to mark user as authenticated
    if (onLogin) {
      onLogin();
    }
  };

  const handleSignUpSuccess = () => {
    // After successful signup, switch to login
    setShowLogin(true);
  };

  return (
    <div className="auth-bg">
      <div className={`auth-card ${showLogin ? 'card-sm' : 'card-lg'} ${showLogin ? 'show-login' : 'show-register'}`}>
        {showLogin ? (
          <Login 
            onLogin={handleLoginSuccess} 
            switchToSignUp={() => setShowLogin(false)} 
          />
        ) : (
          <SignUp 
            onSignUp={handleSignUpSuccess}
            switchToLogin={() => setShowLogin(true)} 
          />
        )}
      </div>
    </div>
  );
}

