// Test mode functionality for BeerCoin web app
// This allows switching between multiple test wallets

import { ethers } from 'ethers';
import { STORAGE_KEYS } from '../config';

// Test wallets
const TEST_WALLETS = {
  admin: {
    address: '0xD63caa57701e7F4b4C54Bf29558c409c17Ed7434',
    privateKey: '0x2eaec2ca13050a04f3522794ef285147a378326ade3ea23ca25b31cd1b382c29'
  },
  trustedUser: {
    address: '0x20fef9659830Bb949dDfbabd1d69f951FCEb2882',
    privateKey: '0x8ff970e41f3a9e9c9b3cb6c0f3b6d5bec0d6353e8d0c7fa5f0c7c8a42a9f3c9a'
  },
  newUser: {
    address: '0x7D0D4FecAbA1bbe762476cED0C295D18389494a8',
    privateKey: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
  }
};

// Function to switch to a specific test wallet
export function switchToTestWallet(walletType) {
  if (!TEST_WALLETS[walletType]) {
    console.error(`Invalid wallet type: ${walletType}`);
    return false;
  }
  
  const wallet = TEST_WALLETS[walletType];
  
  // Store wallet in localStorage
  localStorage.setItem(STORAGE_KEYS.PRIVATE_KEY, wallet.privateKey);
  
  // Set username based on wallet type
  if (walletType === 'admin') {
    localStorage.setItem(STORAGE_KEYS.USERNAME, 'admin');
  } else if (walletType === 'trustedUser') {
    localStorage.setItem(STORAGE_KEYS.USERNAME, 'test_trusted_user');
  } else if (walletType === 'newUser') {
    localStorage.setItem(STORAGE_KEYS.USERNAME, 'test_new_user');
  }
  
  console.log(`Switched to ${walletType} wallet: ${wallet.address}`);
  return true;
}

// Function to create a new random wallet
export function createRandomTestWallet(username) {
  const wallet = ethers.Wallet.createRandom();
  
  // Store wallet in localStorage
  localStorage.setItem(STORAGE_KEYS.PRIVATE_KEY, wallet.privateKey);
  
  // Set username
  if (username) {
    localStorage.setItem(STORAGE_KEYS.USERNAME, username);
  }
  
  console.log(`Created random test wallet: ${wallet.address}`);
  console.log(`Private key: ${wallet.privateKey}`);
  
  return {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
}

// Function to clear current wallet
export function clearTestWallet() {
  localStorage.removeItem(STORAGE_KEYS.PRIVATE_KEY);
  localStorage.removeItem(STORAGE_KEYS.USERNAME);
  console.log('Cleared test wallet');
  return true;
}

// Export test wallets for reference
export { TEST_WALLETS };

