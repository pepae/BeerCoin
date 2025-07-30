const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("BeerCoinDAppV2", (m) => {
  // Get the deployer account
  const deployer = m.getAccount(0);

  // Deploy BeerCoinV2 first
  const beerCoin = m.contract("BeerCoinV2", [deployer]);

  // Deploy BeerCoinDistributorV2 with BeerCoin address and deployer as initial owner
  const distributor = m.contract("BeerCoinDistributorV2", [beerCoin, deployer]);

  // Transfer ownership of BeerCoin to the distributor so it can mint tokens
  m.call(beerCoin, "transferOwnership", [distributor]);

  return { beerCoin, distributor };
});

