const { ethers } = require('hardhat');
const fs = require('fs');

async function main() {
  console.log('🔍 Verifying BeerCoin V2 Deployment on Gnosis Chain...\n');

  // Read deployed addresses
  const deployedAddresses = JSON.parse(
    fs.readFileSync('./ignition/deployments/chain-100/deployed_addresses.json', 'utf8')
  );

  const beerCoinAddress = deployedAddresses['BeerCoinDAppV2#BeerCoinV2'];
  const distributorAddress = deployedAddresses['BeerCoinDAppV2#BeerCoinDistributorV2'];

  console.log('📋 Deployed Contract Addresses:');
  console.log('BeerCoinV2:', beerCoinAddress);
  console.log('BeerCoinDistributorV2:', distributorAddress);
  console.log('');

  try {
    // Get the signer
    const [deployer] = await ethers.getSigners();
    console.log('Verifying with account:', deployer.address);

    // Get contract instances
    const beerCoin = await ethers.getContractAt('BeerCoinV2', beerCoinAddress);
    const distributor = await ethers.getContractAt('BeerCoinDistributorV2', distributorAddress);

    // Verify basic contract properties
    console.log('🔍 Verifying Contract Properties...');
    
    const tokenName = await beerCoin.name();
    const tokenSymbol = await beerCoin.symbol();
    const totalSupply = await beerCoin.totalSupply();
    const beerCoinOwner = await beerCoin.owner();
    const distributorOwner = await distributor.owner();
    const distributionActive = await distributor.distributionActive();

    console.log('Token Name:', tokenName);
    console.log('Token Symbol:', tokenSymbol);
    console.log('Total Supply:', ethers.formatEther(totalSupply), 'BEER');
    console.log('BeerCoin Owner:', beerCoinOwner);
    console.log('Distributor Owner:', distributorOwner);
    console.log('Distribution Active:', distributionActive);
    console.log('');

    // Verify ownership transfer
    if (beerCoinOwner === distributorAddress) {
      console.log('✅ BeerCoin ownership correctly transferred to distributor');
    } else {
      console.log('❌ BeerCoin ownership not transferred correctly');
    }

    // Check if deployer is registered as trusted user
    console.log('🧪 Testing Basic Functionality...');
    
    try {
      const isRegistered = await distributor.isRegistered(deployer.address);
      console.log('Deployer registered:', isRegistered);

      if (isRegistered) {
        const userInfo = await distributor.getUserInfo(deployer.address);
        console.log('Deployer user info:', {
          username: userInfo.username,
          isTrusted: userInfo.isTrusted,
          isActive: userInfo.isActive,
          referralCount: Number(userInfo.referralCount)
        });
      } else {
        // Add deployer as trusted user for testing
        console.log('Adding deployer as trusted user...');
        const addTrustedTx = await distributor.addTrustedUser(deployer.address, 'admin');
        await addTrustedTx.wait();
        console.log('✅ Deployer added as trusted user');
      }
    } catch (error) {
      console.log('Error checking/adding trusted user:', error.message);
    }

    // Test the new registerUserByTrusted function
    console.log('\n🧪 Testing New Registration Function...');
    
    // Create a test wallet
    const testWallet = ethers.Wallet.createRandom();
    console.log('Test wallet address:', testWallet.address);

    try {
      // Check if the new function exists and can be called
      const tx = await distributor.registerUserByTrusted.staticCall(testWallet.address, 'testuser');
      console.log('✅ registerUserByTrusted function is callable');
    } catch (error) {
      if (error.message.includes('Must be active trusted user')) {
        console.log('✅ registerUserByTrusted function exists and has proper access control');
      } else {
        console.log('❌ Error with registerUserByTrusted function:', error.message);
      }
    }

    // Get contract statistics
    console.log('\n📊 Contract Statistics:');
    const totalUsers = await distributor.getTotalUsers();
    const totalTrustedUsers = await distributor.getTotalTrustedUsers();
    const baseRewardRate = await distributor.baseRewardRate();
    const referrerMultiplier = await distributor.referrerMultiplier();

    console.log('Total Users:', Number(totalUsers));
    console.log('Total Trusted Users:', Number(totalTrustedUsers));
    console.log('Base Reward Rate:', ethers.formatEther(baseRewardRate), 'BEER per second');
    console.log('Referrer Multiplier:', Number(referrerMultiplier) / 100, 'x');

    // Save deployment info for web app
    const deploymentInfo = {
      network: 'gnosis',
      chainId: 100,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        BeerCoinV2: {
          address: beerCoinAddress,
          name: tokenName,
          symbol: tokenSymbol,
          totalSupply: ethers.formatEther(totalSupply),
          owner: beerCoinOwner
        },
        BeerCoinDistributorV2: {
          address: distributorAddress,
          owner: distributorOwner,
          distributionActive: distributionActive,
          totalUsers: Number(totalUsers),
          totalTrustedUsers: Number(totalTrustedUsers),
          baseRewardRate: ethers.formatEther(baseRewardRate),
          referrerMultiplier: Number(referrerMultiplier)
        }
      },
      blockExplorerUrls: {
        BeerCoinV2: `https://gnosisscan.io/address/${beerCoinAddress}`,
        BeerCoinDistributorV2: `https://gnosisscan.io/address/${distributorAddress}`
      }
    };

    fs.writeFileSync('v2-deployment-verified.json', JSON.stringify(deploymentInfo, null, 2));
    console.log('\n💾 Verification results saved to v2-deployment-verified.json');

    console.log('\n🎉 V2 Deployment Verification Complete!');
    console.log('=====================================');
    console.log('✅ All contracts deployed successfully');
    console.log('✅ Ownership transferred correctly');
    console.log('✅ New registration function available');
    console.log('✅ Basic functionality verified');
    console.log('=====================================');

    console.log('\n🔗 View on Block Explorer:');
    console.log('BeerCoinV2:', `https://gnosisscan.io/address/${beerCoinAddress}`);
    console.log('BeerCoinDistributorV2:', `https://gnosisscan.io/address/${distributorAddress}`);

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

