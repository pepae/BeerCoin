import { ethers } from 'ethers';
import { STORAGE_KEYS } from '../config';

/**
 * WalletService - Handles wallet creation, storage, and recovery
 */
class WalletService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
  }

  /**
   * Create a new wallet
   * @returns {Object} Wallet data
   */
  createWallet() {
    const wallet = ethers.Wallet.createRandom();
    const walletData = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic.phrase,
      createdAt: new Date().toISOString(),
    };
    
    this.saveWallet(walletData);
    return walletData;
  }

  /**
   * Save wallet data to local storage
   * @param {Object} walletData - Wallet data to save
   */
  saveWallet(walletData) {
    localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(walletData));
  }

  /**
   * Get wallet data from local storage
   * @returns {Object|null} Wallet data or null if not found
   */
  getWallet() {
    const walletData = localStorage.getItem(STORAGE_KEYS.WALLET);
    return walletData ? JSON.parse(walletData) : null;
  }

  /**
   * Check if wallet exists in local storage
   * @returns {boolean} True if wallet exists
   */
  hasWallet() {
    return !!localStorage.getItem(STORAGE_KEYS.WALLET);
  }

  /**
   * Get wallet instance from private key
   * @returns {ethers.Wallet|null} Wallet instance or null if not found
   */
  getWalletInstance() {
    const walletData = this.getWallet();
    if (!walletData) return null;
    
    return new ethers.Wallet(walletData.privateKey, this.provider);
  }

  /**
   * Import wallet from private key
   * @param {string} privateKey - Private key
   * @returns {Object} Wallet data
   */
  importFromPrivateKey(privateKey) {
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const walletData = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: null, // No mnemonic when importing from private key
        createdAt: new Date().toISOString(),
      };
      
      this.saveWallet(walletData);
      return walletData;
    } catch (error) {
      console.error('Error importing wallet:', error);
      throw new Error('Invalid private key');
    }
  }

  /**
   * Import wallet from mnemonic
   * @param {string} mnemonic - Mnemonic phrase
   * @returns {Object} Wallet data
   */
  importFromMnemonic(mnemonic) {
    try {
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      const walletData = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: mnemonic,
        createdAt: new Date().toISOString(),
      };
      
      this.saveWallet(walletData);
      return walletData;
    } catch (error) {
      console.error('Error importing wallet:', error);
      throw new Error('Invalid mnemonic phrase');
    }
  }

  /**
   * Clear wallet data from local storage
   */
  clearWallet() {
    localStorage.removeItem(STORAGE_KEYS.WALLET);
  }

  /**
   * Get wallet balance
   * @param {string} address - Wallet address
   * @returns {Promise<string>} Balance in ETH
   */
  async getBalance(address) {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0.0';
    }
  }

  /**
   * Send transaction
   * @param {string} to - Recipient address
   * @param {string} amount - Amount to send in ETH
   * @returns {Promise<ethers.TransactionResponse>} Transaction response
   */
  async sendTransaction(to, amount) {
    const wallet = this.getWalletInstance();
    if (!wallet) throw new Error('No wallet found');
    
    const tx = {
      to,
      value: ethers.parseEther(amount),
    };
    
    return wallet.sendTransaction(tx);
  }
}

// Create singleton instance
const walletService = new WalletService();
export default walletService;

