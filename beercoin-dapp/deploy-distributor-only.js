const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying BeerCoinDistributorV2 only...");
  
  // Use the existing BeerCoin address
  const BEERCOIN_ADDRESS = "0x9277a6F60CC18E7119A9A52a78299b5e4c73C594";
  
  console.log("Using existing BeerCoin at:", BEERCOIN_ADDRESS);
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "xDAI");
  
  if (balance < ethers.parseEther("0.01")) {
    throw new Error("Insufficient balance for deployment");
  }
  
  // Deploy BeerCoinDistributorV2
  console.log("\nDeploying BeerCoinDistributorV2...");
  const BeerCoinDistributorV2 = await ethers.getContractFactory("BeerCoinDistributorV2");
  
  const distributor = await BeerCoinDistributorV2.deploy(BEERCOIN_ADDRESS, deployer.address);
  
  await distributor.waitForDeployment();
  const distributorAddress = await distributor.getAddress();
  
  console.log("BeerCoinDistributorV2 deployed to:", distributorAddress);
  
  // Verify the deployment
  console.log("\nVerifying deployment...");
  const tokenAddress = await distributor.beerCoin();
  console.log("Distributor token address:", tokenAddress);
  console.log("Expected token address:", BEERCOIN_ADDRESS);
  
  if (tokenAddress.toLowerCase() !== BEERCOIN_ADDRESS.toLowerCase()) {
    throw new Error("Token address mismatch!");
  }
  
  // Check initial state
  const isActive = await distributor.distributionActive();
  const owner = await distributor.owner();
  const baseRate = await distributor.baseRewardRate();
  
  console.log("\nDistributor state:");
  console.log("- Active:", isActive);
  console.log("- Owner:", owner);
  console.log("- Base rate:", ethers.formatEther(baseRate), "BEER/day");
  
  // Save deployment info
  const deploymentInfo = {
    network: "gnosis",
    chainId: 100,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      BeerCoinV2: {
        address: BEERCOIN_ADDRESS,
        note: "Pre-existing contract"
      },
      BeerCoinDistributorV2: {
        address: distributorAddress,
        owner: owner,
        distributionActive: isActive,
        baseRewardRate: ethers.formatEther(baseRate)
      }
    }
  };
  
  console.log("\nDeployment completed successfully!");
  console.log("Update your config with:");
  console.log("BEERCOIN_ADDRESS:", BEERCOIN_ADDRESS);
  console.log("DISTRIBUTOR_ADDRESS:", distributorAddress);
  
  return deploymentInfo;
}

main()
  .then((info) => {
    console.log("\nFinal deployment info:", JSON.stringify(info, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
