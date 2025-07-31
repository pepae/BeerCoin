import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import contractServiceV2 from '../lib/contractServiceV2';
import { APP_CONFIG } from '../config';

/**
 * Custom hook for real-time contract data
 * @returns {Object} Contract data and functions
 */
const useContractData = () => {
  const { wallet, isRegistered } = useWallet();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [beerBalance, setBeerBalance] = useState('0.0');
  const [pendingRewards, setPendingRewards] = useState('0.0');
  const [userInfo, setUserInfo] = useState(null);
  const [distributionActive, setDistributionActive] = useState(false);
  const [baseRewardRate, setBaseRewardRate] = useState('0.0');
  const [referrerMultiplier, setReferrerMultiplier] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalTrustedUsers, setTotalTrustedUsers] = useState(0);

  // Fetch initial data
  useEffect(() => {
    if (!wallet) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get distribution status
        const active = await contractServiceV2.isDistributionActive();
        setDistributionActive(active);
        
        // Get base reward rate and referrer multiplier
        const [rate, multiplier] = await Promise.all([
          contractServiceV2.getBaseRewardRate(),
          contractServiceV2.getReferrerMultiplier()
        ]);
        setBaseRewardRate(rate);
        setReferrerMultiplier(multiplier);
        
        // Get balances
        await refreshBalances();
        
        // Get user info if registered
        if (isRegistered) {
          console.log('[useContractData] User is registered, fetching user info for:', wallet.address);
          const info = await contractServiceV2.getUserInfo(wallet.address);
          console.log('[useContractData] Got user info:', info);
          setUserInfo(info);
        } else {
          console.log('[useContractData] User is not registered, skipping user info fetch');
        }
      } catch (err) {
        console.error('Error fetching contract data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [wallet, isRegistered]);

  // Refresh balances periodically
  useEffect(() => {
    if (!wallet) return;
    
    const intervalId = setInterval(() => {
      refreshBalances();
    }, APP_CONFIG.pollingInterval);
    
    return () => clearInterval(intervalId);
  }, [wallet]);

  // Refresh balances
  const refreshBalances = async () => {
    if (!wallet) return;
    
    try {
      const [beerBal, pendingRew] = await Promise.all([
        contractServiceV2.getBeerBalance(wallet.address),
        isRegistered ? contractServiceV2.getPendingRewards(wallet.address) : '0.0'
      ]);
      
      setBeerBalance(beerBal);
      setPendingRewards(pendingRew);
    } catch (err) {
      console.error('Error refreshing balances:', err);
    }
  };

  // Refresh user info
  const refreshUserInfo = async () => {
    if (!wallet || !isRegistered) {
      console.log('[useContractData] refreshUserInfo: No wallet or not registered');
      return;
    }
    
    try {
      console.log('[useContractData] Refreshing user info for:', wallet.address);
      const info = await contractServiceV2.getUserInfo(wallet.address);
      console.log('[useContractData] Refreshed user info:', info);
      setUserInfo(info);
    } catch (err) {
      console.error('[useContractData] Error refreshing user info:', err);
    }
  };

  // Claim rewards
  const claimRewards = async () => {
    if (!wallet || !isRegistered) throw new Error('Not registered');
    
    try {
      const tx = await contractServiceV2.claimRewards();
      await tx.wait();
      
      // Refresh balances and user info
      await refreshBalances();
      await refreshUserInfo();
      
      return tx;
    } catch (err) {
      console.error('Error claiming rewards:', err);
      throw err;
    }
  };

  // Transfer BEER tokens
  const transferBeer = async (to, amount) => {
    if (!wallet) throw new Error('No wallet found');
    
    try {
      const tx = await contractServiceV2.transferBeer(to, amount);
      await tx.wait();
      
      // Refresh balances
      await refreshBalances();
      
      return tx;
    } catch (err) {
      console.error('Error transferring BEER:', err);
      throw err;
    }
  };

  return {
    loading,
    error,
    beerBalance,
    pendingRewards,
    userInfo,
    distributionActive,
    baseRewardRate,
    referrerMultiplier,
    totalUsers,
    totalTrustedUsers,
    refreshBalances,
    refreshUserInfo,
    claimRewards,
    transferBeer
  };
};

export default useContractData;

