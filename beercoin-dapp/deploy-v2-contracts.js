const { ethers } = require('hardhat');
const fs = require('fs');

async function main() {
  console.log('🍺 Deploying BeerCoin V2 Contracts to Gnosis Chain...\n');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log('Account balance:', ethers.formatEther(balance), 'xDAI\n');

  if (balance < ethers.parseEther('0.01')) {
    console.error('❌ Insufficient balance for deployment. Need at least 0.01 xDAI');
    process.exit(1);
  }

  try {
    // Deploy BeerCoinV2
    console.log('📄 Deploying BeerCoinV2...');
    const BeerCoinV2 = await ethers.getContractFactory('BeerCoinV2');
    const beerCoin = await BeerCoinV2.deploy(deployer.address);
    await beerCoin.waitForDeployment();
    const beerCoinAddress = await beerCoin.getAddress();
    console.log('✅ BeerCoinV2 deployed to:', beerCoinAddress);

    // Deploy BeerCoinDistributorV2
    console.log('📄 Deploying BeerCoinDistributorV2...');
    const BeerCoinDistributorV2 = await ethers.getContractFactory('BeerCoinDistributorV2');
    const distributor = await BeerCoinDistributorV2.deploy(beerCoinAddress, deployer.address);
    await distributor.waitForDeployment();
    const distributorAddress = await distributor.getAddress();
    console.log('✅ BeerCoinDistributorV2 deployed to:', distributorAddress);

    // Transfer ownership of BeerCoin to distributor
    console.log('🔄 Transferring BeerCoin ownership to distributor...');
    const transferTx = await beerCoin.transferOwnership(distributorAddress);
    await transferTx.wait();
    console.log('✅ Ownership transferred');

    // Verify deployment
    console.log('\n🔍 Verifying deployment...');
    const distributorOwner = await distributor.owner();
    const beerCoinOwner = await beerCoin.owner();
    const totalSupply = await beerCoin.totalSupply();
    
    console.log('Distributor owner:', distributorOwner);
    console.log('BeerCoin owner:', beerCoinOwner);
    console.log('Initial BEER supply:', ethers.formatEther(totalSupply), 'BEER');

    // Save deployment info
    const deploymentInfo = {
      network: 'gnosis',
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        BeerCoinV2: {
          address: beerCoinAddress,
          owner: beerCoinOwner
        },
        BeerCoinDistributorV2: {
          address: distributorAddress,
          owner: distributorOwner
        }
      },
      transactions: {
        beerCoinDeploy: beerCoin.deploymentTransaction()?.hash,
        distributorDeploy: distributor.deploymentTransaction()?.hash,
        ownershipTransfer: transferTx.hash
      }
    };

    fs.writeFileSync('deployment-v2-gnosis.json', JSON.stringify(deploymentInfo, null, 2));
    console.log('\n💾 Deployment info saved to deployment-v2-gnosis.json');

    // Display summary
    console.log('\n🎉 Deployment Complete!');
    console.log('=====================================');
    console.log('BeerCoinV2:', beerCoinAddress);
    console.log('BeerCoinDistributorV2:', distributorAddress);
    console.log('=====================================');
    console.log('\n📋 Next Steps:');
    console.log('1. Update contract addresses in beercoin-webapp/src/lib/contractServiceV2.js');
    console.log('2. Add trusted users using the admin wallet');
    console.log('3. Test the registration flow');
    console.log('4. Deploy the web app');

    // Create a quick test
    console.log('\n🧪 Running quick test...');
    
    // Add deployer as trusted user
    console.log('Adding deployer as trusted user...');
    const addTrustedTx = await distributor.addTrustedUser(deployer.address, 'admin');
    await addTrustedTx.wait();
    console.log('✅ Deployer added as trusted user');

    // Check if deployer is trusted
    const userInfo = await distributor.getUserInfo(deployer.address);
    console.log('Admin user info:', {
      username: userInfo.username,
      isTrusted: userInfo.isTrusted,
      isActive: userInfo.isActive
    });

    console.log('\n🎯 V2 Contracts are ready for use!');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

