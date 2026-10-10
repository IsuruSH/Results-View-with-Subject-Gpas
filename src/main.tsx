import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { initAnalytics } from './services/analytics';
import './index.css';

// Before render, so the first page view is not missed. No-ops when
// VITE_GA_MEASUREMENT_ID is unset.
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
