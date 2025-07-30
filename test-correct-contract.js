// Test the CORRECT V2 contract address
const { ethers } = require('ethers');

const CORRECT_DISTRIBUTOR_ADDRESS = '0xFB8E611686F21eC845AeD71F8ed942cA3C1150d9';
const TINA_ADDRESS = '0xb9532ac5bA3CB087A58d436B15B45D2fFBDb1E63';
const TINA_USERNAME = 'tina';

async function testCorrectContract() {
  try {
    console.log('🎯 Testing CORRECT V2 Contract');
    console.log('==============================');
    console.log('Contract address:', CORRECT_DISTRIBUTOR_ADDRESS);
    
    const provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
    
    // Check if registerUserByTrusted function exists
    const iface = new ethers.Interface([
      "function registerUserByTrusted(address userAddress, string memory username) external"
    ]);
    
    const functionSelector = iface.getFunction('registerUserByTrusted').selector;
    console.log('Looking for function selector:', functionSelector);
    
    const contractCode = await provider.getCode(CORRECT_DISTRIBUTOR_ADDRESS);
    const selectorExists = contractCode.toLowerCase().includes(functionSelector.slice(2).toLowerCase());
    console.log('✅ Function exists in contract:', selectorExists);
    
    if (selectorExists) {
      console.log('\n🧪 Testing function call on correct contract...');
      
      // Try the call on the correct contract
      const encodedData = iface.encodeFunctionData('registerUserByTrusted', [TINA_ADDRESS, TINA_USERNAME]);
      
      try {
        const result = await provider.call({
          to: CORRECT_DISTRIBUTOR_ADDRESS,
          data: encodedData,
          from: '0x167B0703Fc797f886Dc914501C9584B809b54758'
        });
        console.log('✅ Function call succeeded on correct contract!');
      } catch (err) {
        console.log('❌ Function call failed:', err.message);
        if (err.reason) {
          console.log('🎯 Reason:', err.reason);
        }
      }
    }
    
    // Also check trusted users on the correct contract
    console.log('\n👥 Checking trusted users on correct contract...');
    try {
      const abi = [
        "function getAllTrustedUsers() external view returns (address[])",
        "function getUserInfo(address user) external view returns (string memory username, bool isTrusted, bool isActive, address referrer, uint256 referralCount, uint256 totalEarned, uint256 pendingRewards, uint256 joinTime)"
      ];
      
      const contract = new ethers.Contract(CORRECT_DISTRIBUTOR_ADDRESS, abi, provider);
      const trustedUsers = await contract.getAllTrustedUsers();
      console.log('Trusted users on correct contract:', trustedUsers);
      
      // Check if our trusted user exists on the correct contract
      const trustedUserExists = trustedUsers.includes('0x167B0703Fc797f886Dc914501C9584B809b54758');
      console.log('Our trusted user exists on correct contract:', trustedUserExists);
      
      if (trustedUserExists) {
        const userInfo = await contract.getUserInfo('0x167B0703Fc797f886Dc914501C9584B809b54758');
        console.log('Trusted user info on correct contract:');
        console.log('  Username:', userInfo[0]);
        console.log('  Is Trusted:', userInfo[1]);
        console.log('  Is Active:', userInfo[2]);
      }
      
    } catch (err) {
      console.log('❌ Error checking trusted users:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testCorrectContract();
