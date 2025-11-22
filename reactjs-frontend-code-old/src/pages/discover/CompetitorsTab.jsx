// frontend/src/pages/discover/CompetitorsTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Loader, AlertCircle, Users, Zap, Eye } from 'react-feather';
import '../../App.css'; // For shared styles
import './CompetitorsTab.css'; // New CSS file for this tab

// Component for the results
function CompetitorResults({ results }) {
  const { competitorAnalysis, contentGaps, videoIdeas } = results;

  return (
    <div className="competitor-results-grid">
      
      {/* Column 1: Analysis */}
      <div className="competitor-col">
        <div className="competitor-card">
          <div className="competitor-card-header">
            <Users size={18} />
            <h4>Competitor Analysis</h4>
          </div>
          <p className="competitor-label">Assumed Strategy</p>
          <p className="competitor-text">{competitorAnalysis.assumedStrategy}</p>
          <p className="competitor-label">What Works For Them</p>
          <p className="competitor-text">{competitorAnalysis.whatWorks}</p>
        </div>

        <div className="competitor-card">
          <div className="competitor-card-header">
            <Eye size={18} />
            <h4>Content Gaps & Opportunities</h4>
          </div>
          <div className="gaps-list">
            {contentGaps.map((gap, index) => (
              <div key={index} className="gap-item">
                <p className="gap-title"><strong>Gap:</strong> {gap.gap}</p>
                <p className="gap-opportunity"><strong>Opportunity:</strong> {gap.opportunity}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Column 2: Video Ideas */}
      <div className="competitor-col">
        <div className="competitor-card">
          <div className="competitor-card-header">
            <Zap size={18} />
            <h4>AI-Generated Video Ideas (For You)</h4>
          </div>
          <div className="video-ideas-list">
            {videoIdeas.map((idea, index) => (
              <div key={index} className="video-idea-item">
                <p className="video-idea-title">"{idea.title}"</p>
                <span className="video-idea-focus">
                  Strategy: <strong>{idea.strategy}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Tab Component
function CompetitorsTab() {
  const [topic, setTopic] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- State for Profile Selection ---
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');

  // Fetch profiles on component mount
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const token = localStorage.getItem('apiToken');
        if (!token) return;

        const response = await axios.get('/api/v1/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const fetchedProfiles = response.data || [];
        setProfiles(fetchedProfiles);
        
        if (fetchedProfiles.length > 0) {
          setSelectedProfileId(fetchedProfiles[0].id); // Select first one
        }
      } catch (err) {
        console.error("Failed to fetch profiles", err);
      }
    };
    fetchProfiles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults(null);
    const token = localStorage.getItem('apiToken');

    try {
      const response = await axios.post('/api/v1/ai/discover/competitor', 
        { 
          topic: topic,
          profileId: selectedProfileId // Send selected profile
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setResults(response.data);
    } catch (err) {
      console.error("Error fetching competitor analysis:", err);
      setError("Failed to generate analysis. The AI might be busy. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="competitors-tab">
      <p style={{ color: 'var(--text-secondary)', marginTop: 0, fontSize: '1rem', lineHeight: 1.6 }}>
        Analyze a competitor's channel or a niche topic. The AI will find content gaps and suggest unique video ideas based on your selected creator profile.
      </p>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="input-form" style={{ padding: 0, margin: '20px 0', gap: 16, alignItems: 'center' }}>
        <div className="input-wrapper" style={{ flexGrow: 1 }}>
          <Users size={20} className="input-icon" />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a competitor's @handle or a topic (e.g., @MrBeast, 'VTube Studio Tutorials')"
            required
            style={{paddingLeft: '50px'}}
          />
        </div>
        
        {/* Profile Selector */}
        <div className="select-wrapper" style={{minWidth: '200px'}}>
          <Users size={16} className="select-icon" />
          <select 
            className="settings-select"
            value={selectedProfileId} 
            onChange={(e) => setSelectedProfileId(e.target.value)}
            disabled={profiles.length === 0}
          >
            {profiles.length === 0 ? (
              <option value="">Loading profiles...</option>
            ) : (
              profiles.map(profile => (
                <option key={profile.id} value={profile.id}>{profile.name}</option>
              ))
            )}
          </select>
        </div>

        <button type="submit" className="generate-button" disabled={isLoading} style={{ padding: '16px 20px' }}>
          {isLoading ? (
            <Loader size={20} className="spinner" />
          ) : (
            <>
              Analyze
              <Zap size={20} />
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
            <Users size={30} />
            <h3 style={{marginTop: '15px'}}>Competitor Analysis</h3>
            <p>Enter a topic or channel name above to get started.</p>
          </div>
        )}

        {results && (
          <CompetitorResults results={results} />
        )}
      </div>
    </div>
  );
}

export default CompetitorsTab;