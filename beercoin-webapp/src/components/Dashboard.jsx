import { useState } from 'react';
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
    claimRewards,
    refreshBalances
  } = useContractData();
  
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        {/* BEER Balance */}
        <div className="beer-card">
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
        </div>
        
        {/* Pending Rewards */}
        {isRegistered && (
          <div className="beer-card">
            <h3 className="text-lg font-medium mb-2">Pending Rewards</h3>
            <p className="beer-balance mb-1">{parseFloat(pendingRewards).toFixed(4)} BEER</p>
            <p className="text-sm text-muted-foreground mb-4">Claimable now</p>
            
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
          
          {/* Referral Information for Trusted Users */}
          {isTrusted && (
            <>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Referrals:</span>
                  <span className="font-medium">
                    {userInfo ? (userInfo.referralCount || 0) : 'Loading...'} users
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Issuance Multiplier:</span>
                  <span className="font-medium text-primary">
                    {userInfo ? 
                      ((userInfo.referralCount || 0) * 0.1 + 1).toFixed(1) + 'x' : 
                      'Loading...'
                    }
                  </span>
                </div>
                {userInfo && (
                  <p className="text-xs text-muted-foreground">
                    Base rate + {((userInfo.referralCount || 0) * 0.1).toFixed(1)}x bonus from referrals
                  </p>
                )}
              </div>
              
              {/* Debug info - remove this later */}
              <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
                <strong>Debug:</strong> userInfo = {JSON.stringify(userInfo)}
              </div>
            </>
          )}
          
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

