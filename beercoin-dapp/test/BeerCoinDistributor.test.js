const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BeerCoinDistributor", function () {
  let beerCoin;
  let distributor;
  let owner;
  let trustedUser1;
  let trustedUser2;
  let user1;
  let user2;
  let user3;
  let addrs;

  beforeEach(async function () {
    [owner, trustedUser1, trustedUser2, user1, user2, user3, ...addrs] = await ethers.getSigners();

    // Deploy BeerCoin
    const BeerCoin = await ethers.getContractFactory("BeerCoin");
    beerCoin = await BeerCoin.deploy(owner.address);

    // Deploy BeerCoinDistributor
    const BeerCoinDistributor = await ethers.getContractFactory("BeerCoinDistributor");
    distributor = await BeerCoinDistributor.deploy(beerCoin.target, owner.address);

    // Transfer ownership of BeerCoin to distributor so it can mint tokens
    await beerCoin.transferOwnership(distributor.target);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await distributor.owner()).to.equal(owner.address);
    });

    it("Should set the right BeerCoin address", async function () {
      expect(await distributor.beerCoin()).to.equal(beerCoin.target);
    });

    it("Should have distribution active by default", async function () {
      expect(await distributor.distributionActive()).to.equal(true);
    });

    it("Should have correct default parameters", async function () {
      expect(await distributor.baseRewardRate()).to.equal(ethers.parseEther("0.001"));
      expect(await distributor.referrerMultiplier()).to.equal(150);
    });
  });

  describe("Trusted User Management", function () {
    it("Should allow owner to add trusted users", async function () {
      await distributor.addTrustedUser(trustedUser1.address, "trusted1");
      
      const userInfo = await distributor.getUserInfo(trustedUser1.address);
      expect(userInfo.username).to.equal("trusted1");
      expect(userInfo.isTrusted).to.equal(true);
      expect(userInfo.isActive).to.equal(true);
    });

    it("Should not allow non-owner to add trusted users", async function () {
      await expect(
        distributor.connect(user1).addTrustedUser(trustedUser1.address, "trusted1")
      ).to.be.revertedWithCustomError(distributor, "OwnableUnauthorizedAccount");
    });

    it("Should not allow duplicate usernames", async function () {
      await distributor.addTrustedUser(trustedUser1.address, "trusted1");
      
      await expect(
        distributor.addTrustedUser(trustedUser2.address, "trusted1")
      ).to.be.revertedWith("Username already taken");
    });

    it("Should allow owner to remove trusted status", async function () {
      await distributor.addTrustedUser(trustedUser1.address, "trusted1");
      await distributor.removeTrustedUser(trustedUser1.address);
      
      const userInfo = await distributor.getUserInfo(trustedUser1.address);
      expect(userInfo.isTrusted).to.equal(false);
    });

    it("Should emit events for trusted user operations", async function () {
      await expect(distributor.addTrustedUser(trustedUser1.address, "trusted1"))
        .to.emit(distributor, "UserTrusted")
        .withArgs(trustedUser1.address, "trusted1");
        
      await expect(distributor.removeTrustedUser(trustedUser1.address))
        .to.emit(distributor, "UserUntrusted")
        .withArgs(trustedUser1.address, "trusted1");
    });
  });

  describe("User Registration", function () {
    beforeEach(async function () {
      // Add a trusted user for referrals
      await distributor.addTrustedUser(trustedUser1.address, "trusted1");
    });

    it("Should allow users to register with trusted referrer", async function () {
      await distributor.connect(user1).registerUser("user1", trustedUser1.address);
      
      const userInfo = await distributor.getUserInfo(user1.address);
      expect(userInfo.username).to.equal("user1");
      expect(userInfo.isTrusted).to.equal(false);
      expect(userInfo.isActive).to.equal(true);
      expect(userInfo.referrer).to.equal(trustedUser1.address);
    });

    it("Should update referrer's referral count", async function () {
      await distributor.connect(user1).registerUser("user1", trustedUser1.address);
      
      const referrerInfo = await distributor.getUserInfo(trustedUser1.address);
      expect(referrerInfo.referralCount).to.equal(1);
    });

    it("Should not allow registration without trusted referrer", async function () {
      await expect(
        distributor.connect(user1).registerUser("user1", user2.address)
      ).to.be.revertedWith("Referrer must be trusted");
    });

    it("Should not allow self-referral", async function () {
      await expect(
        distributor.connect(trustedUser1).registerUser("trusted1", trustedUser1.address)
      ).to.be.revertedWith("Cannot refer yourself");
    });

    it("Should not allow duplicate registration", async function () {
      await distributor.connect(user1).registerUser("user1", trustedUser1.address);
      
      await expect(
        distributor.connect(user1).registerUser("user1_new", trustedUser1.address)
      ).to.be.revertedWith("User already registered");
    });

    it("Should emit UserRegistered event", async function () {
      await expect(distributor.connect(user1).registerUser("user1", trustedUser1.address))
        .to.emit(distributor, "UserRegistered")
        .withArgs(user1.address, "user1", trustedUser1.address);
    });
  });

  describe("Reward Calculation and Claims", function () {
    beforeEach(async function () {
      // Setup trusted user and regular user
      await distributor.addTrustedUser(trustedUser1.address, "trusted1");
      await distributor.connect(user1).registerUser("user1", trustedUser1.address);
    });

    it("Should calculate correct base rewards", async function () {
      // Fast forward 1000 seconds
      await time.increase(1000);
      
      const pendingRewards = await distributor.calculatePendingRewards(user1.address);
      const expectedRewards = ethers.parseEther("0.001") * BigInt(1000); // 1000 seconds * 0.001 BEER/second
      
      expect(pendingRewards).to.be.closeTo(expectedRewards, ethers.parseEther("0.01"));
    });

    it("Should calculate correct referral bonus", async function () {
      // Add another user referred by trustedUser1
      await distributor.connect(user2).registerUser("user2", trustedUser1.address);
      
      // Fast forward 1000 seconds
      await time.increase(1000);
      
      const pendingRewards = await distributor.calculatePendingRewards(trustedUser1.address);
      const baseReward = ethers.parseEther("0.001") * BigInt(1000);
      const referralBonus = (baseReward * BigInt(150) * BigInt(2)) / BigInt(100); // 2 referrals, 1.5x multiplier
      const expectedRewards = baseReward + referralBonus;
      
      expect(pendingRewards).to.be.closeTo(expectedRewards, ethers.parseEther("0.01"));
    });

    it("Should allow users to claim rewards", async function () {
      // Fast forward 1000 seconds
      await time.increase(1000);
      
      const initialBalance = await beerCoin.balanceOf(user1.address);
      await distributor.connect(user1).claimRewards();
      const finalBalance = await beerCoin.balanceOf(user1.address);
      
      expect(finalBalance).to.be.greaterThan(initialBalance);
    });

    it("Should update user's total earned after claim", async function () {
      // Fast forward 1000 seconds
      await time.increase(1000);
      
      const pendingBefore = await distributor.calculatePendingRewards(user1.address);
      await distributor.connect(user1).claimRewards();
      
      const userInfo = await distributor.getUserInfo(user1.address);
      expect(userInfo.totalEarned).to.be.closeTo(pendingBefore, ethers.parseEther("0.01"));
    });

    it("Should reset pending rewards after claim", async function () {
      // Fast forward 1000 seconds
      await time.increase(1000);
      
      await distributor.connect(user1).claimRewards();
      const pendingAfter = await distributor.calculatePendingRewards(user1.address);
      
      expect(pendingAfter).to.equal(0);
    });

    it("Should emit TokensClaimed event", async function () {
      // Fast forward 1000 seconds
      await time.increase(1000);
      
      const pendingRewards = await distributor.calculatePendingRewards(user1.address);
      
      await expect(distributor.connect(user1).claimRewards())
        .to.emit(distributor, "TokensClaimed")
        .withArgs(user1.address, pendingRewards);
    });
  });

  describe("Admin Functions", function () {
    beforeEach(async function () {
      await distributor.addTrustedUser(trustedUser1.address, "trusted1");
      await distributor.connect(user1).registerUser("user1", trustedUser1.address);
    });

    it("Should allow owner to kick users", async function () {
      await distributor.kickUser(user1.address);
      
      const userInfo = await distributor.getUserInfo(user1.address);
      expect(userInfo.isActive).to.equal(false);
    });

    it("Should allow owner to toggle distribution", async function () {
      await distributor.toggleDistribution();
      expect(await distributor.distributionActive()).to.equal(false);
      
      await distributor.toggleDistribution();
      expect(await distributor.distributionActive()).to.equal(true);
    });

    it("Should allow owner to update reward rate", async function () {
      const newRate = ethers.parseEther("0.002");
      await distributor.updateRewardRate(newRate);
      
      expect(await distributor.baseRewardRate()).to.equal(newRate);
    });

    it("Should allow owner to update referrer multiplier", async function () {
      const newMultiplier = 200; // 2x
      await distributor.updateReferrerMultiplier(newMultiplier);
      
      expect(await distributor.referrerMultiplier()).to.equal(newMultiplier);
    });

    it("Should not allow non-owner to use admin functions", async function () {
      await expect(
        distributor.connect(user1).kickUser(user2.address)
      ).to.be.revertedWithCustomError(distributor, "OwnableUnauthorizedAccount");
      
      await expect(
        distributor.connect(user1).toggleDistribution()
      ).to.be.revertedWithCustomError(distributor, "OwnableUnauthorizedAccount");
      
      await expect(
        distributor.connect(user1).updateRewardRate(ethers.parseEther("0.002"))
      ).to.be.revertedWithCustomError(distributor, "OwnableUnauthorizedAccount");
    });
  });

  describe("Distribution Control", function () {
    beforeEach(async function () {
      await distributor.addTrustedUser(trustedUser1.address, "trusted1");
    });

    it("Should prevent registration when distribution is inactive", async function () {
      await distributor.toggleDistribution();
      
      await expect(
        distributor.connect(user1).registerUser("user1", trustedUser1.address)
      ).to.be.revertedWith("Distribution is not active");
    });

    it("Should prevent claims when distribution is inactive", async function () {
      await distributor.connect(user1).registerUser("user1", trustedUser1.address);
      await time.increase(1000);
      
      await distributor.toggleDistribution();
      
      await expect(
        distributor.connect(user1).claimRewards()
      ).to.be.revertedWith("Distribution is not active");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await distributor.addTrustedUser(trustedUser1.address, "trusted1");
      await distributor.addTrustedUser(trustedUser2.address, "trusted2");
      await distributor.connect(user1).registerUser("user1", trustedUser1.address);
    });

    it("Should return correct total users count", async function () {
      expect(await distributor.getTotalUsers()).to.equal(3); // 2 trusted + 1 regular
    });

    it("Should return correct trusted users count", async function () {
      expect(await distributor.getTotalTrustedUsers()).to.equal(2);
    });

    it("Should return all trusted users", async function () {
      const trustedUsers = await distributor.getAllTrustedUsers();
      expect(trustedUsers).to.include(trustedUser1.address);
      expect(trustedUsers).to.include(trustedUser2.address);
    });

    it("Should check username availability", async function () {
      expect(await distributor.isUsernameAvailable("newuser")).to.equal(true);
      expect(await distributor.isUsernameAvailable("user1")).to.equal(false);
    });
  });
});

