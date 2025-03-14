import React from 'react';

const ItemStats = ({ priceData, itemName }) => {
  if (!priceData || priceData.length === 0) {
    return null;
  }

  // Calculate statistics from the price data
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

  // Calculate 7d change if we have enough data
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

  // Comment out the unused variables for now - can be used in future enhancements
  // const allTimeHigh = Math.max(...priceData.map(item => item.max));
  // const allTimeLow = Math.min(...priceData.map(item => item.min));

  return (
    <div>
      {itemName && (
        <h2 style={{ marginBottom: '1rem' }}>{itemName}</h2>
      )}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-label">Current Price</div>
            <div className="stat-value">{currentPrice.toFixed(2)}</div>
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

export default ItemStats; 