'use client';

import { useState } from 'react';
import axios from 'axios';
import { TrendingUp, Search, Loader, AlertCircle, Copy, Check } from 'react-feather';

interface Idea {
  title: string;
  concept: string;
  hook: string;
}

export default function OutliersTab() {
  const [topic, setTopic] = useState('');
  const [results, setResults] = useState<{ ideas: Idea[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('apiToken');

    try {
      const response = await axios.post('/api/v1/ai/discover/outliers', 
        { topic },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(response.data);
    } catch (err) {
      setError("Failed to generate ideas. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <p className="text-slate-400">
        Find non-obvious, high-potential video ideas. The AI suggests unique angles matching your profile.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a game or topic (e.g., Minecraft, Elden Ring)..."
            required
            className="w-full bg-[var(--bg-input)] border border-border rounded-xl py-3 pl-12 pr-4 text-slate-100 outline-none focus:border-primary focus:shadow-[0_0_15px_var(--primary-glow)] transition-all"
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          className="px-6 bg-primary hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? <Loader className="animate-spin" size={20} /> : <TrendingUp size={20} />}
          Find Ideas
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {!results && !isLoading && !error && (
        <div className="text-center py-12 bg-surface border border-border rounded-2xl border-dashed">
          <TrendingUp size={40} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-300">Ready to Discover</h3>
          <p className="text-slate-500">Enter a topic above to start hunting for outliers.</p>
        </div>
      )}

      {results && (
        <div className="grid gap-6">
          {results.ideas.map((idea, index) => (
            <div key={index} className="bg-surface border border-border hover:border-primary/50 p-6 rounded-xl transition-colors group">
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400"><TrendingUp size={18} /></div>
                  <h4 className="text-lg font-bold text-slate-100">{idea.title}</h4>
                </div>
                <button 
                  onClick={() => handleCopy(idea.title, index)}
                  className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  {copiedIndex === index ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase mb-1 block">The Concept</span>
                  <p className="text-slate-300 text-sm leading-relaxed">{idea.concept}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase mb-1 block">The Hook (First 10s)</span>
                  <p className="text-slate-300 text-sm italic leading-relaxed">"{idea.hook}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}