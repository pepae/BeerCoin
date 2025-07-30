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
  const pollingRef = useRef();
  // Poll for trusted status when on step 2 (QR code display)
  useEffect(() => {
    if (step !== 2 || !wallet?.address) return;
    let isMounted = true;
    let pollCount = 0;
    const pollTrustedStatus = async () => {
      try {
        pollCount++;
        console.log(`[Registration] Polling for trusted status... (attempt ${pollCount})`);
        if (!contractServiceV2.distributorContract) {
          console.log('[Registration] Initializing contract service...');
          await contractServiceV2.initialize(wallet);
        }
        const userInfo = await contractServiceV2.getUserInfo(wallet.address);
        const isTrusted = userInfo?.isTrusted;
        console.log(`[Registration] Trusted status for ${wallet.address}:`, isTrusted);
        if (isTrusted && isMounted) {
          console.log('[Registration] User is now trusted! Navigating to dashboard.');
          if (setActivePage) setActivePage('dashboard');
        } else if (isMounted) {
          pollingRef.current = setTimeout(pollTrustedStatus, 3000);
        }
      } catch (err) {
        console.error('[Registration] Error polling trusted status:', err);
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
                <span className="font-mono">{formatAddress(wallet.address)}</span>
              </div>
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

