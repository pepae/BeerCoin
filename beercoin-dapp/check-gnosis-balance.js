const { ethers } = require('ethers');
require('dotenv').config();

async function checkBalance() {
  try {
    // Connect to Gnosis Chain
    const provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
    
    // Get wallet from private key
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log('Checking balance on Gnosis Chain...');
    console.log('Wallet address:', wallet.address);
    
    // Get balance
    const balance = await provider.getBalance(wallet.address);
    const balanceInEther = ethers.formatEther(balance);
    
    console.log('Balance:', balanceInEther, 'xDAI');
    
    if (parseFloat(balanceInEther) < 0.01) {
      console.log('⚠️  Warning: Low balance for deployment');
    } else {
      console.log('✅ Sufficient balance for deployment');
    }
    
  } catch (error) {
    console.error('Error checking balance:', error);
  }
}

checkBalance();

