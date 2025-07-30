// Debug script to check why Tina's registration is failing
const { ethers } = require('ethers');

// Contract addresses
const DISTRIBUTOR_ADDRESS = '0x9E6233c16288949728b94FF134db1453AFfa49B4';

// Addresses
const TRUSTED_USER = '0x167B0703Fc797f886Dc914501C9584B809b54758';
const TINA_ADDRESS = '0xb9532ac5bA3CB087A58d436B15B45D2fFBDb1E63'; // Fixed checksum
const TINA_USERNAME = 'tina';

// ABI for debugging
const DISTRIBUTOR_ABI = [
  "function registerUserByTrusted(address userAddress, string memory username) external",
  "function isRegistered(address user) external view returns (bool)",
  "function getUserInfo(address user) external view returns (string memory username, bool isTrusted, bool isActive, address referrer, uint256 referralCount, uint256 totalEarned, uint256 pendingRewards, uint256 joinTime)",
  "function usernameToAddress(string memory username) external view returns (address)",
  "function distributionActive() external view returns (bool)"
];

async function debugRegistration() {
  try {
    console.log('🔍 Debug: Tina Registration Issue');
    console.log('=====================================');
    
    const provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
    const contract = new ethers.Contract(DISTRIBUTOR_ADDRESS, DISTRIBUTOR_ABI, provider);
    
    // 1. Check if distribution is active
    console.log('\n1️⃣ Checking if distribution is active...');
    try {
      const distributionActive = await contract.distributionActive();
      console.log('   Distribution Active:', distributionActive);
      if (!distributionActive) {
        console.log('   ❌ ISSUE: Distribution is not active!');
      }
    } catch (err) {
      console.log('   ❌ Error checking distribution status:', err.message);
    }
    
    // 2. Check trusted user status
    console.log('\n2️⃣ Checking trusted user status...');
    try {
      const trustedUserInfo = await contract.getUserInfo(TRUSTED_USER);
      console.log('   Username:', trustedUserInfo[0] || '(not set)');
      console.log('   Is Trusted:', trustedUserInfo[1]);
      console.log('   Is Active:', trustedUserInfo[2]);
      
      if (!trustedUserInfo[1]) {
        console.log('   ❌ ISSUE: User is not trusted!');
      }
      if (!trustedUserInfo[2]) {
        console.log('   ❌ ISSUE: Trusted user is not active!');
      }
    } catch (err) {
      console.log('   ❌ Error getting trusted user info:', err.message);
    }
    
    // 3. Check if Tina is already registered
    console.log('\n3️⃣ Checking if Tina is already registered...');
    try {
      const isRegistered = await contract.isRegistered(TINA_ADDRESS);
      console.log('   Is Registered:', isRegistered);
      
      if (isRegistered) {
        console.log('   ❌ ISSUE: Tina is already registered!');
        const tinaInfo = await contract.getUserInfo(TINA_ADDRESS);
        console.log('   Current Username:', tinaInfo[0]);
        console.log('   Is Trusted:', tinaInfo[1]);
        console.log('   Is Active:', tinaInfo[2]);
        console.log('   Referrer:', tinaInfo[3]);
      }
    } catch (err) {
      console.log('   ❌ Error checking registration:', err.message);
    }
    
    // 4. Check if username is already taken
    console.log('\n4️⃣ Checking if username "tina" is already taken...');
    try {
      const usernameOwner = await contract.usernameToAddress(TINA_USERNAME);
      console.log('   Username "tina" owned by:', usernameOwner);
      
      if (usernameOwner !== '0x0000000000000000000000000000000000000000') {
        console.log('   ❌ ISSUE: Username "tina" is already taken!');
        
        // Get info about the user who has this username
        const ownerInfo = await contract.getUserInfo(usernameOwner);
        console.log('   Current owner details:');
        console.log('     - Address:', usernameOwner);
        console.log('     - Username:', ownerInfo[0]);
        console.log('     - Is Active:', ownerInfo[2]);
      } else {
        console.log('   ✅ Username "tina" is available');
      }
    } catch (err) {
      console.log('   ❌ Error checking username:', err.message);
    }
    
    // 5. Try different username variations
    console.log('\n5️⃣ Checking alternative usernames...');
    const alternatives = ['Tina', 'TINA', 'tina2', 'tina1'];
    for (const alt of alternatives) {
      try {
        const owner = await contract.usernameToAddress(alt);
        if (owner === '0x0000000000000000000000000000000000000000') {
          console.log(`   ✅ "${alt}" is available`);
        } else {
          console.log(`   ❌ "${alt}" is taken by ${owner}`);
        }
      } catch (err) {
        console.log(`   ❓ Error checking "${alt}":`, err.message);
      }
    }
    
    // 6. Check contract balance (for gas estimation issues)
    console.log('\n6️⃣ Checking contract and user balances...');
    try {
      const contractBalance = await provider.getBalance(DISTRIBUTOR_ADDRESS);
      const trustedUserBalance = await provider.getBalance(TRUSTED_USER);
      const tinaBalance = await provider.getBalance(TINA_ADDRESS);
      
      console.log('   Contract Balance:', ethers.formatEther(contractBalance), 'xDAI');
      console.log('   Trusted User Balance:', ethers.formatEther(trustedUserBalance), 'xDAI');
      console.log('   Tina Balance:', ethers.formatEther(tinaBalance), 'xDAI');
    } catch (err) {
      console.log('   ❌ Error checking balances:', err.message);
    }
    
    console.log('\n📊 Summary:');
    console.log('If all checks above pass, the issue might be:');
    console.log('- Gas limit too low');
    console.log('- Network congestion');
    console.log('- Contract state inconsistency');
    console.log('- Missing modifier requirements not checked above');
    
  } catch (error) {
    console.error('❌ Debug script error:', error.message);
  }
}

debugRegistration();
