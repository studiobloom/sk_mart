import React, { useState } from 'react';
import { getItemIconUrl } from '../api/itemsApi';

const ItemIcon = ({ itemId, size = 30, className = '', style = {}, onLoad, onError }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Create the icon URL
  const iconUrl = getItemIconUrl(itemId);

  // Default styles for the icon container
  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
    ...style
  };

  // Styles for the actual image
  const imageStyle = {
    width: '125%',
    height: '125%',
    objectFit: 'contain',
    opacity: loading ? 0.5 : 1,
    transition: 'opacity 0.2s ease',
    filter: 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.8))'
  };

  // Handle image load success
  const handleLoad = () => {
    setLoading(false);
    setError(false);
    // Call external onLoad handler if provided
    if (onLoad && typeof onLoad === 'function') {
      onLoad();
    }
  };

  // Handle image load error
  const handleError = () => {
    setLoading(false);
    setError(true);
    // Even on error, we should call the onLoad handler to decrement the counter
    if (onLoad && typeof onLoad === 'function') {
      onLoad();
    }
    // Call external onError handler if provided
    if (onError && typeof onError === 'function') {
      onError();
    }
  };

  return (
    <div className={`item-icon ${className}`} style={containerStyle}>
      {!error && (
        <img
          src={iconUrl}
          alt={`${itemId} icon`}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      {error && (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '4px'
        }}>
          ?
        </div>
      )}
    </div>
  );
};

export default ItemIcon; 