import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // We will create this file for styling

function App() {
  const [gameName, setGameName] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to handle the form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Call our backend API
      const response = await axios.post('http://localhost:3001/api/generate', {
        gameName: gameName,
      });
      setResult(response.data);
    } catch (err)
 {
      console.error('Error fetching data:', err);
      setError('Failed to generate content. Is the backend server running?');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!'); // Simple confirmation
  };

  // Helper to handle newlines in the description for display
  const formatForDisplay = (text) => {
    return text.replace(/\\n/g, '\n');
  };

  return (
    <div className="container">
      <header>
        <h1>🎮 StreamTitle.AI</h1>
        <p>Instant SEO for your gaming content.</p>
      </header>

      {/* --- Input Form (FR-1) --- */}
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          placeholder="Enter a game or modpack name..."
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </form>

      {/* --- Results Section (FR-4) --- */}
      {error && <div className="error-message">{error}</div>}

      {isLoading && <div className="loading-spinner"></div>}

      {result && (
        <div className="results-card">
          <h2>Results for: {result.game}</h2>

          {/* --- YouTube Title --- */}
          <div className="result-item">
            <label>Generated YouTube Title</label>
            <textarea
              readOnly
              value={result.youtube.title}
              onClick={() => copyToClipboard(result.youtube.title)}
            ></textarea>
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(result.youtube.title)}
            >
              Copy
            </button>
          </div>

          {/* --- YouTube Description --- */}
          <div className="result-item">
            <label>Generated YouTube Description</label>
            <textarea
              readOnly
              // We now format the description to show newlines correctly
              value={formatForDisplay(result.youtube.description)}
              rows={18} // Make it much taller
              onClick={() => copyToClipboard(formatForDisplay(result.youtube.description))}
            ></textarea>
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(formatForDisplay(result.youtube.description))}
            >
              Copy
            </button>
          </div>
          
          {/* --- Discord Announcement --- */}
          <div className="result-item">
            <label>Generated Discord Announcement</label>
            <textarea
              readOnly
              value={formatForDisplay(result.discord.announcement)}
              rows={10} // Make it taller
              onClick={() => copyToClipboard(formatForDisplay(result.discord.announcement))}
            ></textarea>
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(formatForDisplay(result.discord.announcement))}
            >
              Copy
            </button>
          </div>

          {/* --- YouTube Tags --- */}
          <div className="result-item">
            <label>Generated YouTube Tags</label>
            <div className="tags-container">
              {result.youtube.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(result.youtube.tags.join(', '))}
            >
              Copy Tags
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;