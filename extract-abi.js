const fs = require('fs');
const path = require('path');

// Extract BeerCoinV2 ABI
const beerCoinV2Artifact = JSON.parse(
  fs.readFileSync('./beercoin-dapp/artifacts/contracts/BeerCoinV2.sol/BeerCoinV2.json', 'utf8')
);

const beerCoinV2ABI = {
  abi: beerCoinV2Artifact.abi
};

fs.writeFileSync(
  './beercoin-webapp/src/contracts/BeerCoinV2.json',
  JSON.stringify(beerCoinV2ABI, null, 2)
);

// Extract BeerCoinDistributorV2 ABI
const distributorV2Artifact = JSON.parse(
  fs.readFileSync('./beercoin-dapp/artifacts/contracts/BeerCoinDistributorV2.sol/BeerCoinDistributorV2.json', 'utf8')
);

const distributorV2ABI = {
  abi: distributorV2Artifact.abi
};

fs.writeFileSync(
  './beercoin-webapp/src/contracts/BeerCoinDistributorV2.json',
  JSON.stringify(distributorV2ABI, null, 2)
);

console.log('ABI files extracted successfully!');
console.log('- BeerCoinV2.json');
console.log('- BeerCoinDistributorV2.json');

