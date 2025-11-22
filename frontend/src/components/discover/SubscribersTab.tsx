'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { BarChart, AlertCircle } from 'react-feather';
import { useAuth } from '@/components/AuthProvider';

export default function SubscribersTab() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if(!user) return;
      try {
        const token = localStorage.getItem('apiToken');
        const res = await axios.get('/api/v1/youtube/analytics/growth', { headers: { Authorization: `Bearer ${token}` } });
        setData(res.data.growthData || []);
      } catch(e) { setError("Failed to load growth data."); } finally { setLoading(false); }
    };
    fetchData();
  }, [user]);

  if(loading) return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-violet-500 rounded-full animate-spin border-t-transparent"></div></div>;
  if(data.length === 0) return <div className="text-center py-20 text-slate-500">No subscriber data found (Channel new or unconnected).</div>;

  return (
    <div className="h-[400px] bg-surface border border-border rounded-xl p-6">
      <h3 className="text-lg font-bold text-slate-100 mb-6 text-center">Net Subscriber Growth (30 Days)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Area type="monotone" dataKey="Net" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorNet)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}