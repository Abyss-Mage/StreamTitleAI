'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, Cpu, Loader, MessageSquare } from 'react-feather';
import { useAuth } from '@/components/AuthProvider';

// --- Types ---
interface Message {
  role: 'user' | 'ai';
  text: string;
}

interface Profile {
  id: string;
  name: string;
}

const AVAILABLE_MODELS = [
  { id: 'openai/gpt-oss-20b:free', name: 'GPT-OSS 20B (Free)' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
  { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1 (Free)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)' }
];

export default function CoachPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Hello! I'm your AI Coach. Select a profile and model above, then ask me anything about your content strategy!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const token = localStorage.getItem('apiToken');
        if (!token) return;
        const response = await axios.get('/api/v1/profile', { headers: { Authorization: `Bearer ${token}` } });
        setProfiles(response.data || []);
        if (response.data.length > 0) setSelectedProfileId(response.data[0].id);
      } catch (err) { console.error(err); }
    };
    if (user) fetchProfiles();
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('apiToken');
      const response = await axios.post('/api/v1/ai/coach', 
        { 
          messages: [...messages, userMsg],
          profileId: selectedProfileId,
          model: selectedModel 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, { role: 'ai', text: response.data.reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', text: "Error: " + (err.response?.data?.error || err.message) }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col max-w-5xl mx-auto animate-in fade-in duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <MessageSquare className="text-violet-400" /> AI Coach
        </h2>
        
        <div className="flex gap-3 w-full md:w-auto">
          <select 
            className="flex-1 md:w-48 bg-surface border border-border rounded-lg py-2 px-3 text-sm text-slate-200 outline-none focus:border-primary cursor-pointer"
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <select 
            className="flex-1 md:w-48 bg-surface border border-border rounded-lg py-2 px-3 text-sm text-slate-200 outline-none focus:border-primary cursor-pointer"
            value={selectedProfileId} 
            onChange={(e) => setSelectedProfileId(e.target.value)}
          >
            {profiles.length === 0 ? <option>No Profiles</option> : profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-surface border border-border backdrop-blur-md rounded-2xl overflow-hidden flex flex-col shadow-xl">
        
        {/* Messages Window */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                msg.role === 'ai' 
                  ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white' 
                  : 'bg-surface border border-border text-slate-400'
              }`}>
                {msg.role === 'ai' ? <Cpu size={20} /> : <User size={20} />}
              </div>
              
              {/* Bubble */}
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-md ${
                msg.role === 'ai' 
                  ? 'bg-[var(--bg-input)] border border-border text-slate-200 rounded-tl-sm' 
                  : 'bg-primary text-white rounded-tr-sm'
              }`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center flex-shrink-0">
                  <Cpu size={20} />
               </div>
               <div className="bg-[var(--bg-input)] border border-border p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
               </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 bg-[var(--bg-color)] border-t border-border flex gap-3">
          <input 
            type="text"
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Ask for advice, script ideas, or channel analysis..." 
            className="flex-1 bg-[var(--bg-input)] border border-border rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-primary focus:shadow-[0_0_10px_var(--primary-glow)] transition-all"
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="w-14 h-14 rounded-xl bg-primary hover:bg-violet-500 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>

      </div>
    </div>
  );
}