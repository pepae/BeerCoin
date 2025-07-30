// Quick script to check if an address is a trusted user
const { ethers } = require('ethers');

// Contract configuration
const DISTRIBUTOR_ADDRESS = '0x9E6233c16288949728b94FF134db1453AFfa49B4';
const DISTRIBUTOR_ABI = [
  "function getUserInfo(address user) external view returns (string memory username, bool isTrusted, bool isActive, address referrer, uint256 referralCount, uint256 totalEarned, uint256 pendingRewards, uint256 joinTime)",
  "function getTotalTrustedUsers() external view returns (uint256)",
  "function getAllTrustedUsers() external view returns (address[] memory)"
];

// Address to check
const ADDRESS_TO_CHECK = '0x35E294E1e0f6Fa53c86d222d3c29Bd41A1f02890';

async function checkTrustedStatus() {
  try {
    console.log('🔍 Checking trusted status for:', ADDRESS_TO_CHECK);
    console.log('================================================');
    
    // Connect to Gnosis Chain
    const provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
    
    // First, check if the contract exists
    const contractCode = await provider.getCode(DISTRIBUTOR_ADDRESS);
    console.log('Contract exists:', contractCode !== '0x');
    
    if (contractCode === '0x') {
      console.log('❌ Contract does not exist at address:', DISTRIBUTOR_ADDRESS);
      return;
    }
    
    // Connect to distributor contract (read-only)
    const distributorContract = new ethers.Contract(
      DISTRIBUTOR_ADDRESS,
      DISTRIBUTOR_ABI,
      provider
    );
    
    console.log('\n🔍 Getting user info...');
    
    try {
      // Get user info which includes trusted status
      const userInfo = await distributorContract.getUserInfo(ADDRESS_TO_CHECK);
      
      console.log('\n📋 User Details:');
      console.log('- Username:', userInfo[0] || '(not set)');
      console.log('- Is Trusted:', userInfo[1]);
      console.log('- Is Active:', userInfo[2]);
      console.log('- Referrer:', userInfo[3]);
      console.log('- Referral Count:', userInfo[4].toString());
      console.log('- Total Earned:', ethers.formatEther(userInfo[5]), 'BEER');
      console.log('- Pending Rewards:', ethers.formatEther(userInfo[6]), 'BEER');
      console.log('- Join Time:', new Date(Number(userInfo[7]) * 1000).toLocaleString());
      
      const isTrusted = userInfo[1];
      
      console.log('\n📊 Summary:');
      if (isTrusted) {
        console.log('🎉 YES - This address IS a TRUSTED USER');
        console.log('   ✅ Can approve new user registrations');
        console.log('   ✅ Can earn referral rewards');
        console.log('   ✅ Has special privileges in the system');
      } else {
        console.log('❌ NO - This address is NOT a trusted user');
        console.log('   ❌ Cannot approve new user registrations');
        console.log('   ⚠️  Must be registered by an existing trusted user');
      }
      
    } catch (err) {
      console.log('❌ Error getting user info:', err.message);
      console.log('This usually means the address is not registered in the system yet.');
      
      // Try to get list of all trusted users for comparison
      try {
        console.log('\n🔍 Getting all trusted users...');
        const trustedUsers = await distributorContract.getAllTrustedUsers();
        const totalTrusted = await distributorContract.getTotalTrustedUsers();
        
        console.log(`\n📊 System has ${totalTrusted} trusted users total`);
        
        const isInTrustedList = trustedUsers.some(addr => 
          addr.toLowerCase() === ADDRESS_TO_CHECK.toLowerCase()
        );
        
        if (isInTrustedList) {
          console.log('🎉 YES - Address found in trusted users list!');
        } else {
          console.log('❌ NO - Address NOT found in trusted users list');
          console.log('\n🔍 Current trusted users:');
          trustedUsers.forEach((addr, index) => {
            console.log(`   ${index + 1}. ${addr}`);
          });
        }
        
      } catch (err2) {
        console.log('❌ Error getting trusted users list:', err2.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking trusted status:', error.message);
  }
}

checkTrustedStatus();
