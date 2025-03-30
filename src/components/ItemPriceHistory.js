import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getItemPriceHistory } from '../api/marketApi';
import PriceChart from './PriceChart';
import ItemIcon from './ItemIcon';

const ItemPriceHistory = () => {
  const { itemId } = useParams();
  const [hasFetched, setHasFetched] = useState(false);
  
  const [chartData, setChartData] = useState([]);
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTime, setLoadingTime] = useState(0);
  const [priceError, setPriceError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState('1h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imagesLoadingCount, setImagesLoadingCount] = useState(0);
  const [forceShowContent, setForceShowContent] = useState(false);

  const availableIntervals = [
    { value: '5m', label: '5 Min' },
    { value: '15m', label: '15 Min' },
    { value: '30m', label: '30 Min' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' }
  ];

  // Handle image load completion
  const handleImageLoaded = () => {
    setImagesLoadingCount(prev => {
      const newCount = prev - 1;
      if (newCount <= 0) {
        setImagesLoaded(true);
      }
      return newCount;
    });
  };

  // Handle image load error - count it as loaded to prevent blocking the UI
  const handleImageError = () => {
    handleImageLoaded();
  };

  const renderPrice = (price) => {
    if (!price) return null;
    return (
      <div className="price-value">
        <img 
          src="/images/gold.png" 
          alt="gold" 
          className="coin-icon" 
          style={{ width: '24px', height: '24px', marginRight: '4px' }} 
          onLoad={handleImageLoaded}
          onError={handleImageError}
        />
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

  // Fetch data with a specific interval
  const fetchData = useCallback(async (interval) => {
    setIsRefreshing(true);
    
    try {
      console.log(`Fetching data with interval ${interval}...`);
      const response = await getItemPriceHistory(itemId, interval);
      
      // Check if we got valid data back
      if (!response || !response.body || !Array.isArray(response.body) || response.body.length === 0) {
        console.error(`No valid data returned for ${itemId} with interval ${interval}`);
        setIsRefreshing(false);
        return false;
      }
      
      const data = response.body;
      const sortedData = [...data].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      // If this is the '1h' interval (used for stats)
      if (interval === '1h') {
        setStatsData(sortedData);
      }
      
      // Always update chart data with the requested interval
      setChartData(sortedData);
      setIsRefreshing(false);
      return true;
    } catch (err) {
      console.error(`Error fetching ${interval} interval data:`, err);
      setPriceError(`Failed to fetch price history for interval ${interval}. Please try another interval.`);
      setIsRefreshing(false);
      return false;
    }
  }, [itemId]);

  // Single effect to handle all data loading
  useEffect(() => {
    // Skip if no itemId
    if (!itemId) return;
    
    // Skip if we've already fetched for this item
    if (hasFetched) return;
    
    const fetchInitialData = async () => {
      setLoading(true);
      setPriceError(null);
      setDataLoaded(false);
      
      try {
        console.log(`Initial data fetch for ${itemId} with interval ${selectedInterval}`);
        // Make a single API call for the initial data
        const success = await fetchData(selectedInterval);
        
        // If we need 1h data for stats and selectedInterval isn't 1h, fetch that too
        if (success && selectedInterval !== '1h') {
          await fetchData('1h');
        }
        
        if (success) {
          // Reset image loading state
          setImagesLoaded(false);
          setForceShowContent(false);
          setImagesLoadingCount(4);
          
          // Set a timeout to force show content after 3 seconds
          setTimeout(() => {
            setForceShowContent(true);
          }, 3000);
          
          setDataLoaded(true);
        } else {
          setPriceError('Failed to fetch data. Please check if the item name is correct.');
        }
      } catch (err) {
        console.error(`Error during initial data load:`, err);
        setPriceError('An error occurred while loading data.');
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    };
    
    fetchInitialData();
  }, [itemId, selectedInterval, fetchData, hasFetched]);

  // Reset fetch flag when itemId changes
  useEffect(() => {
    setHasFetched(false);
  }, [itemId]);

  const handleIntervalChange = (interval) => {
    if (interval !== selectedInterval) {
      // Call fetchData with the new interval directly
      if (itemId && dataLoaded) {
        fetchData(interval);
      }
      
      // Update the state
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
      <div className="content">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>{formatItemName(itemId)}</h2>
          <ItemIcon 
            itemId={itemId} 
            size={40} 
            style={{ marginLeft: '10px' }} 
            onLoad={handleImageLoaded} 
            onError={handleImageError}
          />
        </div>

        {/* Stats section */}
        <div className="stats-section">
          {loading ? (
            <div className="loading-overlay">
              <p>Loading statistics...</p>
            </div>
          ) : hasStatsData ? (
            renderStats(statsData, formatItemName(itemId))
          ) : priceError ? (
            <div className="error">{priceError}</div>
          ) : null}
        </div>
        
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
          
          <div className="chart-container" style={{ position: 'relative', minHeight: '300px' }}>
            {isRefreshing && (
              <div className="loading-overlay">
                <p>Updating chart data...</p>
              </div>
            )}
            {shouldShowChart ? (
              <PriceChart priceData={chartData} selectedInterval={selectedInterval} />
            ) : loading ? (
              <div className="loading-overlay">
                <p>Loading price history...</p>
              </div>
            ) : (
              <div className="no-data">
                <p>No price data available for the selected interval.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .content {
          opacity: 1;
          transition: opacity 0.3s ease;
        }
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.7);
          border-radius: 4px;
        }
        .stats-section {
          position: relative;
          min-height: 100px;
        }
        .no-data {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default ItemPriceHistory; 