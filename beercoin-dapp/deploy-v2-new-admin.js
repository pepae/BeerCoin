const hre = require("hardhat");

async function main() {
  console.log("🍺 Deploying BeerCoin V2 contracts with new admin...");
  
  // New admin address (derived from the provided private key)
  const NEW_ADMIN_ADDRESS = "0x7610c51E816a0908a3bC69149063Be00c03999fF";
  
  console.log(`New Admin Address: ${NEW_ADMIN_ADDRESS}`);
  
  // Deploy BeerCoinV2 first
  console.log("\n📄 Deploying BeerCoinV2...");
  const BeerCoinV2 = await hre.ethers.getContractFactory("BeerCoinV2");
  const beerCoin = await BeerCoinV2.deploy(NEW_ADMIN_ADDRESS);
  await beerCoin.waitForDeployment();
  
  const beerCoinAddress = await beerCoin.getAddress();
  console.log(`✅ BeerCoinV2 deployed to: ${beerCoinAddress}`);
  
  // Deploy BeerCoinDistributorV2
  console.log("\n📄 Deploying BeerCoinDistributorV2...");
  const BeerCoinDistributorV2 = await hre.ethers.getContractFactory("BeerCoinDistributorV2");
  const distributor = await BeerCoinDistributorV2.deploy(beerCoinAddress, NEW_ADMIN_ADDRESS);
  await distributor.waitForDeployment();
  
  const distributorAddress = await distributor.getAddress();
  console.log(`✅ BeerCoinDistributorV2 deployed to: ${distributorAddress}`);
  
  // Transfer BeerCoin ownership to the distributor so it can mint tokens
  console.log("\n🔄 Transferring BeerCoin ownership to distributor...");
  const [deployer] = await hre.ethers.getSigners();
  
  // Connect to BeerCoin as deployer and transfer ownership to distributor
  const beerCoinAsDeployer = beerCoin.connect(deployer);
  const transferTx = await beerCoinAsDeployer.transferOwnership(distributorAddress);
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
  
  console.log("\n📊 Contract Parameters:");
  console.log(`Base Reward Rate: ${hre.ethers.formatEther(baseRewardRate)} BEER/second`);
  console.log(`Referrer Multiplier: ${referrerMultiplier}/${multiplierBase} = ${(referrerMultiplier/multiplierBase).toFixed(1)}x per referral`);
  console.log(`Distribution Active: ${distributionActive}`);
  
  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    admin: NEW_ADMIN_ADDRESS,
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
      referrerMultiplier: referrerMultiplier.toString(),
      multiplierBase: multiplierBase.toString(),
      distributionActive
    }
  };
  
  // Write to file
  const fs = require('fs');
  fs.writeFileSync(
    'deployment-v2-new-admin.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n✅ Deployment completed successfully!");
  console.log("📄 Deployment info saved to: deployment-v2-new-admin.json");
  
  console.log("\n📋 Summary:");
  console.log(`BeerCoinV2: ${beerCoinAddress}`);
  console.log(`BeerCoinDistributorV2: ${distributorAddress}`);
  console.log(`Admin: ${NEW_ADMIN_ADDRESS}`);
  console.log(`Referrer Multiplier: 0.5x per referral`);
  console.log(`Initial Supply: 0 BEER`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
