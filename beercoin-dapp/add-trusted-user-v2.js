const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('🔧 Adding Trusted User to BeerCoin V2...\n');

  try {
    // Get the admin signer
    const [adminWallet] = await ethers.getSigners();
    console.log('Admin wallet:', adminWallet.address);
    
    // Contract address
    const distributorAddress = '0xFB8E611686F21eC845AeD71F8ed942cA3C1150d9';
    
    // Get contract instance
    const distributor = await ethers.getContractAt('BeerCoinDistributorV2', distributorAddress, adminWallet);
    
    // User to make trusted
    const userAddress = '0x167B0703Fc797f886Dc914501C9584B809b54758';
    const username = 'trusted_user_2';
    
    console.log('Adding trusted user:', userAddress);
    console.log('Username:', username);
    
    // Check if user is already registered
    const isRegistered = await distributor.isRegistered(userAddress);
    console.log('User already registered:', isRegistered);
    
    if (isRegistered) {
      const userInfo = await distributor.getUserInfo(userAddress);
      console.log('Current user info:', {
        username: userInfo.username,
        isTrusted: userInfo.isTrusted,
        isActive: userInfo.isActive
      });
      
      if (userInfo.isTrusted) {
        console.log('✅ User is already a trusted user!');
        return;
      }
    }
    
    // Add as trusted user
    console.log('\nAdding as trusted user...');
    const tx = await distributor.addTrustedUser(userAddress, username);
    console.log('Transaction hash:', tx.hash);
    
    console.log('Waiting for confirmation...');
    await tx.wait();
    console.log('✅ Transaction confirmed!');
    
    // Verify the user was added
    const userInfo = await distributor.getUserInfo(userAddress);
    console.log('\nUser info after adding:', {
      username: userInfo.username,
      isTrusted: userInfo.isTrusted,
      isActive: userInfo.isActive,
      referralCount: Number(userInfo.referralCount)
    });
    
    // Get updated stats
    const totalTrustedUsers = await distributor.getTotalTrustedUsers();
    console.log('Total trusted users:', Number(totalTrustedUsers));
    
    console.log('\n🎉 Successfully added trusted user!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error.message.includes('Username already taken')) {
      console.log('\n💡 Username already taken. Let me try with a different username...');
      
      // Try with a different username
      const alternativeUsername = 'trusted_user_alt_' + Date.now();
      console.log('Trying with username:', alternativeUsername);
      
      try {
        const [adminWallet] = await ethers.getSigners();
        const distributor = await ethers.getContractAt('BeerCoinDistributorV2', '0xFB8E611686F21eC845AeD71F8ed942cA3C1150d9', adminWallet);
        
        const tx = await distributor.addTrustedUser('0x167B0703Fc797f886Dc914501C9584B809b54758', alternativeUsername);
        await tx.wait();
        console.log('✅ Successfully added with alternative username!');
      } catch (altError) {
        console.error('❌ Alternative attempt failed:', altError.message);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

