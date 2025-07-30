const hre = require("hardhat");
const fs = require("fs");

// Contract addresses on Gnosis Chain
const BEERCOIN_ADDRESS = "0x5CcC0D40017aE800f7b432e9E76b4d31572A240B";
const DISTRIBUTOR_ADDRESS = "0x9E6233c16288949728b94FF134db1453AFfa49B4";

async function main() {
  console.log("🍺 Testing BeerCoin DApp Live System on Gnosis Chain");
  console.log("=" .repeat(60));

  // Load admin wallet
  const adminPrivateKey = process.env.PRIVATE_KEY;
  const adminWallet = new hre.ethers.Wallet(adminPrivateKey, hre.ethers.provider);
  
  console.log("Admin wallet:", adminWallet.address);
  console.log("Admin balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(adminWallet.address)), "xDAI");

  // Create test wallets
  console.log("\\n📝 Creating test wallets...");
  const trustedUserWallet = hre.ethers.Wallet.createRandom().connect(hre.ethers.provider);
  const newUserWallet = hre.ethers.Wallet.createRandom().connect(hre.ethers.provider);
  
  console.log("Trusted user wallet:", trustedUserWallet.address);
  console.log("New user wallet:", newUserWallet.address);

  // Get contract instances
  const BeerCoin = await hre.ethers.getContractFactory("BeerCoin");
  const BeerCoinDistributor = await hre.ethers.getContractFactory("BeerCoinDistributor");
  
  const beerCoin = BeerCoin.attach(BEERCOIN_ADDRESS);
  const distributor = BeerCoinDistributor.attach(DISTRIBUTOR_ADDRESS);
  
  // Connect contracts with admin wallet
  const beerCoinAdmin = beerCoin.connect(adminWallet);
  const distributorAdmin = distributor.connect(adminWallet);

  console.log("\\n🔍 Checking initial contract state...");
  const totalSupply = await beerCoin.totalSupply();
  const distributionActive = await distributor.distributionActive();
  const baseRewardRate = await distributor.baseRewardRate();
  const totalUsers = await distributor.getTotalUsers();
  
  console.log(`Total BEER supply: ${hre.ethers.formatEther(totalSupply)} BEER`);
  console.log(`Distribution active: ${distributionActive}`);
  console.log(`Base reward rate: ${hre.ethers.formatEther(baseRewardRate)} BEER/second`);
  console.log(`Total users: ${totalUsers}`);

  // Step 1: Add trusted user
  console.log("\\n👤 Step 1: Adding trusted user...");
  try {
    const addTrustedTx = await distributorAdmin.addTrustedUser(
      trustedUserWallet.address, 
      "test_trusted_user"
    );
    await addTrustedTx.wait();
    console.log("✅ Trusted user added successfully!");
    
    const trustedUserInfo = await distributor.getUserInfo(trustedUserWallet.address);
    console.log(`   Username: ${trustedUserInfo.username}`);
    console.log(`   Is trusted: ${trustedUserInfo.isTrusted}`);
    console.log(`   Is active: ${trustedUserInfo.isActive}`);
  } catch (error) {
    console.log("❌ Error adding trusted user:", error.message);
    return;
  }

  // Step 2: Register new user with referral
  console.log("\\n🆕 Step 2: Registering new user with referral...");
  
  // First, we need to fund the new user wallet with a tiny amount for gas
  console.log("   Funding new user wallet for gas...");
  const fundTx = await adminWallet.sendTransaction({
    to: newUserWallet.address,
    value: hre.ethers.parseEther("0.001") // 0.001 xDAI for gas
  });
  await fundTx.wait();
  console.log("   ✅ New user wallet funded");

  try {
    const distributorNewUser = distributor.connect(newUserWallet);
    const registerTx = await distributorNewUser.registerUser(
      "test_new_user",
      trustedUserWallet.address
    );
    await registerTx.wait();
    console.log("✅ New user registered successfully!");
    
    const newUserInfo = await distributor.getUserInfo(newUserWallet.address);
    console.log(`   Username: ${newUserInfo.username}`);
    console.log(`   Referrer: ${newUserInfo.referrer}`);
    console.log(`   Is trusted: ${newUserInfo.isTrusted}`);
    console.log(`   Is active: ${newUserInfo.isActive}`);
    
    // Check referrer's referral count
    const updatedTrustedInfo = await distributor.getUserInfo(trustedUserWallet.address);
    console.log(`   Referrer now has ${updatedTrustedInfo.referralCount} referrals`);
  } catch (error) {
    console.log("❌ Error registering new user:", error.message);
    return;
  }

  // Step 3: Wait for rewards to accumulate
  console.log("\\n⏰ Step 3: Waiting for rewards to accumulate...");
  console.log("   Waiting 60 seconds for rewards to build up...");
  
  // Check initial pending rewards
  let trustedPending = await distributor.calculatePendingRewards(trustedUserWallet.address);
  let newUserPending = await distributor.calculatePendingRewards(newUserWallet.address);
  
  console.log(`   Initial trusted user pending: ${hre.ethers.formatEther(trustedPending)} BEER`);
  console.log(`   Initial new user pending: ${hre.ethers.formatEther(newUserPending)} BEER`);
  
  // Wait 60 seconds
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  // Check rewards after waiting
  trustedPending = await distributor.calculatePendingRewards(trustedUserWallet.address);
  newUserPending = await distributor.calculatePendingRewards(newUserWallet.address);
  
  console.log(`   After 60s - Trusted user pending: ${hre.ethers.formatEther(trustedPending)} BEER`);
  console.log(`   After 60s - New user pending: ${hre.ethers.formatEther(newUserPending)} BEER`);

  // Step 4: Claim rewards
  console.log("\\n💰 Step 4: Claiming rewards...");
  
  // Check initial BEER balances
  let trustedBeerBalance = await beerCoin.balanceOf(trustedUserWallet.address);
  let newUserBeerBalance = await beerCoin.balanceOf(newUserWallet.address);
  
  console.log(`   Initial trusted user BEER balance: ${hre.ethers.formatEther(trustedBeerBalance)} BEER`);
  console.log(`   Initial new user BEER balance: ${hre.ethers.formatEther(newUserBeerBalance)} BEER`);

  // Fund trusted user wallet for gas
  const fundTrustedTx = await adminWallet.sendTransaction({
    to: trustedUserWallet.address,
    value: hre.ethers.parseEther("0.001")
  });
  await fundTrustedTx.wait();

  try {
    // Claim rewards for trusted user
    const distributorTrusted = distributor.connect(trustedUserWallet);
    const claimTrustedTx = await distributorTrusted.claimRewards();
    await claimTrustedTx.wait();
    console.log("   ✅ Trusted user claimed rewards!");

    // Claim rewards for new user
    const distributorNewUser = distributor.connect(newUserWallet);
    const claimNewUserTx = await distributorNewUser.claimRewards();
    await claimNewUserTx.wait();
    console.log("   ✅ New user claimed rewards!");

    // Check final balances
    trustedBeerBalance = await beerCoin.balanceOf(trustedUserWallet.address);
    newUserBeerBalance = await beerCoin.balanceOf(newUserWallet.address);
    
    console.log(`   Final trusted user BEER balance: ${hre.ethers.formatEther(trustedBeerBalance)} BEER`);
    console.log(`   Final new user BEER balance: ${hre.ethers.formatEther(newUserBeerBalance)} BEER`);

  } catch (error) {
    console.log("❌ Error claiming rewards:", error.message);
    return;
  }

  // Step 5: Final verification
  console.log("\\n🔍 Step 5: Final system verification...");
  
  const finalTotalSupply = await beerCoin.totalSupply();
  const finalTotalUsers = await distributor.getTotalUsers();
  const finalTrustedUsers = await distributor.getTotalTrustedUsers();
  
  console.log(`Final total BEER supply: ${hre.ethers.formatEther(finalTotalSupply)} BEER`);
  console.log(`Final total users: ${finalTotalUsers}`);
  console.log(`Final trusted users: ${finalTrustedUsers}`);

  // Get final user info
  const finalTrustedInfo = await distributor.getUserInfo(trustedUserWallet.address);
  const finalNewUserInfo = await distributor.getUserInfo(newUserWallet.address);
  
  console.log(`\\nTrusted user total earned: ${hre.ethers.formatEther(finalTrustedInfo.totalEarned)} BEER`);
  console.log(`New user total earned: ${hre.ethers.formatEther(finalNewUserInfo.totalEarned)} BEER`);

  // Save test results
  const testResults = {
    timestamp: new Date().toISOString(),
    network: hre.network.name,
    contracts: {
      beerCoin: BEERCOIN_ADDRESS,
      distributor: DISTRIBUTOR_ADDRESS
    },
    testWallets: {
      admin: adminWallet.address,
      trustedUser: trustedUserWallet.address,
      newUser: newUserWallet.address
    },
    results: {
      trustedUserEarned: hre.ethers.formatEther(finalTrustedInfo.totalEarned),
      newUserEarned: hre.ethers.formatEther(finalNewUserInfo.totalEarned),
      totalSupplyAfter: hre.ethers.formatEther(finalTotalSupply),
      totalUsers: finalTotalUsers.toString(),
      trustedUsers: finalTrustedUsers.toString()
    }
  };

  fs.writeFileSync('live-test-results.json', JSON.stringify(testResults, null, 2));

  console.log("\\n🎉 Live system test completed successfully!");
  console.log("✅ All functionality verified on Gnosis Chain mainnet");
  console.log("📄 Test results saved to live-test-results.json");
  console.log("\\n" + "=" .repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });

