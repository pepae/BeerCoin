import { ethers } from 'ethers';
import BeerCoinV2ABI from '../contracts/BeerCoinV2.json';
import BeerCoinDistributorV2ABI from '../contracts/BeerCoinDistributorV2.json';
import { BEERCOIN_ADDRESS, DISTRIBUTOR_ADDRESS } from '../config';

// Gnosis Chain configuration
const GNOSIS_CHAIN_ID = 100;
const GNOSIS_RPC_URL = 'https://rpc.gnosischain.com';

// Contract addresses imported from config
const BEER_COIN_ADDRESS = BEERCOIN_ADDRESS;
const DISTRIBUTOR_ADDRESS_V2 = DISTRIBUTOR_ADDRESS;

class ContractServiceV2 {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.beerCoinContract = null;
    this.distributorContract = null;
  }

  async initialize(wallet) {
    try {
      // Create provider for Gnosis Chain
      this.provider = new ethers.JsonRpcProvider(GNOSIS_RPC_URL);
      
      // Create signer from wallet
      this.signer = new ethers.Wallet(wallet.privateKey, this.provider);
      
      // Initialize contracts
      this.beerCoinContract = new ethers.Contract(
        BEER_COIN_ADDRESS,
        BeerCoinV2ABI.abi,
        this.signer
      );
      
      this.distributorContract = new ethers.Contract(
        DISTRIBUTOR_ADDRESS_V2,
        BeerCoinDistributorV2ABI.abi,
        this.signer
      );
      
      return true;
    } catch (error) {
      console.error('Failed to initialize contract service:', error);
      return false;
    }
  }

  // Getter for contract addresses
  get beerCoinAddress() {
    return BEER_COIN_ADDRESS;
  }

  get distributorAddress() {
    return DISTRIBUTOR_ADDRESS_V2;
  }

  // Get BEER token balance
  async getBeerBalance(address) {
    try {
      if (!this.beerCoinContract) return '0';
      const balance = await this.beerCoinContract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting BEER balance:', error);
      return '0';
    }
  }

  // Get xDAI balance
  async getXDaiBalance(address) {
    try {
      if (!this.provider) return '0';
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting xDAI balance:', error);
      return '0';
    }
  }

  // Check if user is registered
  async isUserRegistered(address) {
    try {
      if (!this.distributorContract) return false;
      return await this.distributorContract.isRegistered(address);
    } catch (error) {
      console.error('Error checking registration:', error);
      return false;
    }
  }

  // Get user information
  async getUserInfo(address) {
    try {
      if (!this.distributorContract) return null;
      const userInfo = await this.distributorContract.getUserInfo(address);
      return {
        username: userInfo.username,
        isTrusted: userInfo.isTrusted,
        isActive: userInfo.isActive,
        referrer: userInfo.referrer,
        referralCount: Number(userInfo.referralCount),
        totalEarned: ethers.formatEther(userInfo.totalEarned),
        pendingRewards: ethers.formatEther(userInfo.pendingRewards),
        joinTime: Number(userInfo.joinTime)
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      // Fallback to direct users mapping
      try {
        const userInfo = await this.distributorContract.users(address);
        return {
          username: userInfo.username,
          isTrusted: userInfo.isTrusted,
          isActive: userInfo.isActive,
          referrer: userInfo.referrer,
          referralCount: Number(userInfo.referralCount),
          totalEarned: ethers.formatEther(userInfo.totalEarned),
          pendingRewards: '0', // Not available in users mapping
          joinTime: Number(userInfo.joinTime)
        };
      } catch (fallbackError) {
        console.error('Error getting user info from users mapping:', fallbackError);
        return null;
      }
    }
  }

  // Get pending rewards
  async getPendingRewards(address) {
    try {
      if (!this.distributorContract) return '0';
      const pending = await this.distributorContract.calculatePendingRewards(address);
      return ethers.formatEther(pending);
    } catch (error) {
      console.error('Error getting pending rewards:', error);
      return '0';
    }
  }

  // Claim rewards
  async claimRewards() {
    try {
      if (!this.distributorContract) throw new Error('Contract not initialized');
      
      const tx = await this.distributorContract.claimRewards();
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Error claiming rewards:', error);
      return { success: false, error: error.message };
    }
  }

  // Register user by trusted user (NEW FUNCTION)
  async registerUserByTrusted(userAddress, username) {
    try {
      if (!this.distributorContract) throw new Error('Contract not initialized');
      
      // Ensure proper address checksum
      const checksummedAddress = ethers.getAddress(userAddress.toLowerCase());
      
      const tx = await this.distributorContract.registerUserByTrusted(checksummedAddress, username);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Error registering user by trusted:', error);
      return { success: false, error: error.message };
    }
  }

  // Legacy registration function (still available)
  async registerUser(username, referrerAddress) {
    try {
      if (!this.distributorContract) throw new Error('Contract not initialized');
      
      const tx = await this.distributorContract.registerUser(username, referrerAddress);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Error registering user:', error);
      return { success: false, error: error.message };
    }
  }

  // Send BEER tokens
  async sendBeer(toAddress, amount) {
    try {
      if (!this.beerCoinContract) throw new Error('Contract not initialized');
      
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.beerCoinContract.transfer(toAddress, amountWei);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Error sending BEER:', error);
      return { success: false, error: error.message };
    }
  }

  // Send xDAI
  async sendXDai(toAddress, amount) {
    try {
      if (!this.signer) throw new Error('Signer not initialized');
      
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.signer.sendTransaction({
        to: toAddress,
        value: amountWei
      });
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Error sending xDAI:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if username is available
  async isUsernameAvailable(username) {
    try {
      if (!this.distributorContract) {
        console.error('Distributor contract not initialized');
        return false;
      }
      
      if (!username || username.trim().length === 0) {
        console.error('Invalid username provided');
        return false;
      }

      console.log('Checking username availability for:', username);
      console.log('Using distributor address:', DISTRIBUTOR_ADDRESS_V2);
      
      const result = await this.distributorContract.isUsernameAvailable(username);
      console.log('Username availability result:', result);
      
      return result;
    } catch (error) {
      console.error('Error checking username availability:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        data: error.data
      });
      return false;
    }
  }

  // Get total users count
  async getTotalUsers() {
    try {
      if (!this.distributorContract) return 0;
      const count = await this.distributorContract.getTotalUsers();
      return Number(count);
    } catch (error) {
      console.error('Error getting total users:', error);
      return 0;
    }
  }

  // Get total trusted users count
  async getTotalTrustedUsers() {
    try {
      if (!this.distributorContract) return 0;
      const count = await this.distributorContract.getTotalTrustedUsers();
      return Number(count);
    } catch (error) {
      console.error('Error getting total trusted users:', error);
      return 0;
    }
  }

  // Get all trusted users
  async getAllTrustedUsers() {
    try {
      if (!this.distributorContract) return [];
      return await this.distributorContract.getAllTrustedUsers();
    } catch (error) {
      console.error('Error getting trusted users:', error);
      return [];
    }
  }

  // Check if distribution is active
  async isDistributionActive() {
    try {
      if (!this.distributorContract) return false;
      return await this.distributorContract.distributionActive();
    } catch (error) {
      console.error('Error checking distribution status:', error);
      return false;
    }
  }
}

// Create and export singleton instance
const contractServiceV2 = new ContractServiceV2();
export default contractServiceV2;

