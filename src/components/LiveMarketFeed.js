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

  // Helper function to get background color based on rarity
  const getRarityColor = (rarity) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary':
        return [158, 126, 45]; // gold gradient
      case 'epic':
        return [138, 43, 226]; // purple gradient
      case 'rare':
        return [0, 119, 190]; // blue gradient
      case 'uncommon':
        return [46, 139, 87]; // green gradient
      case 'unique':
        return [92, 92, 66]; // olive gradient
      default:
        return [128, 128, 128]; // gray gradient
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
              {/* Placeholder for item image */}
              <div className="item-icon" style={{ backgroundColor: '#333' }}>
                {item.item_id?.charAt(0) || '?'}
              </div>
            </div>
            <div className="item-info">
              <div className="item-name" style={{ color: getTextColor(item.rarity) }}>
                {item.item}
              </div>
              <div className="item-rarity" style={{ color: getTextColor(item.rarity) }}>
                {item.rarity}
              </div>
            </div>
            <div className="item-price">
              <span className="coin-icon">💰</span>
              <span className="price-value" style={{ color: 'var(--gold)' }}>{item.price}</span>
              {item.quantity > 1 && <span className="quantity" style={{ color: 'var(--gold)' }}>x{item.quantity}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveMarketFeed; 