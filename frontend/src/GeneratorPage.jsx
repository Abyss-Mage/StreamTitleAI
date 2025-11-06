// frontend/src/GeneratorPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { 
  Search, Copy, Youtube, MessageSquare, Hash, ThumbsUp, 
  Globe, AlignLeft, X, Loader, Monitor // Added Monitor
} from 'react-feather';

// Firebase Imports
import { auth, db } from './firebase';
import { addDoc, collection, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';

function GeneratorPage() {
  const [gameName, setGameName] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- NEW: Add Platform State ---
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
        // --- UPDATE: Load new preferences ---
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
    setResult(null);

    // --- UPDATE: Add platform to preferences ---
    const userPreferences = {
      platform: platform,
      language: language,
      descriptionLength: descriptionLength,
    };

    try {
      // --- Get Firebase Auth Token ---
      if (!auth.currentUser) {
        throw new Error("You must be logged in to generate content.");
      }
      const token = await auth.currentUser.getIdToken();

      // --- TASK 1 FIX: Use relative API path ---
      const response = await axios.post('/api/generate', 
        { // Payload
          gameName: gameName,
          ...userPreferences,
        },
        { // Config with Auth Header
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const newResult = { ...response.data };
      setResult(newResult);
      
      // --- TASK 2: SAVE TO FIRESTORE HISTORY ---
      // Check if this exact game was already saved
      const historyCollection = collection(db, 'history');
      const q = query(
        historyCollection,
        where("uid", "==", auth.currentUser.uid),
        where("game", "==", newResult.game),
        limit(1)
      );
      
      const existing = await getDocs(q);
      
      if (existing.empty) {
        // Add new item to firestore
        await addDoc(historyCollection, {
          ...newResult, 
          uid: auth.currentUser.uid, // Tag with user ID
          createdAt: serverTimestamp() // Add timestamp
        });
      } else {
        // We could update the existing one, but for now we'll just skip
        console.log("History item for this game already exists.");
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.response && err.response.status === 404) {
        setError(`'${gameName}' was not found. Please check the spelling.`);
        setResult(err.response.data); 
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
    alert('Copied to clipboard!'); 
  };

  const formatForDisplay = (text) => {
    if (typeof text !== 'string') return '';
    return text.replace(/\\n/g, '\n');
  };

  return (
    <> 
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
        
        {/* --- UPDATE: 3-column settings row --- */}
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

      {error && (
        <div className="error-message">
          <X size={20} /> {error}
        </div>
      )}

      {isLoading && !result && <div className="loading-spinner"></div>}

      {/* --- UPDATE: Use new generic result keys --- */}
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

          {/* Thumbnail Ideas */}
          {result.thumbnailIdeas && (
            <div className="result-item">
              <label><ThumbsUp size={16} /> Generated Thumbnail Ideas</label>
              <div className="thumbnail-ideas-container">
                <p><strong>Idea 1:</strong> {result.thumbnailIdeas.idea_1}</p>
                <p><strong>Idea 2:</strong> {result.thumbnailIdeas.idea_2}</p>
                <p>
                  <strong>Text Overlay:</strong> 
                  <span className="thumbnail-text-tag">{result.thumbnailIdeas.text_overlay}</span>
                </p>
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