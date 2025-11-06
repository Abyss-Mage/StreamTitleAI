// frontend/src/GeneratorPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // We still use the main styles
import { 
  Search, Copy, Youtube, MessageSquare, Hash, ThumbsUp, 
  Globe, AlignLeft, X, Loader
} from 'react-feather';

// This is the main generator page
function GeneratorPage() {
  const [gameName, setGameName] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [descriptionLength, setDescriptionLength] = useState('Medium');
  const [language, setLanguage] = useState('English');
  
  // --- NEW: Load from History (via sessionStorage) ---
  // This effect runs once on mount to check if we navigated
  // from the history page.
  useEffect(() => {
    const itemToLoad = sessionStorage.getItem('loadItem');
    if (itemToLoad) {
      try {
        const item = JSON.parse(itemToLoad);
        setResult(item);
        
        // Load preferences from the item
        const prefs = item.preferences || {};
        setGameName(prefs.originalQuery || item.game);
        setDescriptionLength(prefs.descriptionLength || 'Medium');
        setLanguage(prefs.language || 'English');

      } catch (e) {
        console.error("Failed to parse item from sessionStorage", e);
      } finally {
        // Clear the item so it doesn't load again on refresh
        sessionStorage.removeItem('loadItem');
      }
    }
  }, []); // Empty array ensures this runs only once on mount

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setIsLoading(true);
    setError(null);
    setResult(null);

    const userPreferences = {
      language: language,
      descriptionLength: descriptionLength,
    };

    try {
      const response = await axios.post('https://a12911800d90.ngrok-free.app/api/generate', {
        gameName: gameName,
        ...userPreferences,
      });
      
      const newResult = { ...response.data };
      setResult(newResult);
      
      // --- SAVE TO HISTORY (localStorage) ---
      // We don't manage history state here, just save it
      const storedHistory = localStorage.getItem('streamTitleHistory');
      const history = storedHistory ? JSON.parse(storedHistory) : [];
      
      // Add a unique ID and the full result
      const newHistoryItem = { 
        ...newResult, 
        id: new Date().toISOString() 
      };
      
      // Add new item to the front, preventing duplicates of the same game
      const updatedHistory = [newHistoryItem, ...history.filter(item => item.game !== newResult.game)];
      localStorage.setItem('streamTitleHistory', JSON.stringify(updatedHistory));

    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.response && err.response.status === 404) {
        setError(`'${gameName}' was not found. Please check the spelling.`);
        setResult(err.response.data); 
      } else {
        setError('Failed to generate content. Is the backend server running?');
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
    // We remove the outer <div className="container">, as App.jsx will provide it
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
        
        <div className="settings-row">
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
              <option value="Short">Short Desc.</option>
              <option value="Medium">Medium Desc.</option>
              <option value="Long">Long Desc.</option>
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

          {/* YouTube Title */}
          <div className="result-item">
            <label><Youtube size={16} /> Generated YouTube Title</label>
            <textarea
              readOnly
              rows={2}
              value={result.youtube.title}
              onClick={() => copyToClipboard(result.youtube.title)}
            ></textarea>
            <button
              className="copy-btn"
              title="Copy to clipboard"
              onClick={() => copyToClipboard(result.youtube.title)}
            >
              <Copy size={16} />
            </button>
          </div>

          {/* Thumbnail Ideas */}
          {result.thumbnail && (
            <div className="result-item">
              <label><ThumbsUp size={16} /> Generated Thumbnail Ideas</label>
              <div className="thumbnail-ideas-container">
                <p><strong>Idea 1:</strong> {result.thumbnail.idea_1}</p>
                <p><strong>Idea 2:</strong> {result.thumbnail.idea_2}</p>
                <p>
                  <strong>Text Overlay:</strong> 
                  <span className="thumbnail-text-tag">{result.thumbnail.text_overlay}</span>
                </p>
              </div>
            </div>
          )}

          {/* YouTube Description */}
          <div className="result-item">
            <label><AlignLeft size={16} /> Generated YouTube Description</label>
            <textarea
              readOnly
              value={formatForDisplay(result.youtube.description)}
              rows={12} 
              onClick={() => copyToClipboard(formatForDisplay(result.youtube.description))}
            ></textarea>
            <button
              className="copy-btn"
              title="Copy to clipboard"
              onClick={() => copyToClipboard(formatForDisplay(result.youtube.description))}
            >
              <Copy size={16} />
            </button>
          </div>
          
          {/* Discord Announcement */}
          <div className="result-item">
            <label><MessageSquare size={16} /> Generated Discord Announcement</label>
            <textarea
              readOnly
              value={formatForDisplay(result.discord.announcement)}
              rows={8} 
              onClick={() => copyToClipboard(formatForDisplay(result.discord.announcement))}
            ></textarea>  
            <button
              className="copy-btn"
              title="Copy to clipboard"
              onClick={() => copyToClipboard(formatForDisplay(result.discord.announcement))}
            >
              <Copy size={16} />
            </button>
          </div>

          {/* YouTube Tags */}
          <div className="result-item">
            <label><Hash size={16} /> Generated YouTube Tags</label>
            <div className="tags-container">
              {result.youtube.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <button
              className="copy-btn"
              title="Copy all tags"
              onClick={() => copyToClipboard(result.youtube.tags.join(', '))}
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