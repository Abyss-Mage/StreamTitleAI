// frontend/src/pages/discover/KeywordsTab.jsx
import React from 'react';
import { Search } from 'react-feather';

function KeywordsTab() {
  return (
    <div className="placeholder-tab">
      <Search size={40} />
      <h3>Keyword Explorer</h3>
      <p>Analyze search volume and get AI-driven insights on Google Trends data to find breakout topics before they peak.</p>
    </div>
  );
}

export default KeywordsTab;