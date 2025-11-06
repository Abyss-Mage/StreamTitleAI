import React, { useState, useEffect } from 'react';
// --- UPDATE: Import NavLink instead of Link ---
import { Routes, Route, NavLink } from 'react-router-dom';
import './App.css'; 

import { Sun, Moon, Clock, Home } from 'react-feather';
import GeneratorPage from './GeneratorPage';
import HistoryPage from './HistoryPage';

function App() {
  
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'dark'
  );

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  return (
    <div className="container">
      
      <header className="app-header">
        <h1 className="main-title">StreamTitle.AI</h1>
        
        <nav className="main-nav">
          {/* --- UPDATE: Use NavLink --- */}
          <NavLink 
            to="/" 
            className={({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "")}
          >
            <Home size={18} />
            <span>Generator</span>
          </NavLink>
          
          {/* --- UPDATE: Use NavLink --- */}
          <NavLink 
            to="/history" 
            className={({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "")}
          >
            <Clock size={18} />
            <span>History</span>
          </NavLink>
        </nav>

        <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </header>
      
      <main>
        <Routes>
          <Route path="/" element={<GeneratorPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>

    </div>
  );
}

export default App;