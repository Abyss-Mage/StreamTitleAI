// frontend/src/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from './firebase'; // <-- REMOVED the underscore
// Removed all 'firebase/storage' imports
import { 
  User, Loader, AlertCircle, Save, 
  Edit3, Volume2, Slash, Link, CheckCircle, Image,
  Youtube, // <-- NEW
  Twitch, // <-- NEW
  Check, // <-- NEW
  X // <-- NEW
} from 'react-feather';
import './App.css';

// --- NEW: Add your YouTube Client ID (from .env) here ---
// You *must* get this from your Google Cloud Console
const YOUTUBE_CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID; 

// Default profile structure, now includes logoUrl
const defaultProfile = {
  tone: '',
  voiceGuidelines: '',
  bannedWords: [],
  defaultCTAs: [],
  logoUrl: '',
};

// --- NEW: Connection Status Component ---
function ConnectionStatus({ service, status, onConnect }) {
  const isConnected = status && status.connected;
  return (
    <div className="connection-item">
      <div className="connection-info">
        {service === 'youtube' ? <Youtube size={24} /> : <Twitch size={24} />}
        <strong>{service === 'youtube' ? 'YouTube' : 'Twitch'}</strong>
        {isConnected ? (
          <span className="status-badge connected">
            <Check size={14} /> Connected
          </span>
        ) : (
          <span className="status-badge disconnected">
            <X size={14} /> Disconnected
          </span>
        )}
      </div>
      {isConnected ? (
        <p className="connection-name">As: {status.channelName}</p>
      ) : (
        <button className="connect-btn" onClick={onConnect}>
          Connect
        </button>
      )}
    </div>
  );
}


function SettingsPage() {
  const [profile, setProfile] = useState(defaultProfile);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  // --- NEW: Connection State ---
  const [connections, setConnections] = useState(null);
  const [isConnectionsLoading, setIsConnectionsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  // --- ADD THESE NEW STATES ---
  const [analytics, setAnalytics] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  // --- END ---
  
  // --- NEW: Google OAuth Client ---
  const [googleCodeClient, setGoogleCodeClient] = useState(null);

  // --- Load profile AND connections from API on mount ---
  useEffect(() => {
    const loadAllSettings = async () => {
      const token = localStorage.getItem('apiToken');
      if (!token) {
        setProfileError("Authentication token not found.");
        setIsProfileLoading(false);
        return;
      }
      
      // Reset errors
      setProfileError(null);
      setConnectionError(null);
      
      // Fetch Profile
      try {
        setIsProfileLoading(true);
        const response = await axios.get('/api/v1/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const storedLogoUrl = localStorage.getItem('userLogoUrl');
        setProfile({
          ...defaultProfile, ...response.data,
          bannedWords: response.data.bannedWords || [],
          defaultCTAs: response.data.defaultCTAs || [],
          logoUrl: response.data.logoUrl || storedLogoUrl || '',
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
        setProfileError("Failed to load creator profile.");
      } finally {
        setIsProfileLoading(false);
      }

      // Fetch Connections
      try {
        setIsConnectionsLoading(true);
        const response = await axios.get('/api/v1/connections', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setConnections(response.data);
      } catch (err) {
        console.error("Error fetching connections:", err);
        setConnectionError("Failed to load channel connections.");
      } finally {
        setIsConnectionsLoading(false);
      }
    };

    loadAllSettings();
  }, []);

  // --- NEW: Initialize Google Code Client ---
  useEffect(() => {
    if (window.google && YOUTUBE_CLIENT_ID) {
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: YOUTUBE_CLIENT_ID,
        // These are the scopes our V2 plan requires
        scope: [
          'https://www.googleapis.com/auth/youtube.force-ssl', // Manage videos
          'https://www.googleapis.com/auth/yt-analytics.readonly', // Read analytics
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ].join(' '),
        callback: (response) => {
          // This callback runs after user grants permission
          handleYouTubeCode(response.code);
        },
      });
      setGoogleCodeClient(client);
    } else {
      console.warn("Google GSI client or YOUTUBE_CLIENT_ID is missing.");
    }
  }, [window.google, YOUTUBE_CLIENT_ID]);

  // --- NEW: Handle YouTube Connect Button Click ---
  const handleConnectYouTube = () => {
    if (googleCodeClient) {
      googleCodeClient.requestCode();
    } else {
      setConnectionError("YouTube client is not initialized. Are you missing your Client ID?");
    }
  };

  // --- NEW: Send one-time code to backend ---
  const handleYouTubeCode = async (code) => {
    setConnectionError(null);
    setIsConnectionsLoading(true); // Show spinner
    try {
      const token = localStorage.getItem('apiToken');
      const response = await axios.post('/api/v1/auth/connect/youtube', 
        { code },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Refresh connection status
      setConnections(prev => ({
        ...prev,
        youtube: { connected: true, channelName: response.data.channelName }
      }));
      
    } catch (err) {
      console.error("Error connecting YouTube:", err);
      setConnectionError("Failed to connect YouTube account. Please try again.");
    } finally {
      setIsConnectionsLoading(false);
    }
  };

  // --- NEW: Handle Fetch Analytics Button Click ---
  const handleFetchAnalytics = async () => {
    setIsAnalyticsLoading(true);
    setAnalyticsError(null);
    setAnalytics(null);

    try {
      const token = localStorage.getItem('apiToken');
      const response = await axios.get('/api/v1/youtube/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = response.data.analytics;
      const result = {
        channelTitle: response.data.channelTitle,
        views: data.rows[0][0],
        subscribersGained: data.rows[0][1],
        subscribersLost: data.rows[0][2],
      };
      setAnalytics(result);
      
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setAnalyticsError("Failed to fetch analytics. Please try again.");
    } finally {
      setIsAnalyticsLoading(false);
    }
  };
  
  // --- (Profile change and save handlers are unchanged) ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (e) => {
    const { name, value } = e.target;
    const array = value.split('\n').filter(item => item.trim() !== '');
    setProfile(prev => ({ ...prev, [name]: array }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      const token = localStorage.getItem('apiToken');
      if (!token) throw new Error("Authentication token not found.");
      await axios.put('/api/v1/profile', profile, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profile.logoUrl) {
        localStorage.setItem('userLogoUrl', profile.logoUrl);
      } else {
        localStorage.removeItem('userLogoUrl');
      }
      setProfileSuccess("Creator profile saved successfully!");
    } catch (err) {
      console.error("Error saving profile:", err);
      setProfileError("Failed to save profile. (Did you set IAM permissions?)");
    } finally {
      setIsProfileSaving(false);
    }
  };


  return (
    <div className="settings-page-container">
      
      {/* --- NEW: Channel Connections Card --- */}
      <div className="results-card" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <h2><Link size={28} /> Channel Connections</h2>
        <p className="settings-subtitle">Connect your accounts to power V2 analytics and enable one-click publishing.</p>
        
        {isConnectionsLoading ? (
          <div className="loading-spinner"></div>
        ) : (
          <div className="connections-list">
            {connectionError && <div className="error-message" style={{ marginBottom: '15px' }}>{connectionError}</div>}
            
            <ConnectionStatus 
              service="youtube" 
              status={connections?.youtube} 
              onConnect={handleConnectYouTube}
            />

            {/* --- ADD THIS SECTION --- */}
            {connections?.youtube.connected && (
              <div className="analytics-section">
                <button 
                  className="connect-btn" 
                  onClick={handleFetchAnalytics} 
                  disabled={isAnalyticsLoading}
                  style={{background: 'var(--bg-tag)', color: 'var(--text-primary)'}}
                >
                  {isAnalyticsLoading ? <Loader size={16} className="spinner" /> : 'Fetch Last 30d Analytics'}
                </button>

                {analyticsError && <div className="error-message" style={{marginTop: '15px'}}>{analyticsError}</div>}
                
                {analytics && (
                  <div className="analytics-results">
                    <h4>Analytics for: {analytics.channelTitle}</h4>
                    <p>Views: <strong>{analytics.views}</strong></p>
                    <p>New Subs: <strong>{analytics.subscribersGained}</strong></p>
                    <p>Subs Lost: <strong>{analytics.subscribersLost}</strong></p>
                  </div>
                )}
              </div>
            )}
            {/* --- END OF SECTION --- */}
            
            <ConnectionStatus 
              service="twitch" 
              status={connections?.twitch} 
              onConnect={() => alert('Twitch connection coming soon!')}
            />
          </div>
        )}
      </div>

      {/* --- Main Creator Profile Card (Unchanged) --- */}
      <div className="results-card" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <h2><Edit3 size={28} /> Creator Profile</h2>
        <p className="settings-subtitle">Define your brand's voice for the AI. This will be used in all future generations.</p>

        {isProfileLoading ? (
          <div className="loading-spinner"></div>
        ) : (
          <form className="settings-form" onSubmit={handleSaveProfile}>
            
            <div className="form-group">
              <label htmlFor="tone"><Edit3 size={16} /> Tone</label>
              <p>How do you want to sound? (e.g., "Funny, chaotic, and high-energy" or "Calm, informative, and professional")</p>
              <input type="text" id="tone" name="tone" value={profile.tone} onChange={handleProfileChange} placeholder="e.g., Funny, high-energy, and welcoming" />
            </div>

            <div className="form-group">
              <label htmlFor="voiceGuidelines"><Volume2 size={16} /> Voice Guidelines</label>
              <p>Specific rules for the AI. (e.g., "Never use emojis," "Always start with a question," "Refer to the audience as 'the squad'")</p>
              <textarea id="voiceGuidelines" name="voiceGuidelines" value={profile.voiceGuidelines} onChange={handleProfileChange} rows={3} placeholder="e.g., Always use 🚀 emojis, never use 'lol'" />
            </div>

            <div className="form-group">
              <label htmlFor="bannedWords"><Slash size={16} /> Banned Words (one per line)</label>
              <p>Words the AI should never use in its output. (e.g., competitor names, specific slang)</p>
              <textarea id="bannedWords" name="bannedWords" value={profile.bannedWords.join('\n')} onChange={handleArrayChange} rows={4} placeholder="e.g., MyOldChannelName" />
            </div>

            <div className="form-group">
              <label htmlFor="defaultCTAs"><Link size={16} /> Default Links (one per line)</label>
              <p>Links the AI should automatically add to descriptions. (e.g., Discord, Patreon, social media)</p>
              <textarea id="defaultCTAs" name="defaultCTAs" value={profile.defaultCTAs.join('\n')} onChange={handleArrayChange} rows={4} placeholder="e.g., https://discord.gg/my-server" />
            </div>

            <div className="form-group">
              <label htmlFor="logoUrl"><Image size={16} /> Channel Logo URL</label>
              <p>Paste a public URL to your channel logo. (e.g., from Imgur, Discord, or your website). This will be used in thumbnail recipes.</p>
              <input type="text" id="logoUrl" name="logoUrl" value={profile.logoUrl} onChange={handleProfileChange} placeholder="https://i.imgur.com/my-logo.png" />
              {profile.logoUrl && (
                <div className="logo-preview" style={{alignItems: 'flex-start'}}>
                  <img src={profile.logoUrl} alt="Logo preview" />
                  <p>Current Logo Preview</p>
                </div>
              )}
            </div>

            <button type="submit" className="generate-button" disabled={isProfileSaving}>
              {isProfileSaving ? <Loader size={20} className="spinner" /> : <><Save size={20} /> Save Creator Profile</>}
            </button>

            {profileError && <div className="error-message" style={{ marginTop: '15px' }}><AlertCircle size={16} /> {profileError}</div>}
            {profileSuccess && <div className="success-message" style={{ marginTop: '15px' }}><CheckCircle size={16} /> {profileSuccess}</div>}

          </form>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;