'use client';

import { useState } from 'react';
import axios from 'axios';
import { Check, Zap, Shield, Star } from 'react-feather';
import { useAuth } from '@/components/AuthProvider';

export default function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Replace this with your actual Stripe Price ID from your Stripe Dashboard
  // e.g., price_1Qxxxxxxxxxxxxxx
  const STRIPE_PRICE_ID = "price_1SWGLiSgkZbSk9McUwYFjO5y"; 

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('apiToken');
      const { data } = await axios.post('/api/v1/stripe/create-checkout-session', 
        { priceId: STRIPE_PRICE_ID },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Redirect to Stripe
      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout failed", error);
      alert("Failed to start checkout.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 animate-in fade-in duration-500">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-slate-100 mb-4">Upgrade Your Content Game</h1>
        <p className="text-xl text-slate-400">Unlock the full power of AI optimization and coaching.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* Free Plan */}
        <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col">
          <div className="mb-4">
            <span className="bg-slate-700 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Starter</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-100 mb-2">Free</h2>
          <p className="text-slate-400 mb-8">Perfect for getting started.</p>
          
          <ul className="space-y-4 flex-1 mb-8">
            <li className="flex items-center gap-3 text-slate-300"><Check size={20} className="text-green-400" /> 5 AI Generations / day</li>
            <li className="flex items-center gap-3 text-slate-300"><Check size={20} className="text-green-400" /> Basic Outlier Ideas</li>
            <li className="flex items-center gap-3 text-slate-300"><Check size={20} className="text-green-400" /> 1 Creator Profile</li>
          </ul>

          <button className="w-full py-4 rounded-xl border border-border bg-[var(--bg-input)] text-slate-300 font-bold cursor-not-allowed opacity-50">
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-b from-violet-900/20 to-surface border border-violet-500/30 rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 bg-violet-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">POPULAR</div>
          
          <div className="mb-4">
            <span className="bg-violet-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
              <Star size={12} fill="white" /> Pro
            </span>
          </div>
          <h2 className="text-3xl font-bold text-slate-100 mb-2">$19<span className="text-lg text-slate-400 font-normal">/month</span></h2>
          <p className="text-violet-200 mb-8">For serious creators.</p>
          
          <ul className="space-y-4 flex-1 mb-8">
            <li className="flex items-center gap-3 text-white"><Check size={20} className="text-violet-400" /> <strong>Unlimited</strong> Generations</li>
            <li className="flex items-center gap-3 text-white"><Check size={20} className="text-violet-400" /> <strong>AI Coach</strong> Access</li>
            <li className="flex items-center gap-3 text-white"><Check size={20} className="text-violet-400" /> Competitor Analysis</li>
            <li className="flex items-center gap-3 text-white"><Check size={20} className="text-violet-400" /> Unlimited Profiles</li>
          </ul>

          <button 
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-white text-violet-900 font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? "Redirecting..." : "Upgrade Now"} <Zap size={20} fill="currentColor" />
          </button>
        </div>

      </div>
    </div>
  );
}