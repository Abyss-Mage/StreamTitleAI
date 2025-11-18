// frontend/src/pages/CoachPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, Cpu, Loader, AlertCircle } from 'react-feather';
import '/src/App.css';
import './CoachPage.css';

const AVAILABLE_MODELS = [
  { id: 'openai/gpt-oss-20b:free', name: 'GPT-OSS 20B (Free)' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
  { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1 (Free)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)' }
];

function CoachPage() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! Select a model and profile, then ask me anything." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const token = localStorage.getItem('apiToken');
        const response = await axios.get('/api/v1/profile', { headers: { 'Authorization': `Bearer ${token}` } });
        setProfiles(response.data || []);
        if (response.data.length > 0) setSelectedProfileId(response.data[0].id);
      } catch (err) { console.error(err); }
    };
    fetchProfiles();
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('apiToken');
      const response = await axios.post('/api/v1/ai/coach', 
        { 
          messages: [...messages, userMsg],
          profileId: selectedProfileId,
          model: selectedModel // <-- Pass model
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, { role: 'ai', text: response.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "Error: " + (err.response?.data?.error || err.message) }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="results-card" style={{ marginTop: 0, height: '100%' }}>
      <div className="history-header" style={{ padding: '0 0 20px 0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <h2 style={{margin: 0, marginRight: 'auto'}}><Cpu size={28} /> AI Coach</h2>
        
        {/* Model Selector */}
        <div className="select-wrapper" style={{ width: '200px' }}>
           <Cpu size={16} className="select-icon" />
           <select className="settings-select" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
           </select>
        </div>

        {/* Profile Selector */}
        <div className="select-wrapper" style={{ width: '200px' }}>
           <User size={16} className="select-icon" />
           <select className="settings-select" value={selectedProfileId} onChange={(e) => setSelectedProfileId(e.target.value)}>
              {profiles.length === 0 ? <option>No Profiles</option> : profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
           </select>
        </div>
      </div>

      <div className="coach-container">
        <div className="chat-window">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className={`avatar ${msg.role === 'ai' ? 'ai-avatar' : 'user-avatar'}`}>
                {msg.role === 'ai' ? <Cpu size={20} /> : <User size={20} />}
              </div>
              <div className="bubble">{msg.text}</div>
            </div>
          ))}
          {isLoading && <div className="message ai"><div className="bubble">...</div></div>}
          <div ref={chatEndRef} />
        </div>
        <form className="chat-input-area" onSubmit={handleSend}>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your question..." onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(e)} />
          <button type="submit" className="send-btn" disabled={isLoading}><Send size={20}/></button>
        </form>
      </div>
    </div>
  );
}

export default CoachPage;