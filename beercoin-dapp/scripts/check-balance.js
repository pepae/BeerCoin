const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  
  console.log("Network:", hre.network.name);
  console.log("Address:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "xDAI");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

