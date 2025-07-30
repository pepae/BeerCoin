// Deep dive debug to find the exact revert reason
const { ethers } = require('ethers');

// Contract addresses
const DISTRIBUTOR_ADDRESS = '0x9E6233c16288949728b94FF134db1453AFfa49B4';
const TRUSTED_USER = '0x167B0703Fc797f886Dc914501C9584B809b54758';
const TINA_ADDRESS = '0xb9532ac5bA3CB087A58d436B15B45D2fFBDb1E63';
const TINA_USERNAME = 'tina';

// More comprehensive ABI
const DISTRIBUTOR_ABI = [
  "function registerUserByTrusted(address userAddress, string memory username) external",
  "function isRegistered(address user) external view returns (bool)",
  "function getUserInfo(address user) external view returns (string memory username, bool isTrusted, bool isActive, address referrer, uint256 referralCount, uint256 totalEarned, uint256 pendingRewards, uint256 joinTime)",
  "function usernameToAddress(string memory username) external view returns (address)",
  "function distributionActive() external view returns (bool)",
  "function owner() external view returns (address)",
  "function baseRewardRate() external view returns (uint256)",
  "function referrerMultiplier() external view returns (uint256)"
];

async function deepDebug() {
  try {
    console.log('🔬 Deep Debug: Finding Exact Revert Reason');
    console.log('============================================');
    
    const provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
    const contract = new ethers.Contract(DISTRIBUTOR_ADDRESS, DISTRIBUTOR_ABI, provider);
    
    // Create a read-only version for testing
    console.log('\n🧪 Testing transaction simulation...');
    
    // First, let's manually check all the require statements from the contract
    console.log('\n📋 Manual Requirement Checks:');
    
    // 1. userAddress != address(0)
    console.log('1. User address is not zero:', TINA_ADDRESS !== '0x0000000000000000000000000000000000000000');
    
    // 2. !isRegistered[userAddress]
    const isRegistered = await contract.isRegistered(TINA_ADDRESS);
    console.log('2. User is not already registered:', !isRegistered);
    if (isRegistered) {
      const userInfo = await contract.getUserInfo(TINA_ADDRESS);
      console.log('   ❌ User already registered with username:', userInfo[0]);
      return; // Exit if already registered
    }
    
    // 3. bytes(username).length > 0
    console.log('3. Username is not empty:', TINA_USERNAME.length > 0);
    
    // 4. usernameToAddress[username] == address(0)
    const usernameOwner = await contract.usernameToAddress(TINA_USERNAME);
    console.log('4. Username is not taken:', usernameOwner === '0x0000000000000000000000000000000000000000');
    if (usernameOwner !== '0x0000000000000000000000000000000000000000') {
      console.log('   ❌ Username taken by:', usernameOwner);
      return; // Exit if username taken
    }
    
    // 5. userAddress != msg.sender
    console.log('5. User address != trusted user:', TINA_ADDRESS.toLowerCase() !== TRUSTED_USER.toLowerCase());
    
    // 6. Check trusted user status (onlyTrustedUser modifier)
    const trustedUserInfo = await contract.getUserInfo(TRUSTED_USER);
    console.log('6. Trusted user is registered:', trustedUserInfo[0] !== '');
    console.log('7. Trusted user is trusted:', trustedUserInfo[1]);
    console.log('8. Trusted user is active:', trustedUserInfo[2]);
    
    // 9. Check distribution is active (onlyActiveDistribution modifier)
    const distributionActive = await contract.distributionActive();
    console.log('9. Distribution is active:', distributionActive);
    
    console.log('\n🔍 All basic checks passed. Trying more advanced debugging...');
    
    // Try to call the function with staticCall to get better error info
    console.log('\n🧪 Attempting staticCall...');
    try {
      // Use a wallet to make the static call from the correct address
      const wallet = new ethers.Wallet('0x' + '1'.repeat(64), provider); // Dummy private key
      const walletContract = new ethers.Contract(DISTRIBUTOR_ADDRESS, DISTRIBUTOR_ABI, wallet);
      
      // Override the from address to simulate the trusted user
      const result = await walletContract.registerUserByTrusted.staticCall(
        TINA_ADDRESS, 
        TINA_USERNAME,
        { from: TRUSTED_USER }
      );
      console.log('✅ Static call succeeded:', result);
    } catch (staticError) {
      console.log('❌ Static call failed:', staticError.message);
      
      // Try to get more specific error information
      if (staticError.reason) {
        console.log('🎯 EXACT REASON:', staticError.reason);
      }
      
      if (staticError.code === 'CALL_EXCEPTION' && staticError.data) {
        console.log('🔍 Error data:', staticError.data);
      }
    }
    
    // Try a different approach - check if there are any issues with the contract state
    console.log('\n🔍 Additional Contract State Checks:');
    
    try {
      const owner = await contract.owner();
      console.log('Contract owner:', owner);
      
      const baseRewardRate = await contract.baseRewardRate();
      console.log('Base reward rate:', baseRewardRate.toString());
      
      const referrerMultiplier = await contract.referrerMultiplier();
      console.log('Referrer multiplier:', referrerMultiplier.toString());
      
    } catch (err) {
      console.log('❌ Error getting contract state:', err.message);
    }
    
    // Final attempt: try to encode the function call manually and see if we can get more info
    console.log('\n🛠️ Manual Function Call Encoding Test:');
    try {
      const iface = new ethers.Interface(DISTRIBUTOR_ABI);
      const encodedData = iface.encodeFunctionData('registerUserByTrusted', [TINA_ADDRESS, TINA_USERNAME]);
      console.log('Encoded function data:', encodedData);
      
      // Try to call with eth_call
      const callResult = await provider.call({
        to: DISTRIBUTOR_ADDRESS,
        data: encodedData,
        from: TRUSTED_USER
      });
      console.log('✅ Raw call succeeded:', callResult);
      
    } catch (callError) {
      console.log('❌ Raw call failed:', callError.message);
      
      if (callError.reason) {
        console.log('🎯 RAW CALL REASON:', callError.reason);
      }
    }
    
  } catch (error) {
    console.error('❌ Deep debug error:', error.message);
  }
}

deepDebug();
