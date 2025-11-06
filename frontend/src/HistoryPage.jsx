import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- FIX: Was 'in', now 'from'
import { Youtube, Clock, AlertTriangle } from 'react-feather';
import './App.css'; // We can reuse the same styles

// --- History Item Component ---
function HistoryItem({ item, onLoad }) {
  return (
    <div className="history-item" onClick={() => onLoad(item)}>
      <div className="history-item-game">{item.game}</div>
      <div className="history-item-title">
        <Youtube size={14} /> 
        <span>{item.youtube.title}</span>
      </div>
    </div>
  );
}

function HistoryPage() {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate(); // Hook for navigation

  // Load history from localStorage on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('streamTitleHistory');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, []);

  // --- NEW: Load a history item ---
  // This function now uses sessionStorage to pass the data
  // and navigates the user back to the homepage.
  const loadHistoryItem = (item) => {
    try {
      sessionStorage.setItem('loadItem', JSON.stringify(item));
      navigate('/'); // Navigate back to the generator page
    } catch (e) {
      console.error("Failed to save item to sessionStorage", e);
      alert("Error loading item.");
    }
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear all history? This cannot be undone.")) {
      localStorage.removeItem('streamTitleHistory');
      setHistory([]);
    }
  };

  return (
    <div className="history-section-page">
      <div className="history-header">
        <h2 style={{ margin: 0 }}><Clock size={28} /> Generation History</h2>
        <button className="clear-history-btn" onClick={clearHistory}>
          Clear All
        </button>
      </div>
      <p>Click an item to reload it on the main page.</p>
      
      {history.length > 0 ? (
        <div className="history-list">
          {history.map((item) => (
            <HistoryItem key={item.id} item={item} onLoad={loadHistoryItem} />
          ))}
        </div>
      ) : (
        <div className="history-empty">
          <AlertTriangle size={40} />
          <h3>No History Found</h3>
          <p>Your generated content will appear here.</p>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;