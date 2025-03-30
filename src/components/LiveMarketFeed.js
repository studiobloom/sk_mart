import React, { useState, useEffect, useCallback } from 'react';
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
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(true);
  const ITEMS_PER_PAGE = 10;

  // Fetch market data for a specific page
  const fetchMarketData = useCallback(async (pageNum) => {
    try {
      setIsChangingPage(true);
      const offset = (pageNum - 1) * ITEMS_PER_PAGE;
      
      // Check if we already loaded this page data
      if (marketData[pageNum] && marketData[pageNum].length > 0) {
        setIsChangingPage(false);
        return;
      }
      
      const response = await marketApi.getLiveMarketData(ITEMS_PER_PAGE, offset);
      const newData = response.body || [];
      
      // Store data by page number
      setMarketData(prevData => ({
        ...prevData,
        [pageNum]: newData
      }));
      
      // Update hasMorePages based on if we got a full page of items
      setHasMorePages(newData.length === ITEMS_PER_PAGE);
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    } finally {
      setIsChangingPage(false);
    }
  }, [marketData]);

  // Initial load
  useEffect(() => {
    fetchMarketData(1);
  }, []);

  // Handle page changes
  useEffect(() => {
    if (currentPage > 0) {
      fetchMarketData(currentPage);
    }
  }, [currentPage, fetchMarketData]);

  const handleNextPage = () => {
    if (currentPage === totalPages && hasMorePages) {
      // If we're on the last page and there might be more, increase total pages
      setTotalPages(prev => prev + 1);
    }
    setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

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

  if (loading && Object.keys(marketData).length === 0) return <div className="loading">Loading market data...</div>;
  if (error && Object.keys(marketData).length === 0) return <div className="error">{error}</div>;
  
  const currentItems = marketData[currentPage] || [];
  
  return (
    <div className="market-feed">
      <h2>Live Market Listings</h2>
      
      <div className="market-grid">
        {isChangingPage ? (
          <div className="loading-overlay">Loading page {currentPage}...</div>
        ) : currentItems.length === 0 ? (
          <div className="empty-state">No items found on this page</div>
        ) : (
          currentItems.map((item) => (
            <div 
              key={item.id} 
              className="market-item"
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
          ))
        )}
      </div>
      
      {/* Pagination controls */}
      <div className="pagination-controls">
        <button 
          onClick={handlePrevPage} 
          disabled={currentPage === 1 || isChangingPage}
          className="pagination-button"
        >
          Previous
        </button>
        
        <div className="pagination-info">
          Page {currentPage} of {totalPages}
        </div>
        
        {currentPage === totalPages ? (
          <button 
            onClick={handleNextPage} 
            disabled={isChangingPage || !hasMorePages}
            className="pagination-button load-more"
          >
            Load More
          </button>
        ) : (
          <button 
            onClick={handleNextPage} 
            disabled={currentPage >= totalPages || isChangingPage}
            className="pagination-button"
          >
            Next
          </button>
        )}
      </div>
      
      {/* Page number buttons */}
      <div className="pagination-numbers">
        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
          // Show pages around current page
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          
          return (
            <button
              key={pageNum}
              onClick={() => goToPage(pageNum)}
              className={`page-number ${pageNum === currentPage ? 'current-page' : ''}`}
              disabled={isChangingPage}
            >
              {pageNum}
            </button>
          );
        })}
        
        {totalPages > 5 && currentPage < totalPages - 2 && (
          <>
            <span className="ellipsis">...</span>
            <button
              onClick={() => goToPage(totalPages)}
              className={`page-number ${totalPages === currentPage ? 'current-page' : ''}`}
              disabled={isChangingPage}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>
      
      <style jsx>{`
        .pagination-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
        }
        
        .pagination-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--gold);
          color: var(--gold);
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .pagination-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .pagination-info {
          color: #ccc;
        }
        
        .pagination-numbers {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 15px;
        }
        
        .page-number {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #555;
          color: #ccc;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .page-number:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .page-number:disabled {
          cursor: not-allowed;
        }
        
        .current-page {
          background: rgba(255, 215, 0, 0.2);
          border-color: var(--gold);
          color: var(--gold);
        }
        
        .ellipsis {
          color: #ccc;
          align-self: center;
        }
        
        .loading-overlay {
          grid-column: 1 / -1;
          text-align: center;
          padding: 30px;
          color: #ccc;
        }
        
        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 30px;
          color: #ccc;
        }
        
        .market-grid {
          min-height: 400px;
          position: relative;
        }
        
        .load-more {
          background: rgba(255, 215, 0, 0.1);
          border-color: var(--gold);
          font-weight: 500;
        }
        
        .load-more:hover:not(:disabled) {
          background: rgba(255, 215, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default LiveMarketFeed; 