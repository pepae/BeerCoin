import { ethers } from 'ethers';
import { BEERCOIN_ADDRESS, DISTRIBUTOR_ADDRESS } from '../config';
import BeerCoinABI from '../contracts/BeerCoin.json';
import BeerCoinDistributorABI from '../contracts/BeerCoinDistributor.json';
import walletService from './walletService';

/**
 * ContractService - Handles interactions with BeerCoin smart contracts
 */
class ContractService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
    this.beerCoinAddress = BEERCOIN_ADDRESS;
    this.distributorAddress = DISTRIBUTOR_ADDRESS;
    
    // Initialize contract instances
    this.beerCoin = new ethers.Contract(
      this.beerCoinAddress,
      BeerCoinABI.abi,
      this.provider
    );
    
    this.distributor = new ethers.Contract(
      this.distributorAddress,
      BeerCoinDistributorABI.abi,
      this.provider
    );
  }

  /**
   * Get BeerCoin balance for an address
   * @param {string} address - Wallet address
   * @returns {Promise<string>} Balance in BEER
   */
  async getBeerBalance(address) {
    try {
      const balance = await this.beerCoin.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting BEER balance:', error);
      return '0.0';
    }
  }

  /**
   * Get pending rewards for an address
   * @param {string} address - Wallet address
   * @returns {Promise<string>} Pending rewards in BEER
   */
  async getPendingRewards(address) {
    try {
      const pendingRewards = await this.distributor.calculatePendingRewards(address);
      return ethers.formatEther(pendingRewards);
    } catch (error) {
      console.error('Error getting pending rewards:', error);
      return '0.0';
    }
  }

  /**
   * Check if a user is registered
   * @param {string} address - Wallet address
   * @returns {Promise<boolean>} True if registered
   */
  async isUserRegistered(address) {
    try {
      return await this.distributor.isRegistered(address);
    } catch (error) {
      console.error('Error checking if user is registered:', error);
      return false;
    }
  }

  /**
   * Check if a username is available
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} True if available
   */
  async isUsernameAvailable(username) {
    try {
      return await this.distributor.isUsernameAvailable(username);
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }

  /**
   * Get user information
   * @param {string} address - Wallet address
   * @returns {Promise<Object>} User information
   */
  async getUserInfo(address) {
    try {
      const userInfo = await this.distributor.getUserInfo(address);
      return {
        username: userInfo[0],
        isTrusted: userInfo[1],
        isActive: userInfo[2],
        referrer: userInfo[3],
        referralCount: Number(userInfo[4]),
        totalEarned: ethers.formatEther(userInfo[5]),
        pendingRewards: ethers.formatEther(userInfo[6]),
        joinTime: new Date(Number(userInfo[7]) * 1000).toISOString(),
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  /**
   * Register a new user
   * @param {string} username - Username
   * @param {string} referrer - Referrer address
   * @param {string} userAddress - Optional user address (for trusted users registering others)
   * @returns {Promise<ethers.TransactionResponse>} Transaction response
   */
  async registerUser(username, referrer, userAddress = null) {
    const wallet = walletService.getWalletInstance();
    if (!wallet) throw new Error('No wallet found');
    
    const distributorWithSigner = this.distributor.connect(wallet);
    
    // If userAddress is provided, trusted user is registering someone else
    if (userAddress) {
      // This would require a special function in the smart contract
      // For now, we'll use the regular registration but from the trusted user's perspective
      return distributorWithSigner.registerUser(username, referrer);
    } else {
      // Regular self-registration
      return distributorWithSigner.registerUser(username, referrer);
    }
  }

  /**
   * Claim rewards
   * @returns {Promise<ethers.TransactionResponse>} Transaction response
   */
  async claimRewards() {
    const wallet = walletService.getWalletInstance();
    if (!wallet) throw new Error('No wallet found');
    
    const distributorWithSigner = this.distributor.connect(wallet);
    return distributorWithSigner.claimRewards();
  }

  /**
   * Transfer BEER tokens
   * @param {string} to - Recipient address
   * @param {string} amount - Amount to send in BEER
   * @returns {Promise<ethers.TransactionResponse>} Transaction response
   */
  async transferBeer(to, amount) {
    const wallet = walletService.getWalletInstance();
    if (!wallet) throw new Error('No wallet found');
    
    const beerCoinWithSigner = this.beerCoin.connect(wallet);
    return beerCoinWithSigner.transfer(to, ethers.parseEther(amount));
  }

  /**
   * Check if distribution is active
   * @returns {Promise<boolean>} True if active
   */
  async isDistributionActive() {
    try {
      return await this.distributor.distributionActive();
    } catch (error) {
      console.error('Error checking if distribution is active:', error);
      return false;
    }
  }

  /**
   * Get base reward rate
   * @returns {Promise<string>} Base reward rate in BEER per second
   */
  async getBaseRewardRate() {
    try {
      const rate = await this.distributor.baseRewardRate();
      return ethers.formatEther(rate);
    } catch (error) {
      console.error('Error getting base reward rate:', error);
      return '0.0';
    }
  }
}

// Create singleton instance
const contractService = new ContractService();
export default contractService;

