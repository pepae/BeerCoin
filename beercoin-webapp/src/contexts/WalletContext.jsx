import { createContext, useContext, useState, useEffect } from 'react';
import walletService from '../lib/walletService';
import contractServiceV2 from '../lib/contractServiceV2';
import { STORAGE_KEYS } from '../config';

// Create context
const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState('0.0');
  const [beerBalance, setBeerBalance] = useState('0.0');
  const [pendingRewards, setPendingRewards] = useState('0.0');
  const [isRegistered, setIsRegistered] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [username, setUsername] = useState(localStorage.getItem(STORAGE_KEYS.USERNAME) || '');
  const [isTrusted, setIsTrusted] = useState(localStorage.getItem(STORAGE_KEYS.IS_TRUSTED) === 'true');

  // Initialize wallet on component mount
  useEffect(() => {
    const initWallet = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if wallet exists in local storage
        if (walletService.hasWallet()) {
          const walletData = walletService.getWallet();
          setWallet(walletData);
          
          // Initialize contract service
          await contractServiceV2.initialize(walletData);
          
          // Check if user is registered
          const registered = await contractServiceV2.isUserRegistered(walletData.address);
          setIsRegistered(registered);
          
          if (registered) {
            // Get user info
            const info = await contractServiceV2.getUserInfo(walletData.address);
            setUserInfo(info);
            setUsername(info.username);
            setIsTrusted(info.isTrusted);
            
            // Save to local storage
            localStorage.setItem(STORAGE_KEYS.USERNAME, info.username);
            localStorage.setItem(STORAGE_KEYS.IS_TRUSTED, info.isTrusted);
          }
          
          // Get balances
          await refreshBalances(walletData.address);
        }
      } catch (err) {
        console.error('Error initializing wallet:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    initWallet();
  }, []);

  // Refresh balances periodically
  useEffect(() => {
    if (!wallet) return;
    
    const intervalId = setInterval(() => {
      refreshBalances(wallet.address);
    }, 10000); // Every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [wallet]);

  // Refresh balances
  const refreshBalances = async (address) => {
    try {
      const [xdaiBalance, beerBal, pendingRew] = await Promise.all([
        walletService.getBalance(address),
        contractServiceV2.getBeerBalance(address),
        contractServiceV2.getPendingRewards(address)
      ]);
      
      setBalance(xdaiBalance);
      setBeerBalance(beerBal);
      setPendingRewards(pendingRew);
    } catch (err) {
      console.error('Error refreshing balances:', err);
    }
  };

  // Create a new wallet
  const createWallet = () => {
    try {
      const walletData = walletService.createWallet();
      setWallet(walletData);
      setIsRegistered(false);
      setUserInfo(null);
      return walletData;
    } catch (err) {
      console.error('Error creating wallet:', err);
      setError(err.message);
      throw err;
    }
  };

  // Import wallet from private key
  const importWalletFromPrivateKey = async (privateKey) => {
    try {
      const walletData = walletService.importFromPrivateKey(privateKey);
      setWallet(walletData);
      
      // Initialize contract service
      await contractServiceV2.initialize(walletData);
      
      // Check if user is registered
      const registered = await contractServiceV2.isUserRegistered(walletData.address);
      setIsRegistered(registered);
      
      if (registered) {
        // Get user info
        const info = await contractServiceV2.getUserInfo(walletData.address);
        setUserInfo(info);
        setUsername(info.username);
        setIsTrusted(info.isTrusted);
        
        // Save to local storage
        localStorage.setItem(STORAGE_KEYS.USERNAME, info.username);
        localStorage.setItem(STORAGE_KEYS.IS_TRUSTED, info.isTrusted);
      }
      
      // Get balances
      await refreshBalances(walletData.address);
      
      return walletData;
    } catch (err) {
      console.error('Error importing wallet:', err);
      setError(err.message);
      throw err;
    }
  };

  // Import wallet from mnemonic
  const importWalletFromMnemonic = async (mnemonic) => {
    try {
      const walletData = walletService.importFromMnemonic(mnemonic);
      setWallet(walletData);
      
      // Initialize contract service
      await contractServiceV2.initialize(walletData);
      
      // Check if user is registered
      const registered = await contractServiceV2.isUserRegistered(walletData.address);
      setIsRegistered(registered);
      
      if (registered) {
        // Get user info
        const info = await contractServiceV2.getUserInfo(walletData.address);
        setUserInfo(info);
        setUsername(info.username);
        setIsTrusted(info.isTrusted);
        
        // Save to local storage
        localStorage.setItem(STORAGE_KEYS.USERNAME, info.username);
        localStorage.setItem(STORAGE_KEYS.IS_TRUSTED, info.isTrusted);
      }
      
      // Get balances
      await refreshBalances(walletData.address);
      
      return walletData;
    } catch (err) {
      console.error('Error importing wallet:', err);
      setError(err.message);
      throw err;
    }
  };

  // Register user
  const registerUser = async (username, referrer) => {
    try {
      if (!wallet) throw new Error('No wallet found');
      
      const tx = await contractServiceV2.registerUser(username, referrer);
      await tx.wait();
      
      setIsRegistered(true);
      setUsername(username);
      
      // Save to local storage
      localStorage.setItem(STORAGE_KEYS.USERNAME, username);
      
      // Get user info
      const info = await contractServiceV2.getUserInfo(wallet.address);
      setUserInfo(info);
      setIsTrusted(info.isTrusted);
      localStorage.setItem(STORAGE_KEYS.IS_TRUSTED, info.isTrusted);
      
      // Refresh balances
      await refreshBalances(wallet.address);
      
      return true;
    } catch (err) {
      console.error('Error registering user:', err);
      setError(err.message);
      throw err;
    }
  };

  // Claim rewards
  const claimRewards = async () => {
    try {
      if (!wallet) throw new Error('No wallet found');
      if (!isRegistered) throw new Error('User not registered');
      
      const tx = await contractServiceV2.claimRewards();
      await tx.wait();
      
      // Refresh balances
      await refreshBalances(wallet.address);
      
      return true;
    } catch (err) {
      console.error('Error claiming rewards:', err);
      setError(err.message);
      throw err;
    }
  };

  // Transfer BEER tokens
  const transferBeer = async (to, amount) => {
    try {
      if (!wallet) throw new Error('No wallet found');
      
      const tx = await contractServiceV2.transferBeer(to, amount);
      await tx.wait();
      
      // Refresh balances
      await refreshBalances(wallet.address);
      
      return true;
    } catch (err) {
      console.error('Error transferring BEER:', err);
      setError(err.message);
      throw err;
    }
  };

  // Send xDAI
  const sendXDai = async (to, amount) => {
    try {
      if (!wallet) throw new Error('No wallet found');
      
      const tx = await walletService.sendTransaction(to, amount);
      await tx.wait();
      
      // Refresh balances
      await refreshBalances(wallet.address);
      
      return true;
    } catch (err) {
      console.error('Error sending xDAI:', err);
      setError(err.message);
      throw err;
    }
  };

  // Clear wallet
  const clearWallet = () => {
    walletService.clearWallet();
    setWallet(null);
    setIsRegistered(false);
    setUserInfo(null);
    setUsername('');
    setIsTrusted(false);
    setBeerBalance('0.0');
    setPendingRewards('0.0');
    setBalance('0.0');
    
    // Clear local storage
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
    localStorage.removeItem(STORAGE_KEYS.IS_TRUSTED);
    localStorage.removeItem(STORAGE_KEYS.REFERRER);
  };

  // Context value
  const value = {
    wallet,
    loading,
    error,
    balance,
    beerBalance,
    pendingRewards,
    isRegistered,
    userInfo,
    username,
    isTrusted,
    createWallet,
    importWalletFromPrivateKey,
    importWalletFromMnemonic,
    registerUser,
    claimRewards,
    transferBeer,
    sendXDai,
    clearWallet,
    refreshBalances,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

// Custom hook to use the wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export default WalletContext;

