const hre = require("hardhat");

async function main() {
  console.log("Starting BeerCoin DApp deployment...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

  // Deploy BeerCoin
  console.log("\\nDeploying BeerCoin...");
  const BeerCoin = await hre.ethers.getContractFactory("BeerCoin");
  const beerCoin = await BeerCoin.deploy(deployer.address);
  await beerCoin.waitForDeployment();
  console.log("BeerCoin deployed to:", beerCoin.target);

  // Deploy BeerCoinDistributor
  console.log("\\nDeploying BeerCoinDistributor...");
  const BeerCoinDistributor = await hre.ethers.getContractFactory("BeerCoinDistributor");
  const distributor = await BeerCoinDistributor.deploy(beerCoin.target, deployer.address);
  await distributor.waitForDeployment();
  console.log("BeerCoinDistributor deployed to:", distributor.target);

  // Transfer BeerCoin ownership to distributor
  console.log("\\nTransferring BeerCoin ownership to distributor...");
  const transferTx = await beerCoin.transferOwnership(distributor.target);
  await transferTx.wait();
  console.log("Ownership transferred successfully");

  // Verify deployment
  console.log("\\nVerifying deployment...");
  const distributorOwner = await distributor.owner();
  const beerCoinOwner = await beerCoin.owner();
  const beerCoinAddress = await distributor.beerCoin();
  
  console.log("Distributor owner:", distributorOwner);
  console.log("BeerCoin owner:", beerCoinOwner);
  console.log("BeerCoin address in distributor:", beerCoinAddress);
  
  console.log("\\n=== DEPLOYMENT SUMMARY ===");
  console.log("BeerCoin (BEER):", beerCoin.target);
  console.log("BeerCoinDistributor:", distributor.target);
  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name);
  console.log("==========================");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      BeerCoin: beerCoin.target,
      BeerCoinDistributor: distributor.target
    },
    timestamp: new Date().toISOString()
  };

  const fs = require("fs");
  fs.writeFileSync(`deployment-${hre.network.name}.json`, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to deployment-${hre.network.name}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

