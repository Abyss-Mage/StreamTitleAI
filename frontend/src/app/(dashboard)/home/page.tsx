'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart2, ArrowUp, ArrowDown, Youtube, Twitch, Clock, MessageCircle, Heart, Eye, Users, Video } from 'react-feather';
import { useAuth } from '@/components/AuthProvider';

export default function HomePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'youtube' | 'twitch'>('youtube');
  const [ytData, setYtData] = useState<any>(null);
  const [twData, setTwData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      const token = localStorage.getItem('apiToken');
      const headers = { Authorization: `Bearer ${token}` };

      try {
        // Use Promise.allSettled to fetch both, even if one fails
        const results = await Promise.allSettled([
          axios.get('/api/v1/youtube/analytics', { headers }),
          axios.get('/api/v1/twitch/analytics', { headers })
        ]);

        const [ytResult, twResult] = results;

        // 1. Handle YouTube
        if (ytResult.status === 'fulfilled') {
          setYtData(ytResult.value.data);
        } else {
          console.warn("YouTube Analytics Failed:", ytResult.reason);
        }

        // 2. Handle Twitch (With Debugging)
        if (twResult.status === 'fulfilled') {
          console.log("Twitch Data Received:", twResult.value.data); // <--- Check Console
          setTwData(twResult.value.data);
        } else {
          // This will tell us if it's a 404, 500, or Auth error
          console.error("Twitch Analytics Failed:", twResult.reason); 
        }

      } catch (err) {
        console.error("Global Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const renderStatCard = (label: string, value: string | number, icon: any, colorClass: string) => (
    <div className="bg-surface border border-border p-5 rounded-xl flex items-center gap-4 hover:border-primary/30 transition-colors">
      <div className={`p-3 rounded-lg bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-100">{value ? value.toLocaleString() : 0}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Performance</h1>
          <p className="text-slate-400">Detailed analytics across your platforms.</p>
        </div>
        <div className="flex bg-surface border border-border rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('youtube')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'youtube' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Youtube size={16} /> YouTube
          </button>
          <button 
            onClick={() => setActiveTab('twitch')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'twitch' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Twitch size={16} /> Twitch
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-500">Loading analytics...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          
          {/* YOUTUBE TAB */}
          {activeTab === 'youtube' && (
            ytData ? (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center gap-4 bg-gradient-to-r from-red-900/20 to-surface border border-red-500/20 p-6 rounded-2xl">
                  <img src={ytData.thumbnail} className="w-16 h-16 rounded-full border-2 border-red-500" alt="Channel" />
                  <div>
                    <h2 className="text-xl font-bold text-white">{ytData.channelTitle}</h2>
                    <span className="text-red-400 text-sm font-medium">YouTube Connected</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {renderStatCard("30d Views", ytData.stats.views, <Eye className="text-blue-400" size={24} />, "text-blue-400")}
                  {renderStatCard("Net Subs", ytData.stats.netSubs, ytData.stats.netSubs >= 0 ? <ArrowUp className="text-green-400" size={24} /> : <ArrowDown className="text-red-400" size={24} />, ytData.stats.netSubs >= 0 ? "text-green-400" : "text-red-400")}
                  {renderStatCard("Watch Hours", ytData.stats.watchTimeHours, <Clock className="text-orange-400" size={24} />, "text-orange-400")}
                  {renderStatCard("Avg Duration", `${ytData.stats.avgViewDuration}s`, <BarChart2 className="text-purple-400" size={24} />, "text-purple-400")}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-surface border border-border rounded-2xl text-slate-500">
                YouTube not connected. Go to Settings.
              </div>
            )
          )}

          {/* TWITCH TAB */}
          {activeTab === 'twitch' && (
            twData ? (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center gap-4 bg-gradient-to-r from-purple-900/20 to-surface border border-purple-500/20 p-6 rounded-2xl">
                  <img src={twData.thumbnail} className="w-16 h-16 rounded-full border-2 border-purple-500" alt="Channel" />
                  <div>
                    <h2 className="text-xl font-bold text-white">{twData.channelTitle}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 text-sm font-medium capitalize">{twData.stats.broadcasterType || 'Streamer'}</span>
                      {twData.stats.isLive && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded font-bold animate-pulse">LIVE</span>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderStatCard("Followers", twData.stats.followers, <Users className="text-purple-400" size={24} />, "text-purple-400")}
                  {renderStatCard("Total Views", twData.stats.totalViews, <Video className="text-blue-400" size={24} />, "text-blue-400")}
                  {renderStatCard("Current Viewers", twData.stats.currentViewers, <Eye className="text-red-400" size={24} />, "text-red-400")}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-surface border border-border rounded-2xl text-slate-500">
                Twitch not connected. Go to Settings.
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}