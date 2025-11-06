// frontend/src/LoginPage.jsx
import React, { useState } from 'react';
import { auth } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { User, Mail, Lock, LogIn, Monitor } from 'react-feather';
import './App.css'; // Reuse existing styles

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="input-form" style={{ maxWidth: '400px', margin: '40px auto' }}>
      <h2 style={{ textAlign: 'center', marginTop: 0 }}>
        <Monitor size={28} /> {isLogin ? 'Login' : 'Sign Up'}
      </h2>
      
      <form onSubmit={handleSubmit} className="input-form" style={{ padding: 0, marginTop: 0, gap: 16 }}>
        <div className="input-wrapper">
          <Mail size={20} className="input-icon" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            autoComplete="email"
          />
        </div>
        <div className="input-wrapper">
          <Lock size={20} className="input-icon" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (6+ characters)"
            required
            autoComplete="current-password"
            minLength={6}
          />
        </div>
        
        {error && <div className="error-message" style={{ marginTop: 0 }}>{error}</div>}

        <button type="submit" className="generate-button">
          {isLogin ? 'Login' : 'Create Account'}
          <LogIn size={20} />
        </button>
      </form>
      
      <button 
        onClick={handleGoogleSignIn} 
        className="generate-button"
        style={{ background: 'var(--bg-tag)', color: 'var(--text-primary)', marginTop: '10px' }}
      >
        Sign in with Google
      </button>
      
      <button 
        onClick={() => setIsLogin(!isLogin)} 
        style={toggleFormButtonStyle}
      >
        {isLogin ? "Need an account? Sign Up" : "Have an account? Login"}
      </button>
    </div>
  );
}

// Simple style for the toggle button
const toggleFormButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '10px',
  width: '100%',
  marginTop: '10px'
};

export default LoginPage;