// frontend/src/GeneratorPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '/src/App.css';
import { Search, Copy, Youtube, MessageSquare, Hash, Monitor, Globe, AlignLeft, X, Loader, Layers, User, Cpu } from 'react-feather';
import { auth, db } from '/src/firebase';
import { addDoc, collection, serverTimestamp, query, where, getDocs, limit } from "firebase/firestore"; 

// Define Models Constant
const AVAILABLE_MODELS = [
  { id: 'openai/gpt-oss-20b:free', name: 'GPT-OSS 20B (Free)' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
  { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1 (Free)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)' }
];

function GeneratorPage() {
  const [gameName, setGameName] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [platform, setPlatform] = useState('YouTube');
  const [descriptionLength, setDescriptionLength] = useState('Medium');
  const [language, setLanguage] = useState('English');
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  
  // New Model State
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const token = localStorage.getItem('apiToken');
        if (!token) return;
        const response = await axios.get('/api/v1/profile', { headers: { 'Authorization': `Bearer ${token}` } });
        setProfiles(response.data || []);
        if (response.data && response.data.length > 0) setSelectedProfileId(response.data[0].id);
      } catch (err) { console.error(err); }
    };
    fetchProfiles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setIsLoading(true);
    setError(null);
    setResult(null);

    if (profiles.length > 0 && !selectedProfileId) {
        setError("Please select a Creator Profile.");
        setIsLoading(false);
        return;
    }

    try {
      const token = localStorage.getItem('apiToken');
      const response = await axios.post('/api/v1/generate', 
        {
          gameName,
          profileId: selectedProfileId,
          platform,
          language,
          descriptionLength,
          model: selectedModel // <-- Pass the model
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      const newResult = response.data;
      setResult(newResult);
      
      // Save to History
      if (auth.currentUser) {
        const historyRef = collection(db, 'history');
        await addDoc(historyRef, {
           ...newResult, 
           uid: auth.currentUser.uid, 
           createdAt: serverTimestamp() 
        });
      }

    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => navigator.clipboard.writeText(text);
  const formatForDisplay = (text) => text ? text.replace(/\\n/g, '\n') : '';

  return (
    <> 
      <form onSubmit={handleSubmit} className="input-form">
         <div className="input-wrapper">
          <Search size={20} className="input-icon" />
          <input type="text" value={gameName} onChange={(e) => setGameName(e.target.value)} placeholder="Enter a game name..." required />
        </div>
        
        <div className="settings-row">
          {/* Profile */}
          <div className="select-wrapper">
            <User size={16} className="select-icon" />
            <select className="settings-select" value={selectedProfileId} onChange={(e) => setSelectedProfileId(e.target.value)}>
              {profiles.length === 0 ? <option>No profiles</option> : profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* AI Model Selector */}
          <div className="select-wrapper">
            <Cpu size={16} className="select-icon" />
            <select className="settings-select" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {/* Platform */}
          <div className="select-wrapper">
            <Monitor size={16} className="select-icon" />
            <select className="settings-select" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option>YouTube</option><option>Twitch</option><option>Kick</option>
            </select>
          </div>

          {/* Language */}
          <div className="select-wrapper">
            <Globe size={16} className="select-icon" />
            <select className="settings-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option>English</option><option>Spanish</option><option>French</option><option>German</option>
            </select>
          </div>
        </div>
        
        <button type="submit" className="generate-button" disabled={isLoading}>
          {isLoading ? <Loader size={20} className="spinner" /> : <><Search size={20} /> Generate</>}
        </button>
      </form>

      {/* Results UI */}
      {error && <div className="error-message"><X size={20}/> {error}</div>}
      {result && (
        <div className="results-card">
          <h2>Results for: {result.game} <span style={{fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '10px'}}>({AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name})</span></h2>
          
          <div className="result-item">
             <label>Title</label>
             <textarea readOnly value={result.platformTitle} rows={2} onClick={() => copyToClipboard(result.platformTitle)} />
          </div>
          
          {result.thumbnail && (
             <div className="result-item">
                <label><Layers size={16} /> Thumbnail Plan</label>
                <div className="thumbnail-ideas-container">
                   <p><strong>Theme:</strong> {result.thumbnail.description}</p>
                   <ul className="thumbnail-layers-list">
                      {result.thumbnail.layers.map((l,i) => <li key={i}><strong>{l.type}:</strong> {l.content}</li>)}
                   </ul>
                </div>
             </div>
          )}

          <div className="result-item">
             <label>Description</label>
             <textarea readOnly value={formatForDisplay(result.platformDescription)} rows={10} onClick={() => copyToClipboard(formatForDisplay(result.platformDescription))} />
          </div>

          <div className="result-item">
             <label>Tags</label>
             <div className="tags-container">{result.platformTags.map((t,i) => <span key={i} className="tag">{t}</span>)}</div>
          </div>
        </div>
      )}
    </>
  );
}

export default GeneratorPage;