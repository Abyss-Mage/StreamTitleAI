// frontend/src/pages/discover/OutliersTab.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { TrendingUp, Search, Loader, AlertCircle, Copy, Check } from 'react-feather';
import '/src/App.css'; // For .input-wrapper, .generate-button, etc.
import './OutliersTab.css'; // New CSS for this component

// Component for a single idea card
function IdeaCard({ idea, onCopy }) {
  return (
    <div className="idea-card">
      <div className="idea-header">
        <TrendingUp size={20} />
        <h4>{idea.title}</h4>
        <CopyButton onCopy={() => onCopy(idea.title)} />
      </div>
      <p className="idea-label">The Concept</p>
      <p className="idea-text">{idea.concept}</p>
      <p className="idea-label">The Hook (First 10s)</p>
      <p className="idea-text">"{idea.hook}"</p>
    </div>
  );
}

// Small copy button component
function CopyButton({ onCopy }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="idea-copy-btn" onClick={handleCopy} title="Copy title">
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
}

function OutliersTab() {
  const [topic, setTopic] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults(null);
    const token = localStorage.getItem('apiToken');

    try {
      const response = await axios.post('/api/v1/ai/discover/outliers', 
        { topic },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setResults(response.data);
    } catch (err) {
      console.error("Error fetching outlier ideas:", err);
      setError("Failed to generate ideas. The AI might be busy. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="outliers-tab">
      <p style={{ color: 'var(--text-secondary)', marginTop: 0, fontSize: '1rem', lineHeight: 1.6 }}>
        Find non-obvious, high-potential video ideas for any topic. The AI will analyze your creator profile to suggest unique angles that match your tone.
      </p>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="input-form" style={{ padding: 0, margin: '20px 0', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
        <div className="input-wrapper" style={{ flexGrow: 1 }}>
          <Search size={20} className="input-icon" />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a game or topic (e.g., Minecraft, Elden Ring, VR)"
            required
          />
        </div>
        <button type="submit" className="generate-button" disabled={isLoading} style={{ padding: '16px 20px' }}>
          {isLoading ? (
            <Loader size={20} className="spinner" />
          ) : (
            <>
              Find Ideas
              <TrendingUp size={20} />
            </>
          )}
        </button>
      </form>

      {/* Results Section */}
      <div className="ideas-results-container">
        {error && (
          <div className="error-message" style={{ marginTop: 0 }}>
            <AlertCircle size={16}/> {error}
          </div>
        )}
        
        {!results && !isLoading && !error && (
          <div className="placeholder-tab" style={{ padding: '40px' }}>
            <TrendingUp size={30} />
            <h3 style={{marginTop: '15px'}}>Find Your Next Hit</h3>
            <p>Enter a topic above to get started.</p>
          </div>
        )}

        {results && (
          <div className="ideas-grid">
            {results.ideas.map((idea, index) => (
              <IdeaCard key={index} idea={idea} onCopy={copyToClipboard} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OutliersTab;