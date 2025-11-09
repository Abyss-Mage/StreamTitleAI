// frontend/src/layouts/SidebarLayout.jsx
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; // Import auth
import { signOut } from 'firebase/auth'; // Import signOut
import './DashboardLayout.css'; // We will create this CSS file next
import {
  Grid,
  Search,
  Clock,
  Settings,
  Zap,
  Coffee,
  Sun,
  Moon,
  LogOut
} from 'react-feather';

// Re-using the NavLink logic from App.jsx
const getNavLinkClass = ({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "");

function SidebarLayout({ theme, toggleTheme }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem('apiToken'); // Clear API token on sign out
    navigate('/login'); // Redirect to login after sign out
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <h1 className="sidebar-title">StreamTitle.AI</h1>
        
        <nav className="sidebar-nav">
          <span className="nav-section-title">Dashboard</span>
          <NavLink to="/home" className={getNavLinkClass}>
            <Grid size={18} />
            <span>Home</span>
          </NavLink>

          <span className="nav-section-title">Content Tools</span>
          <NavLink to="/generator" className={getNavLinkClass}>
            <Search size={18} />
            <span>Generator (V2)</span>
          </NavLink>
          <NavLink to="/optimize" className={getNavLinkClass}>
            <Zap size={18} />
            <span>Optimize</span>
          </NavLink>
          <NavLink to="/discover" className={getNavLinkClass}>
            <Coffee size={18} />
            <span>Discover</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <nav className="sidebar-nav">
            <NavLink to="/history" className={getNavLinkClass}>
              <Clock size={18} />
              <span>History</span>
            </NavLink>
            <NavLink to="/settings" className={getNavLinkClass}>
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          </nav>
          
          <div className="sidebar-controls">
            <button onClick={toggleTheme} className="control-btn" title="Toggle theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button onClick={handleSignOut} className="control-btn" title="Sign Out">
              <LogOut size={18} />
            </button>
          </div>
          
          <div className="user-profile">
            {/* This can be expanded later with user info */}
            <div className="user-avatar">
              {auth.currentUser?.email[0].toUpperCase() || '?'}
            </div>
            <span className="user-email">{auth.currentUser?.email}</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {/* All nested routes will render here */}
        <Outlet />
      </main>
    </div>
  );
}

export default SidebarLayout;