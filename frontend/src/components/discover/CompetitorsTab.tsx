'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Zap, Eye, Loader, AlertCircle } from 'react-feather';
import { useAuth } from '@/components/AuthProvider';

export default function CompetitorsTab() {
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadProfiles = async () => {
      if(!user) return;
      try {
        const token = localStorage.getItem('apiToken');
        const res = await axios.get('/api/v1/profile', { headers: { Authorization: `Bearer ${token}` } });
        setProfiles(res.data);
        if(res.data.length > 0) setSelectedProfileId(res.data[0].id);
      } catch(e) { console.error(e); }
    };
    loadProfiles();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const token = localStorage.getItem('apiToken');
    try {
      const res = await axios.post('/api/v1/ai/discover/competitor', 
        { topic, profileId: selectedProfileId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(res.data);
    } catch(e) { console.error(e); } finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <p className="text-slate-400">Analyze a competitor or topic to find content gaps.</p>

      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Competitor channel or topic..." className="w-full bg-[var(--bg-input)] border border-border rounded-xl py-3 pl-12 pr-4 text-slate-100 outline-none focus:border-primary" required />
        </div>
        <select value={selectedProfileId} onChange={e => setSelectedProfileId(e.target.value)} className="bg-[var(--bg-input)] border border-border rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-primary">
          {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button type="submit" disabled={isLoading} className="px-6 bg-primary hover:bg-violet-500 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">
          {isLoading ? <Loader className="animate-spin" size={20} /> : <Zap size={20} />} Analyze
        </button>
      </form>

      {results && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-surface border border-border p-6 rounded-xl">
              <h4 className="font-bold text-slate-100 mb-4 flex items-center gap-2"><Users size={18} className="text-primary"/> Competitor Strategy</h4>
              <div className="space-y-4">
                <div><span className="text-xs font-bold text-slate-500 uppercase">Assumed Strategy</span><p className="text-slate-300 mt-1">{results.competitorAnalysis.assumedStrategy}</p></div>
                <div><span className="text-xs font-bold text-slate-500 uppercase">What Works</span><p className="text-slate-300 mt-1">{results.competitorAnalysis.whatWorks}</p></div>
              </div>
            </div>
            <div className="bg-surface border border-border p-6 rounded-xl">
              <h4 className="font-bold text-slate-100 mb-4 flex items-center gap-2"><Eye size={18} className="text-primary"/> Content Gaps</h4>
              <div className="space-y-4">{results.contentGaps.map((g:any, i:number) => (
                <div key={i} className="border-l-2 border-primary pl-4"><p className="font-bold text-slate-200">{g.gap}</p><p className="text-slate-400 text-sm">{g.opportunity}</p></div>
              ))}</div>
            </div>
          </div>
          <div className="bg-surface border border-border p-6 rounded-xl">
            <h4 className="font-bold text-slate-100 mb-6 flex items-center gap-2"><Zap size={18} className="text-primary"/> Attack Plan (Video Ideas)</h4>
            <div className="space-y-4">{results.videoIdeas.map((v:any, i:number) => (
              <div key={i} className="p-4 bg-[var(--bg-input)] rounded-lg border border-border"><p className="font-bold text-slate-200 mb-1">"{v.title}"</p><p className="text-xs text-slate-400">Strategy: <span className="text-primary">{v.strategy}</span></p></div>
            ))}</div>
          </div>
        </div>
      )}
    </div>
  );
}