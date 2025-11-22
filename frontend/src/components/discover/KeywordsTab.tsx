'use client';

import { useState } from 'react';
import axios from 'axios';
import { Search, Loader, AlertCircle, TrendingUp, HelpCircle, Tag, Video } from 'react-feather';

interface KeywordResult {
  primaryKeyword: string;
  searchIntent: string;
  relatedKeywords: string[];
  videoIdeas: { title: string; keywordFocus: string }[];
}

export default function KeywordsTab() {
  const [topic, setTopic] = useState('');
  const [results, setResults] = useState<KeywordResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('apiToken');

    try {
      const response = await axios.post('/api/v1/ai/discover/keywords', 
        { topic },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(response.data);
    } catch (err) {
      setError("Failed to analyze keywords.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <p className="text-slate-400">Analyze user intent and find low-competition keywords.</p>

      <form onSubmit={handleSubmit} className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic..."
            required
            className="w-full bg-[var(--bg-input)] border border-border rounded-xl py-3 pl-12 pr-4 text-slate-100 outline-none focus:border-primary focus:shadow-[0_0_15px_var(--primary-glow)] transition-all"
          />
        </div>
        <button type="submit" disabled={isLoading} className="px-6 bg-primary hover:bg-violet-500 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">
          {isLoading ? <Loader className="animate-spin" size={20} /> : <Search size={20} />} Analyze
        </button>
      </form>

      {results && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-surface border border-border p-6 rounded-xl">
              <h4 className="flex items-center gap-2 text-slate-100 font-bold mb-4 border-b border-white/5 pb-3">
                <TrendingUp size={18} className="text-primary"/> Primary Keyword
              </h4>
              <p className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
                {results.primaryKeyword}
              </p>
            </div>

            <div className="bg-surface border border-border p-6 rounded-xl">
              <h4 className="flex items-center gap-2 text-slate-100 font-bold mb-4 border-b border-white/5 pb-3">
                <HelpCircle size={18} className="text-primary"/> Search Intent
              </h4>
              <p className="text-slate-300">{results.searchIntent}</p>
            </div>

            <div className="bg-surface border border-border p-6 rounded-xl">
              <h4 className="flex items-center gap-2 text-slate-100 font-bold mb-4 border-b border-white/5 pb-3">
                <Tag size={18} className="text-primary"/> Related Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {results.relatedKeywords.map((tag, i) => (
                  <span key={i} className="bg-white/5 border border-white/10 text-slate-300 px-3 py-1 rounded-full text-sm">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="bg-surface border border-border p-6 rounded-xl h-full">
            <h4 className="flex items-center gap-2 text-slate-100 font-bold mb-6 border-b border-white/5 pb-3">
              <Video size={18} className="text-primary"/> AI Video Ideas
            </h4>
            <div className="space-y-4">
              {results.videoIdeas.map((idea, i) => (
                <div key={i} className="p-4 bg-[var(--bg-input)] border border-border rounded-lg">
                  <p className="font-bold text-slate-200 mb-2">"{idea.title}"</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-black/20 px-2 py-1 rounded w-fit">
                    <span className="font-bold text-primary">Target:</span> {idea.keywordFocus}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}