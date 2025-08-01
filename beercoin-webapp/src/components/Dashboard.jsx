import { useState, useEffect, useRef } from 'react';
import { useWallet } from '../contexts/WalletContext';
import useContractData from '../hooks/useContractData';
import WalletDetails from './WalletDetails';

const Dashboard = () => {
  const { 
    wallet, 
    balance, 
    isRegistered, 
    username,
    isTrusted
  } = useWallet();
  
  const {
    beerBalance,
    pendingRewards,
    userInfo,
    baseRewardRate,
    referrerMultiplier,
    multiplierBase,
    claimRewards,
    refreshBalances
  } = useContractData();

  // Debug logging for userInfo
  console.log('[Dashboard] userInfo:', userInfo);
  console.log('[Dashboard] isTrusted:', isTrusted);
  console.log('[Dashboard] isRegistered:', isRegistered);
  
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Beer glass embedded iframe - much simpler!
  const beerGlassRef = useRef(null);

  if (!wallet) {
    return null;
  }

  const handleClaimRewards = async () => {
    try {
      setClaiming(true);
      setError('');
      setSuccess('');
      
      await claimRewards();
      setSuccess('Rewards claimed successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to claim rewards');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    } finally {
      setClaiming(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshBalances();
    } catch (err) {
      console.error('Error refreshing balances:', err);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div>
      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {/* BEER Balance with Interactive Glass */}
        <div className="beer-card">
          <div className="flex justify-between items-start gap-4">
            {/* Balance Info */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">BEER Balance</h3>
                <button 
                  onClick={handleRefresh}
                  className="p-2 text-primary hover:text-primary/80"
                >
                  🔄
                </button>
              </div>
              <p className="beer-balance mb-1">{parseFloat(beerBalance).toFixed(4)} BEER</p>
              <p className="text-sm text-muted-foreground">≈ {parseFloat(beerBalance).toFixed(2)} BEER</p>
              <p className="text-xs text-muted-foreground mt-2">🍺 Tilt your phone to move the beer around!</p>
            </div>
            
            {/* Interactive Beer Glass - Embedded HTML */}
            <div className="flex-shrink-0">
              <iframe 
                ref={beerGlassRef}
                src="beer-mini.html"
                width="180" 
                height="240"
                frameBorder="0"
                className="rounded-lg border border-primary/20"
                title="Interactive Beer Glass"
              />
            </div>
          </div>
        </div>
        
        {/* Pending Rewards */}
        {isRegistered && (
          <div className="beer-card">
            <h3 className="text-lg font-medium mb-2">Pending Rewards</h3>
            <p className="beer-balance mb-1">{parseFloat(pendingRewards).toFixed(4)} BEER</p>
            <p className="text-sm text-muted-foreground mb-4">Claimable now</p>
            
            {/* Referral Information for Trusted Users */}
            {isTrusted && (
              <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Referrals:</span>
                  <span className="text-sm font-medium">
                    {userInfo ? userInfo.referralCount || 0 : 'Loading...'} users
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Issuance Multiplier:</span>
                  <span className="text-sm font-medium text-primary">
                    {userInfo && referrerMultiplier && multiplierBase
                      ? `${(1 + ((userInfo.referralCount || 0) * referrerMultiplier) / multiplierBase).toFixed(1)}x`
                      : 'Loading...'
                    }
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {userInfo && referrerMultiplier && multiplierBase
                    ? `Base rate + ${(((userInfo.referralCount || 0) * referrerMultiplier) / multiplierBase).toFixed(1)}x bonus from referrals`
                    : 'Loading multiplier information...'
                  }
                </p>
              </div>
            )}
            
            <button
              className="beer-button w-full"
              onClick={handleClaimRewards}
              disabled={claiming || parseFloat(pendingRewards) <= 0}
            >
              {claiming ? 'Claiming...' : 'Claim Rewards'}
            </button>
          </div>
        )}
        
        {/* xDAI Balance */}
        <div className="beer-card">
          <h3 className="text-lg font-medium mb-2">xDAI Balance</h3>
          <p className="beer-balance mb-1">{parseFloat(balance).toFixed(4)} xDAI</p>
          <p className="text-sm text-muted-foreground">For transaction fees</p>
        </div>
      </div>
      
      {/* User Info */}
      {isRegistered ? (
        <div className="beer-card mb-6">
          <h2 className="text-xl font-bold mb-4">User Information</h2>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Username:</span>
              <span className="font-medium">{username}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium">
                {isTrusted ? (
                  <span className="text-primary">Trusted User</span>
                ) : (
                  <span>Regular User</span>
                )}
              </span>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Wallet:</span>
              <span className="font-mono">{formatAddress(wallet.address)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="beer-card mb-6">
          <h2 className="text-xl font-bold mb-4">Not Registered</h2>
          <p className="text-muted-foreground mb-4">
            You need to register with a referral from a trusted user to start earning BEER tokens.
          </p>
          <button 
            className="beer-button w-full"
            onClick={() => window.location.href = '/register'}
          >
            Register Now
          </button>
        </div>
      )}
      
      {/* Wallet Details Toggle */}
      <button
        className="beer-button-secondary w-full mb-6"
        onClick={() => setShowWalletDetails(!showWalletDetails)}
      >
        {showWalletDetails ? 'Hide Wallet Details' : 'Show Wallet Details'}
      </button>
      
      {/* Wallet Details */}
      {showWalletDetails && <WalletDetails />}
      
      {/* Error and Success Messages */}
      {error && (
        <div className="beer-toast bg-destructive text-destructive-foreground">
          {error}
        </div>
      )}
      
      {success && (
        <div className="beer-toast bg-primary text-primary-foreground">
          {success}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

