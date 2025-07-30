// Script for trusted users to register new users directly
const { ethers } = require('ethers');

// Load wallet info from environment variable
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error('❌ PRIVATE_KEY environment variable not set');
  console.log('💡 Set it with: $env:PRIVATE_KEY="your_private_key_here"');
  process.exit(1);
}

// Contract addresses
const DISTRIBUTOR_ADDRESS = '0x9E6233c16288949728b94FF134db1453AFfa49B4';

// User to register (update these values)
const NEW_USER_ADDRESS = '0xB9532aC5Ba3CB087A58D436B15B45d2FfbdB1e63'; // Tina's address
const NEW_USERNAME = 'Tina'; // Tina's username

// ABI for the distributor contract
const DISTRIBUTOR_ABI = [
  "function registerUserByTrusted(address userAddress, string memory username) external",
  "function isRegistered(address user) external view returns (bool)",
  "function getUserInfo(address user) external view returns (string memory username, bool isTrusted, bool isActive, address referrer, uint256 referralCount, uint256 totalEarned, uint256 pendingRewards, uint256 joinTime)"
];

async function main() {
  try {
    console.log('🎯 Trusted User Registration Script');
    console.log('==================================');
    
    // Connect to Gnosis Chain
    const provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
    
    // Create wallet instance
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`📱 Using trusted user wallet: ${wallet.address}`);
    
    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} xDAI`);
    
    if (balance < ethers.parseEther('0.001')) {
      console.error('❌ Insufficient balance to perform transaction');
      return;
    }
    
    // Connect to distributor contract
    const distributorContract = new ethers.Contract(
      DISTRIBUTOR_ADDRESS,
      DISTRIBUTOR_ABI,
      wallet
    );
    
    // Check if the trusted user is registered and trusted
    try {
      const trustedUserInfo = await distributorContract.getUserInfo(wallet.address);
      console.log(`👤 Trusted user status:`);
      console.log(`   - Username: ${trustedUserInfo[0] || '(not set)'}`);
      console.log(`   - Is Trusted: ${trustedUserInfo[1]}`);
      console.log(`   - Is Active: ${trustedUserInfo[2]}`);
      
      if (!trustedUserInfo[1]) {
        console.error('❌ This wallet is not a trusted user!');
        console.log('💡 Only trusted users can register new users directly');
        return;
      }
      
      if (!trustedUserInfo[2]) {
        console.error('❌ This trusted user is not active!');
        return;
      }
      
    } catch (err) {
      console.error('❌ Could not verify trusted user status:', err.message);
      console.log('💡 Make sure this wallet is registered as a trusted user');
      return;
    }
    
    // Check if new user is already registered
    console.log(`\n🔍 Checking if ${NEW_USERNAME} (${NEW_USER_ADDRESS}) is already registered...`);
    const isAlreadyRegistered = await distributorContract.isRegistered(NEW_USER_ADDRESS);
    
    if (isAlreadyRegistered) {
      console.log(`✅ User ${NEW_USERNAME} is already registered!`);
      
      // Show their info
      const userInfo = await distributorContract.getUserInfo(NEW_USER_ADDRESS);
      console.log(`📋 Current user info:`);
      console.log(`   - Username: ${userInfo[0]}`);
      console.log(`   - Is Trusted: ${userInfo[1]}`);
      console.log(`   - Is Active: ${userInfo[2]}`);
      console.log(`   - Referrer: ${userInfo[3]}`);
      return;
    }
    
    // Register the new user
    console.log(`\n🚀 Registering ${NEW_USERNAME} (${NEW_USER_ADDRESS}) as a new user...`);
    console.log(`💡 This will be done by trusted user: ${wallet.address}`);
    
    // Estimate gas first
    try {
      const gasEstimate = await distributorContract.registerUserByTrusted.estimateGas(
        NEW_USER_ADDRESS,
        NEW_USERNAME
      );
      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
    } catch (gasError) {
      console.error('❌ Gas estimation failed:', gasError.message);
      console.log('💡 This might indicate the transaction will fail');
      
      // Try to provide more specific error info
      if (gasError.message.includes('User already registered')) {
        console.log('❌ User is already registered');
      } else if (gasError.message.includes('Username already taken')) {
        console.log('❌ Username is already taken');
      } else if (gasError.message.includes('Must be active trusted user')) {
        console.log('❌ Wallet is not an active trusted user');
      }
      return;
    }
    
    // Send the transaction
    const tx = await distributorContract.registerUserByTrusted(
      NEW_USER_ADDRESS,
      NEW_USERNAME
    );
    
    console.log(`📝 Transaction sent: ${tx.hash}`);
    console.log(`⏳ Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Verify registration was successful
    console.log(`\n🔍 Verifying registration...`);
    const isNowRegistered = await distributorContract.isRegistered(NEW_USER_ADDRESS);
    
    if (isNowRegistered) {
      console.log(`🎉 SUCCESS! ${NEW_USERNAME} has been registered successfully!`);
      
      // Show new user info
      const newUserInfo = await distributorContract.getUserInfo(NEW_USER_ADDRESS);
      console.log(`\n📋 New user details:`);
      console.log(`   - Username: ${newUserInfo[0]}`);
      console.log(`   - Is Trusted: ${newUserInfo[1]}`);
      console.log(`   - Is Active: ${newUserInfo[2]}`);
      console.log(`   - Referrer: ${newUserInfo[3]} (the trusted user who registered them)`);
      console.log(`   - Join Time: ${new Date(Number(newUserInfo[7]) * 1000).toLocaleString()}`);
      
    } else {
      console.error('❌ Registration verification failed - user not found');
    }
    
  } catch (error) {
    console.error('❌ Error during registration:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('User already registered')) {
      console.log('💡 The user address is already registered in the system');
    } else if (error.message.includes('Username already taken')) {
      console.log('💡 Try a different username - this one is taken');
    } else if (error.message.includes('Must be active trusted user')) {
      console.log('💡 Only active trusted users can register new users');
    } else if (error.message.includes('insufficient funds')) {
      console.log('💡 Not enough xDAI to pay for gas fees');
    }
  }
}

main();
