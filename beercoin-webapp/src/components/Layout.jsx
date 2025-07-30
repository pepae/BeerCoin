import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import beerIcon from '../assets/beer-icon.svg';

const Layout = ({ children }) => {
  const { wallet, username, isTrusted, isRegistered } = useWallet();
  const [showBubbles, setShowBubbles] = useState(true);

  // Disable bubbles after 5 seconds for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBubbles(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Beer bubbles background animation */}
      {showBubbles && (
        <>
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="beer-bubble"
              style={{
                width: `${Math.random() * 30 + 10}px`,
                height: `${Math.random() * 30 + 10}px`,
                left: `${Math.random() * 100}%`,
                bottom: `-${Math.random() * 20 + 10}px`,
                opacity: Math.random() * 0.5 + 0.1,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 5 + 5}s`,
              }}
            />
          ))}
        </>
      )}
      
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <img src={beerIcon} alt="BeerCoin" className="w-8 h-8 mr-2" />
            <h1 className="text-xl font-bold text-primary">BeerCoin</h1>
          </div>
          
          {wallet && (
            <div className="flex items-center">
              {isRegistered ? (
                <div className="flex items-center">
                  <span className="text-sm mr-2">{username}</span>
                  {isTrusted && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      Trusted
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Not Registered</span>
              )}
            </div>
          )}
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-6 pb-24">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border py-2">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>BeerCoin DApp - Earn and share BEER tokens with friends</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

