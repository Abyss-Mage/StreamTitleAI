// frontend/src/pages/discover/CompetitorsTab.jsx
import React from 'react';
import { Users } from 'react-feather';

function CompetitorsTab() {
  return (
    <div className="placeholder-tab">
      <Users size={40} />
      <h3>Competitor Analysis</h3>
      <p>Track other channels in your space to see what's working for them and find gaps in their content strategy that you can fill.</p>
    </div>
  );
}

export default CompetitorsTab;