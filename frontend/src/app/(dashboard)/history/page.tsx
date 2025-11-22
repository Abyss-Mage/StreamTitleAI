'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { useAuth } from '@/components/AuthProvider';
import { Clock, Trash2, Youtube, Monitor, AlertTriangle } from 'react-feather';

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'history'), 
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [user]);

  const clearAll = async () => {
    if (!confirm("Clear all history?")) return;
    const q = query(collection(db, 'history'), where("uid", "==", user?.uid));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    setHistory([]);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3"><Clock className="text-violet-400" /> History</h1>
        {history.length > 0 && (
          <button onClick={clearAll} className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors text-sm font-bold">
            Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-20">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-border rounded-2xl">
          <AlertTriangle size={40} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-300">No History Found</h3>
          <p className="text-slate-500">Your generated content will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map(item => (
            <div key={item.id} className="bg-surface border border-border p-5 rounded-xl hover:border-primary/50 transition-colors cursor-default group">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-200 text-lg mb-1">{item.game || 'Unknown Game'}</h4>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    {item.platform === 'Twitch' ? <Monitor size={14} /> : <Youtube size={14} />}
                    <span className="truncate max-w-md">{item.platformTitle}</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-black/20 px-2 py-1 rounded">
                  {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Just now'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}