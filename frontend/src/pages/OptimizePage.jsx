// frontend/src/pages/OptimizePage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader, AlertCircle, Eye, ThumbsUp, Zap } from 'react-feather';
import '../App.css'; // For .results-card and .loading-spinner
import './OptimizePage.css'; // New CSS for this page

// Helper to format large numbers (e.g., 10000 -> 10,000)
const formatNumber = (num) => {
  if (num === undefined || num === null) return 'N/A';
  return new Intl.NumberFormat('en-US').format(num);
};

// Component for a single video card
function VideoCard({ video }) {
  const { snippet, statistics } = video;
  
  // Get the best available thumbnail
  const thumbnail = snippet.thumbnails.maxres || snippet.thumbnails.high || snippet.thumbnails.medium;

  return (
    <div className="video-card">
      <div className="video-thumbnail">
        <img src={thumbnail.url} alt={snippet.title} loading="lazy" />
      </div>
      <div className="video-info">
        <h3 className="video-title" title={snippet.title}>
          {snippet.title}
        </h3>
        <div className="video-stats">
          <span className="stat-item">
            <Eye size={14} /> {formatNumber(statistics.viewCount)}
          </span>
          <span className="stat-item">
            <ThumbsUp size={14} /> {formatNumber(statistics.likeCount)}
          </span>
        </div>
        <button className="generate-button optimize-btn">
          <Zap size={16} />
          Optimize with AI
        </button>
      </div>
    </div>
  );
}

function OptimizePage() {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('apiToken');

      try {
        const response = await axios.get('/api/v1/youtube/videos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setVideos(response.data.videos || []);
        } else {
          throw new Error("Failed to fetch videos.");
        }

      } catch (err) {
        console.error("Error fetching videos:", err);
        setError(err.response?.data || "Failed to load videos. Please check your YouTube connection in Settings.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <div className="loading-spinner" style={{ margin: '40px auto' }}></div>;
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }

    if (videos.length === 0) {
      return (
        <div className="history-empty" style={{padding: '40px'}}>
          <AlertCircle size={40} />
          <h3>No Videos Found</h3>
          <p>We couldn't find any recent videos on your connected YouTube channel.</p>
        </div>
      );
    }

    return (
      <div className="video-grid">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    );
  };

  return (
    <div className="results-card" style={{ marginTop: 0 }}>
      <div className="optimize-header">
        <h2><Zap size={28} /> Optimize Your Videos</h2>
        <p>Select a recent video to analyze and get AI-powered suggestions for titles, descriptions, and more.</p>
      </div>
      {renderContent()}
    </div>
  );
}

export default OptimizePage;