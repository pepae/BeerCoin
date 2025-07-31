import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AdminPanel from './components/AdminPanel';
import { WalletProvider } from './contexts/WalletContext';

ReactDOM.createRoot(document.getElementById('admin-root')).render(
  <React.StrictMode>
    <WalletProvider>
      <AdminPanel />
    </WalletProvider>
  </React.StrictMode>
);
