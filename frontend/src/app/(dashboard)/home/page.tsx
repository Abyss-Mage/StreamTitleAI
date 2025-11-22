'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { 
  Search, Zap, Video, Image, TrendingUp, Lock, 
  ArrowRight, CheckCircle, PlayCircle, Target 
} from 'react-feather';
import { useAuth } from '@/components/AuthProvider';
import OptimizeModal from '@/components/OptimizeModal';

export default function HomePage() {
  const { user } = useAuth();
  const [latestVideo, setLatestVideo] = useState<any>(null);
  const [dailyIdea, setDailyIdea] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [showOptimize, setShowOptimize] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      const token = localStorage.getItem('apiToken');
      const headers = { Authorization: `Bearer ${token}` };

      try {
        // Parallel fetch: Video, Daily Idea, Analytics
        const [vidRes, ideaRes, statRes] = await Promise.allSettled([
          axios.get('/api/v1/youtube/videos', { headers }),
          axios.get('/api/v1/ai/daily-idea', { headers }),
          axios.get('/api/v1/youtube/analytics', { headers })
        ]);

        if (vidRes.status === 'fulfilled' && vidRes.value.data.videos?.length > 0) {
          setLatestVideo(vidRes.value.data.videos[0]);
        }
        if (ideaRes.status === 'fulfilled') setDailyIdea(ideaRes.value.data);
        if (statRes.status === 'fulfilled') setStats(statRes.value.data.stats);

      } catch (e) { console.error(e); }
    };
    loadData();
  }, [user]);

  // Monetization Progress Calculations
  const subsProgress = stats ? Math.min((stats.netSubs / 1000) * 100, 100) : 0;
  const watchProgress = stats ? Math.min((stats.watchTimeHours / 4000) * 100, 100) : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 pb-20">
      
      {/* --- MAIN CONTENT (Left, 70%) --- */}
      <div className="flex-1 space-y-8 min-w-0">
        
        {/* 1. Top Action Cards */}
        <section>
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">What would you like to do today?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/discover" className="bg-surface border border-border p-4 rounded-xl hover:border-primary hover:bg-white/5 transition-all group text-center">
              <div className="w-10 h-10 mx-auto bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <TrendingUp size={20} />
              </div>
              <span className="text-sm font-bold text-slate-200">Find Keywords</span>
            </Link>
            <Link href="/generator" className="bg-surface border border-border p-4 rounded-xl hover:border-primary hover:bg-white/5 transition-all group text-center">
              <div className="w-10 h-10 mx-auto bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Zap size={20} />
              </div>
              <span className="text-sm font-bold text-slate-200">Get Video Ideas</span>
            </Link>
            <Link href="/discover" className="bg-surface border border-border p-4 rounded-xl hover:border-primary hover:bg-white/5 transition-all group text-center">
              <div className="w-10 h-10 mx-auto bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Video size={20} />
              </div>
              <span className="text-sm font-bold text-slate-200">Trend Hunter</span>
            </Link>
            <Link href="/generator" className="bg-surface border border-border p-4 rounded-xl hover:border-primary hover:bg-white/5 transition-all group text-center">
              <div className="w-10 h-10 mx-auto bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Image size={20} />
              </div>
              <span className="text-sm font-bold text-slate-200">Create Thumbs</span>
            </Link>
          </div>
        </section>

        {/* 2. Optimize Latest Video */}
        {latestVideo && (
          <section className="bg-[var(--bg-input)] border border-border rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center">
            <div className="relative w-full sm:w-48 aspect-video rounded-lg overflow-hidden shadow-lg">
              <img src={latestVideo.snippet.thumbnails.medium.url} className="object-cover w-full h-full" alt="Thumbnail" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <PlayCircle className="text-white opacity-80" size={32} />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-100 mb-1 line-clamp-1">{latestVideo.snippet.title}</h4>
              <p className="text-sm text-slate-400 mb-4">Boost your views by optimizing this video's metadata.</p>
              <button 
                onClick={() => setShowOptimize(true)}
                className="px-5 py-2 bg-white text-black font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm"
              >
                <Zap size={16} /> Optimize Now
              </button>
            </div>
          </section>
        )}

        {/* 3. Daily Video Ideas */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase">Daily Video Ideas</h3>
            <Link href="/generator" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {dailyIdea ? (
              <div className="p-5 border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-slate-100 mb-1 group-hover:text-primary transition-colors">{dailyIdea.title}</h4>
                    <p className="text-sm text-slate-400 line-clamp-1">{dailyIdea.idea}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                    dailyIdea.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    {dailyIdea.difficulty || 'Medium'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">Generating daily ideas...</div>
            )}
            <div className="p-3 bg-primary/10 text-center">
              <Link href="/pricing" className="text-xs font-bold text-primary flex items-center justify-center gap-2 hover:underline">
                <Lock size={12} /> Unlock 10+ more ideas with Pro
              </Link>
            </div>
          </div>
        </section>

        {/* 4. Quick Search */}
        <section>
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Search a Keyword</h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input type="text" placeholder="Enter a keyword..." className="w-full bg-[var(--bg-input)] border border-border rounded-xl py-3.5 pl-12 pr-4 text-slate-200 outline-none focus:border-primary transition-all" />
          </div>
        </section>

      </div>

      {/* --- SIDEBAR (Right, 30%) --- */}
      <div className="w-full lg:w-80 space-y-8 flex-shrink-0">
        
        {/* Monetization Progress */}
        <section className="bg-surface border border-border rounded-2xl p-6">
          <h3 className="font-bold text-slate-100 mb-6 flex items-center gap-2"><Target size={18} /> Monetization</h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                <span>Subscribers</span>
                <span>{stats?.netSubs || 0} / 1,000</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${subsProgress}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                <span>Watch Hours</span>
                <span>{stats?.watchTimeHours || 0} / 4,000</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${watchProgress}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* Growth Plan */}
        <section className="bg-surface border border-border rounded-2xl p-6">
          <h3 className="font-bold text-slate-100 mb-6">Growth Plan</h3>
          <div className="relative pl-4 border-l-2 border-slate-700 space-y-8">
            <div className="relative">
              <span className="absolute -left-[21px] top-1 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_var(--primary-glow)]" />
              <h4 className="text-sm font-bold text-slate-200">Foundation</h4>
              <p className="text-xs text-slate-500 mt-1">Optimize your channel layout.</p>
            </div>
            <div className="relative opacity-50">
              <span className="absolute -left-[21px] top-1 w-3 h-3 bg-slate-700 rounded-full" />
              <h4 className="text-sm font-bold text-slate-200">Consistency</h4>
              <p className="text-xs text-slate-500 mt-1">Upload 1 video per week.</p>
            </div>
            <div className="relative opacity-50">
              <span className="absolute -left-[21px] top-1 w-3 h-3 bg-slate-700 rounded-full" />
              <h4 className="text-sm font-bold text-slate-200">Community</h4>
              <p className="text-xs text-slate-500 mt-1">Reach 1,000 subs.</p>
            </div>
          </div>
        </section>

      </div>

      {/* Optimize Modal Trigger */}
      {showOptimize && latestVideo && (
        <OptimizeModal video={latestVideo} onClose={() => setShowOptimize(false)} />
      )}

    </div>
  );
}