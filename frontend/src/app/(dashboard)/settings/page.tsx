'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  User, Loader, AlertCircle, Save, 
  Edit3, Volume2, Slash, Link, CheckCircle,
  Youtube, Twitch, Check, X, Plus, Trash
} from 'react-feather';
import { useAuth } from '@/components/AuthProvider';

// --- Types ---
interface Profile {
  id: string;
  name: string;
  tone: string;
  voiceGuidelines: string;
  bannedWords: string[];
  defaultCTAs: string[];
  logoUrl: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [connections, setConnections] = useState<any>(null);
  
  const [googleClient, setGoogleClient] = useState<any>(null);
  const YOUTUBE_CLIENT_ID = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID; 

  const searchParams = useSearchParams();
  const router = useRouter();
  const twitchProcessing = useRef(false); // Lock for Strict Mode

  const currentProfile = profiles.find(p => p.id === selectedProfileId) || null;

  // --- 1. Load Data ---
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem('apiToken');
        const [profRes, connRes] = await Promise.all([
          axios.get('/api/v1/profile', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/v1/youtube/connections', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const fetchedProfiles = profRes.data || [];
        setProfiles(fetchedProfiles);
        if (fetchedProfiles.length > 0) setSelectedProfileId(fetchedProfiles[0].id);
        setConnections(connRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  // --- 2. Handle Twitch Callback ---
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state === 'twitch_connect' && !twitchProcessing.current) {
      twitchProcessing.current = true; // Prevent double-execution
      
      const connectTwitch = async () => {
        // Clean URL immediately
        window.history.replaceState(null, '', '/settings');
        setMessage(null);
        
        try {
          const token = localStorage.getItem('apiToken');
          const response = await axios.post('/api/v1/auth/connect/twitch', 
            { code },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          setConnections((prev: any) => ({
            ...prev,
            twitch: { connected: true, channelName: response.data.channelName }
          }));
          setMessage({ type: 'success', text: "Twitch connected successfully!" });
        } catch (err: any) {
          console.error("Twitch Error:", err.response?.data || err.message);
          setMessage({ type: 'error', text: "Twitch connection failed. Please try again." });
          twitchProcessing.current = false; // Unlock on error to allow retry
        }
      };
      connectTwitch();
    }
  }, [searchParams]);

  // --- 3. Twitch Redirect Action ---
  const handleTwitchRedirect = () => {
    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
    // Dynamically get current origin (e.g. http://localhost:80 or https://myapp.com)
    const redirectUri = encodeURIComponent(`${window.location.origin}/settings`); 
    const scope = encodeURIComponent('user:read:email channel:read:subscriptions');
    const state = 'twitch_connect';

    if (!clientId) {
      alert("Twitch Client ID is missing in .env.local");
      return;
    }

    const url = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
    window.location.href = url;
  };

  // --- 4. Google Logic ---
  const initGoogleClient = () => {
    if (window.google && YOUTUBE_CLIENT_ID) {
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: YOUTUBE_CLIENT_ID,
        scope: [
          'https://www.googleapis.com/auth/youtube.force-ssl',
          'https://www.googleapis.com/auth/yt-analytics.readonly',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ].join(' '),
        callback: (response: any) => handleYouTubeCode(response.code),
      });
      setGoogleClient(client);
    }
  };

  const handleYouTubeCode = async (code: string) => {
    setMessage(null);
    try {
      const token = localStorage.getItem('apiToken');
      const response = await axios.post('/api/v1/auth/connect/youtube', 
        { code },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConnections((prev: any) => ({
        ...prev,
        youtube: { connected: true, channelName: response.data.channelName }
      }));
      setMessage({ type: 'success', text: "YouTube connected successfully!" });
    } catch (err) {
      setMessage({ type: 'error', text: "Failed to connect YouTube." });
    }
  };

  const connectYouTube = () => {
    if (googleClient) googleClient.requestCode();
    else alert("Google Client not ready. Try refreshing.");
  };

  // --- CRUD Handlers ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('apiToken');
      await axios.put(`/api/v1/profile/${currentProfile.id}`, currentProfile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: "Profile saved!" });
    } catch (err) {
      setMessage({ type: 'error', text: "Save failed." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async () => {
    const name = prompt("Profile Name:");
    if (!name) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('apiToken');
      const res = await axios.post('/api/v1/profile', { name }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfiles([...profiles, res.data]);
      setSelectedProfileId(res.data.id);
      setMessage({ type: 'success', text: "Profile created." });
    } catch (err) {
      setMessage({ type: 'error', text: "Creation failed." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentProfile || !confirm("Delete this profile?")) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('apiToken');
      await axios.delete(`/api/v1/profile/${currentProfile.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const remaining = profiles.filter(p => p.id !== currentProfile.id);
      setProfiles(remaining);
      setSelectedProfileId(remaining[0]?.id || null);
      setMessage({ type: 'success', text: "Profile deleted." });
    } catch (err) {
      setMessage({ type: 'error', text: "Delete failed." });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof Profile, value: any) => {
    if (!selectedProfileId) return;
    setProfiles(profiles.map(p => p.id === selectedProfileId ? { ...p, [field]: value } : p));
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading settings...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="lazyOnload" 
        onLoad={initGoogleClient}
      />

      {/* Connections Card */}
      <div className="bg-surface border border-border backdrop-blur-md rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2"><Link size={20} /> Connections</h2>
        <div className="space-y-3">
          {/* YouTube */}
          <div className="flex items-center justify-between bg-[var(--bg-input)] p-4 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-500"><Youtube size={20} /></div>
              <div>
                <strong className="block text-slate-200">YouTube</strong>
                {connections?.youtube?.connected ? (
                  <span className="text-xs text-green-400 flex items-center gap-1"><Check size={12} /> Connected as {connections.youtube.channelName}</span>
                ) : (
                  <span className="text-xs text-slate-500 flex items-center gap-1"><X size={12} /> Disconnected</span>
                )}
              </div>
            </div>
            {!connections?.youtube?.connected && (
              <button onClick={connectYouTube} className="px-4 py-2 bg-primary hover:bg-violet-500 text-white text-sm font-bold rounded-lg transition-colors">
                Connect
              </button>
            )}
          </div>
          
          {/* Twitch */}
          <div className="flex items-center justify-between bg-[var(--bg-input)] p-4 rounded-xl border border-border">
             <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500"><Twitch size={20} /></div>
              <div>
                <strong className="block text-slate-200">Twitch</strong>
                {connections?.twitch?.connected ? (
                  <span className="text-xs text-green-400 flex items-center gap-1"><Check size={12} /> Connected as {connections.twitch.channelName}</span>
                ) : (
                  <span className="text-xs text-slate-500 flex items-center gap-1"><X size={12} /> Disconnected</span>
                )}
              </div>
            </div>
            {!connections?.twitch?.connected && (
              <button onClick={handleTwitchRedirect} className="px-4 py-2 bg-primary hover:bg-violet-500 text-white text-sm font-bold rounded-lg transition-colors">
                Connect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Manager */}
      <div className="bg-surface border border-border backdrop-blur-md rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2"><Edit3 size={20} /> Creator Profiles</h2>
          <div className="flex gap-2">
             <button onClick={handleCreate} className="p-2 bg-surface border border-border hover:border-primary hover:text-primary rounded-lg transition-colors" title="New Profile"><Plus size={18} /></button>
             <button onClick={handleDelete} disabled={!currentProfile} className="p-2 bg-surface border border-border hover:border-red-500 hover:text-red-500 rounded-lg transition-colors disabled:opacity-50" title="Delete Profile"><Trash size={18} /></button>
          </div>
        </div>

        <div className="mb-8">
          <select 
            className="w-full bg-[var(--bg-input)] border border-border rounded-xl p-3 text-slate-200 outline-none focus:border-primary cursor-pointer"
            value={selectedProfileId || ''}
            onChange={(e) => setSelectedProfileId(e.target.value)}
          >
            {profiles.length === 0 ? <option value="">No profiles created</option> : profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {currentProfile ? (
          <form onSubmit={handleSave} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase">Profile Name</label>
                 <input type="text" value={currentProfile.name} onChange={e => updateField('name', e.target.value)} className="w-full bg-[var(--bg-input)] border border-border rounded-lg p-3 text-slate-200 outline-none focus:border-primary" />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase">Tone</label>
                 <input type="text" value={currentProfile.tone} onChange={e => updateField('tone', e.target.value)} placeholder="e.g. Funny, chaotic" className="w-full bg-[var(--bg-input)] border border-border rounded-lg p-3 text-slate-200 outline-none focus:border-primary" />
               </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Volume2 size={14}/> Voice Guidelines</label>
                <textarea 
                  rows={3} 
                  value={currentProfile.voiceGuidelines} 
                  onChange={e => updateField('voiceGuidelines', e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-border rounded-lg p-3 text-slate-200 outline-none focus:border-primary resize-none"
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Slash size={14}/> Banned Words</label>
                  <textarea 
                    rows={4} 
                    value={currentProfile.bannedWords.join('\n')} 
                    onChange={e => updateField('bannedWords', e.target.value.split('\n'))}
                    className="w-full bg-[var(--bg-input)] border border-border rounded-lg p-3 text-slate-200 outline-none focus:border-primary resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Link size={14}/> Default Links</label>
                  <textarea 
                    rows={4} 
                    value={currentProfile.defaultCTAs.join('\n')} 
                    onChange={e => updateField('defaultCTAs', e.target.value.split('\n'))}
                    className="w-full bg-[var(--bg-input)] border border-border rounded-lg p-3 text-slate-200 outline-none focus:border-primary resize-none"
                  />
                </div>
             </div>

             <div className="pt-4 border-t border-border">
                {message && (
                  <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                  </div>
                )}
                <button type="submit" disabled={isSaving} className="w-full bg-primary hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <Loader size={18} className="animate-spin" /> : <><Save size={18} /> Save Changes</>}
                </button>
             </div>
          </form>
        ) : (
          <div className="text-center py-10 text-slate-500">Create a profile to get started.</div>
        )}
      </div>
    </div>
  );
}