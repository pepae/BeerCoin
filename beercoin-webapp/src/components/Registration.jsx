import { useState, useEffect, useRef } from 'react';
import { useWallet } from '../contexts/WalletContext';
import contractServiceV2 from '../lib/contractServiceV2';
import { QRCodeSVG } from 'qrcode.react';
import { STORAGE_KEYS, APP_CONFIG, QR_CONFIG } from '../config';

const Registration = ({ setActivePage }) => {
  const { wallet } = useWallet();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [step, setStep] = useState(1);
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const pollingRef = useRef();
  // Poll for trusted status when on step 2 (QR code display)
  useEffect(() => {
    if (step !== 2 || !wallet?.address) return;
    let isMounted = true;
    let pollCount = 0;
    const pollTrustedStatus = async () => {
      try {
        pollCount++;
        console.log(`[Registration] Polling for registration status... (attempt ${pollCount})`);
        if (!contractServiceV2.distributorContract) {
          console.log('[Registration] Initializing contract service...');
          await contractServiceV2.initialize(wallet);
        }
        const isRegistered = await contractServiceV2.isUserRegistered(wallet.address);
        console.log(`[Registration] isRegistered for ${wallet.address}:`, isRegistered);
        if (isRegistered && isMounted) {
          console.log('[Registration] User is now registered! Reloading and navigating to dashboard.');
          // Force a reload to update all state, then go to dashboard
          setTimeout(() => {
            if (setActivePage) setActivePage('dashboard');
            window.location.reload();
          }, 500);
        } else if (isMounted) {
          pollingRef.current = setTimeout(pollTrustedStatus, 3000);
        }
      } catch (err) {
        console.error('[Registration] Error polling registration status:', err);
        if (isMounted) pollingRef.current = setTimeout(pollTrustedStatus, 5000);
      }
    };
    pollTrustedStatus();
    return () => {
      isMounted = false;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [step, wallet, setActivePage]);

  // Debounced username checking
  useEffect(() => {
    if (!username.trim()) {
      setUsernameAvailable(false);
      setError('');
      return;
    }

    const timer = setTimeout(() => {
      checkUsername(username);
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const checkUsername = async (value) => {
    if (!value.trim()) {
      setUsernameAvailable(false);
      return;
    }

    // Basic username validation
    if (value.length < 3) {
      setError('Username must be at least 3 characters long');
      setUsernameAvailable(false);
      return;
    }

    if (value.length > 20) {
      setError('Username must be less than 20 characters');
      setUsernameAvailable(false);
      return;
    }

    // Check for valid characters (alphanumeric and underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setError('Username can only contain letters, numbers, and underscores');
      setUsernameAvailable(false);
      return;
    }
    
    try {
      setChecking(true);
      setError('');
      console.log('Checking username:', value);
      
      // Ensure contract service is initialized
      if (!contractServiceV2.distributorContract) {
        console.log('Contract service not initialized, trying to initialize...');
        if (wallet) {
          await contractServiceV2.initialize(wallet);
        }
      }
      
      const available = await contractServiceV2.isUsernameAvailable(value);
      console.log('Username available:', available);
      
      setUsernameAvailable(available);
      
      if (!available) {
        setError('Username is already taken');
      } else {
        setError('');
      }
    } catch (err) {
      console.error('Error checking username:', err);
      setError('Error checking username availability. Please try again.');
      setUsernameAvailable(false);
    } finally {
      setChecking(false);
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    
    // Reset states when user types
    setUsernameAvailable(false);
    if (error && error.includes('Username')) {
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    if (!usernameAvailable) {
      setError('Username is not available');
      return;
    }
    
    // Save username to local storage
    localStorage.setItem(STORAGE_KEYS.USERNAME, username);
    
    // Move to QR code step
    setStep(2);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = wallet.address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Generate QR code data for trusted user to scan
  const generateQRData = () => {
    return JSON.stringify({
      type: 'registration',
      address: wallet.address,
      username: username,
      timestamp: Date.now()
    });
  };

  if (!wallet) {
    return null;
  }

  return (
    <div className="beer-container">
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-center">Join BeerCoin</h2>
          <p className="text-center text-muted-foreground mb-6">
            Choose a username to start earning BEER tokens
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Choose a Username</label>
              <input
                type="text"
                className={`beer-input w-full ${
                  username && (usernameAvailable ? 'border-primary' : 'border-destructive')
                }`}
                placeholder="Enter username (3-20 characters, letters, numbers, underscore)"
                value={username}
                onChange={handleUsernameChange}
                required
              />
              {checking && (
                <p className="text-xs text-muted-foreground mt-1">Checking availability...</p>
              )}
              {username && usernameAvailable && !checking && (
                <p className="text-xs text-primary mt-1">✓ Username is available</p>
              )}
              {username && !usernameAvailable && !checking && error && (
                <p className="text-xs text-destructive mt-1">{error}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="beer-button w-full"
              disabled={!usernameAvailable || loading || checking}
            >
              {checking ? 'Checking...' : 'Continue'}
            </button>
          </form>
          
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-center">
              {error}
            </div>
          )}
        </div>
      )}
      
      {step === 2 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-center">Get Approved</h2>
          <p className="text-center text-muted-foreground mb-6">
            Ask a trusted user to scan this QR code to approve your registration
          </p>
          
          <div className="beer-qr-container mb-6">
            <QRCodeSVG
              value={generateQRData()}
              size={QR_CONFIG.size}
              level={QR_CONFIG.errorCorrectionLevel}
              includeMargin={QR_CONFIG.includeMargin}
              fgColor={QR_CONFIG.color.dark}
              bgColor={QR_CONFIG.color.light}
            />
          </div>
          
          <div className="beer-card mb-6">
            <h3 className="text-lg font-medium mb-4">Registration Details</h3>
            
            <div className="mb-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Username:</span>
                <span className="font-medium">{username}</span>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Your Address:</span>
                <div className="flex items-center gap-2">
                  <span 
                    className="font-mono text-sm cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setShowFullAddress(!showFullAddress)}
                    title="Click to toggle full address"
                  >
                    {showFullAddress ? wallet.address : formatAddress(wallet.address)}
                  </span>
                  <button
                    onClick={copyAddress}
                    className="text-xs px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
                    title="Copy full address"
                  >
                    {copySuccess ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="beer-card mb-6 bg-primary/5 border-primary/20">
            <h4 className="text-sm font-medium mb-2 text-primary">💡 Important</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Save your wallet address somewhere safe. You'll need it to receive BEER tokens and for future reference.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={wallet.address}
                readOnly
                className="flex-1 px-3 py-2 bg-background border border-border rounded font-mono text-sm"
              />
              <button
                onClick={copyAddress}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  copySuccess 
                    ? 'bg-green-500 text-white' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {copySuccess ? '✓ Copied!' : '📋 Copy Address'}
              </button>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6">
            Once approved, you'll start earning BEER tokens at a rate of 0.001 BEER per second.
            The trusted user will need to scan your QR code and approve your registration.
          </p>
          
          <button
            className="beer-button-secondary w-full"
            onClick={() => setStep(1)}
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
};

export default Registration;

