// frontend/src/pages/DiscoverPage.jsx
import React, { useState } from 'react';
import { Coffee, TrendingUp, Search, Users, BarChart } from 'react-feather';

// --- NEW: Import placeholder tabs ---
import OutliersTab from './discover/OutliersTab';
import KeywordsTab from './discover/KeywordsTab';
import CompetitorsTab from './discover/CompetitorsTab';
import SubscribersTab from './discover/SubscribersTab';

// --- FIX: Use relative path for App.css ---
import '../App.css'; // For .results-card
import './DiscoverPage.css'; // New CSS for this page

const tabs = [
  { id: 'outliers', label: 'Outliers', icon: TrendingUp, component: <OutliersTab /> },
  { id: 'keywords', label: 'Keywords', icon: Search, component: <KeywordsTab /> },
  { id: 'competitors', label: 'Competitors', icon: Users, component: <CompetitorsTab /> },
  { id: 'subscribers', label: 'Subscribers', icon: BarChart, component: <SubscribersTab /> },
];

function DiscoverPage() {
  const [activeTab, setActiveTab] = useState('outliers');

  const renderActiveTab = () => {
    const tab = tabs.find(t => t.id === activeTab);
    return tab ? tab.component : null;
  };

  return (
    <div className="results-card" style={{ marginTop: 0 }}>
      <div className="discover-header">
        <h2><Coffee size={28} /> Discover Suite</h2>
        <p>Find your next big video idea by analyzing trends, keywords, and competitors.</p>
      </div>

      {/* --- Tab Navigation --- */}
      <div className="tabs-nav">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- Tab Content --- */}
      <div className="tab-content">
        {renderActiveTab()}
      </div>
    </div>
  );
}

export default DiscoverPage;