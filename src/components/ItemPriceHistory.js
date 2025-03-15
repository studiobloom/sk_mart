import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getItemPriceHistory } from '../api/marketApi';
import PriceChart from './PriceChart';
import ItemIcon from './ItemIcon';

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

  const renderPrice = (price) => {
    if (!price) return null;
    return (
      <div className="price-value">
        <img src="/images/gold.png" alt="gold" className="coin-icon" style={{ width: '24px', height: '24px', marginRight: '4px' }} />
        <span>{price.toFixed(2)}</span>
      </div>
    );
  };

  const renderStats = (priceData, itemName) => {
    if (!priceData || priceData.length === 0) return null;

    const currentPrice = priceData[priceData.length - 1].avg;
    
    // Calculate 24h change
    const last24hData = priceData.filter(item => {
      const itemDate = new Date(item.timestamp);
      const now = new Date(priceData[priceData.length - 1].timestamp);
      const timeDiff = now - itemDate;
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      return hoursDiff <= 24;
    });

    const oldestIn24h = last24hData[0]?.avg || currentPrice;
    const priceChange24h = currentPrice - oldestIn24h;
    const percentChange24h = (priceChange24h / oldestIn24h) * 100;

    // Calculate 7d change
    const last7dData = priceData.filter(item => {
      const itemDate = new Date(item.timestamp);
      const now = new Date(priceData[priceData.length - 1].timestamp);
      const timeDiff = now - itemDate;
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });

    const oldestIn7d = last7dData[0]?.avg || currentPrice;
    const priceChange7d = currentPrice - oldestIn7d;
    const percentChange7d = (priceChange7d / oldestIn7d) * 100;

    // Calculate total volume in last 24h
    const volume24h = last24hData.reduce((sum, item) => sum + item.volume, 0);

    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-label">Current Price</div>
            <div className="stat-value">
              {renderPrice(currentPrice)}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">24h Change</div>
            <div className="stat-value">
              {renderPrice(priceChange24h)}
              <span className={priceChange24h >= 0 ? 'stat-change-positive' : 'stat-change-negative'}>
                ({percentChange24h.toFixed(2)}%)
              </span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">7d Change</div>
            <div className="stat-value">
              {renderPrice(priceChange7d)}
              <span className={priceChange7d >= 0 ? 'stat-change-positive' : 'stat-change-negative'}>
                ({percentChange7d.toFixed(2)}%)
              </span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">24h Volume</div>
            <div className="stat-value">{volume24h}</div>
          </div>
        </div>
      </div>
    );
  };

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
      {priceError && !shouldShowChart ? (
        <div className="error">{priceError}</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0 }}>{formatItemName(itemId)}</h2>
            <ItemIcon itemId={itemId} size={40} style={{ marginLeft: '10px' }} />
          </div>

          {/* Always use statsData for consistent stats display */}
          {hasStatsData ? (
            renderStats(statsData, formatItemName(itemId))
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