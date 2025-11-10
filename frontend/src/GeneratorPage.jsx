// frontend/src/GeneratorPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
// --- FIX: Use absolute paths from /src/ ---
import '/src/App.css';
import { 
  Search, Copy, Youtube, MessageSquare, Hash, ThumbsUp, 
  Globe, AlignLeft, X, Loader, Monitor, Layers,
  User // <-- 1. IMPORT NEW ICON
} from 'react-feather';

// Firebase Imports
import { auth, db } from '/src/firebase'; // --- FIX: Use absolute path
import { addDoc, collection, serverTimestamp, query, where, getDocs, limit } from "firebase/firestore"; 

function GeneratorPage() {
  const [gameName, setGameName] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [platform, setPlatform] = useState('YouTube');
  const [descriptionLength, setDescriptionLength] = useState('Medium');
  const [language, setLanguage] = useState('English');
  
  // --- 2. ADD PROFILE STATE ---
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  // --- END ---

  // Load from History (via sessionStorage)
  useEffect(() => {
    const itemToLoad = sessionStorage.getItem('loadItem');
    if (itemToLoad) {
      try {
        const item = JSON.parse(itemToLoad);
        setResult(item);
        
        const prefs = item.preferences || {};
        setGameName(prefs.originalQuery || item.game);
        setPlatform(prefs.platform || 'YouTube');
        setDescriptionLength(prefs.descriptionLength || 'Medium');
        setLanguage(prefs.language || 'English');
        // Note: We can't easily set the selectedProfileId here
        // as history items don't store it. This is fine for now.

      } catch (e) {
        console.error("Failed to parse item from sessionStorage", e);
      } finally {
        sessionStorage.removeItem('loadItem');
      }
    }
  }, []);

  // --- 3. FETCH PROFILES ON LOAD ---
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const token = localStorage.getItem('apiToken');
        if (!token) return;

        const response = await axios.get('/api/v1/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setProfiles(response.data || []);
        
        // If user has profiles, select the first one by default
        if (response.data && response.data.length > 0) {
          setSelectedProfileId(response.data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch profiles", err);
        setError("Could not load your Creator Profiles. Please check settings.");
      }
    };
    fetchProfiles();
  }, []); // Runs once on page load

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setIsLoading(true);
    setError(null);
    setResult(null); // Clear previous results

    if (profiles.length > 0 && !selectedProfileId) {
        setError("Please select a Creator Profile to use.");
        setIsLoading(false);
        return;
    }

    const userPreferences = {
      platform: platform,
      language: language,
      descriptionLength: descriptionLength,
    };

    try {
      const token = localStorage.getItem('apiToken');
      if (!token) {
        throw new Error("You are not logged in. Please refresh and log in again.");
      }

      // --- FIX: Added /v1/ to the API path ---
      const response = await axios.post('/api/v1/generate', 
        {
          gameName: gameName,
          profileId: selectedProfileId, // <-- 4. SEND THE SELECTED PROFILE ID
          ...userPreferences,
        },
        { 
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      const newResult = { ...response.data };
      setResult(newResult);
      
      // --- SAVE TO FIRESTORE HISTORY ---
      // (This logic is unchanged)
      const historyCollection = collection(db, 'history');
      const q = query(
        historyCollection,
        where("uid", "==", auth.currentUser.uid), 
        where("game", "==", newResult.game),
        where("preferences.platform", "==", newResult.preferences.platform),
        limit(1)
      );
      
      const existing = await getDocs(q);
      
      if (existing.empty && auth.currentUser) { 
        await addDoc(historyCollection, {
          ...newResult, 
          uid: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
      } else {
        console.log("History item for this game/platform already exists.");
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      // --- FIX: Handle errors more safely ---
      if (err.response && err.response.status === 404) {
        const errorMsg = err.response.data?.platformDescription || `The game '${gameName}' was not found. Please check the spelling.`;
        setError(errorMsg);
      } else if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Authentication error. Please log out and log back in.');
      } else {
        setError(err.message || 'Failed to generate content. Is the backend server running?');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatForDisplay = (text) => {
    if (typeof text !== 'string') return '';
    return text.replace(/\\n/g, '\n');
  };

  return (
    <> 
      {/* --- Input Form --- */}
      <form onSubmit={handleSubmit} className="input-form">
         <div className="input-wrapper">
          <Search size={20} className="input-icon" />
          <input
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="Enter a game or modpack name..."
            required
          />
        </div>
        
        {/* --- 5. UPDATED SETTINGS ROW --- */}
        <div className="settings-row">
          
          {/* --- 6. ADDED PROFILE SELECTOR --- */}
          <div className="select-wrapper">
            <User size={16} className="select-icon" />
            <select 
              className="settings-select"
              value={selectedProfileId} 
              onChange={(e) => setSelectedProfileId(e.target.value)}
              disabled={profiles.length === 0}
            >
              <option value="">
                {profiles.length === 0 ? "No profiles found..." : "Select Profile..."}
              </option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>{profile.name}</option>
              ))}
            </select>
          </div>

          <div className="select-wrapper">
            <Monitor size={16} className="select-icon" />
            <select 
              className="settings-select"
              value={platform} 
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="YouTube">YouTube</option>
              <option value="Twitch">Twitch</option>
              <option value="Kick">Kick</option>
            </select>
          </div>

          <div className="select-wrapper">
            <Globe size={16} className="select-icon" />
            <select 
              className="settings-select"
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Japanese">Japanese</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>

          <div className="select-wrapper">
            <AlignLeft size={16} className="select-icon" />
            <select 
              className="settings-select"
              value={descriptionLength}
              onChange={(e) => setDescriptionLength(e.target.value)} 
            >
              <option value="Short">Short</option>
              <option value="Medium">Medium</option>
              <option value="Long">Long</option>
            </select>
          </div>
        </div>
        
        <button type="submit" className="generate-button" disabled={isLoading}>
          {isLoading ? (
            <Loader size={20} className="spinner" />
          ) : (
            <>
              Generate
              <Search size={20} />
            </>
          )}
        </button>
      </form>

      {/* --- Results Section (unchanged) --- */}
      {error && (
        <div className="error-message">
          <X size={20} /> {error}
        </div>
      )}

      {isLoading && !result && <div className="loading-spinner"></div>}

      {result && (
        <div className="results-card">
          <h2>Results for: {result.game}</h2>
          
          {/* ... (all result items are unchanged) ... */}
          {/* Platform Title */}
          <div className="result-item">
            <label><Monitor size={16} /> Generated {platform} Title</label>
            <textarea
              readOnly
              rows={2}
              value={result.platformTitle}
              onClick={() => copyToClipboard(result.platformTitle)}
            ></textarea>
            <button
              className="copy-btn"
              title="Copy to clipboard"
              onClick={() => copyToClipboard(result.platformTitle)}
            >
              <Copy size={16} />
            </button>
          </div>

          {/* Thumbnail Recipe Section */}
          {result.thumbnail && (
            <div className="result-item">
              <label><Layers size={16} /> Generated Thumbnail Recipe</label>
              <div className="thumbnail-ideas-container">
                <p>
                  <strong>Theme:</strong> {result.thumbnail.description}
                </p>
                <p>
                  <strong>Text Overlay:</strong> 
                  <span className="thumbnail-text-tag">{result.thumbnail.text_overlay}</span>
                </p>
                
                <hr style={{ border: 0, borderTop: '1px solid var(--surface-border)', margin: '15px 0' }} />
                
                <strong>Layers (from bottom to top):</strong>
                <ul className="thumbnail-layers-list">
                  {result.thumbnail.layers.map((layer, index) => (
                    <li key={index}>
                      <span className="layer-type-tag">{layer.type}</span>
                      <p>{layer.content}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Platform Description */}
          <div className="result-item">
            <label><AlignLeft size={16} /> Generated {platform} Description</label>
            <textarea
              readOnly
              value={formatForDisplay(result.platformDescription)}
              rows={12} 
              onClick={() => copyToClipboard(formatForDisplay(result.platformDescription))}
            ></textarea>
            <button
              className="copy-btn"
              title="Copy to clipboard"
              onClick={() => copyToClipboard(formatForDisplay(result.platformDescription))}
            >
              <Copy size={16} />
            </button>
          </div>
          
          {/* Discord Announcement */}
          <div className="result-item">
            <label><MessageSquare size={16} /> Generated Discord Announcement</label>
            <textarea
              readOnly
              value={formatForDisplay(result.discordAnnouncement)}
              rows={8} 
              onClick={() => copyToClipboard(formatForDisplay(result.discordAnnouncement))}
            ></textarea>  
            <button
              className="copy-btn"
              title="Copy to clipboard"
              onClick={() => copyToClipboard(formatForDisplay(result.discordAnnouncement))}
            >
              <Copy size={16} />
            </button>
          </div>

          {/* Platform Tags */}
          <div className="result-item">
            <label><Hash size={16} /> Generated {platform} Tags</label>
            <div className="tags-container">
              {result.platformTags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <button
              className="copy-btn"
              title="Copy all tags"
              onClick={() => copyToClipboard(result.platformTags.join(', '))}
            >
              <Copy size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default GeneratorPage;