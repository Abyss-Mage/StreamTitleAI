'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart2, MessageSquare, Zap, Search, Coffee, ArrowUp, ArrowDown, AlertCircle, Loader } from 'react-feather';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

// --- New Interface ---
interface DailyIdea {
  game: string;
  title: string;
  idea: string;
  difficulty: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [dailyIdea, setDailyIdea] = useState<DailyIdea | null>(null); // <--- New State
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem('apiToken');
        
        // Parallel Fetching
        const [analyticsRes, ideaRes] = await Promise.allSettled([
          axios.get('/api/v1/youtube/analytics', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/v1/ai/daily-idea', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        // Handle Analytics
        if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data.analytics?.rows?.length > 0) {
          const row = analyticsRes.value.data.analytics.rows[0];
          setAnalytics({
            channelTitle: analyticsRes.value.data.channelTitle,
            views: Number(row[0]),
            subscribersGained: Number(row[1]),
            subscribersLost: Number(row[2])
          });
        }

        // Handle Daily Idea
        if (ideaRes.status === 'fulfilled') {
          setDailyIdea(ideaRes.value.data);
        }

      } catch (err) {
        console.error("Dashboard load error", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) loadDashboard();
  }, [user]);

  const netSubs = analytics ? analytics.subscribersGained - analytics.subscribersLost : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">{user?.displayName || 'Creator'}</span>!
          </h1>
          <p className="text-slate-400 mt-1">Here is your V3 dashboard overview.</p>
        </div>
        <div className="flex gap-3">
           <Link href="/generator" className="bg-primary hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-violet-500/20 transition-all flex items-center gap-2">
             <Search size={18} /> New Generation
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Analytics (Unchanged logic, just kept for context) */}
        <div className="lg:col-span-2 bg-surface border border-border backdrop-blur-md rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400"><BarChart2 size={20} /></div>
            <h2 className="text-lg font-bold text-slate-100">Channel Analytics (30d)</h2>
          </div>

          {loading ? (
            <div className="h-32 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
            </div>
          ) : analytics ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-black/20 p-5 rounded-xl border border-white/5 text-center">
                <span className="block text-3xl font-extrabold text-slate-100 mb-1">{analytics.views.toLocaleString()}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Views</span>
              </div>
              <div className="bg-black/20 p-5 rounded-xl border border-white/5 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className={`text-3xl font-extrabold ${netSubs >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {netSubs > 0 ? '+' : ''}{netSubs.toLocaleString()}
                  </span>
                  {netSubs >= 0 ? <ArrowUp size={20} className="text-emerald-400" /> : <ArrowDown size={20} className="text-red-400" />}
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Subs</span>
              </div>
              <div className="bg-black/20 p-5 rounded-xl border border-white/5 text-center">
                 <span className="block text-lg font-bold text-slate-100 mb-1 truncate px-2" title={analytics.channelTitle}>
                    {analytics.channelTitle}
                 </span>
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Channel</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">No channel connected.</p>
              <Link href="/settings" className="text-primary hover:underline text-sm font-medium">Connect YouTube in Settings →</Link>
            </div>
          )}
        </div>

        {/* Card 2: Quick Actions (Unchanged) */}
        <div className="bg-surface border border-border backdrop-blur-md rounded-2xl p-6 shadow-xl flex flex-col">
           <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-fuchsia-500/10 rounded-lg text-fuchsia-400"><Zap size={20} /></div>
            <h2 className="text-lg font-bold text-slate-100">Quick Actions</h2>
          </div>
          <div className="flex-1 flex flex-col gap-3">
             <Link href="/optimize" className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-input)] border border-border hover:border-primary hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all group">
                <div className="p-2 bg-violet-500/20 rounded-lg text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-colors"><Zap size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-200">Optimize Video</h4>
                  <p className="text-xs text-slate-400">Analyze existing content</p>
                </div>
             </Link>
             <Link href="/discover" className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-input)] border border-border hover:border-primary hover:shadow-[0_4px_20px_var(--primary-glow)] transition-all group">
                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors"><Coffee size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-200">Discover Trends</h4>
                  <p className="text-xs text-slate-400">Find content gaps</p>
                </div>
             </Link>
          </div>
        </div>

        {/* Card 3: Daily AI Idea (REAL DATA) */}
        <div className="lg:col-span-3 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-start gap-6 relative overflow-hidden group">
           
           {/* Background Glow */}
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all" />

           <div className="p-4 bg-blue-500/20 rounded-2xl text-blue-400 flex-shrink-0 z-10">
              <MessageSquare size={32} />
           </div>
           
           <div className="flex-1 z-10">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-slate-100">Daily AI Inspiration</h3>
                {dailyIdea && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                    dailyIdea.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' : 
                    dailyIdea.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {dailyIdea.difficulty}
                  </span>
                )}
              </div>
              
              {dailyIdea ? (
                <>
                  <p className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                    "{dailyIdea.title}"
                  </p>
                  <p className="text-slate-400 leading-relaxed max-w-3xl">
                    <span className="text-slate-200 font-bold">{dailyIdea.game}:</span> {dailyIdea.idea}
                  </p>
                </>
              ) : loading ? (
                <div className="flex items-center gap-3 text-slate-500">
                  <Loader size={16} className="animate-spin" />
                  Scanning gaming trends...
                </div>
              ) : (
                <p className="text-slate-500">Check back tomorrow for a new idea.</p>
              )}
           </div>

           {dailyIdea && (
             <button 
               onClick={() => navigator.clipboard.writeText(dailyIdea.title)}
               className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all z-10 whitespace-nowrap self-center md:self-start"
             >
               Copy Idea
             </button>
           )}
        </div>

      </div>
    </div>
  );
}