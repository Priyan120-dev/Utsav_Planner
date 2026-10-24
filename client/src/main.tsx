import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import { EventProvider } from './context/EventContext.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EventProvider>
      <App />
    </EventProvider>
  </React.StrictMode>
);
