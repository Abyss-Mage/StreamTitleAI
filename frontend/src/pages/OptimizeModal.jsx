// frontend/src/pages/OptimizeModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Loader, X, Zap, ArrowRight, Copy, AlertCircle } from 'react-feather';
import './OptimizeModal.css';
import '/src/App.css'; // For .generate-button, etc.

// Helper to format text for display
const formatForDisplay = (text) => {
  if (typeof text !== 'string') return '';
  return text.replace(/\\n/g, '\n');
};

// Component for a single suggestion
function SuggestionItem({ title, oldText, newText, onCopy }) {
  return (
    <div className="suggestion-item">
      <h4>{title}</h4>
      <div className="comparison-box">
        <div className="text-box old-text">
          <span className="text-label">Original</span>
          <p>{formatForDisplay(oldText) || '(Not provided)'}</p>
        </div>
        <ArrowRight size={20} className="arrow-icon" />
        <div className="text-box new-text">
          <span className="text-label">Suggestion</span>
          <p>{formatForDisplay(newText)}</p>
          <button className="copy-btn" title="Copy Suggestion" onClick={() => onCopy(newText)}>
            <Copy size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function OptimizeModal({ video, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const handleOptimize = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    const token = localStorage.getItem('apiToken');

    try {
      const response = await axios.post('/api/v1/ai/optimize', 
        { videoDetails: video },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setResults(response.data);
    } catch (err) {
      console.error("Error optimizing video:", err);
      setError("Failed to get suggestions. The AI might be busy. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You can add a small "Copied!" notification here later
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={24} />
        </button>
        
        <div className="modal-header">
          <img 
            src={video.snippet.thumbnails.medium.url} 
            alt="thumbnail" 
            className="modal-thumbnail" 
          />
          <div className="modal-header-info">
            <h2>Optimize Video</h2>
            <p>{video.snippet.title}</p>
          </div>
        </div>

        <div className="modal-body">
          {!results && !isLoading && (
            <div className="modal-start-state">
              <p>Click below to get AI suggestions for this video based on its stats and your creator profile.</p>
              <button className="generate-button" onClick={handleOptimize}>
                <Zap size={18} />
                Analyze & Optimize
              </button>
            </div>
          )}

          {isLoading && <div className="loading-spinner" style={{ margin: '40px auto' }}></div>}
          
          {error && <div className="error-message" style={{ margin: 0 }}><AlertCircle size={16}/> {error}</div>}

          {results && (
            <div className="results-container">
              <div className="suggestion-summary">
                <h4><Zap size={16} /> AI Analysis Complete</h4>
                <p>{results.overallSuggestion}</p>
                <div className="score-badge">
                  New Score: <strong>{results.newScore}/100</strong>
                  <span className="old-score">(was {results.originalScore}/100)</span>
                </div>
              </div>
              
              <SuggestionItem 
                title="Suggested Title"
                oldText={video.snippet.title}
                newText={results.newTitle}
                onCopy={copyToClipboard}
              />
              
              <SuggestionItem 
                title="Suggested Description"
                oldText={video.snippet.description}
                newText={results.newDescription}
                onCopy={copyToClipboard}
              />

              <div className="suggestion-item">
                <h4>Suggested Tags</h4>
                <div className="tags-container" style={{background: 'var(--bg-input)'}}>
                  {results.newTags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                  <button 
                    className="copy-btn" 
                    title="Copy all tags" 
                    onClick={() => copyToClipboard(results.newTags.join(', '))}
                    style={{position: 'absolute', top: '12px', right: '12px'}}
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
}