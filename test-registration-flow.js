// Comprehensive test script for BeerCoin registration flow
const { ethers } = require('ethers');
const fs = require('fs');

// Load admin wallet info from environment variable
// For security, use environment variable instead of hardcoded file path
const adminPrivateKey = process.env.PRIVATE_KEY;
if (!adminPrivateKey) {
  console.error('PRIVATE_KEY environment variable not set');
  process.exit(1);
}

// Contract addresses
const DISTRIBUTOR_ADDRESS = '0x9E6233c16288949728b94FF134db1453AFfa49B4';
const BEERCOIN_ADDRESS = '0x5CcC0D40017aE800f7b432e9E76b4d31572A240B';

// ABI for the contracts
const DISTRIBUTOR_ABI = [
  "function addTrustedUser(address user, string memory username) external",
  "function registerUser(string memory username, address referrer) external",
  "function isTrusted(address user) external view returns (bool)",
  "function isRegistered(address user) external view returns (bool)",
  "function getUserInfo(address user) external view returns (string memory username, bool isTrusted, bool isActive, address referrer, uint256 referralCount, uint256 totalEarned, uint256 pendingRewards, uint256 joinTime)",
  "function calculatePendingRewards(address user) external view returns (uint256)",
  "function claimRewards() external"
];

const BEERCOIN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)"
];

// Test parameters
const TEST_USER_1_USERNAME = "test_trusted_user";
const TEST_USER_2_USERNAME = "test_new_user";
const WAIT_TIME_SECONDS = 60; // Time to wait for rewards to accumulate

// Helper function to wait for a specified number of seconds
function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// Helper function to format addresses
function formatAddress(address) {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Helper function to format token amounts
function formatTokens(amount) {
  return ethers.formatEther(amount);
}

async function main() {
  try {
    console.log("=== BEERCOIN REGISTRATION FLOW TEST ===");
    
    // Connect to Gnosis Chain
    const provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
    
    // Create admin wallet instance
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    console.log(`\n[1] Using admin wallet: ${adminWallet.address}`);
    
    // Check admin wallet balance
    const adminBalance = await provider.getBalance(adminWallet.address);
    console.log(`Admin wallet balance: ${formatTokens(adminBalance)} xDAI`);
    
    if (adminBalance < ethers.parseEther('0.03')) {
      console.error('Insufficient balance to perform test');
      return;
    }
    
    // Connect to contracts with admin wallet
    const distributorContract = new ethers.Contract(
      DISTRIBUTOR_ADDRESS,
      DISTRIBUTOR_ABI,
      adminWallet
    );
    
    const beerCoinContract = new ethers.Contract(
      BEERCOIN_ADDRESS,
      BEERCOIN_ABI,
      adminWallet
    );
    
    // Create test wallets
    console.log("\n[2] Creating test wallets...");
    const testWallet1 = ethers.Wallet.createRandom().connect(provider);
    const testWallet2 = ethers.Wallet.createRandom().connect(provider);
    
    console.log(`Test Wallet 1 (Trusted User): ${testWallet1.address}`);
    console.log(`Test Wallet 2 (New User): ${testWallet2.address}`);
    
    // Save test wallet info to file
    const testWalletInfo = {
      trustedUser: {
        address: testWallet1.address,
        privateKey: testWallet1.privateKey
      },
      newUser: {
        address: testWallet2.address,
        privateKey: testWallet2.privateKey
      }
    };
    fs.writeFileSync('./test-wallets.json', JSON.stringify(testWalletInfo, null, 2));
    console.log("Test wallet info saved to ./test-wallets.json");
    
    // Fund test wallets
    console.log("\n[3] Funding test wallets...");
    
    console.log(`Sending 0.01 xDAI to Test Wallet 1...`);
    const tx1 = await adminWallet.sendTransaction({
      to: testWallet1.address,
      value: ethers.parseEther('0.01')
    });
    await tx1.wait();
    console.log(`Transaction confirmed: ${tx1.hash}`);
    
    console.log(`Sending 0.01 xDAI to Test Wallet 2...`);
    const tx2 = await adminWallet.sendTransaction({
      to: testWallet2.address,
      value: ethers.parseEther('0.01')
    });
    await tx2.wait();
    console.log(`Transaction confirmed: ${tx2.hash}`);
    
    // Add Test Wallet 1 as trusted user
    console.log("\n[4] Adding Test Wallet 1 as trusted user...");
    const tx3 = await distributorContract.addTrustedUser(testWallet1.address, TEST_USER_1_USERNAME);
    await tx3.wait();
    console.log(`Transaction confirmed: ${tx3.hash}`);
    
    // Verify trusted status
    const isTrusted = await distributorContract.isTrusted(testWallet1.address);
    console.log(`Is Test Wallet 1 trusted? ${isTrusted}`);
    
    if (!isTrusted) {
      console.error("Failed to add trusted user");
      return;
    }
    
    // Connect distributor contract with Test Wallet 2
    const distributorContractWallet2 = new ethers.Contract(
      DISTRIBUTOR_ADDRESS,
      DISTRIBUTOR_ABI,
      testWallet2.connect(provider)
    );
    
    // Register Test Wallet 2 with Test Wallet 1 as referrer
    console.log("\n[5] Registering Test Wallet 2 with Test Wallet 1 as referrer...");
    const tx4 = await distributorContractWallet2.registerUser(TEST_USER_2_USERNAME, testWallet1.address);
    await tx4.wait();
    console.log(`Transaction confirmed: ${tx4.hash}`);
    
    // Verify registration
    const isRegistered = await distributorContract.isRegistered(testWallet2.address);
    console.log(`Is Test Wallet 2 registered? ${isRegistered}`);
    
    if (!isRegistered) {
      console.error("Failed to register new user");
      return;
    }
    
    // Get user info
    const user1Info = await distributorContract.getUserInfo(testWallet1.address);
    const user2Info = await distributorContract.getUserInfo(testWallet2.address);
    
    console.log("\n[6] User Information:");
    console.log(`\nTrusted User (${formatAddress(testWallet1.address)}):`);
    console.log(`- Username: ${user1Info[0]}`);
    console.log(`- Is Trusted: ${user1Info[1]}`);
    console.log(`- Is Active: ${user1Info[2]}`);
    console.log(`- Referrer: ${formatAddress(user1Info[3])}`);
    console.log(`- Referral Count: ${user1Info[4]}`);
    console.log(`- Total Earned: ${formatTokens(user1Info[5])} BEER`);
    console.log(`- Pending Rewards: ${formatTokens(user1Info[6])} BEER`);
    
    console.log(`\nNew User (${formatAddress(testWallet2.address)}):`);
    console.log(`- Username: ${user2Info[0]}`);
    console.log(`- Is Trusted: ${user2Info[1]}`);
    console.log(`- Is Active: ${user2Info[2]}`);
    console.log(`- Referrer: ${formatAddress(user2Info[3])}`);
    console.log(`- Referral Count: ${user2Info[4]}`);
    console.log(`- Total Earned: ${formatTokens(user2Info[5])} BEER`);
    console.log(`- Pending Rewards: ${formatTokens(user2Info[6])} BEER`);
    
    // Wait for rewards to accumulate
    console.log(`\n[7] Waiting ${WAIT_TIME_SECONDS} seconds for rewards to accumulate...`);
    await sleep(WAIT_TIME_SECONDS);
    
    // Check pending rewards after waiting
    const user1PendingRewards = await distributorContract.calculatePendingRewards(testWallet1.address);
    const user2PendingRewards = await distributorContract.calculatePendingRewards(testWallet2.address);
    
    console.log("\n[8] Pending Rewards After Waiting:");
    console.log(`Trusted User: ${formatTokens(user1PendingRewards)} BEER`);
    console.log(`New User: ${formatTokens(user2PendingRewards)} BEER`);
    
    // Connect distributor contract with Test Wallet 1
    const distributorContractWallet1 = new ethers.Contract(
      DISTRIBUTOR_ADDRESS,
      DISTRIBUTOR_ABI,
      testWallet1.connect(provider)
    );
    
    // Claim rewards for both users
    console.log("\n[9] Claiming rewards for both users...");
    
    console.log("Claiming rewards for Trusted User...");
    const tx5 = await distributorContractWallet1.claimRewards();
    await tx5.wait();
    console.log(`Transaction confirmed: ${tx5.hash}`);
    
    console.log("Claiming rewards for New User...");
    const tx6 = await distributorContractWallet2.claimRewards();
    await tx6.wait();
    console.log(`Transaction confirmed: ${tx6.hash}`);
    
    // Check balances after claiming
    const beerCoinContractWallet1 = new ethers.Contract(
      BEERCOIN_ADDRESS,
      BEERCOIN_ABI,
      testWallet1.connect(provider)
    );
    
    const beerCoinContractWallet2 = new ethers.Contract(
      BEERCOIN_ADDRESS,
      BEERCOIN_ABI,
      testWallet2.connect(provider)
    );
    
    const user1Balance = await beerCoinContractWallet1.balanceOf(testWallet1.address);
    const user2Balance = await beerCoinContractWallet2.balanceOf(testWallet2.address);
    
    console.log("\n[10] BEER Balances After Claiming:");
    console.log(`Trusted User: ${formatTokens(user1Balance)} BEER`);
    console.log(`New User: ${formatTokens(user2Balance)} BEER`);
    
    // Get updated user info
    const updatedUser1Info = await distributorContract.getUserInfo(testWallet1.address);
    const updatedUser2Info = await distributorContract.getUserInfo(testWallet2.address);
    
    console.log("\n[11] Updated User Information:");
    console.log(`\nTrusted User (${formatAddress(testWallet1.address)}):`);
    console.log(`- Total Earned: ${formatTokens(updatedUser1Info[5])} BEER`);
    console.log(`- Pending Rewards: ${formatTokens(updatedUser1Info[6])} BEER`);
    
    console.log(`\nNew User (${formatAddress(testWallet2.address)}):`);
    console.log(`- Total Earned: ${formatTokens(updatedUser2Info[5])} BEER`);
    console.log(`- Pending Rewards: ${formatTokens(updatedUser2Info[6])} BEER`);
    
    // Save test results to file
    const testResults = {
      trustedUser: {
        address: testWallet1.address,
        username: user1Info[0],
        isTrusted: user1Info[1],
        referralCount: Number(user1Info[4]),
        initialPendingRewards: formatTokens(user1Info[6]),
        pendingRewardsAfterWaiting: formatTokens(user1PendingRewards),
        finalBalance: formatTokens(user1Balance),
        totalEarned: formatTokens(updatedUser1Info[5])
      },
      newUser: {
        address: testWallet2.address,
        username: user2Info[0],
        isTrusted: user2Info[1],
        referrer: user2Info[3],
        initialPendingRewards: formatTokens(user2Info[6]),
        pendingRewardsAfterWaiting: formatTokens(user2PendingRewards),
        finalBalance: formatTokens(user2Balance),
        totalEarned: formatTokens(updatedUser2Info[5])
      },
      testParameters: {
        waitTimeSeconds: WAIT_TIME_SECONDS
      },
      transactions: {
        fundTrustedUser: tx1.hash,
        fundNewUser: tx2.hash,
        addTrustedUser: tx3.hash,
        registerNewUser: tx4.hash,
        trustedUserClaimRewards: tx5.hash,
        newUserClaimRewards: tx6.hash
      }
    };
    
    fs.writeFileSync('./test-results.json', JSON.stringify(testResults, null, 2));
    console.log("\nTest results saved to ./test-results.json");
    
    console.log("\n=== TEST COMPLETED SUCCESSFULLY ===");
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

