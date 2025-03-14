import React from 'react';

const ApiErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="card error-fallback">
      <h2>API Connection Error</h2>
      <p style={{ marginBottom: '20px' }}>
        We're having trouble connecting to the SK-Mart API.
      </p>
      <div className="error" style={{ marginBottom: '20px' }}>
        {error.message || 'An unknown error occurred'}
      </div>
      <p style={{ marginBottom: '20px' }}>
        This could be due to:
      </p>
      <ul>
        <li>The API server is currently down or experiencing issues</li>
        <li>Your internet connection is unstable</li>
        <li>The item you're looking for doesn't exist in the database</li>
      </ul>
      {resetErrorBoundary && (
        <button 
          onClick={resetErrorBoundary}
          className="retry-button"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ApiErrorFallback; 