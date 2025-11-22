'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Copy, Layers, Monitor, Globe, User, Cpu, AlertCircle, Check } from 'react-feather';
import { useAuth } from '@/components/AuthProvider';
import { addDoc, collection, serverTimestamp } from "firebase/firestore"; 
import { db } from '@/firebase';

// --- Types ---
interface ThumbnailLayer {
  type: string;
  content: string;
}

interface GeneratorResult {
  game: string;
  platformTitle: string;
  platformDescription: string;
  platformTags: string[];
  thumbnail: {
    description: string;
    layers: ThumbnailLayer[];
  };
}

interface UserProfile {
  id: string;
  name: string;
}

const AVAILABLE_MODELS = [
  { id: 'openai/gpt-oss-20b:free', name: 'GPT-OSS 20B (Free)' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
  { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1 (Free)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)' }
];

export default function GeneratorPage() {
  const { user } = useAuth();
  const [gameName, setGameName] = useState('');
  const [result, setResult] = useState<GeneratorResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [platform, setPlatform] = useState('YouTube');
  const [descriptionLength, setDescriptionLength] = useState('Medium');
  const [language, setLanguage] = useState('English');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
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
          model: selectedModel
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      const newResult = response.data;
      setResult(newResult);
      
      // Save to History in Firebase
      if (user) {
        await addDoc(collection(db, 'history'), {
           ...newResult, 
           uid: user.uid, 
           createdAt: serverTimestamp() 
        });
      }

    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* --- Header --- */}
      <div>
        <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
          <Search className="text-violet-400" /> Content Generator
        </h2>
        <p className="text-slate-400 mt-2">Create optimized titles, descriptions, and tags for your next video.</p>
      </div>

      {/* --- Input Form --- */}
      <div className="bg-surface border border-border backdrop-blur-md rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
           
           {/* Game Input */}
           <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              value={gameName} 
              onChange={(e) => setGameName(e.target.value)} 
              placeholder="Enter a game name (e.g., Elden Ring, Minecraft)..." 
              required 
              className="w-full bg-[var(--bg-input)] border border-border rounded-xl py-4 pl-12 pr-4 text-lg text-slate-100 outline-none focus:border-primary focus:shadow-[0_0_15px_var(--primary-glow)] transition-all placeholder:text-slate-500"
            />
          </div>
          
          {/* Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Profile */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Creator Profile</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select 
                  className="w-full bg-[var(--bg-input)] border border-border rounded-lg py-2.5 pl-10 pr-3 text-sm text-slate-200 outline-none focus:border-primary appearance-none cursor-pointer"
                  value={selectedProfileId} 
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                >
                  {profiles.length === 0 ? <option>No profiles</option> : profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">AI Model</label>
              <div className="relative">
                <Cpu size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select 
                  className="w-full bg-[var(--bg-input)] border border-border rounded-lg py-2.5 pl-10 pr-3 text-sm text-slate-200 outline-none focus:border-primary appearance-none cursor-pointer"
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>

            {/* Platform */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Platform</label>
              <div className="relative">
                <Monitor size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select 
                  className="w-full bg-[var(--bg-input)] border border-border rounded-lg py-2.5 pl-10 pr-3 text-sm text-slate-200 outline-none focus:border-primary appearance-none cursor-pointer"
                  value={platform} 
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  <option>YouTube</option><option>Twitch</option><option>Kick</option>
                </select>
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Language</label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select 
                  className="w-full bg-[var(--bg-input)] border border-border rounded-lg py-2.5 pl-10 pr-3 text-sm text-slate-200 outline-none focus:border-primary appearance-none cursor-pointer"
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option>English</option><option>Spanish</option><option>French</option><option>German</option>
                </select>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-violet-500/25 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <><Search size={20} /> Generate Content</>
            )}
          </button>
        </form>
      </div>

      {/* --- Results --- */}
      {result && (
        <div className="bg-surface border border-border backdrop-blur-md rounded-2xl p-8 shadow-xl space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-2xl font-bold text-slate-100">Results: <span className="text-primary">{result.game}</span></h2>
            <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
              {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}
            </span>
          </div>
          
          {/* Title */}
          <div className="space-y-2 relative group">
             <label className="text-sm font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
               Title 
               {copiedField === 'title' && <span className="text-green-400 text-xs normal-case flex items-center gap-1"><Check size={12}/> Copied</span>}
             </label>
             <div className="relative">
                <textarea 
                  readOnly 
                  value={result.platformTitle} 
                  rows={2} 
                  className="w-full bg-[var(--bg-input)] border border-border rounded-xl p-4 text-lg font-medium text-slate-100 outline-none focus:border-primary resize-none"
                />
                <button 
                  onClick={() => copyToClipboard(result.platformTitle, 'title')}
                  className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-primary text-slate-400 hover:text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Copy Title"
                >
                  <Copy size={16} />
                </button>
             </div>
          </div>
          
          {/* Thumbnail */}
          {result.thumbnail && (
             <div className="bg-[var(--bg-input)] border border-border rounded-xl p-5 space-y-3">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2"><Layers size={16} /> Thumbnail Plan</label>
                <div className="space-y-2">
                   <p className="text-slate-300"><strong className="text-primary">Theme:</strong> {result.thumbnail.description}</p>
                   <ul className="space-y-2 mt-2">
                      {result.thumbnail.layers.map((l,i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-400 bg-black/20 p-2 rounded-lg">
                          <span className="bg-slate-700 text-white px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider min-w-[80px] text-center">{l.type}</span>
                          <span>{l.content}</span>
                        </li>
                      ))}
                   </ul>
                </div>
             </div>
          )}

          {/* Description */}
          <div className="space-y-2 relative group">
             <label className="text-sm font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
               Description
               {copiedField === 'desc' && <span className="text-green-400 text-xs normal-case flex items-center gap-1"><Check size={12}/> Copied</span>}
             </label>
             <div className="relative">
                <textarea 
                  readOnly 
                  value={result.platformDescription} 
                  rows={10} 
                  className="w-full bg-[var(--bg-input)] border border-border rounded-xl p-4 text-sm leading-relaxed text-slate-200 outline-none focus:border-primary resize-y font-mono"
                />
                <button 
                  onClick={() => copyToClipboard(result.platformDescription, 'desc')}
                  className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-primary text-slate-400 hover:text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Copy Description"
                >
                  <Copy size={16} />
                </button>
             </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-400 uppercase tracking-wide">Tags</label>
             <div className="flex flex-wrap gap-2 bg-[var(--bg-input)] border border-border rounded-xl p-4">
                {result.platformTags.map((t,i) => (
                  <span key={i} className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    #{t}
                  </span>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}