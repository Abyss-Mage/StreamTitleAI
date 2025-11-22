'use client';

import { useState } from 'react';
import { Coffee, TrendingUp, Search, Users, BarChart } from 'react-feather';
import OutliersTab from '@/components/discover/OutliersTab';
import KeywordsTab from '@/components/discover/KeywordsTab';
import CompetitorsTab from '@/components/discover/CompetitorsTab';
import SubscribersTab from '@/components/discover/SubscribersTab';

const TABS = [
  { id: 'outliers', label: 'Outliers', icon: TrendingUp, component: OutliersTab },
  { id: 'keywords', label: 'Keywords', icon: Search, component: KeywordsTab },
  { id: 'competitors', label: 'Competitors', icon: Users, component: CompetitorsTab },
  { id: 'subscribers', label: 'Subscribers', icon: BarChart, component: SubscribersTab },
];

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState('outliers');

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || OutliersTab;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
          <Coffee size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Discover Suite</h1>
          <p className="text-slate-400">Find your next big video idea by analyzing trends, keywords, and competitors.</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-t-lg font-semibold transition-all whitespace-nowrap
                ${isActive 
                  ? 'bg-surface border-b-2 border-primary text-primary' 
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                }
              `}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        <ActiveComponent />
      </div>
    </div>
  );
}