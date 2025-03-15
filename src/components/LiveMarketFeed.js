import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import marketApi from '../api/marketApi';
import ItemIcon from './ItemIcon';

// Helper functions
export const renderPrice = (totalPrice, quantity = 1, onImageLoad) => {
  if (!totalPrice || totalPrice <= 0) return null;
  const perPiecePrice = quantity > 0 ? Math.floor(totalPrice / quantity) : totalPrice;

  return (
    <div className="item-price">
      <img src="/images/divider.png" alt="" className="price-divider" onLoad={onImageLoad} />
      <div className="price-section">
        <img src="/images/gold.png" alt="gold" className="coin-icon" style={{ width: '24px', height: '24px' }} onLoad={onImageLoad} />
        <span className="price-value">{totalPrice}</span>
      </div>
      <img src="/images/divider.png" alt="" className="price-divider" onLoad={onImageLoad} />
      <div className="price-section">
        <img src="/images/gold.png" alt="gold" className="coin-icon" style={{ width: '24px', height: '24px' }} onLoad={onImageLoad} />
        <span className="price-value">{perPiecePrice}</span>
        <span className="quantity">x{quantity}</span>
      </div>
    </div>
  );
};

export const renderStats = (priceData, itemName, onImageLoad) => {
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
              {renderPrice(currentPrice, 1, onImageLoad)}
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

const LiveMarketFeed = () => {
  const navigate = useNavigate();
  const [marketData, setMarketData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [simulatingLiveFeed, setSimulatingLiveFeed] = useState(false);
  const [pendingItems, setPendingItems] = useState([]);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setIsRefreshing(true);
        const response = await marketApi.getLiveMarketData();
        
        // Store the new data
        setMarketData(response.body);
        
        if (loading) {
          // First load - show initial 10 items immediately
          setDisplayedData(response.body.slice(0, visibleCount));
          setLoading(false);
          setIsRefreshing(false);
        } else {
          // Find new items that aren't currently displayed
          const currentIds = new Set(displayedData.map(item => item.id));
          const newItems = response.body.filter(item => !currentIds.has(item.id));
          
          if (newItems.length > 0) {
            // Queue up new items for the simulated live feed
            setPendingItems(newItems);
            setSimulatingLiveFeed(true);
          } else {
            // No new items, just update existing ones
            setDisplayedData(response.body.slice(0, visibleCount));
            setIsRefreshing(false);
          }
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    // Initial fetch
    fetchMarketData();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);

    return () => clearInterval(interval);
  }, [loading, displayedData, visibleCount]);

  // Simulate live feed by adding one item at a time
  useEffect(() => {
    if (simulatingLiveFeed && pendingItems.length > 0) {
      const timer = setTimeout(() => {
        // Add the next item from the pending queue
        const nextItem = pendingItems[0];
        
        setDisplayedData(prev => {
          // Add the new item to the beginning
          const newData = [nextItem, ...prev];
          // Keep only up to visibleCount items
          return newData.slice(0, visibleCount);
        });
        
        // Remove the added item from pending items
        setPendingItems(prev => prev.slice(1));
        
        // If no more pending items, we're done with the live feed
        if (pendingItems.length <= 1) {
          setSimulatingLiveFeed(false);
          setIsRefreshing(false);
        }
      }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
      
      return () => clearTimeout(timer);
    }
  }, [simulatingLiveFeed, pendingItems, visibleCount]);

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
      default:
        return [120, 120, 120];
    }
  };

  const getTextColor = (rarity) => {
    // Get the same RGB values from getRarityColor
    const rgbArray = getRarityColor(rarity);
    // Convert the RGB array to a CSS color string
    return `rgb(${rgbArray[0]}, ${rgbArray[1]}, ${rgbArray[2]})`;
  };

  if (loading) return <div className="loading">Loading market data...</div>;
  if (error) return <div className="error">{error}</div>;
  
  // Modified renderPrice function with error handling
  const renderPriceWithErrorHandling = (item) => {
    const { price, quantity } = item;
    if (!price || price <= 0) return null;
    const perPiecePrice = quantity > 0 ? Math.floor(price / quantity) : price;

    return (
      <div className="item-price">
        <img 
          src="/images/divider.png" 
          alt="" 
          className="price-divider" 
        />
        <div className="price-section">
          <img 
            src="/images/gold.png" 
            alt="gold" 
            className="coin-icon" 
            style={{ width: '24px', height: '24px' }} 
          />
          <span className="price-value">{price}</span>
        </div>
        <img 
          src="/images/divider.png" 
          alt="" 
          className="price-divider" 
        />
        <div className="price-section">
          <img 
            src="/images/gold.png" 
            alt="gold" 
            className="coin-icon" 
            style={{ width: '24px', height: '24px' }} 
          />
          <span className="price-value">{perPiecePrice}</span>
          <span className="quantity">x{quantity}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="market-feed">
      <h2>Live Market Listings</h2>
      {loading && <div className="loading">Loading market data...</div>}
      
      <div className="market-grid">
        {displayedData.map((item, index) => (
          <div 
            key={item.id} 
            className={`market-item ${index === 0 && simulatingLiveFeed ? 'new-item' : ''}`}
            onClick={() => navigate(`/${item.item_id}`)}
            style={{ 
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: '50px minmax(0, 1fr) 120px auto',
              gap: '15px',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.7)',
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
              <ItemIcon 
                itemId={item.item_id} 
                size={30} 
              />
            </div>
            <div className="item-name" style={{ color: getTextColor(item.rarity) }}>
              {item.item}
            </div>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <img 
                src="/images/divider.png" 
                alt="" 
                className="price-divider" 
              />
              <div className="item-rarity" style={{ 
                color: getTextColor(item.rarity),
                textAlign: 'right',
                flex: 1
              }}>
                {item.rarity}
              </div>
            </div>
            {renderPriceWithErrorHandling(item)}
          </div>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .new-item {
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0px 0px 10px rgba(255, 255, 255, 0.1);
        }
      `}</style>
      
      {(isRefreshing || simulatingLiveFeed) && displayedData.length > 0 && (
        <div className="refresh-indicator" style={{ 
          textAlign: 'center', 
          padding: '10px', 
          fontSize: '0.8rem', 
          color: '#888',
          marginTop: '10px'
        }}>
          {simulatingLiveFeed ? 'Live feed active...' : 'Refreshing data...'}
        </div>
      )}
    </div>
  );
};

export default LiveMarketFeed; 