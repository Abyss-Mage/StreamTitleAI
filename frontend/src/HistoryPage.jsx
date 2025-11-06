// frontend/src/HistoryPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Youtube, Clock, AlertTriangle, Loader } from 'react-feather';
import './App.css';

// Firebase Imports
import { auth, db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';

// --- History Item Component ---
function HistoryItem({ item, onLoad }) {
  // Use new generic keys
  return (
    <div className="history-item" onClick={() => onLoad(item)}>
      <div className="history-item-game">{item.game}</div>
      <div className="history-item-title">
        <Youtube size={14} /> 
        <span>{item.platformTitle}</span>
      </div>
    </div>
  );
}

function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Load history from Firestore on mount
  useEffect(() => {
    const fetchHistory = async () => {
      if (!auth.currentUser) return; // Wait for user
      
      try {
        setIsLoading(true);
        const historyCollection = collection(db, 'history');
        const q = query(
          historyCollection, 
          where("uid", "==", auth.currentUser.uid),
          orderBy("createdAt", "desc") // Order by timestamp
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedHistory = [];
        querySnapshot.forEach((doc) => {
          fetchedHistory.push({ id: doc.id, ...doc.data() });
        });
        setHistory(fetchedHistory);
        
      } catch (error) {
        console.error("Error fetching history: ", error);
        alert("Could not load history.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [auth.currentUser]); // Re-run if user changes

  const loadHistoryItem = (item) => {
    try {
      sessionStorage.setItem('loadItem', JSON.stringify(item));
      navigate('/'); // Navigate back to the generator page
    } catch (e) {
      console.error("Failed to save item to sessionStorage", e);
      alert("Error loading item.");
    }
  };

  const clearHistory = async () => {
    if (window.confirm("Are you sure you want to clear ALL your history? This cannot be undone.")) {
      try {
        setIsLoading(true);
        // We must delete documents one by one
        const historyCollection = collection(db, 'history');
        const q = query(historyCollection, where("uid", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const deletePromises = [];
        querySnapshot.forEach((doc) => {
          deletePromises.push(deleteDoc(doc.ref));
        });
        
        await Promise.all(deletePromises);
        setHistory([]); // Clear from state
        
      } catch (error) {
        console.error("Error clearing history: ", error);
        alert("Failed to clear history.");
      } finally {
        setIsLoading(false);
      }
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
      
      {isLoading ? (
        <div className="loading-spinner"></div>
      ) : history.length > 0 ? (
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