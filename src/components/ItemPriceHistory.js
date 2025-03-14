import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getItemPriceHistory } from '../api/marketApi';
import PriceChart from './PriceChart';
import ItemStats from './ItemStats';

const ItemPriceHistory = () => {
  const { itemId } = useParams();
  
  const [aggregatedData, setAggregatedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTime, setLoadingTime] = useState(0);
  const [priceError, setPriceError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Timer for loading state
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

  useEffect(() => {
    const fetchAndAggregateData = async () => {
      setLoading(true);
      setPriceError(null);
      setLoadingTime(0);
      
      const intervals = ['15m', '1h', '4h', '1d'];
      let allData = [];
      let hasError = false;
      
      const results = await Promise.all(intervals.map(async (int) => {
        try {
          const response = await getItemPriceHistory(itemId, int);
          return { interval: int, data: response.body || [] };
        } catch (err) {
          console.error(`Error fetching ${int} interval data:`, err);
          hasError = true;
          return { interval: int, data: [] };
        }
      }));
      
      const timestampMap = new Map();
      
      for (const { data } of results.sort((a, b) => {
        const order = { '15m': 0, '1h': 1, '4h': 2, '1d': 3 };
        return order[a.interval] - order[b.interval];
      })) {
        for (const point of data) {
          if (!timestampMap.has(point.timestamp)) {
            timestampMap.set(point.timestamp, point);
          }
        }
      }
      
      allData = Array.from(timestampMap.values()).sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      if (hasError && allData.length === 0) {
        setPriceError('Failed to fetch price history. Please check if the item name is correct.');
      }
      
      setAggregatedData(allData);
      setLoading(false);
      setDataLoaded(true);
    };
    
    if (itemId) {
      fetchAndAggregateData();
    }
  }, [itemId]);

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
              Aggregating data from all time intervals...
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

  const shouldShowChart = aggregatedData.length > 0;

  if (priceError && !shouldShowChart) {
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
          <ItemStats priceData={aggregatedData} itemName={formatItemName(itemId)} />
          
          <div className="card">
            <div className="chart-header">
              <h2>Market History</h2>
              <div className="chart-info">
                <span>Historical price data</span>
              </div>
            </div>
            
            {aggregatedData.length > 0 ? (
              <PriceChart priceData={aggregatedData} />
            ) : (
              <div className="loading">
                <p>No price data available.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ItemPriceHistory; 