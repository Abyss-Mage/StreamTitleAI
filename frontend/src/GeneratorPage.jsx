// frontend/src/GeneratorPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
// --- FIX: Use absolute paths from /src/ ---
import '/src/App.css';
import { 
  Search, Copy, Youtube, MessageSquare, Hash, ThumbsUp, 
  Globe, AlignLeft, X, Loader, Monitor, Layers
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

      } catch (e) {
        console.error("Failed to parse item from sessionStorage", e);
      } finally {
        sessionStorage.removeItem('loadItem');
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setIsLoading(true);
    setError(null);
    setResult(null); // Clear previous results

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
          ...userPreferences,
        },
        { 
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      const newResult = { ...response.data };
      setResult(newResult);
      
      // --- SAVE TO FIRESTORE HISTORY ---
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
      // Do NOT set result on error, as it will crash the render.
      if (err.response && err.response.status === 404) {
        // Use the error message from the backend if it exists, otherwise provide a default.
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
    // Use a more subtle notification later, but alert is fine for now
  };

  const formatForDisplay = (text) => {
    if (typeof text !== 'string') return '';
    return text.replace(/\\n/g, '\n');
  };

  return (
    <> 
      {/* --- Input Form (unchanged) --- */}
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
        
        <div className="settings-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
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

      {/* --- Results Section --- */}
      {error && (
        <div className="error-message">
          <X size={20} /> {error}
        </div>
      )}

      {isLoading && !result && <div className="loading-spinner"></div>}

      {result && (
        <div className="results-card">
          <h2>Results for: {result.game}</h2>

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

          {/* --- Thumbnail Recipe Section --- */}
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
          {/* --- END OF SECTION --- */}

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