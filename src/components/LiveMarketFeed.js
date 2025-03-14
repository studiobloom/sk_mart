import React, { useState, useEffect } from 'react';
import marketApi from '../api/marketApi';

const LiveMarketFeed = () => {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await marketApi.getLiveMarketData();
        setMarketData(response.body);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMarketData();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);

    return () => clearInterval(interval);
  }, []);

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
      <div>
        {itemName && (
          <h2 style={{ marginBottom: '1rem' }}>{itemName}</h2>
        )}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-label">Current Price</div>
              <div className="stat-value">
                {renderPrice(currentPrice, 1)}
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">24h Change</div>
              <div className="stat-value">
                {priceChange24h.toFixed(2)} <span className={priceChange24h >= 0 ? 'stat-change-positive' : 'stat-change-negative'}>({percentChange24h.toFixed(2)}%)</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">7d Change</div>
              <div className="stat-value">
                {priceChange7d.toFixed(2)} <span className={priceChange7d >= 0 ? 'stat-change-positive' : 'stat-change-negative'}>({percentChange7d.toFixed(2)}%)</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">24h Volume</div>
              <div className="stat-value">{volume24h}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to get background color based on rarity
  const getRarityColor = (rarity) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary':
        return [255, 154, 0];
      case 'epic':
        return [208, 103, 255];
      case 'rare':
        return [0, 170, 238];
      case 'uncommon':
        return [124, 214, 0];
      case 'unique':
        return [255, 232, 129];
      case 'common':
        return [255, 255, 255];
      case 'poor':
        return [120, 120, 120];
    }
  };

  // Helper function to determine text color based on rarity background
  const getTextColor = (rarity) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary':
        return '#ffdf00'; // bright gold
      case 'epic':
        return '#e0b0ff'; // light purple
      case 'rare':
        return '#add8e6'; // light blue
      case 'uncommon':
        return '#90ee90'; // light green
      case 'unique':
        return '#d4d4aa'; // light olive
      default:
        return '#d3d3d3'; // light gray
    }
  };

  const renderPrice = (totalPrice, quantity = 1) => {
    if (!totalPrice || totalPrice <= 0) return null;
    const perPiecePrice = quantity > 0 ? Math.floor(totalPrice / quantity) : totalPrice;

    return (
      <div className="item-price">
        <img src="/images/divider.png" alt="" className="price-divider" />
        <div className="price-section">
          <span className="price-value">{totalPrice}</span>
          <i className="coin-icon fas fa-coins" />
        </div>
        <img src="/images/divider.png" alt="" className="price-divider" />
        <div className="price-section">
          <span className="price-value">{perPiecePrice}</span>
          <i className="coin-icon fas fa-coins" />
          <span className="quantity">x{quantity}</span>
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading">Loading market data...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="market-feed">
      <h2>Live Market Listings</h2>
      <div className="market-grid">
        {marketData.map((item) => (
          <div 
            key={item.id} 
            className="market-item"
            style={{ 
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: '50px minmax(0, 1fr) 120px auto',
              gap: '15px',
              alignItems: 'center'
            }}
          >
            <div 
              className="item-background-gradient"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: -1,
                backgroundImage: `linear-gradient(to right, rgba(${getRarityColor(item.rarity).join(',')}, 0.5), rgba(${getRarityColor(item.rarity).join(',')}, 0), rgba(${getRarityColor(item.rarity).join(',')}, 0)`, 
              }}
            />
            <div className="item-image">
              <div className="item-icon" style={{ backgroundColor: '#333' }}>
                {item.item_id?.charAt(0) || '?'}
              </div>
            </div>
            <div className="item-name" style={{ color: getTextColor(item.rarity) }}>
              {item.item}
            </div>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <img src="/images/divider.png" alt="" className="price-divider" />
              <div className="item-rarity" style={{ 
                color: getTextColor(item.rarity),
                textAlign: 'right',
                flex: 1
              }}>
                {item.rarity}
              </div>
            </div>
            {renderPrice(item.price, item.quantity)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveMarketFeed; 