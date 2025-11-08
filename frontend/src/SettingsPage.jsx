// frontend/src/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from './firebase'; // Removed 'storage'
// Removed all 'firebase/storage' imports
import { 
  User, Loader, AlertCircle, Save, 
  Edit3, Volume2, Slash, Link, CheckCircle, Image
} from 'react-feather';
import './App.css';

// Default profile structure, now includes logoUrl
const defaultProfile = {
  tone: '',
  voiceGuidelines: '',
  bannedWords: [],
  defaultCTAs: [],
  logoUrl: '', // <-- ADDED
};

function SettingsPage() {
  // All 'logoUrl' state is now part of the 'profile' state
  const [profile, setProfile] = useState(defaultProfile);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  // --- Load profile from API on mount ---
  useEffect(() => {
    const fetchProfile = async () => {
      setIsProfileLoading(true);
      setProfileError(null);
      try {
        const token = localStorage.getItem('apiToken');
        if (!token) throw new Error("Authentication token not found.");

        const response = await axios.get('/api/v1/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Load logoUrl from localStorage as a fallback (V1 compatibility)
        const storedLogoUrl = localStorage.getItem('userLogoUrl');

        // Ensure data structure is complete
        setProfile({
          ...defaultProfile,
          ...response.data,
          bannedWords: response.data.bannedWords || [],
          defaultCTAs: response.data.defaultCTAs || [],
          logoUrl: response.data.logoUrl || storedLogoUrl || '', // <-- ADDED
        });

      } catch (err) {
        console.error("Error fetching profile:", err);
        setProfileError("Failed to load creator profile.");
      } finally {
        setIsProfileLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // --- Handle simple text input change ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- Handle textarea inputs that need to be arrays ---
  const handleArrayChange = (e) => {
    const { name, value } = e.target;
    const array = value.split('\n').filter(item => item.trim() !== '');
    setProfile(prev => ({
      ...prev,
      [name]: array
    }));
  };

  // --- Handle saving the profile ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const token = localStorage.getItem('apiToken');
      if (!token) throw new Error("Authentication token not found.");

      // 1. Save the entire profile (including logoUrl) to Firestore
      await axios.put('/api/v1/profile', profile, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // 2. ALSO save the logoUrl to localStorage for GeneratorPage
      if (profile.logoUrl) {
        localStorage.setItem('userLogoUrl', profile.logoUrl);
      } else {
        localStorage.removeItem('userLogoUrl');
      }

      setProfileSuccess("Creator profile saved successfully!");

    } catch (err) {
      console.error("Error saving profile:", err);
      // This is the error you saw!
      setProfileError("Failed to save profile. (Did you set IAM permissions?)");
    } finally {
      setIsProfileSaving(false);
    }
  };


  return (
    <div className="settings-page-container">
      
      {/* --- Main Creator Profile Card --- */}
      <div className="results-card" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <h2><Edit3 size={28} /> Creator Profile</h2>
        <p className="settings-subtitle">Define your brand's voice for the AI. This will be used in all future generations.</p>

        {isProfileLoading ? (
          <div className="loading-spinner"></div>
        ) : (
          <form className="settings-form" onSubmit={handleSaveProfile}>
            
            {/* Tone */}
            <div className="form-group">
              <label htmlFor="tone"><Edit3 size={16} /> Tone</label>
              <p>How do you want to sound? (e.g., "Funny, chaotic, and high-energy" or "Calm, informative, and professional")</p>
              <input
                type="text"
                id="tone"
                name="tone"
                value={profile.tone}
                onChange={handleProfileChange}
                placeholder="e.g., Funny, high-energy, and welcoming"
              />
            </div>

            {/* Voice Guidelines */}
            <div className="form-group">
              <label htmlFor="voiceGuidelines"><Volume2 size={16} /> Voice Guidelines</label>
              <p>Specific rules for the AI. (e.g., "Never use emojis," "Always start with a question," "Refer to the audience as 'the squad'")</p>
              <textarea
                id="voiceGuidelines"
                name="voiceGuidelines"
                value={profile.voiceGuidelines}
                onChange={handleProfileChange}
                rows={3}
                placeholder="e.g., Always use 🚀 emojis, never use 'lol'"
              />
            </div>

            {/* Banned Words */}
            <div className="form-group">
              <label htmlFor="bannedWords"><Slash size={16} /> Banned Words (one per line)</label>
              <p>Words the AI should never use in its output. (e.g., competitor names, specific slang)</p>
              <textarea
                id="bannedWords"
                name="bannedWords"
                // \n is used to join the array for display in the textarea
                value={profile.bannedWords.join('\n')}
                onChange={handleArrayChange}
                rows={4}
                placeholder="e.g., MyOldChannelName"
              />
            </div>

            {/* Default CTAs (Call to Actions) */}
            <div className="form-group">
              <label htmlFor="defaultCTAs"><Link size={16} /> Default Links (one per line)</label>
              <p>Links the AI should automatically add to descriptions. (e.g., Discord, Patreon, social media)</p>
              <textarea
                id="defaultCTAs"
                name="defaultCTAs"
                value={profile.defaultCTAs.join('\n')}
                onChange={handleArrayChange}
                rows={4}
                placeholder="e.g., https://discord.gg/my-server"
              />
            </div>

            {/* --- NEW: Logo URL Field --- */}
            <div className="form-group">
              <label htmlFor="logoUrl"><Image size={16} /> Channel Logo URL</label>
              <p>Paste a public URL to your channel logo. (e.g., from Imgur, Discord, or your website). This will be used in thumbnail recipes.</p>
              <input
                type="text"
                id="logoUrl"
                name="logoUrl"
                value={profile.logoUrl}
                onChange={handleProfileChange}
                placeholder="https://i.imgur.com/my-logo.png"
              />
              {profile.logoUrl && (
                <div className="logo-preview" style={{alignItems: 'flex-start'}}>
                  <img src={profile.logoUrl} alt="Logo preview" />
                  <p>Current Logo Preview</p>
                </div>
              )}
            </div>

            {/* Save Button & Messages */}
            <button type="submit" className="generate-button" disabled={isProfileSaving}>
              {isProfileSaving ? (
                <Loader size={20} className="spinner" />
              ) : (
                <>
                  <Save size={20} />
                  Save Creator Profile
                </>
              )}
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