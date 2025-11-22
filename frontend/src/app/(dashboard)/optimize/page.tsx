'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Eye, ThumbsUp, AlertCircle } from 'react-feather';
import OptimizeModal from '@/components/OptimizeModal';
import { useAuth } from '@/components/AuthProvider';

// --- Types ---
interface Video {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: { url: string };
      high: { url: string };
      maxres?: { url: string };
    };
  };
  statistics: {
    viewCount: string;
    likeCount: string;
  };
}

export default function OptimizePage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const token = localStorage.getItem('apiToken');
        const response = await axios.get('/api/v1/youtube/videos', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVideos(response.data.videos || []);
      } catch (err: any) {
        console.error("Error fetching videos:", err);
        setError("Failed to load videos. Check your YouTube connection in Settings.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchVideos();
  }, [user]);

  // Formatter
  const fmt = (num: string) => new Intl.NumberFormat('en-US', { notation: "compact" }).format(Number(num));

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-violet-500/10 rounded-2xl text-violet-400">
          <Zap size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Optimize Content</h1>
          <p className="text-slate-400">Select a recent video to get AI-powered improvement suggestions.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-80 bg-surface border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-400">
          <AlertCircle className="mx-auto mb-2" size={32} />
          <p>{error}</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-border rounded-2xl">
          <h3 className="text-xl font-bold text-slate-300">No Videos Found</h3>
          <p className="text-slate-500">Connect your YouTube channel in settings to see your content.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div 
              key={video.id} 
              className="group bg-surface border border-border hover:border-primary/50 backdrop-blur-md rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 flex flex-col"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden bg-black">
                <img 
                  src={video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.medium.url} 
                  alt={video.snippet.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              </div>
              
              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-slate-100 line-clamp-2 mb-3 min-h-[3rem]" title={video.snippet.title}>
                  {video.snippet.title}
                </h3>
                
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-5">
                  <span className="flex items-center gap-1"><Eye size={14} /> {fmt(video.statistics.viewCount)}</span>
                  <span className="flex items-center gap-1"><ThumbsUp size={14} /> {fmt(video.statistics.likeCount)}</span>
                </div>

                <button 
                  onClick={() => setSelectedVideo(video)}
                  className="mt-auto w-full py-3 bg-[var(--bg-input)] border border-border hover:bg-primary hover:text-white hover:border-primary rounded-lg font-semibold text-slate-300 transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={16} /> Optimize
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedVideo && (
        <OptimizeModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </div>
  );
}