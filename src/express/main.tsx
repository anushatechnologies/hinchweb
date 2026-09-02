import React from 'react';
import ReactDOM from 'react-dom/client';
import { ExpressApp } from './ExpressApp';
import '../index.css';

const rootElement = document.getElementById('express-root');
if (!rootElement) throw new Error('Failed to find the express-root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ExpressApp />
  </React.StrictMode>
);
