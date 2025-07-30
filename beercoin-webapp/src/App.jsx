import { useState, useEffect } from 'react';
import { WalletProvider, useWallet } from './contexts/WalletContext';
import Layout from './components/Layout';
import WalletCreation from './components/WalletCreation';
import Dashboard from './components/Dashboard';
import Registration from './components/Registration';
import Navigation from './components/Navigation';
import SendBeer from './components/SendBeer';
import QRCodeDisplay from './components/QRCodeDisplay';
import QRCodeScanner from './components/QRCodeScanner';
import TestMode from './components/TestMode';
import './App.css';

const AppContent = () => {
  const { wallet, isRegistered } = useWallet();
  const [activePage, setActivePage] = useState('dashboard');

  // Set initial page based on wallet and registration status, but don't override manual navigation
  useEffect(() => {
    if (!wallet) {
      // No wallet, show wallet creation
      return;
    }
    // Check if URL has /register
    const path = window.location.pathname;
    if (path === '/register') {
      setActivePage('register');
      return;
    }
    // Only auto-navigate if on dashboard or register (default pages)
    if (!isRegistered && activePage !== 'register') {
      setActivePage('register');
    } else if (isRegistered && activePage !== 'dashboard') {
      setActivePage('dashboard');
    }
  }, [wallet, isRegistered]);

  // Render content based on wallet status and active page
  const renderContent = () => {
    if (!wallet) {
      return <WalletCreation />;
    }
    
    if (!isRegistered && activePage !== 'wallet') {
      return <Registration />;
    }
    

    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'qr':
        return <QRCodeDisplay setActivePage={setActivePage} />;
      case 'scan':
        return <QRCodeScanner setActivePage={setActivePage} />;
      case 'send':
        return <SendBeer />;
      case 'wallet':
        return <Dashboard />;
      case 'register':
        return <Registration />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderContent()}
      {wallet && <Navigation activePage={activePage} setActivePage={setActivePage} />}
      <TestMode />
    </Layout>
  );
};

function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}

export default App;

