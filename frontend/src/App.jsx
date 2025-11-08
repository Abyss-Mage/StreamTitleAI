// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import './App.css'; 
import { Sun, Moon, Clock, Home, LogIn, LogOut, Settings } from 'react-feather';
import axios from 'axios'; // <-- IMPORT AXIOS

// Firebase Imports
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Page Imports
import GeneratorPage from './GeneratorPage';
import HistoryPage from './HistoryPage';
import LoginPage from './LoginPage';
import SettingsPage from './SettingsPage';

// A simple component to protect routes
function ProtectedRoute({ children }) {
  const [currentUser] = useAuth();
  if (currentUser === undefined) {
    return <div className="loading-spinner"></div>; // Loading state
  }
  return currentUser ? children : <Navigate to="/login" replace />;
}

// Custom hook to manage auth state
function useAuth() {
  const [currentUser, setCurrentUser] = useState(undefined); // Start as undefined to check auth
  
  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // --- V2 AUTH FLOW ---
        try {
          // 1. Get Firebase ID Token
          const idToken = await user.getIdToken();
          
          // 2. Exchange it for our custom API JWT
          const response = await axios.post('/api/v1/auth/exchange', { token: idToken });
          const { apiToken } = response.data;

          // 3. Store the new API JWT
          localStorage.setItem('apiToken', apiToken);
          
          setCurrentUser(user);

        } catch (error) {
          console.error("Auth Exchange Error:", error);
          // Failed to get API token, force sign out
          await signOut(auth);
          setCurrentUser(null);
          localStorage.removeItem('apiToken');
        }
        // --- END V2 FLOW ---

      } else {
        // User is signed out
        setCurrentUser(null);
        localStorage.removeItem('apiToken');
      }
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  
  return [currentUser];
}

function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'dark'
  );
  const [currentUser] = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem('apiToken'); // Clear API token on sign out
    navigate('/login'); // Redirect to login after sign out
  };
  
  return (
    <div className="container">
      
      <header className="app-header">
        <h1 className="main-title">StreamTitle.AI</h1>
        
        {currentUser && (
          <nav className="main-nav">
            <NavLink 
              to="/" 
              className={({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "")}
            >
              <Home size={18} />
              <span>Generator</span>
            </NavLink>
            
            <NavLink 
              to="/history" 
              className={({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "")}
            >
              <Clock size={18} />
              <span>History</span>
            </NavLink>

            <NavLink 
              to="/settings" 
              className={({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "")}
            >
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          </nav>
        )}

        {currentUser ? (
          <button onClick={handleSignOut} className="theme-toggle-btn" title="Sign Out">
            <LogOut size={20} />
          </button>
        ) : (
          <NavLink 
            to="/login" 
            className="theme-toggle-btn"
            title="Login"
            style={{ textDecoration: 'none' }}
          >
            <LogIn size={20} />
          </NavLink>
        )}
        
        <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </header>
      
      <main>
        <Routes>
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <GeneratorPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              currentUser === undefined ? (
                <div className="loading-spinner"></div> // Wait for auth to load
              ) : currentUser ? (
                <Navigate to="/" replace /> // User is logged in, redirect to generator
              ) : (
                <LoginPage /> // User is logged out, show login page
              )
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

    </div>
  );
}

export default App;