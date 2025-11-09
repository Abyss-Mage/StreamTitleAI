// frontend/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App'; 
import { 
  Zap, Search, Coffee, Loader, AlertCircle, BarChart2, Award, MessageSquare 
} from 'react-feather';
import '../App.css'; // Re-use existing styles like .results-card

// A small component to display the stats once loaded
function AnalyticsDisplay({ analytics }) {
  const netSubs = (analytics.subscribersGained || 0) - (analytics.subscribersLost || 0);
  
  return (
    <div className="stats-grid">
      <div className="stat-item">
        <span className="stat-value">{Number(analytics.views).toLocaleString()}</span>
        <span className="stat-label">Views</span>
      </div>
      <div className="stat-item">
        <span 
          className="stat-value" 
          style={{ color: netSubs >= 0 ? 'var(--primary-color)' : '#ff8b8b' }}
        >
          {netSubs >= 0 ? '+' : ''}{Number(netSubs).toLocaleString()}
        </span>
        <span className="stat-label">Net Subscribers</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{analytics.channelTitle}</span>
        <span className="stat-label">Channel</span>
      </div>
    </div>
  );
}

function HomePage() {
  const [currentUser] = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(null);

  // Fetch analytics on component mount
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsAnalyticsLoading(true);
      setAnalyticsError(null);
      const token = localStorage.getItem('apiToken');

      if (!token) {
        setAnalyticsError("User token not found.");
        setIsAnalyticsLoading(false);
        return;
      }

      try {
        const response = await axios.get('/api/v1/youtube/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = response.data.analytics;
        if (data.rows && data.rows.length > 0) {
          const result = {
            channelTitle: response.data.channelTitle,
            views: data.rows[0][0],
            subscribersGained: data.rows[0][1],
            subscribersLost: data.rows[0][2],
          };
          setAnalytics(result);
        } else {
          setAnalyticsError("No analytics data returned. Is the channel new?");
        }

      } catch (err) {
        console.error("Error fetching analytics:", err);
        if (err.response && (err.response.status === 404 || err.response.status === 500)) {
          setAnalyticsError("Failed to load stats. Have you connected your YouTube account in Settings?");
        } else {
          setAnalyticsError("An unknown error occurred while fetching stats.");
        }
      } finally {
        setIsAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="home-page">
      <h2 style={{marginTop: 0}}>Welcome back, {currentUser?.displayName || currentUser?.email}!</h2>
      <p style={{color: 'var(--text-secondary)', marginTop: '-15px', fontSize: '1.1rem'}}>
        Here's your V3 dashboard.
      </p>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        
        {/* Card 1: Channel Analytics */}
        <div className="results-card card-span-2">
          <h4 className="card-title"><BarChart2 size={18} /> Channel Analytics (Last 30d)</h4>
          {isAnalyticsLoading ? (
            <div className="loading-spinner" style={{margin: '20px auto'}}></div>
          ) : analyticsError ? (
            <div className="error-message" style={{marginTop: 0}}>{analyticsError}</div>
          ) : analytics ? (
            <AnalyticsDisplay analytics={analytics} />
          ) : (
            <p>No analytics to display.</p>
          )}
        </div>

        {/* Card 2: Daily AI Idea */}
        <div className="results-card placeholder-card">
          <h4 className="card-title"><MessageSquare size={18} /> Daily AI Idea</h4>
          <p className="placeholder-text">"Why you're playing <strong>Stardew Valley</strong> all wrong in 2025"</p>
          <button className="generate-button" disabled style={{width: '100%', marginTop: 'auto'}}>Coming Soon</button>
        </div>
        
        {/* Card 3: Quick Actions */}
        <div className="results-card">
          <h4 className="card-title"><Zap size={18} /> Quick Actions</h4>
          <div className="quick-actions-grid">
            <div className="action-card" onClick={() => navigate('/generator')}>
              <Search size={24} />
              <h4>Generate</h4>
              <p>Create new content</p>
            </div>
            <div className="action-card" onClick={() => navigate('/optimize')}>
              <Zap size={24} />
              <h4>Optimize</h4>
              <p>Analyze a video</p>
            </div>
            <div className="action-card" onClick={() => navigate('/discover')}>
              <Coffee size={24} />
              <h4>Discover</h4>
              <p>Find new trends</p>
            </div>
          </div>
        </div>

        {/* Card 4: Creator XP */}
        <div className="results-card placeholder-card">
          <h4 className="card-title"><Award size={18} /> Creator XP</h4>
          <p className="placeholder-text">You are <strong>Level 3: "Budding Creator"</strong></p>
          <div className="xp-bar">
            <div className="xp-progress" style={{width: '40%'}}></div>
          </div>
          <p className="placeholder-subtext">120/300 XP to next level</p>
          <button className="generate-button" disabled style={{width: '100%', marginTop: 'auto'}}>Coming Soon</button>
        </div>

      </div>
      
      {/* Add new CSS for these cards */}
      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: minmax(200px, auto);
          gap: 24px;
        }

        .results-card {
          margin-top: 0; /* Remove default margin */
          display: flex;
          flex-direction: column;
        }
        
        .card-span-2 {
          grid-column: span 2;
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 0;
          margin-bottom: 20px;
          color: var(--text-primary);
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .action-card {
          background: var(--bg-input);
          border: 1px solid var(--surface-border);
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .action-card:hover {
          border-color: var(--primary-color);
          transform: translateY(-4px);
          box-shadow: 0 4px 20px var(--primary-glow);
        }
        .action-card h4 {
          margin: 10px 0 5px 0;
          color: var(--text-primary);
        }
        .action-card p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        /* Analytics Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          text-align: center;
        }
        .stat-item {
          background: var(--bg-input);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--surface-border);
        }
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          display: block;
          line-height: 1.2;
        }
        .stat-label {
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-weight: 500;
          margin-top: 8px;
          display: block;
        }

        /* Placeholder Cards */
        .placeholder-card {
          background: var(--bg-input);
        }
        .placeholder-text {
          font-size: 1.1rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0;
        }
        .placeholder-subtext {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin: 10px 0 0 0;
        }
        .xp-bar {
          width: 100%;
          height: 10px;
          background: var(--surface-border);
          border-radius: 10px;
          margin-top: 20px;
          overflow: hidden;
        }
        .xp-progress {
          height: 100%;
          background: var(--primary-gradient);
          border-radius: 10px;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .dashboard-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .card-span-2 {
            grid-column: span 1;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default HomePage;