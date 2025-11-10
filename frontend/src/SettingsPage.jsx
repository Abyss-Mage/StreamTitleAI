// frontend/src/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Loader, AlertCircle, Save, 
  Edit3, Volume2, Slash, Link, CheckCircle, Image,
  Youtube, Twitch, Check, X,
  Plus, Trash // <-- 1. IMPORT NEW ICONS
} from 'react-feather';
import './App.css';

// --- NEW: CSS for the profile manager ---
const profileManagerStyles = `
  .profile-manager-header {
    display: flex;
    gap: 10px;
    margin-bottom: 25px;
  }
  .profile-manager-header .select-wrapper {
    flex-grow: 1; /* Make dropdown fill space */
  }
  .profile-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-color);
    border: 1px solid var(--surface-border);
    color: var(--text-secondary);
    width: 44px;
    height: 44px;
    padding: 0;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .profile-btn:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
  .profile-btn.delete:hover {
    border-color: #E53E3E;
    color: #E53E3E;
  }
`;

// --- (ConnectionStatus component is unchanged) ---
const YOUTUBE_CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID; 
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
  // --- 2. UPDATED PROFILE STATE ---
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  // --- (end) ---
  
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  // --- (Connection & Analytics states are unchanged) ---
  const [connections, setConnections] = useState(null);
  const [isConnectionsLoading, setIsConnectionsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [googleCodeClient, setGoogleCodeClient] = useState(null);

  // --- 3. HELPER TO GET CURRENT PROFILE ---
  const currentProfile = profiles.find(p => p.id === selectedProfileId) || null;

  // --- 4. LOAD ALL SETTINGS (Profile logic is updated) ---
  useEffect(() => {
    const loadAllSettings = async () => {
      const token = localStorage.getItem('apiToken');
      if (!token) {
        setProfileError("Authentication token not found.");
        setIsProfileLoading(false);
        return;
      }
      
      setProfileError(null);
      setConnectionError(null);
      
      // --- Fetch Profiles (NEW LOGIC) ---
      try {
        setIsProfileLoading(true);
        const response = await axios.get('/api/v1/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const fetchedProfiles = response.data || [];
        setProfiles(fetchedProfiles);
        if (fetchedProfiles.length > 0) {
          setSelectedProfileId(fetchedProfiles[0].id); // Select first profile
        }
      } catch (err) {
        console.error("Error fetching profiles:", err);
        setProfileError("Failed to load creator profiles.");
      } finally {
        setIsProfileLoading(false);
      }
      // --- (end new profile logic) ---

      // --- (Connection fetch logic is unchanged) ---
      try {
        setIsConnectionsLoading(true);
        const response = await axios.get('/api/v1/youtube/connections', {
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

  // --- (Google Client init is unchanged) ---
  useEffect(() => {
    if (window.google && YOUTUBE_CLIENT_ID) {
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: YOUTUBE_CLIENT_ID,
        scope: [
          'https://www.googleapis.com/auth/youtube.force-ssl',
          'https://www.googleapis.com/auth/yt-analytics.readonly',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ].join(' '),
        callback: (response) => {
          handleYouTubeCode(response.code);
        },
      });
      setGoogleCodeClient(client);
    } else {
      console.warn("Google GSI client or YOUTUBE_CLIENT_ID is missing.");
    }
  }, [YOUTUBE_CLIENT_ID]); // Dependency update

  // --- (YouTube connection handlers are unchanged) ---
  const handleConnectYouTube = () => {
    if (googleCodeClient) {
      googleCodeClient.requestCode();
    } else {
      setConnectionError("YouTube client is not initialized.");
    }
  };
  const handleYouTubeCode = async (code) => {
    setConnectionError(null);
    setIsConnectionsLoading(true);
    try {
      const token = localStorage.getItem('apiToken');
      const response = await axios.post('/api/v1/auth/connect/youtube', 
        { code },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
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
  
  // --- 5. UPDATED PROFILE HANDLERS ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    // Update the profile in the main 'profiles' array
    setProfiles(prevProfiles =>
      prevProfiles.map(p =>
        p.id === selectedProfileId ? { ...p, [name]: value } : p
      )
    );
  };

  const handleArrayChange = (e) => {
    const { name, value } = e.target;
    const array = value.split('\n').filter(item => item.trim() !== '');
    setProfiles(prevProfiles =>
      prevProfiles.map(p =>
        p.id === selectedProfileId ? { ...p, [name]: array } : p
      )
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentProfile) return; // No profile selected to save

    setIsProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      const token = localStorage.getItem('apiToken');
      if (!token) throw new Error("Authentication token not found.");
      
      // Use the new UPDATE endpoint
      await axios.put(`/api/v1/profile/${currentProfile.id}`, currentProfile, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setProfileSuccess(`Profile "${currentProfile.name}" saved successfully!`);
    } catch (err) {
      console.error("Error saving profile:", err);
      setProfileError("Failed to save profile.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  // --- 6. NEW PROFILE HANDLERS (CREATE & DELETE) ---
  const handleNewProfile = async () => {
    const name = prompt("Enter a name for the new profile:", `Profile ${profiles.length + 1}`);
    if (!name || name.trim() === '') return;

    setIsProfileSaving(true);
    setProfileError(null);
    try {
      const token = localStorage.getItem('apiToken');
      // Use the new CREATE endpoint
      const response = await axios.post('/api/v1/profile', 
        { name },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      const newProfile = response.data;
      setProfiles(prev => [...prev, newProfile]); // Add to state
      setSelectedProfileId(newProfile.id); // Auto-select it
      setProfileSuccess(`Profile "${newProfile.name}" created!`);

    } catch (err) {
      console.error("Error creating profile:", err);
      setProfileError("Failed to create profile.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!currentProfile) return;
    
    if (!window.confirm(`Are you sure you want to delete the profile "${currentProfile.name}"? This cannot be undone.`)) {
      return;
    }

    setIsProfileSaving(true);
    setProfileError(null);
    try {
      const token = localStorage.getItem('apiToken');
      // Use the new DELETE endpoint
      await axios.delete(`/api/v1/profile/${currentProfile.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Remove from state
      const newProfiles = profiles.filter(p => p.id !== currentProfile.id);
      setProfiles(newProfiles);
      
      // Select a new profile (or null if empty)
      setSelectedProfileId(newProfiles.length > 0 ? newProfiles[0].id : null);
      setProfileSuccess(`Profile "${currentProfile.name}" deleted.`);

    } catch (err) {
      console.error("Error deleting profile:", err);
      setProfileError("Failed to delete profile.");
    } finally {
      setIsProfileSaving(false);
    }
  };


  return (
    <div className="settings-page-container">
      {/* Inject new styles */}
      <style>{profileManagerStyles}</style>

      {/* --- (Channel Connections Card is unchanged) --- */}
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
            <ConnectionStatus 
              service="twitch" 
              status={connections?.twitch} 
              onConnect={() => alert('Twitch connection coming soon!')}
            />
          </div>
        )}
      </div>

      {/* --- 7. UPDATED Creator Profile Card --- */}
      <div className="results-card" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <h2><Edit3 size={28} /> Creator Profiles</h2>
        <p className="settings-subtitle">Manage your AI brand profiles. The selected profile is used for all AI generations.</p>

        {isProfileLoading ? (
          <div className="loading-spinner"></div>
        ) : (
          <>
            {/* --- Profile Selector UI --- */}
            <div className="profile-manager-header">
              <div className="select-wrapper">
                <User size={16} className="select-icon" />
                <select 
                  className="settings-select"
                  value={selectedProfileId || ''} 
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  disabled={profiles.length === 0}
                >
                  <option value="" disabled>
                    {profiles.length === 0 ? "No profiles. Create one!" : "Select a profile to edit..."}
                  </option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <button className="profile-btn" title="New Profile" onClick={handleNewProfile}>
                <Plus size={20} />
              </button>
              <button 
                className="profile-btn delete" 
                title="Delete Selected Profile" 
                onClick={handleDeleteProfile}
                disabled={!currentProfile}
              >
                <Trash size={20} />
              </button>
            </div>

            {/* --- Form (now conditional) --- */}
            {currentProfile ? (
              <form className="settings-form" onSubmit={handleSaveProfile}>
                <div className="form-group">
                  <label htmlFor="name"><Edit3 size={16} /> Profile Name</label>
                  <input type="text" id="name" name="name" value={currentProfile.name} onChange={handleProfileChange} placeholder="e.g., Main Channel" />
                </div>
                <div className="form-group">
                  <label htmlFor="tone"><Edit3 size={16} /> Tone</label>
                  <p>How do you want to sound? (e.g., "Funny, chaotic" or "Calm, informative")</p>
                  <input type="text" id="tone" name="tone" value={currentProfile.tone} onChange={handleProfileChange} placeholder="e.g., Funny, high-energy, and welcoming" />
                </div>
                <div className="form-group">
                  <label htmlFor="voiceGuidelines"><Volume2 size={16} /> Voice Guidelines</label>
                  <p>Specific rules. (e.g., "Never use emojis," "Always start with a question")</p>
                  <textarea id="voiceGuidelines" name="voiceGuidelines" value={currentProfile.voiceGuidelines} onChange={handleProfileChange} rows={3} placeholder="e.g., Always use 🚀 emojis, never use 'lol'" />
                </div>
                <div className="form-group">
                  <label htmlFor="bannedWords"><Slash size={16} /> Banned Words (one per line)</label>
                  <textarea id="bannedWords" name="bannedWords" value={currentProfile.bannedWords.join('\n')} onChange={handleArrayChange} rows={4} placeholder="e.g., MyOldChannelName" />
                </div>
                <div className="form-group">
                  <label htmlFor="defaultCTAs"><Link size={16} /> Default Links (one per line)</label>
                  <textarea id="defaultCTAs" name="defaultCTAs" value={currentProfile.defaultCTAs.join('\n')} onChange={handleArrayChange} rows={4} placeholder="e.g., https://discord.gg/my-server" />
                </div>
                <div className="form-group">
                  <label htmlFor="logoUrl"><Image size={16} /> Channel Logo URL</label>
                  <p>Paste a public URL to your channel logo for thumbnail recipes.</p>
                  <input type="text" id="logoUrl" name="logoUrl" value={currentProfile.logoUrl} onChange={handleProfileChange} placeholder="https://i.imgur.com/my-logo.png" />
                  {currentProfile.logoUrl && (
                    <div className="logo-preview" style={{alignItems: 'flex-start'}}>
                      <img src={currentProfile.logoUrl} alt="Logo preview" />
                      <p>Current Logo Preview</p>
                    </div>
                  )}
                </div>

                <button type="submit" className="generate-button" disabled={isProfileSaving}>
                  {isProfileSaving ? <Loader size={20} className="spinner" /> : <><Save size={20} /> Save Profile "{currentProfile.name}"</>}
                </button>
              </form>
            ) : (
              <div className="history-empty" style={{padding: 20, background: 'var(--bg-input)'}}>
                <User size={30} />
                <h3 style={{marginTop: 15}}>No Profile Selected</h3>
                <p>Select a profile from the dropdown or create a new one to get started.</p>
              </div>
            )}
            
            {/* --- (Error/Success messages) --- */}
            {profileError && <div className="error-message" style={{ marginTop: '15px' }}><AlertCircle size={16} /> {profileError}</div>}
            {profileSuccess && <div className="success-message" style={{ marginTop: '15px' }}><CheckCircle size={16} /> {profileSuccess}</div>}
          </>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;