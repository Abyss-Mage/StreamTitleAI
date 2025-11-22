// frontend/src/pages/discover/SubscribersTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader, AlertCircle, BarChart } from 'react-feather';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import '/src/App.css'; // For shared styles
import './SubscribersTab.css'; // For custom tooltip

// Custom Tooltip for the chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const netValue = payload[0].value;
    const netColor = netValue >= 0 ? '#04b404' : '#ff8b8b';
    
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{`Date: ${label}`}</p>
        <p className="tooltip-net" style={{ color: netColor }}>
          {`Net Change: `}
          <strong>{netValue}</strong>
        </p>
      </div>
    );
  }
  return null;
};

function SubscribersTab() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGrowthData = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('apiToken');

      try {
        const response = await axios.get('/api/v1/youtube/analytics/growth', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setData(response.data.growthData || []);
        } else {
          throw new Error("Failed to fetch growth data.");
        }
      } catch (err) {
        console.error("Error fetching growth data:", err);
        setError(err.response?.data || "Failed to load chart. Please check your YouTube connection in Settings.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrowthData();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <div className="loading-spinner" style={{ margin: '40px auto' }}></div>;
    }

    if (error) {
      return (
        <div className="error-message" style={{ marginTop: 0 }}>
          <AlertCircle size={16}/> {error}
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="placeholder-tab" style={{ padding: '40px' }}>
          <BarChart size={30} />
          <h3 style={{marginTop: '15px'}}>No Data Found</h3>
          <p>We couldn't find any subscriber data for the last 30 days.</p>
        </div>
      );
    }

    // Find the min/max values to set the chart domain
    const netValues = data.map(d => d.Net);
    const yMin = Math.min(...netValues, -1); // Add a buffer
    const yMax = Math.max(...netValues, 1); // Add a buffer

    return (
      <div className="chart-container" style={{ height: '400px' }}>
        <h4 style={{textAlign: 'center', margin: '0 0 20px 0', color: 'var(--text-primary)'}}>
          Net Subscriber Change (Last 30 Days)
        </h4>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 5,
              right: 20,
              left: -10, // Adjust to show Y-axis labels
              bottom: 5,
            }}
          >
            {/* --- FIX: Pass CSS variables as simple strings --- */}
            <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
            <XAxis 
              dataKey="day" 
              stroke="var(--text-secondary)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--text-secondary)" 
              fontSize={12}
              domain={[yMin, yMax]} // Set Y-axis scale
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="Net" 
              stroke="var(--primary-color)" 
              fill="var(--primary-glow)"
              strokeWidth={2}
            />
            {/* --- END OF FIX --- */}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="subscribers-tab">
      {renderContent()}
    </div>
  );
}

export default SubscribersTab;