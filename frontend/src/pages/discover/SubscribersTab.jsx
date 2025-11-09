// frontend/src/pages/discover/SubscribersTab.jsx
import React from 'react';
import { BarChart } from 'react-feather';

function SubscribersTab() {
  return (
    <div className="placeholder-tab">
      <BarChart size={40} />
      <h3>Subscriber Analytics</h3>
      <p>Visualize your channel's growth, see which videos are driving the most subscribers, and understand your audience retention better.</p>
    </div>
  );
}

export default SubscribersTab;