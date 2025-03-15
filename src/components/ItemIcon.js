import React, { useState, useEffect } from 'react';
import { getItemIconUrl } from '../api/itemsApi';

const ItemIcon = ({ itemId, size = 30, className = '', style = {} }) => {
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
    width: '120%',
    height: '120%',
    objectFit: 'contain',
    opacity: loading ? 0 : 1,
    transition: 'opacity 0.2s ease'
  };

  // Fallback content (first letter of item ID)
  const fallbackContent = itemId?.charAt(0)?.toUpperCase() || '?';

  // Handle image load success
  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  // Handle image load error
  const handleError = () => {
    setLoading(false);
    setError(true);
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
      {(loading || error) && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gold)',
          fontSize: `${size * 0.5}px`,
          fontWeight: 'bold'
        }}>
          {fallbackContent}
        </div>
      )}
    </div>
  );
};

export default ItemIcon; 