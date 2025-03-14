import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getItemPriceHistory } from '../api/marketApi';
import PriceChart from './PriceChart';
import ItemStats from './ItemStats';

const ItemPriceHistory = () => {
  const { itemId } = useParams();
  
  const [chartData, setChartData] = useState([]);
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTime, setLoadingTime] = useState(0);
  const [priceError, setPriceError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState('1h');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const availableIntervals = [
    { value: '5m', label: '5 Min' },
    { value: '15m', label: '15 Min' },
    { value: '30m', label: '30 Min' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' }
  ];

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
    } else {
      setLoadingTime(0);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading]);

  // Fetch stats data (always using 1h interval for consistency)
  const fetchStatsData = useCallback(async () => {
    try {
      // Always use 1h interval for stats to ensure consistency
      const response = await getItemPriceHistory(itemId, '1h');
      const data = response.body || [];
      
      const sortedData = [...data].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      setStatsData(sortedData);
      return true;
    } catch (err) {
      console.error(`Error fetching stats data:`, err);
      return false;
    }
  }, [itemId]);

  // Fetch chart data with the selected interval
  const fetchChartData = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      const response = await getItemPriceHistory(itemId, selectedInterval);
      const data = response.body || [];
      
      const sortedData = [...data].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      setChartData(sortedData);
      setIsRefreshing(false);
      return true;
    } catch (err) {
      console.error(`Error fetching ${selectedInterval} interval data:`, err);
      setPriceError(`Failed to fetch price history for interval ${selectedInterval}. Please try another interval.`);
      setIsRefreshing(false);
      return false;
    }
  }, [itemId, selectedInterval]);

  // Initial data load
  useEffect(() => {
    if (itemId) {
      setLoading(true);
      setPriceError(null);
      
      const loadData = async () => {
        // First load stats data (1h interval)
        const statsSuccess = await fetchStatsData();
        
        // Then load chart data with selected interval
        const chartSuccess = await fetchChartData();
        
        if (statsSuccess && chartSuccess) {
          setDataLoaded(true);
        } else if (!statsSuccess && !chartSuccess) {
          setPriceError('Failed to fetch any data. Please check if the item name is correct.');
        }
        
        setLoading(false);
      };
      
      loadData();
    }
  }, [itemId, fetchStatsData, fetchChartData]); // Include the callback functions as dependencies

  // When interval changes, only update chart data
  useEffect(() => {
    if (itemId && dataLoaded) {
      fetchChartData();
    }
  }, [selectedInterval, itemId, dataLoaded, fetchChartData]);

  const handleIntervalChange = (interval) => {
    if (interval !== selectedInterval) {
      setSelectedInterval(interval);
    }
  };

  const formatItemName = (name) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase());
  };

  if (loading && !dataLoaded) {
    return (
      <div className="loading">
        <div style={{ textAlign: 'center' }}>
          <div>Loading price history for {formatItemName(itemId)}...</div>
          {loadingTime > 3 && (
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#8a8a8a' }}>
              Loading data...
              {loadingTime > 10 && (
                <div style={{ marginTop: '5px' }}>
                  Still loading... ({loadingTime}s)
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const shouldShowChart = chartData.length > 0;
  const hasStatsData = statsData.length > 0;

  if (priceError && !shouldShowChart && !hasStatsData) {
    return (
      <div>
        <div className="error">{priceError}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="item-header">
      </div>
      
      {priceError && !shouldShowChart ? (
        <div className="error">{priceError}</div>
      ) : (
        <>
          {/* Always use statsData for consistent stats display */}
          {hasStatsData ? (
            <ItemStats priceData={statsData} itemName={formatItemName(itemId)} />
          ) : (
            <div className="loading">
              <p>Loading statistics...</p>
            </div>
          )}
          
          <div className="card">
            <div className="chart-header">
              <h2>Market History</h2>
              <div className="interval-selector">
                {availableIntervals.map(interval => (
                  <button
                    key={interval.value}
                    className={`interval-button ${selectedInterval === interval.value ? 'active' : ''}`}
                    onClick={() => handleIntervalChange(interval.value)}
                    disabled={isRefreshing}
                  >
                    {interval.label}
                  </button>
                ))}
              </div>
            </div>
            
            {isRefreshing ? (
              <div className="loading">
                <p>Updating chart data...</p>
              </div>
            ) : shouldShowChart ? (
              <PriceChart priceData={chartData} selectedInterval={selectedInterval} />
            ) : (
              <div className="loading">
                <p>No price data available for the selected interval.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ItemPriceHistory; 