const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const BeerCoinDAppModule = buildModule("BeerCoinDAppModule", (m) => {
  // Get the deployer account
  const deployer = m.getAccount(0);

  // Deploy BeerCoin first
  const beerCoin = m.contract("BeerCoin", [deployer]);

  // Deploy BeerCoinDistributor with BeerCoin address
  const distributor = m.contract("BeerCoinDistributor", [beerCoin, deployer]);

  // Transfer BeerCoin ownership to the distributor so it can mint tokens
  m.call(beerCoin, "transferOwnership", [distributor]);

  return { beerCoin, distributor };
});

module.exports = BeerCoinDAppModule;

