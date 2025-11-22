// frontend/src/pages/discover/KeywordsTab.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Search, Loader, AlertCircle, TrendingUp, HelpCircle, Tag, Video } from 'react-feather';
import '/src/App.css'; // For shared styles
import './KeywordsTab.css'; // New CSS file for this tab

// Component for the results
function KeywordResults({ results }) {
    const { primaryKeyword, searchIntent, relatedKeywords, videoIdeas } = results;

    return (
        <div className="keyword-results-grid">

            {/* Column 1: Keyword Details */}
            <div className="keyword-details-col">
                {/* Primary Keyword */}
                <div className="keyword-card">
                    <div className="keyword-card-header">
                        <TrendingUp size={18} />
                        <h4>Primary Keyword</h4>
                    </div>
                    <p className="primary-keyword-text">{primaryKeyword}</p>
                </div>

                {/* Search Intent */}
                <div className="keyword-card">
                    <div className="keyword-card-header">
                        <HelpCircle size={18} />
                        <h4>Search Intent</h4>
                    </div>
                    <p className="intent-text">{searchIntent}</p>
                </div>

                {/* Related Keywords */}
                <div className="keyword-card">
                    <div className="keyword-card-header">
                        <Tag size={18} />
                        <h4>Related Keywords</h4>
                    </div>
                    <div className="tags-container" style={{padding: 0, border: 'none', background: 'none'}}>
                        {relatedKeywords.map((tag, index) => (
                            <span key={index} className="tag">{tag}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Column 2: Video Ideas */}
            <div className="keyword-video-col">
                <div className="keyword-card">
                    <div className="keyword-card-header">
                        <Video size={18} />
                        <h4>AI-Generated Video Ideas</h4>
                    </div>
                    <div className="video-ideas-list">
                        {videoIdeas.map((idea, index) => (
                            <div key={index} className="video-idea-item">
                                <p className="video-idea-title">"{idea.title}"</p>
                                <span className="video-idea-focus">
                  Targets: <strong>{idea.keywordFocus}</strong>
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
function KeywordsTab() {
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
            const response = await axios.post('/api/v1/ai/discover/keywords',
                { topic },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setResults(response.data);
        } catch (err) {
            console.error("Error fetching keyword ideas:", err);
            setError("Failed to generate ideas. The AI might be busy. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="keywords-tab">
            <p style={{ color: 'var(--text-secondary)', marginTop: 0, fontSize: '1rem', lineHeight: 1.6 }}>
                Analyze any topic to find the primary keyword, user search intent, related long-tail keywords, and AI-generated video ideas.
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
                            Analyze Topic
                            <Search size={20} />
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
                        <Search size={30} />
                        <h3 style={{marginTop: '15px'}}>Keyword Explorer</h3>
                        <p>Enter a topic above to get started.</p>
                    </div>
                )}

                {results && (
                    <KeywordResults results={results} />
                )}
            </div>
        </div>
    );
}

export default KeywordsTab;