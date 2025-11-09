// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css'; 
import axios from 'axios'; 

// Firebase Imports
import { auth } from './firebase.js'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Page Imports
import GeneratorPage from './GeneratorPage.jsx';
import HistoryPage from './HistoryPage.jsx';
import LoginPage from './LoginPage.jsx';
import SettingsPage from './SettingsPage.jsx';

// V3 Layout & Page Imports
import SidebarLayout from './layouts/SidebarLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import DiscoverPage from './pages/DiscoverPage.jsx'; 
import OptimizePage from './pages/OptimizePage.jsx';

// A simple component to protect routes
function ProtectedRoute({ children }) {
  const [currentUser] = useAuth();
  if (currentUser === undefined) {
    return <div className="loading-spinner"></div>; // Loading state
  }
  return currentUser ? children : <Navigate to="/login" replace />;
}

// Custom hook to manage auth state - EXPORTED
export function useAuth() {
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
          // Use the V2 endpoint
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
  const [currentUser] = useAuth(); // We still need this for the login check

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  return (
    <>
      <main>
        <Routes>
          <Route 
            path="/login" 
            element={
              currentUser === undefined ? (
                <div className="loading-spinner"></div> // Wait for auth to load
              ) : currentUser ? (
                <Navigate to="/home" replace /> // User is logged in, redirect to NEW home
              ) : (
                <LoginPage /> // User is logged out, show login page
              )
            } 
          />
          
          {/* --- NEW V3 Protected Route Structure --- */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                {/* Pass theme props to the layout */}
                <SidebarLayout theme={theme} toggleTheme={toggleTheme} />
              </ProtectedRoute>
            }
          >
            {/* These routes render inside SidebarLayout's <Outlet /> */}
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home" element={<HomePage />} />
            <Route path="generator" element={<GeneratorPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
            
            {/* V3 Pages */}
            <Route path="optimize" element={<OptimizePage />} />
            <Route path="discover" element={<DiscoverPage />} />
            <Route path="coach" element={<div className="results-card" style={{marginTop: 0}}><h2>AI Coach (Coming Soon)</h2></div>} />
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default App;