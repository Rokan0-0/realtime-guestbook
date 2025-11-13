// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SomniaProvider } from './context/SomniaContext.tsx'; // Import our provider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Wrap the App in our Provider */}
    <SomniaProvider>
      <App />
    </SomniaProvider>
  </React.StrictMode>,
);