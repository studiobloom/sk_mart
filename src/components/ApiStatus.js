import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApiStatus = () => {
  const [status, setStatus] = useState('checking');
  
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        // Try to fetch a small amount of data to check if the API is responsive
        await axios.get('https://api.darkerdb.com/v1/market/analytics/WolfPelt/prices/history?interval=1h&limit=1');
        setStatus('online');
      } catch (error) {
        if (error.response) {
          // If we get any response, the API is at least partially working
          setStatus('degraded');
        } else {
          // No response means the API is likely down
          setStatus('offline');
        }
      }
    };
    
    checkApiStatus();
    
    // Check API status every 5 minutes
    const interval = setInterval(checkApiStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'API Online';
      case 'degraded':
        return 'API Degraded';
      case 'offline':
        return 'API Offline';
      default:
        return 'Checking API...';
    }
  };
  
  return (
    <div className="api-status">
      <div className={`status-indicator status-${status}`} />
      <span className="status-text">{getStatusText()}</span>
    </div>
  );
};

export default ApiStatus; 