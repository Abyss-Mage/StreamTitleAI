'use client';

import { useState } from 'react';
import axios from 'axios';
import { X, Send, MessageSquare, AlertCircle, Check } from 'react-feather';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('General');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const token = localStorage.getItem('apiToken');
      await axios.post('/api/v1/feedback', 
        { message, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setMessage('');
      }, 2000);
    } catch (err) {
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface border border-border backdrop-blur-xl p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button>
        
        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <MessageSquare className="text-primary" size={20} /> Share Feedback
        </h2>

        {status === 'success' ? (
          <div className="text-center py-8 text-green-400 animate-in zoom-in">
            <Check size={48} className="mx-auto mb-2" />
            <p>Feedback sent! Thank you.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-border rounded-lg p-2.5 text-slate-200 outline-none focus:border-primary [&>option]:bg-slate-800 [&>option]:text-slate-200"
              >
                <option>General</option>
                <option>Bug Report</option>
                <option>Feature Request</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Message</label>
              <textarea 
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you think..."
                required
                className="w-full bg-[var(--bg-input)] border border-border rounded-lg p-3 text-slate-200 outline-none focus:border-primary resize-none"
              />
            </div>
            
            {status === 'error' && <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle size={14}/> Failed to send.</p>}

            <button 
              type="submit" 
              disabled={status === 'sending'}
              className="w-full bg-primary hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {status === 'sending' ? 'Sending...' : <><Send size={18} /> Send Feedback</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}