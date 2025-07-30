const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BeerCoin DApp Integration Test", function () {
  let beerCoin;
  let distributor;
  let owner;
  let trustedUser1;
  let user1;
  let user2;

  before(async function () {
    [owner, trustedUser1, user1, user2] = await ethers.getSigners();

    // Deploy BeerCoin
    const BeerCoin = await ethers.getContractFactory("BeerCoin");
    beerCoin = await BeerCoin.deploy(owner.address);

    // Deploy BeerCoinDistributor
    const BeerCoinDistributor = await ethers.getContractFactory("BeerCoinDistributor");
    distributor = await BeerCoinDistributor.deploy(beerCoin.target, owner.address);

    // Transfer ownership of BeerCoin to distributor
    await beerCoin.transferOwnership(distributor.target);

    console.log("BeerCoin deployed to:", beerCoin.target);
    console.log("BeerCoinDistributor deployed to:", distributor.target);
  });

  it("Should complete full user journey", async function () {
    console.log("\\n=== Starting Full User Journey Test ===");

    // Step 1: Admin adds trusted user
    console.log("\\n1. Adding trusted user...");
    await distributor.addTrustedUser(trustedUser1.address, "trusted_alice");
    
    let trustedInfo = await distributor.getUserInfo(trustedUser1.address);
    console.log(`   Trusted user created: ${trustedInfo.username} (${trustedUser1.address})`);
    expect(trustedInfo.isTrusted).to.equal(true);

    // Step 2: Regular user registers with referral
    console.log("\\n2. Regular user registering with referral...");
    await distributor.connect(user1).registerUser("user_bob", trustedUser1.address);
    
    let userInfo = await distributor.getUserInfo(user1.address);
    console.log(`   User registered: ${userInfo.username} (${user1.address})`);
    console.log(`   Referred by: ${userInfo.referrer}`);
    expect(userInfo.referrer).to.equal(trustedUser1.address);

    // Step 3: Check referrer's referral count increased
    trustedInfo = await distributor.getUserInfo(trustedUser1.address);
    console.log(`   Referrer now has ${trustedInfo.referralCount} referrals`);
    expect(trustedInfo.referralCount).to.equal(1);

    // Step 4: Add another user to test multiplier
    console.log("\\n3. Adding second user to test referral multiplier...");
    await distributor.connect(user2).registerUser("user_charlie", trustedUser1.address);
    
    trustedInfo = await distributor.getUserInfo(trustedUser1.address);
    console.log(`   Referrer now has ${trustedInfo.referralCount} referrals`);
    expect(trustedInfo.referralCount).to.equal(2);

    // Step 5: Fast forward time and check rewards
    console.log("\\n4. Fast forwarding 3600 seconds (1 hour) to accumulate rewards...");
    await time.increase(3600);

    const user1Pending = await distributor.calculatePendingRewards(user1.address);
    const trustedPending = await distributor.calculatePendingRewards(trustedUser1.address);
    
    console.log(`   User1 pending rewards: ${ethers.formatEther(user1Pending)} BEER`);
    console.log(`   Trusted user pending rewards: ${ethers.formatEther(trustedPending)} BEER`);
    
    // Trusted user should have more rewards due to referral multiplier
    expect(trustedPending).to.be.greaterThan(user1Pending);

    // Step 6: Users claim their rewards
    console.log("\\n5. Users claiming rewards...");
    
    const user1BalanceBefore = await beerCoin.balanceOf(user1.address);
    await distributor.connect(user1).claimRewards();
    const user1BalanceAfter = await beerCoin.balanceOf(user1.address);
    
    const trustedBalanceBefore = await beerCoin.balanceOf(trustedUser1.address);
    await distributor.connect(trustedUser1).claimRewards();
    const trustedBalanceAfter = await beerCoin.balanceOf(trustedUser1.address);
    
    console.log(`   User1 claimed: ${ethers.formatEther(user1BalanceAfter - user1BalanceBefore)} BEER`);
    console.log(`   Trusted user claimed: ${ethers.formatEther(trustedBalanceAfter - trustedBalanceBefore)} BEER`);
    
    expect(user1BalanceAfter).to.be.greaterThan(user1BalanceBefore);
    expect(trustedBalanceAfter).to.be.greaterThan(trustedBalanceBefore);

    // Step 7: Test admin functions
    console.log("\\n6. Testing admin functions...");
    
    // Update reward rate
    const newRate = ethers.parseEther("0.002"); // 0.002 BEER per second
    await distributor.updateRewardRate(newRate);
    console.log(`   Updated reward rate to: ${ethers.formatEther(newRate)} BEER/second`);
    
    // Test distribution toggle
    await distributor.toggleDistribution();
    console.log("   Distribution paused");
    expect(await distributor.distributionActive()).to.equal(false);
    
    await distributor.toggleDistribution();
    console.log("   Distribution resumed");
    expect(await distributor.distributionActive()).to.equal(true);

    // Step 8: Test with new reward rate
    console.log("\\n7. Testing with new reward rate...");
    await time.increase(1800); // 30 minutes
    
    const user1NewPending = await distributor.calculatePendingRewards(user1.address);
    console.log(`   User1 pending with new rate: ${ethers.formatEther(user1NewPending)} BEER`);
    
    // Should have rewards based on new rate
    expect(user1NewPending).to.be.greaterThan(0);

    // Step 9: Display final statistics
    console.log("\\n=== Final Statistics ===");
    const totalUsers = await distributor.getTotalUsers();
    const totalTrusted = await distributor.getTotalTrustedUsers();
    const beerCoinTotalSupply = await beerCoin.totalSupply();
    
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Total trusted users: ${totalTrusted}`);
    console.log(`   Total BEER supply: ${ethers.formatEther(beerCoinTotalSupply)} BEER`);
    
    const finalUser1Info = await distributor.getUserInfo(user1.address);
    const finalTrustedInfo = await distributor.getUserInfo(trustedUser1.address);
    
    console.log(`   User1 total earned: ${ethers.formatEther(finalUser1Info.totalEarned)} BEER`);
    console.log(`   Trusted user total earned: ${ethers.formatEther(finalTrustedInfo.totalEarned)} BEER`);
    
    console.log("\\n=== Integration Test Complete ===");
  });

  it("Should handle edge cases properly", async function () {
    console.log("\\n=== Testing Edge Cases ===");

    // Test kicking a user
    console.log("\\n1. Testing user kick functionality...");
    await distributor.kickUser(user2.address);
    
    const kickedUserInfo = await distributor.getUserInfo(user2.address);
    console.log(`   User ${kickedUserInfo.username} kicked - Active: ${kickedUserInfo.isActive}`);
    expect(kickedUserInfo.isActive).to.equal(false);

    // Test that kicked user cannot claim rewards
    await time.increase(1000);
    const kickedUserPending = await distributor.calculatePendingRewards(user2.address);
    console.log(`   Kicked user pending rewards: ${ethers.formatEther(kickedUserPending)} BEER`);
    expect(kickedUserPending).to.equal(0);

    // Test removing trusted status
    console.log("\\n2. Testing trusted user removal...");
    await distributor.removeTrustedUser(trustedUser1.address);
    
    const untrustedInfo = await distributor.getUserInfo(trustedUser1.address);
    console.log(`   User ${untrustedInfo.username} untrusted - Trusted: ${untrustedInfo.isTrusted}`);
    expect(untrustedInfo.isTrusted).to.equal(false);

    console.log("\\n=== Edge Cases Test Complete ===");
  });
});

