const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 Debugging Username Availability...\n');

  try {
    // Get the admin signer
    const [adminWallet] = await ethers.getSigners();
    console.log('Admin wallet:', adminWallet.address);
    
    // Contract address
    const distributorAddress = '0xFB8E611686F21eC845AeD71F8ed942cA3C1150d9';
    
    // Get contract instance
    const distributor = await ethers.getContractAt('BeerCoinDistributorV2', distributorAddress);
    
    console.log('Contract address:', distributorAddress);
    
    // Test various usernames
    const testUsernames = [
      'admin',
      'trusted_user_2', 
      'newuser123',
      'testuser',
      'alice',
      'bob',
      'charlie',
      'randomuser' + Date.now()
    ];
    
    console.log('Testing username availability...\n');
    
    for (const username of testUsernames) {
      try {
        const isAvailable = await distributor.isUsernameAvailable(username);
        console.log(`"${username}": ${isAvailable ? '✅ Available' : '❌ Not Available'}`);
        
        // If not available, check who owns it
        if (!isAvailable) {
          try {
            const ownerAddress = await distributor.usernameToAddress(username);
            console.log(`  → Owned by: ${ownerAddress}`);
          } catch (err) {
            console.log(`  → Error getting owner: ${err.message}`);
          }
        }
      } catch (error) {
        console.log(`"${username}": ❌ Error - ${error.message}`);
      }
    }
    
    // Check contract state
    console.log('\n📊 Contract State:');
    const totalUsers = await distributor.getTotalUsers();
    const totalTrustedUsers = await distributor.getTotalTrustedUsers();
    console.log('Total Users:', Number(totalUsers));
    console.log('Total Trusted Users:', Number(totalTrustedUsers));
    
    // Check if the contract service is working correctly
    console.log('\n🔧 Testing Contract Service Logic...');
    
    // Test the exact function call that the web app makes
    const testUsername = 'testuser123';
    console.log(`Testing "${testUsername}" directly...`);
    
    try {
      // This is the exact call the web app makes
      const result = await distributor.isUsernameAvailable(testUsername);
      console.log('Direct call result:', result);
      console.log('Type of result:', typeof result);
      console.log('Boolean conversion:', Boolean(result));
    } catch (error) {
      console.log('Direct call error:', error.message);
    }
    
    // Check if there's an issue with the contract function
    console.log('\n🔍 Checking Contract Function...');
    try {
      const contractCode = await ethers.provider.getCode(distributorAddress);
      console.log('Contract has code:', contractCode !== '0x');
      
      // Try to call the function with different approaches
      const callData = distributor.interface.encodeFunctionData('isUsernameAvailable', [testUsername]);
      console.log('Call data encoded successfully');
      
      const result = await ethers.provider.call({
        to: distributorAddress,
        data: callData
      });
      
      const decoded = distributor.interface.decodeFunctionResult('isUsernameAvailable', result);
      console.log('Raw provider call result:', decoded[0]);
      
    } catch (error) {
      console.log('Contract function check error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

