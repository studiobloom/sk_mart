import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ItemPriceHistory from './components/ItemPriceHistory';
import Header from './components/Header';
import SearchForm from './components/SearchForm';
import ApiErrorFallback from './components/ApiErrorFallback';
import './App.css';

// Simple Error Boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  render() {
    if (this.state.hasError) {
      return <ApiErrorFallback 
        error={this.state.error} 
        resetErrorBoundary={this.resetErrorBoundary} 
      />;
    }

    return this.props.children;
  }
}

function App() {
  const [key, setKey] = useState(0);

  const handleErrorReset = () => {
    // Force re-mount of components by changing the key
    setKey(prevKey => prevKey + 1);
  };

  return (
    <Router>
      <div className="container">
        <Header />
        <Routes>
          <Route path="/" element={
            <div className="home-container">
              <h1>SK-Mart</h1>
              <p>Welcome to SK-Mart - Your One-Stop Shopping Destination</p>
              <SearchForm />
            </div>
          } />
          <Route path="/:itemId" element={
            <ErrorBoundary key={key} onReset={handleErrorReset}>
              <ItemPriceHistory />
            </ErrorBoundary>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 