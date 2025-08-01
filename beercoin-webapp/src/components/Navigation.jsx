import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';

const Navigation = ({ activePage, setActivePage }) => {
  const { wallet, isRegistered, isTrusted } = useWallet();
  const [showTooltip, setShowTooltip] = useState(false);

  if (!wallet) {
    return null;
  }

  const handleNavClick = (page) => {
    // If user is not registered, they can only access the register page
    if (!isRegistered && page !== 'register') {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
      return;
    }
    
    setActivePage(page);
  };

  return (
    <nav className="fixed bottom-12 left-0 right-0 z-20 flex justify-center">
      <div className="bg-card rounded-full shadow-lg border border-border p-1 flex space-x-1">
        <button
          className={`p-3 rounded-full ${
            activePage === 'dashboard'
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground hover:bg-muted'
          }`}
          onClick={() => handleNavClick('dashboard')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </button>
        
        <button
          className={`p-3 rounded-full ${
            activePage === 'leaderboard'
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground hover:bg-muted'
          }`}
          onClick={() => handleNavClick('leaderboard')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
            <path d="M14 9h1.5a2.5 2.5 0 0 0 0-5H14"></path>
            <path d="M6 2L3 21h18L18 2H6z"></path>
            <path d="M10 7h4"></path>
            <path d="M10 11h4"></path>
            <path d="M10 15h4"></path>
          </svg>
        </button>
        
        <button
          className={`p-3 rounded-full ${
            activePage === 'qr'
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground hover:bg-muted'
          }`}
          onClick={() => handleNavClick('qr')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="6" height="6" x="3" y="3" rx="1"></rect>
            <rect width="6" height="6" x="15" y="3" rx="1"></rect>
            <rect width="6" height="6" x="3" y="15" rx="1"></rect>
            <rect width="6" height="6" x="15" y="15" rx="1"></rect>
          </svg>
        </button>
        
        <button
          className={`p-3 rounded-full ${
            activePage === 'scan'
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground hover:bg-muted'
          }`}
          onClick={() => handleNavClick('scan')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
            <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
            <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
            <rect width="10" height="10" x="7" y="7" rx="1"></rect>
          </svg>
        </button>
        
        <button
          className={`p-3 rounded-full ${
            activePage === 'send'
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground hover:bg-muted'
          }`}
          onClick={() => handleNavClick('send')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4Z"></path>
            <path d="M22 2 11 13"></path>
          </svg>
        </button>
      </div>
      
      {/* Registration Required Tooltip */}
      {showTooltip && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-card text-card-foreground px-4 py-2 rounded-lg shadow-lg border border-border text-sm whitespace-nowrap">
          Registration required to access this feature
        </div>
      )}
    </nav>
  );
};

export default Navigation;

