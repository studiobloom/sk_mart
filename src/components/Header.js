import React from 'react';
import { Link } from 'react-router-dom';
import SearchForm from './SearchForm';

const Header = () => {
  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1>SK-Mart</h1>
        </Link>
      </div>
      <div className="header-right">
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <SearchForm />
          <h1>
            <Link to="/">Home</Link>
          </h1>
        </nav>
      </div>
    </header>
  );
};

export default Header;