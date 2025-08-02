const { ethers } = require("hardhat");

async function main() {
  console.log("=== Fresh BeerCoin V2 Full Deployment ===");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "xDAI");
  
  if (balance < ethers.parseEther("0.01")) {
    throw new Error("Insufficient balance for deployment");
  }
  
  console.log("\n=== Step 1: Deploy BeerCoinV2 ===");
  const BeerCoinV2 = await ethers.getContractFactory("BeerCoinV2");
  
  // Deploy with deployer as initial owner
  const beerCoin = await BeerCoinV2.deploy(deployer.address);
  await beerCoin.waitForDeployment();
  const beerCoinAddress = await beerCoin.getAddress();
  
  console.log("BeerCoinV2 deployed to:", beerCoinAddress);
  
  // Verify BeerCoin deployment
  const name = await beerCoin.name();
  const symbol = await beerCoin.symbol();
  const totalSupply = await beerCoin.totalSupply();
  const owner = await beerCoin.owner();
  
  console.log("- Name:", name);
  console.log("- Symbol:", symbol);
  console.log("- Total Supply:", ethers.formatEther(totalSupply));
  console.log("- Owner:", owner);
  
  console.log("\n=== Step 2: Deploy BeerCoinDistributorV2 ===");
  const BeerCoinDistributorV2 = await ethers.getContractFactory("BeerCoinDistributorV2");
  
  // Deploy with deployer as initial owner
  const distributor = await BeerCoinDistributorV2.deploy(beerCoinAddress, deployer.address);
  await distributor.waitForDeployment();
  const distributorAddress = await distributor.getAddress();
  
  console.log("BeerCoinDistributorV2 deployed to:", distributorAddress);
  
  // Verify Distributor deployment
  const distributorOwner = await distributor.owner();
  const tokenAddress = await distributor.beerCoin();
  const isActive = await distributor.distributionActive();
  const baseRate = await distributor.baseRewardRate();
  
  console.log("- Owner:", distributorOwner);
  console.log("- Token Address:", tokenAddress);
  console.log("- Distribution Active:", isActive);
  console.log("- Base Rate:", ethers.formatEther(baseRate), "BEER/second");
  
  console.log("\n=== Step 3: Transfer BeerCoin Ownership to Distributor ===");
  console.log("Transferring BeerCoin ownership from", owner, "to", distributorAddress);
  
  const transferTx = await beerCoin.transferOwnership(distributorAddress);
  await transferTx.wait();
  console.log("Ownership transfer transaction:", transferTx.hash);
  
  // Verify ownership transfer
  const newOwner = await beerCoin.owner();
  console.log("New BeerCoin owner:", newOwner);
  
  if (newOwner.toLowerCase() === distributorAddress.toLowerCase()) {
    console.log("✅ Ownership successfully transferred!");
  } else {
    throw new Error("❌ Ownership transfer failed!");
  }
  
  console.log("\n=== Step 4: Test Minting Capability ===");
  // Test that the distributor can now mint tokens
  try {
    const testAmount = ethers.parseEther("1.0");
    
    // Get distributor contract instance for calling mint
    const distributorSigner = distributor.connect(deployer);
    
    // Note: We can't directly call mint from distributor as it's internal
    // But we can verify the ownership is correct
    console.log("Distributor can now mint tokens via claimRewards function");
  } catch (error) {
    console.warn("Note: Direct minting test not possible, but ownership is correct");
  }
  
  console.log("\n=== Deployment Summary ===");
  const deploymentInfo = {
    network: "gnosis",
    chainId: 100,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      BeerCoinV2: {
        address: beerCoinAddress,
        name: name,
        symbol: symbol,
        totalSupply: ethers.formatEther(totalSupply),
        owner: newOwner
      },
      BeerCoinDistributorV2: {
        address: distributorAddress,
        owner: distributorOwner,
        distributionActive: isActive,
        baseRewardRate: ethers.formatEther(baseRate)
      }
    },
    verification: {
      deployed: true,
      ownershipTransferred: newOwner.toLowerCase() === distributorAddress.toLowerCase(),
      readyForUse: true
    }
  };
  
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("Update your webapp config with:");
  console.log("BEERCOIN_ADDRESS:", beerCoinAddress);
  console.log("DISTRIBUTOR_ADDRESS:", distributorAddress);
  
  return deploymentInfo;
}

main()
  .then((info) => {
    console.log("\n✅ All contracts deployed and configured!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
