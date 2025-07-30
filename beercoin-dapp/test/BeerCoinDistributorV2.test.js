const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BeerCoinDistributorV2", function () {
  let beerCoin, distributor;
  let owner, trustedUser, newUser, anotherUser;
  let baseRewardRate;

  beforeEach(async function () {
    [owner, trustedUser, newUser, anotherUser] = await ethers.getSigners();

    // Deploy BeerCoinV2
    const BeerCoinV2 = await ethers.getContractFactory("BeerCoinV2");
    beerCoin = await BeerCoinV2.deploy(owner.address);
    await beerCoin.waitForDeployment();

    // Deploy BeerCoinDistributorV2
    const BeerCoinDistributorV2 = await ethers.getContractFactory("BeerCoinDistributorV2");
    distributor = await BeerCoinDistributorV2.deploy(await beerCoin.getAddress(), owner.address);
    await distributor.waitForDeployment();

    // Transfer ownership of BeerCoin to distributor
    await beerCoin.transferOwnership(await distributor.getAddress());

    // Get base reward rate
    baseRewardRate = await distributor.baseRewardRate();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await distributor.owner()).to.equal(owner.address);
    });

    it("Should set the right BeerCoin address", async function () {
      expect(await distributor.beerCoin()).to.equal(await beerCoin.getAddress());
    });

    it("Should have distribution active by default", async function () {
      expect(await distributor.distributionActive()).to.be.true;
    });
  });

  describe("Trusted User Management", function () {
    it("Should allow owner to add trusted users", async function () {
      await expect(distributor.addTrustedUser(trustedUser.address, "trusted1"))
        .to.emit(distributor, "UserTrusted")
        .withArgs(trustedUser.address, "trusted1");

      const userInfo = await distributor.getUserInfo(trustedUser.address);
      expect(userInfo.username).to.equal("trusted1");
      expect(userInfo.isTrusted).to.be.true;
      expect(userInfo.isActive).to.be.true;
    });

    it("Should not allow non-owner to add trusted users", async function () {
      await expect(
        distributor.connect(trustedUser).addTrustedUser(newUser.address, "trusted1")
      ).to.be.revertedWithCustomError(distributor, "OwnableUnauthorizedAccount");
    });

    it("Should not allow duplicate usernames", async function () {
      await distributor.addTrustedUser(trustedUser.address, "trusted1");
      await expect(
        distributor.addTrustedUser(newUser.address, "trusted1")
      ).to.be.revertedWith("Username already taken");
    });
  });

  describe("User Registration by Trusted Users", function () {
    beforeEach(async function () {
      // Add a trusted user first
      await distributor.addTrustedUser(trustedUser.address, "trusted1");
    });

    it("Should allow trusted users to register new users", async function () {
      await expect(
        distributor.connect(trustedUser).registerUserByTrusted(newUser.address, "newuser1")
      )
        .to.emit(distributor, "UserRegisteredByTrusted")
        .withArgs(newUser.address, "newuser1", trustedUser.address);

      const userInfo = await distributor.getUserInfo(newUser.address);
      expect(userInfo.username).to.equal("newuser1");
      expect(userInfo.isTrusted).to.be.false;
      expect(userInfo.isActive).to.be.true;
      expect(userInfo.referrer).to.equal(trustedUser.address);

      // Check that trusted user's referral count increased
      const trustedUserInfo = await distributor.getUserInfo(trustedUser.address);
      expect(trustedUserInfo.referralCount).to.equal(1);
    });

    it("Should not allow non-trusted users to register others", async function () {
      await expect(
        distributor.connect(newUser).registerUserByTrusted(anotherUser.address, "newuser1")
      ).to.be.revertedWith("Must be active trusted user");
    });

    it("Should not allow registering the same user twice", async function () {
      await distributor.connect(trustedUser).registerUserByTrusted(newUser.address, "newuser1");
      
      await expect(
        distributor.connect(trustedUser).registerUserByTrusted(newUser.address, "newuser2")
      ).to.be.revertedWith("User already registered");
    });

    it("Should not allow trusted user to register themselves", async function () {
      await expect(
        distributor.connect(trustedUser).registerUserByTrusted(trustedUser.address, "self")
      ).to.be.revertedWith("Cannot register yourself");
    });

    it("Should not allow duplicate usernames in registerUserByTrusted", async function () {
      await distributor.connect(trustedUser).registerUserByTrusted(newUser.address, "newuser1");
      
      await expect(
        distributor.connect(trustedUser).registerUserByTrusted(anotherUser.address, "newuser1")
      ).to.be.revertedWith("Username already taken");
    });
  });

  describe("Reward Calculation and Claims", function () {
    beforeEach(async function () {
      // Add trusted user and register new user
      await distributor.addTrustedUser(trustedUser.address, "trusted1");
      await distributor.connect(trustedUser).registerUserByTrusted(newUser.address, "newuser1");
    });

    it("Should calculate correct base rewards", async function () {
      // Fast forward 100 seconds
      await time.increase(100);

      const pendingRewards = await distributor.calculatePendingRewards(newUser.address);
      const expectedRewards = baseRewardRate * 100n; // 100 seconds * base rate
      expect(pendingRewards).to.be.closeTo(expectedRewards, ethers.parseEther("0.001"));
    });

    it("Should calculate correct referral bonus for trusted users", async function () {
      // Fast forward 100 seconds
      await time.increase(100);

      const pendingRewards = await distributor.calculatePendingRewards(trustedUser.address);
      const baseReward = baseRewardRate * 100n; // 100 seconds * base rate
      const referralBonus = (baseReward * 150n * 1n) / 100n; // 1.5x multiplier for 1 referral
      const expectedRewards = baseReward + referralBonus;
      
      expect(pendingRewards).to.be.closeTo(expectedRewards, ethers.parseEther("0.001"));
    });

    it("Should allow users to claim rewards", async function () {
      // Fast forward 100 seconds
      await time.increase(100);

      const pendingBefore = await distributor.calculatePendingRewards(newUser.address);
      
      await expect(distributor.connect(newUser).claimRewards())
        .to.emit(distributor, "TokensClaimed")
        .withArgs(newUser.address, pendingBefore);

      const balance = await beerCoin.balanceOf(newUser.address);
      expect(balance).to.equal(pendingBefore);

      // Pending rewards should be 0 after claim
      const pendingAfter = await distributor.calculatePendingRewards(newUser.address);
      expect(pendingAfter).to.equal(0);
    });

    it("Should accumulate referral bonuses correctly", async function () {
      // Register another user to increase referral count
      await distributor.connect(trustedUser).registerUserByTrusted(anotherUser.address, "newuser2");
      
      // Fast forward 100 seconds
      await time.increase(100);

      const pendingRewards = await distributor.calculatePendingRewards(trustedUser.address);
      const baseReward = baseRewardRate * 100n; // 100 seconds * base rate
      const referralBonus = (baseReward * 150n * 2n) / 100n; // 1.5x multiplier for 2 referrals
      const expectedRewards = baseReward + referralBonus;
      
      expect(pendingRewards).to.be.closeTo(expectedRewards, ethers.parseEther("0.001"));
    });
  });

  describe("Legacy Registration Function", function () {
    beforeEach(async function () {
      // Add trusted user
      await distributor.addTrustedUser(trustedUser.address, "trusted1");
    });

    it("Should still allow self-registration with referrer", async function () {
      await expect(
        distributor.connect(newUser).registerUser("newuser1", trustedUser.address)
      )
        .to.emit(distributor, "UserRegistered")
        .withArgs(newUser.address, "newuser1", trustedUser.address);

      const userInfo = await distributor.getUserInfo(newUser.address);
      expect(userInfo.username).to.equal("newuser1");
      expect(userInfo.referrer).to.equal(trustedUser.address);
    });
  });

  describe("Admin Functions", function () {
    beforeEach(async function () {
      await distributor.addTrustedUser(trustedUser.address, "trusted1");
      await distributor.connect(trustedUser).registerUserByTrusted(newUser.address, "newuser1");
    });

    it("Should allow owner to kick users", async function () {
      await expect(distributor.kickUser(newUser.address))
        .to.emit(distributor, "UserKicked")
        .withArgs(newUser.address, "newuser1");

      const userInfo = await distributor.getUserInfo(newUser.address);
      expect(userInfo.isActive).to.be.false;
    });

    it("Should allow owner to toggle distribution", async function () {
      await expect(distributor.toggleDistribution())
        .to.emit(distributor, "DistributionToggled")
        .withArgs(false);

      expect(await distributor.distributionActive()).to.be.false;
    });

    it("Should prevent registration when distribution is inactive", async function () {
      await distributor.toggleDistribution(); // Deactivate

      await expect(
        distributor.connect(trustedUser).registerUserByTrusted(anotherUser.address, "newuser2")
      ).to.be.revertedWith("Distribution is not active");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await distributor.addTrustedUser(trustedUser.address, "trusted1");
      await distributor.connect(trustedUser).registerUserByTrusted(newUser.address, "newuser1");
    });

    it("Should return correct user counts", async function () {
      expect(await distributor.getTotalUsers()).to.equal(2);
      expect(await distributor.getTotalTrustedUsers()).to.equal(1);
    });

    it("Should return trusted users list", async function () {
      const trustedUsers = await distributor.getAllTrustedUsers();
      expect(trustedUsers).to.have.lengthOf(1);
      expect(trustedUsers[0]).to.equal(trustedUser.address);
    });

    it("Should check username availability", async function () {
      expect(await distributor.isUsernameAvailable("available")).to.be.true;
      expect(await distributor.isUsernameAvailable("trusted1")).to.be.false;
      expect(await distributor.isUsernameAvailable("newuser1")).to.be.false;
    });
  });
});

