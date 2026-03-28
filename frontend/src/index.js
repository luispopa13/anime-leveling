import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.js';
import './index.css';
import { AnimeFavoritesProvider } from './components/AnimeFavoritesContext';
import { initDevToolsBlocker } from './utils/devToolsBlocker';

// Pornește blockerul imediat, înainte de orice render
initDevToolsBlocker();

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <AnimeFavoritesProvider>
        <App />
      </AnimeFavoritesProvider>
    </HelmetProvider>
  </React.StrictMode>
);