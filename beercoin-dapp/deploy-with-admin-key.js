const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🍺 Deploying BeerCoin V2 contracts with specific admin wallet...");
  
  // Private key should be provided via environment variable for security
  const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
  
  if (!ADMIN_PRIVATE_KEY) {
    console.error("❌ ADMIN_PRIVATE_KEY environment variable is required");
    process.exit(1);
  }
  
  // Create wallet from private key
  const provider = hre.ethers.provider;
  const adminWallet = new hre.ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
  const adminAddress = adminWallet.address;
  
  console.log(`Admin Address: ${adminAddress}`);
  console.log(`Admin Balance: ${hre.ethers.formatEther(await provider.getBalance(adminAddress))} xDAI`);
  
  // Deploy BeerCoinV2 first
  console.log("\n📄 Deploying BeerCoinV2...");
  const BeerCoinV2 = await hre.ethers.getContractFactory("BeerCoinV2", adminWallet);
  const beerCoin = await BeerCoinV2.deploy(adminAddress);
  await beerCoin.waitForDeployment();
  
  const beerCoinAddress = await beerCoin.getAddress();
  console.log(`✅ BeerCoinV2 deployed to: ${beerCoinAddress}`);
  
  // Deploy BeerCoinDistributorV2
  console.log("\n📄 Deploying BeerCoinDistributorV2...");
  const BeerCoinDistributorV2 = await hre.ethers.getContractFactory("BeerCoinDistributorV2", adminWallet);
  const distributor = await BeerCoinDistributorV2.deploy(beerCoinAddress, adminAddress);
  await distributor.waitForDeployment();
  
  const distributorAddress = await distributor.getAddress();
  console.log(`✅ BeerCoinDistributorV2 deployed to: ${distributorAddress}`);
  
  // Transfer BeerCoin ownership to the distributor so it can mint tokens
  console.log("\n🔄 Transferring BeerCoin ownership to distributor...");
  const transferTx = await beerCoin.transferOwnership(distributorAddress);
  await transferTx.wait();
  console.log("✅ BeerCoin ownership transferred to distributor");
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const beerCoinOwner = await beerCoin.owner();
  const distributorOwner = await distributor.owner();
  const beerCoinInDistributor = await distributor.beerCoin();
  
  console.log(`BeerCoin owner: ${beerCoinOwner}`);
  console.log(`Distributor owner: ${distributorOwner}`);
  console.log(`BeerCoin address in distributor: ${beerCoinInDistributor}`);
  
  // Check initial parameters
  const baseRewardRate = await distributor.baseRewardRate();
  const referrerMultiplier = await distributor.referrerMultiplier();
  const multiplierBase = await distributor.MULTIPLIER_BASE();
  const distributionActive = await distributor.distributionActive();
  const totalSupply = await beerCoin.totalSupply();
  
  console.log("\n📊 Contract Parameters:");
  console.log(`Base Reward Rate: ${hre.ethers.formatEther(baseRewardRate)} BEER/second`);
  console.log(`Referrer Multiplier: ${referrerMultiplier}/${multiplierBase} = ${(Number(referrerMultiplier)/Number(multiplierBase)).toFixed(1)}x per referral`);
  console.log(`Distribution Active: ${distributionActive}`);
  console.log(`Total Supply: ${hre.ethers.formatEther(totalSupply)} BEER`);
  
  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: adminAddress,
    admin: adminAddress,
    timestamp: new Date().toISOString(),
    contracts: {
      BeerCoinV2: {
        address: beerCoinAddress,
        owner: beerCoinOwner
      },
      BeerCoinDistributorV2: {
        address: distributorAddress,
        owner: distributorOwner,
        beerCoinAddress: beerCoinInDistributor
      }
    },
    parameters: {
      baseRewardRate: baseRewardRate.toString(),
      baseRewardRateFormatted: hre.ethers.formatEther(baseRewardRate) + " BEER/second",
      referrerMultiplier: referrerMultiplier.toString(),
      multiplierBase: multiplierBase.toString(),
      referrerMultiplierFormatted: `${(Number(referrerMultiplier)/Number(multiplierBase)).toFixed(1)}x per referral`,
      distributionActive,
      totalSupply: totalSupply.toString(),
      totalSupplyFormatted: hre.ethers.formatEther(totalSupply) + " BEER"
    }
  };
  
  // Write to file
  const fs = require('fs');
  fs.writeFileSync(
    'deployment-v2-final.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n✅ Deployment completed successfully!");
  console.log("📄 Deployment info saved to: deployment-v2-final.json");
  
  console.log("\n📋 FINAL SUMMARY:");
  console.log(`🪙 BeerCoinV2: ${beerCoinAddress}`);
  console.log(`📦 BeerCoinDistributorV2: ${distributorAddress}`);
  console.log(`👑 Admin: ${adminAddress}`);
  console.log(`🔄 Referrer Multiplier: 0.5x per referral`);
  console.log(`💰 Initial Supply: 0 BEER`);
  console.log(`⚡ Distribution: Active`);
  
  console.log("\n🔧 Next steps:");
  console.log("1. Update your frontend config with the new contract addresses");
  console.log("2. Use the admin panel to add trusted users");
  console.log("3. Trusted users can start registering regular users");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
