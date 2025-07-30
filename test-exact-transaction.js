// Test the exact transaction that's failing
const { ethers } = require('ethers');

// Load private key for testing (you'll need to set this)
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error('❌ PRIVATE_KEY environment variable not set');
  console.log('💡 Set it with: $env:PRIVATE_KEY="your_private_key_here"');
  process.exit(1);
}

// Contract addresses
const DISTRIBUTOR_ADDRESS = '0x9E6233c16288949728b94FF134db1453AFfa49B4';

// Addresses (with correct checksum)
const TINA_ADDRESS = '0xb9532ac5bA3CB087A58d436B15B45D2fFBDb1E63';
const TINA_USERNAME = 'tina';

// ABI for the function we're testing
const DISTRIBUTOR_ABI = [
  "function registerUserByTrusted(address userAddress, string memory username) external",
  "function isRegistered(address user) external view returns (bool)",
  "function getUserInfo(address user) external view returns (string memory username, bool isTrusted, bool isActive, address referrer, uint256 referralCount, uint256 totalEarned, uint256 pendingRewards, uint256 joinTime)"
];

async function testTransaction() {
  try {
    console.log('🧪 Testing Exact Transaction');
    console.log('=============================');
    
    const provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('📱 Using wallet:', wallet.address);
    console.log('🎯 Registering:', TINA_ADDRESS);
    console.log('👤 Username:', TINA_USERNAME);
    
    const contract = new ethers.Contract(DISTRIBUTOR_ADDRESS, DISTRIBUTOR_ABI, wallet);
    
    // First, let's try to estimate gas to see the exact error
    console.log('\n⛽ Testing gas estimation...');
    try {
      const gasEstimate = await contract.registerUserByTrusted.estimateGas(
        TINA_ADDRESS,
        TINA_USERNAME
      );
      console.log('✅ Gas estimate successful:', gasEstimate.toString());
      
      // If gas estimation works, try the actual transaction
      console.log('\n🚀 Attempting actual transaction...');
      
      const tx = await contract.registerUserByTrusted(
        TINA_ADDRESS,
        TINA_USERNAME,
        {
          gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        }
      );
      
      console.log('📝 Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt.transactionHash);
      
    } catch (gasError) {
      console.log('❌ Gas estimation failed:', gasError.message);
      
      // Try to decode the error more specifically
      if (gasError.reason) {
        console.log('🔍 Specific reason:', gasError.reason);
      }
      
      if (gasError.code === 'CALL_EXCEPTION') {
        console.log('🔍 This is a contract execution error');
        
        // Try to get more details about the call
        if (gasError.transaction) {
          console.log('📋 Transaction details:');
          console.log('   To:', gasError.transaction.to);
          console.log('   From:', gasError.transaction.from);
          console.log('   Data:', gasError.transaction.data);
        }
      }
      
      // Let's try calling with staticCall to see if we can get more info
      console.log('\n🔬 Trying static call for better error info...');
      try {
        await contract.registerUserByTrusted.staticCall(
          TINA_ADDRESS,
          TINA_USERNAME
        );
        console.log('🤔 Static call succeeded - this is unexpected!');
      } catch (staticError) {
        console.log('❌ Static call failed:', staticError.message);
        if (staticError.reason) {
          console.log('🎯 EXACT ERROR REASON:', staticError.reason);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testTransaction();
