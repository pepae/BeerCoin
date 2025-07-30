const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BeerCoin", function () {
  let beerCoin;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy the BeerCoin contract
    const BeerCoin = await ethers.getContractFactory("BeerCoin");
    beerCoin = await BeerCoin.deploy(owner.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await beerCoin.owner()).to.equal(owner.address);
    });

    it("Should assign the initial supply to the owner", async function () {
      const ownerBalance = await beerCoin.balanceOf(owner.address);
      expect(await beerCoin.totalSupply()).to.equal(ownerBalance);
      expect(ownerBalance).to.equal(ethers.parseEther("1000000")); // 1 million BEER
    });

    it("Should have correct token details", async function () {
      expect(await beerCoin.name()).to.equal("BeerCoin");
      expect(await beerCoin.symbol()).to.equal("BEER");
      expect(await beerCoin.decimals()).to.equal(18);
    });

    it("Should have correct max supply", async function () {
      expect(await beerCoin.maxSupply()).to.equal(ethers.parseEther("100000000")); // 100 million BEER
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await beerCoin.mint(addr1.address, mintAmount);
      
      expect(await beerCoin.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        beerCoin.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWithCustomError(beerCoin, "OwnableUnauthorizedAccount");
    });

    it("Should not allow minting beyond max supply", async function () {
      const maxSupply = await beerCoin.maxSupply();
      const currentSupply = await beerCoin.totalSupply();
      const excessAmount = maxSupply - currentSupply + ethers.parseEther("1");
      
      await expect(
        beerCoin.mint(addr1.address, excessAmount)
      ).to.be.revertedWith("BeerCoin: exceeds max supply");
    });

    it("Should not allow minting to zero address", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        beerCoin.mint(ethers.ZeroAddress, mintAmount)
      ).to.be.revertedWith("BeerCoin: mint to zero address");
    });

    it("Should emit TokensMinted event", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(beerCoin.mint(addr1.address, mintAmount))
        .to.emit(beerCoin, "TokensMinted")
        .withArgs(addr1.address, mintAmount);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      // Transfer some tokens to addr1 for burning tests
      await beerCoin.transfer(addr1.address, ethers.parseEther("1000"));
    });

    it("Should allow users to burn their own tokens", async function () {
      const burnAmount = ethers.parseEther("500");
      const initialBalance = await beerCoin.balanceOf(addr1.address);
      
      await beerCoin.connect(addr1).burn(burnAmount);
      
      expect(await beerCoin.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
    });

    it("Should not allow burning more than balance", async function () {
      const burnAmount = ethers.parseEther("2000"); // More than addr1's balance
      
      await expect(
        beerCoin.connect(addr1).burn(burnAmount)
      ).to.be.revertedWith("BeerCoin: insufficient balance to burn");
    });

    it("Should not allow burning zero amount", async function () {
      await expect(
        beerCoin.connect(addr1).burn(0)
      ).to.be.revertedWith("BeerCoin: burn amount must be greater than 0");
    });

    it("Should emit TokensBurned event", async function () {
      const burnAmount = ethers.parseEther("500");
      await expect(beerCoin.connect(addr1).burn(burnAmount))
        .to.emit(beerCoin, "TokensBurned")
        .withArgs(addr1.address, burnAmount);
    });
  });

  describe("Burn From", function () {
    beforeEach(async function () {
      // Transfer some tokens to addr1 and approve addr2 to spend them
      await beerCoin.transfer(addr1.address, ethers.parseEther("1000"));
      await beerCoin.connect(addr1).approve(addr2.address, ethers.parseEther("500"));
    });

    it("Should allow burning tokens with allowance", async function () {
      const burnAmount = ethers.parseEther("300");
      const initialBalance = await beerCoin.balanceOf(addr1.address);
      
      await beerCoin.connect(addr2).burnFrom(addr1.address, burnAmount);
      
      expect(await beerCoin.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
    });

    it("Should not allow burning more than allowance", async function () {
      const burnAmount = ethers.parseEther("600"); // More than allowance
      
      await expect(
        beerCoin.connect(addr2).burnFrom(addr1.address, burnAmount)
      ).to.be.revertedWith("BeerCoin: burn amount exceeds allowance");
    });

    it("Should reduce allowance after burning", async function () {
      const burnAmount = ethers.parseEther("300");
      const initialAllowance = await beerCoin.allowance(addr1.address, addr2.address);
      
      await beerCoin.connect(addr2).burnFrom(addr1.address, burnAmount);
      
      expect(await beerCoin.allowance(addr1.address, addr2.address)).to.equal(initialAllowance - burnAmount);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      await beerCoin.transfer(addr1.address, transferAmount);
      expect(await beerCoin.balanceOf(addr1.address)).to.equal(transferAmount);
      
      await beerCoin.connect(addr1).transfer(addr2.address, ethers.parseEther("500"));
      expect(await beerCoin.balanceOf(addr2.address)).to.equal(ethers.parseEther("500"));
      expect(await beerCoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await beerCoin.balanceOf(owner.address);
      
      await expect(
        beerCoin.connect(addr1).transfer(owner.address, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(beerCoin, "ERC20InsufficientBalance");
    });
  });
});

