'use client';

import { useState } from 'react';
import axios from 'axios';
import { X, Zap, ArrowRight, Copy, AlertCircle, Check } from 'react-feather';

// --- Types ---
interface VideoSnippet {
  title: string;
  description: string;
  thumbnails: {
    medium: { url: string };
    high: { url: string };
  };
}

interface Video {
  id: string;
  snippet: VideoSnippet;
}

interface OptimizeResult {
  originalScore: number;
  newScore: number;
  overallSuggestion: string;
  newTitle: string;
  newDescription: string;
  newTags: string[];
}

interface OptimizeModalProps {
  video: Video;
  onClose: () => void;
}

// Helper to format text
const formatText = (text: string) => text?.replace(/\\n/g, '\n') || '';

export default function OptimizeModal({ video, onClose }: OptimizeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<OptimizeResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleOptimize = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('apiToken');

    try {
      const response = await axios.post('/api/v1/ai/optimize', 
        { videoDetails: video },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(response.data);
    } catch (err: any) {
      setError("Failed to generate suggestions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-surface border border-border backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-[var(--bg-color)]/90 backdrop-blur-md">
          <div className="flex items-center gap-4 overflow-hidden">
            <img 
              src={video.snippet.thumbnails.medium.url} 
              alt="Thumbnail" 
              className="w-32 aspect-video object-cover rounded-lg border border-border shadow-sm flex-shrink-0" 
            />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-100 truncate">Optimize Video</h2>
              <p className="text-sm text-slate-400 truncate">{video.snippet.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8">
          {!results && !isLoading && (
            <div className="text-center py-12 space-y-6">
              <p className="text-lg text-slate-300 max-w-md mx-auto">
                Get AI-powered suggestions for your title, description, and tags based on your creator profile.
              </p>
              <button 
                onClick={handleOptimize}
                className="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 transition-all hover:scale-105 flex items-center gap-3 mx-auto text-lg"
              >
                <Zap size={20} /> Analyze & Optimize
              </button>
            </div>
          )}

          {isLoading && (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              <p className="text-slate-400 animate-pulse">Analyzing video metrics...</p>
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
              <AlertCircle size={20} /> {error}
            </div>
          )}

          {results && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Score Card */}
              <div className="bg-[var(--bg-input)] border border-border rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold">
                    <span>{results.newScore}/100</span>
                    <span className="text-xs font-normal opacity-80 bg-black/20 px-1.5 py-0.5 rounded">Was {results.originalScore}</span>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2"><Zap size={18} className="text-yellow-400"/> AI Analysis</h4>
                <p className="text-slate-300 pr-32">{results.overallSuggestion}</p>
              </div>
              
              {/* Comparison Item: Title */}
              <SuggestionItem 
                label="Title" 
                original={video.snippet.title} 
                suggested={results.newTitle} 
                onCopy={() => copyToClipboard(results.newTitle, 'title')}
                isCopied={copied === 'title'}
              />

              {/* Comparison Item: Description */}
              <SuggestionItem 
                label="Description" 
                original={video.snippet.description} 
                suggested={results.newDescription} 
                onCopy={() => copyToClipboard(results.newDescription, 'desc')}
                isCopied={copied === 'desc'}
                isTextArea
              />

              {/* Tags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-300">Suggested Tags</h4>
                  <button 
                    onClick={() => copyToClipboard(results.newTags.join(', '), 'tags')}
                    className="text-xs font-bold text-primary hover:text-violet-400 flex items-center gap-1 uppercase tracking-wide"
                  >
                    {copied === 'tags' ? <Check size={14} /> : <Copy size={14} />} Copy All
                  </button>
                </div>
                <div className="bg-[var(--bg-input)] border border-border rounded-xl p-4 flex flex-wrap gap-2">
                  {results.newTags.map((tag, i) => (
                    <span key={i} className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-component for comparing fields
function SuggestionItem({ label, original, suggested, onCopy, isCopied, isTextArea = false }: any) {
  return (
    <div className="space-y-3">
      <h4 className="font-bold text-slate-300">{label}</h4>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
        {/* Original */}
        <div className="bg-[var(--bg-input)] border border-border rounded-xl p-4 opacity-70">
          <span className="text-xs font-bold text-slate-500 uppercase mb-2 block">Original</span>
          <div className={`text-sm text-slate-400 ${isTextArea ? 'whitespace-pre-wrap max-h-40 overflow-y-auto' : ''}`}>
            {formatText(original) || '(Empty)'}
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center h-full text-slate-600">
          <ArrowRight size={20} />
        </div>

        {/* Suggested */}
        <div className="bg-[var(--bg-input)] border border-primary/30 rounded-xl p-4 relative group hover:border-primary transition-colors">
          <span className="text-xs font-bold text-primary uppercase mb-2 block">Suggestion</span>
          <div className={`text-sm text-slate-200 ${isTextArea ? 'whitespace-pre-wrap max-h-40 overflow-y-auto' : ''}`}>
            {formatText(suggested)}
          </div>
          <button 
            onClick={onCopy}
            className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-primary text-slate-300 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
            title="Copy"
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}